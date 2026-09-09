#!/bin/bash
# Deploy the personal site (Next.js in web/).
# Run on the server after `git pull` (same idea as ~/project/wele/script.sh).
#
# Usage:
#   ./script.sh              # npm install (if needed), build, pm2 restart
#   ./script.sh --restart    # skip build, just restart pm2
#   ./script.sh --no-install # skip npm ci/install
#
# Process: caobo171.web on port 3010 (see web/ecosystem.config.js)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web"
APP_NAME="caobo171.web"
PORT="${PORT:-3010}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

BUILD=true
RUN_INSTALL=true

for arg in "$@"; do
  case "$arg" in
    --restart)    BUILD=false ;;
    --no-install) RUN_INSTALL=false ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg (options: --restart, --no-install)"
      exit 1
      ;;
  esac
done

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
echo -n "$HEALTH_URL ... "
if curl -fsS --max-time 8 "$HEALTH_URL"; then
  echo
else
  echo "FAILED — check: pm2 logs $APP_NAME"
  exit 1
fi
echo ""

echo "========== DEPLOY COMPLETE =========="
pm2 list
