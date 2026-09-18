# PULSE — Personal Life & Finance Operating System

A calm, liquid-design personal workspace for tasks, habits, goals, calendar, and finance tracking.

## Architecture: Cloudflare Workers + D1

PULSE runs on a 100% free serverless stack powered by **Cloudflare Workers** and **Cloudflare D1** (SQLite relational database).

- **5 GB Free Database Storage**: Stored in Cloudflare D1 with zero paid subscriptions.
- **Secure Authentication**: Salted PBKDF2 password hashing and HMAC-SHA256 session tokens.
- **Ultra-fast Edge Sync**: Single-batch synchronization between React state and D1.
- **Single-page Application**: Hosted directly on Cloudflare Workers Assets.

## Quick Start (Cloudflare)

To deploy on your new Cloudflare account, follow [`CLOUDFLARE_SETUP.md`](./CLOUDFLARE_SETUP.md).

```powershell
# 1. Login to your new Cloudflare account
npx.cmd wrangler login

# 2. Create the D1 database
npx.cmd wrangler d1 create pulse-db
# (Paste the database_id into wrangler.toml)

# 3. Apply schema
npx.cmd wrangler d1 execute pulse-db --remote --file=schema-d1.sql

# 4. Set session signing secret
npx.cmd wrangler secret put AUTH_SECRET

# 5. Build and deploy
npm.cmd run build
npx.cmd wrangler deploy
```

## Local Development

```powershell
# Terminal 1: Cloudflare Worker API & Local D1
npm.cmd run worker:dev

# Terminal 2: React Vite App (proxies /api to Worker)
npm.cmd run dev
```
