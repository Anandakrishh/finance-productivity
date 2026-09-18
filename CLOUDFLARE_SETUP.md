# Deploy PULSE to Cloudflare (Free Workers + D1)

This stack migrates PULSE from Supabase to **Cloudflare Workers + D1**: a 100% free serverless API and Single Page Application with up to **5 GB** of relational SQLite database storage. No credit card or paid subscription is required.

---

## 1. Connect to your NEW Cloudflare account

If you were previously logged in with another Cloudflare account (such as for Winter Arc), switch accounts first:

```powershell
# Log out of any previous account
npx.cmd wrangler logout

# Log into your NEW Cloudflare account (browser will open)
npx.cmd wrangler login

# Confirm the active account
npx.cmd wrangler whoami
```

---

## 2. Create the D1 database on your new account

Run:

```powershell
npx.cmd wrangler d1 create pulse-db
```

Wrangler will output something like:

```text
[[d1_databases]]
binding = "DB"
database_name = "pulse-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Open `wrangler.toml` in the project root and replace `REPLACE_WITH_YOUR_NEW_D1_DATABASE_ID` with your new `database_id`.

---

## 3. Initialize the database schema

Run this command to create all 12 tables and lookup indexes on Cloudflare D1:

```powershell
npx.cmd wrangler d1 execute pulse-db --remote --file=schema-d1.sql
```

---

## 4. Set the authentication session secret

Generate and set your Worker's signing secret:

```powershell
npx.cmd wrangler secret put AUTH_SECRET
```

When prompted, paste a random string of at least 32 characters (e.g., generated with a password manager) and press Enter. This secret signs login tokens with HMAC-SHA256 and never touches frontend code.

---

## 5. Build and deploy

Run:

```powershell
npm.cmd run build
npx.cmd wrangler deploy
```

Wrangler will print your live URL:
`https://pulse.<your-subdomain>.workers.dev`

Open the URL, register your account, and all tasks, habits, goals, and finance data will persist across all your devices in Cloudflare D1!

---

## 6. Local development

To run both the frontend and the local Cloudflare backend concurrently:

### Terminal 1 (Cloudflare Worker & Local D1 database on port 8787):
```powershell
npx.cmd wrangler dev
```

### Terminal 2 (Vite React dev server on port 5173):
```powershell
npm.cmd run dev
```

Vite is preconfigured in `vite.config.ts` to automatically proxy all `/api` requests to `http://127.0.0.1:8787`.

---

## What files power this setup?

| File | Purpose |
|---|---|
| `worker.js` | Cloudflare Worker API: PBKDF2 user auth, JWT/HMAC sessions, D1 atomic batch sync, and SPA asset serving |
| `schema-d1.sql` | Cloudflare D1 / SQLite schema with users, profiles, tasks, goals, habits, transactions, assets, liabilities, budgets, savings goals, investments, and calendar events |
| `wrangler.toml` | Cloudflare Worker and D1 binding configuration |
| `src/lib/api.ts` | Frontend API client for auth and D1 data synchronization |
| `src/context/AuthContext.tsx` | React auth context powered by Cloudflare Worker API |
| `src/context/AppDataContext.tsx` | Global app data context synced with Cloudflare D1 tables |
