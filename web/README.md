# Personal site (Next.js)

Chip Huyen–inspired personal homepage for Nguyễn Văn Cao. Fullstack-ready: Next.js App Router + optional Postgres (Drizzle). Runs fine with no database today.

## Quick start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What’s included

- Homepage: bio, WELE, Writing → [Substack](https://kaonguyen.substack.com/), open source, links
- `GET /api/health` — always works; reports `db: "not_configured"` until you set `DATABASE_URL`
- Drizzle schema (`contact_messages`) ready for later features
- `output: "standalone"` for self-hosting

## Database (optional)

You don’t need Postgres to develop or deploy the site.

When you’re ready:

```bash
cp .env.example .env.local
# edit DATABASE_URL

docker compose up -d
npm run db:push
```

Then `/api/health` should return `{ "ok": true, "db": "ok" }`.

## Deploy

On the server (after `git pull`), from the repo root:

```bash
./script.sh              # install + build + pm2 restart (port 41717)
./script.sh --restart    # pm2 only
```

PM2 process name: `caobo171.web`. Health: `http://127.0.0.1:41717/api/health`.

Or build a Node standalone server:

```bash
cd web && npm run build
# run node .next/standalone/server.js (after copying static assets per Next standalone docs)
```
