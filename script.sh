#!/bin/bash
# Deploy the personal site (Next.js in web/).
#
# Run on the server from the repo root, after `git pull`. The script locates
# itself, so the checkout path does not matter (today: /root/caobo171).
#
# Needs Node 20.9+ (Next 16). pm2 runs the app from nvm, but a non-interactive
# `ssh host ./script.sh` gets the system node instead, so the script loads nvm
# itself and refuses to build on a Node too old to produce a working bundle.
#
# Usage:
#   ./script.sh              # npm install (if needed), build, pm2 restart
#   ./script.sh --restart    # skip build, just restart pm2
#   ./script.sh --no-install # skip npm ci/install
#
# Process: caobo171.web on port 41717 (see web/ecosystem.config.js)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web"
APP_NAME="caobo171.web"
PORT="${PORT:-41717}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

BUILD=true
RUN_INSTALL=true

for arg in "$@"; do
  case "$arg" in
    --restart)    BUILD=false ;;
    --no-install) RUN_INSTALL=false ;;
    -h|--help)
      awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg (options: --restart, --no-install)"
      exit 1
      ;;
  esac
done

# pm2 launched this app from nvm's Node; a non-interactive shell would
# otherwise build it with whatever /usr/bin/node happens to be.
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi

NODE_VERSION="$(node -v 2>/dev/null || true)"
if [ -z "$NODE_VERSION" ]; then
  echo "ERROR: node not found on PATH."
  exit 1
fi
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node $NODE_VERSION on PATH, but Next 16 needs 20.9+."
  echo "       Install/select it with nvm, e.g.: nvm install 22 && nvm alias default 22"
  exit 1
fi

if [ ! -d "$WEB_DIR" ]; then
  echo "ERROR: web/ not found at $WEB_DIR"
  exit 1
fi

cd "$WEB_DIR"

echo "========== DEPLOYING caobo171.web =========="
echo "(build=$BUILD install=$RUN_INSTALL port=$PORT)"
echo ""

if [ "$RUN_INSTALL" = true ]; then
  echo "===== [1/3] Dependencies ====="
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  echo ""
else
  echo "===== [1/3] Dependencies (skipped) ====="
  echo ""
fi

if [ "$BUILD" = true ]; then
  echo "===== [2/3] Build ====="
  nice -n 10 env NODE_OPTIONS="--max-old-space-size=2048" npm run build
  echo ""
else
  echo "===== [2/3] Build (skipped — --restart) ====="
  echo ""
fi

echo "===== [3/3] PM2 restart ====="
if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 not found. Install with: npm i -g pm2"
  exit 1
fi

# Prefer startOrRestart (restart --env is unreliable on some PM2 versions)
pm2 startOrRestart ecosystem.config.js --only "$APP_NAME" --env production
pm2 save 2>/dev/null || true
echo ""

echo "===== Health check ====="
echo "$HEALTH_URL"

# pm2 returns as soon as it has spawned the process, but Next needs a moment
# more to bind the port. Curling once here reports FAILED on a good deploy,
# so poll until it answers or the timeout runs out.
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
health_deadline=$(( SECONDS + HEALTH_TIMEOUT ))
while true; do
  if health_body="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null)"; then
    echo "  OK after ${SECONDS}s — $health_body"
    break
  fi
  if [ "$SECONDS" -ge "$health_deadline" ]; then
    echo "  FAILED after ${HEALTH_TIMEOUT}s — check: pm2 logs $APP_NAME"
    exit 1
  fi
  sleep 2
done
echo ""

echo "========== DEPLOY COMPLETE =========="
pm2 list
