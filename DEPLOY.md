# Deploying waytoresidency to Vercel

The app is a single Next.js 16 deployment. Express has been folded into Next route handlers, so you ship one thing: `apps/web`. Postgres stays on Neon (already provisioned).

## What goes where

| Concern | Where it lives | Free tier? |
|---|---|---|
| Web pages + API routes + Better Auth | Vercel | Yes (Hobby) |
| Postgres | Neon (`ep-hidden-feather-aql3a8kp...`) | Yes |
| File storage / cron | n/a yet | — |

## One-time setup (about 15 min)

### 1. Push to GitHub

```bash
git add -A
git commit -m "initial commit"
git push -u origin master
```

(Remote already set: `git@github.com:vespersolutionspk18/waytoresidency.git`)

### 2. Create the Vercel project

1. Open https://vercel.com/new
2. **Import** the `waytoresidency` GitHub repo
3. **Configure project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: leave as `.` (vercel.json points to `apps/web`)
   - **Build & Output Settings**: leave defaults (vercel.json handles them)
   - **Install Command**: leave defaults (vercel.json handles it)
4. **Environment Variables** — add these (same values you'd use for production):

   | Name | Value | Note |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_sWCo79TiMdfB@ep-hidden-feather-aql3a8kp.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require` | Same Neon URL |
   | `BETTER_AUTH_SECRET` | (generate a fresh 32+ char random string for prod) | `openssl rand -hex 32` |
   | `BETTER_AUTH_URL` | `https://waytoresidency.vercel.app` (or your custom domain, full URL with `https://`) | Update after step 4 |
   | `NEXT_PUBLIC_APP_URL` | same as `BETTER_AUTH_URL` | Same value |

5. **Deploy**. First build will take 2-3 min.

### 3. Verify the first deploy

After the deploy finishes, open the assigned URL (e.g. `waytoresidency.vercel.app`) and check:

- `https://your-domain/api/health` → `{"ok":true}`
- `/sign-up` → create a test account, should land you on `/dashboard`
- `/admin` after signing in as `admin@waytoresidency.com` / `WtrAdmin2026!` → should land in admin panel

If `/sign-in` errors out: re-check `BETTER_AUTH_URL` matches the deployed URL exactly (no trailing slash).

### 4. (Optional) Custom domain

1. Vercel project → **Settings → Domains** → add `waytoresidency.com`
2. Vercel shows the DNS records to set. At your registrar (Hostinger / GoDaddy / wherever):
   - `A` record `@` → `76.76.21.21`
   - `CNAME` record `www` → `cname.vercel-dns.com`
3. Wait for DNS to propagate (usually <30 min, sometimes hours)
4. **Update env vars** `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://waytoresidency.com`
5. **Redeploy** (Vercel → Deployments → click latest → Redeploy)

## Day-to-day workflow

After the initial setup, deploys are automatic:

```bash
git push          # → Vercel auto-deploys
```

Every push to `master` ships to production. PRs get preview URLs automatically.

## Database migrations

Migrations are kept in `apps/web/drizzle/`. They were applied to Neon already. For future schema changes:

```bash
# locally
pnpm db:generate    # creates a new migration from schema changes
pnpm db:migrate     # applies it to the Neon URL in .env.local
git add apps/web/drizzle/
git commit -m "schema: <what changed>"
git push
```

Migrations don't run on Vercel deploys — apply them locally first, then push the new migration files. Neon is a shared DB so the migration is live the moment you run `db:migrate` locally; the new deploy just needs the schema to already be there.

## Seeding

| Command | What it does |
|---|---|
| `pnpm admin:seed` | Creates default admin `admin@waytoresidency.com` / `WtrAdmin2026!` |
| `pnpm admin:promote <email>` | Promotes any existing user to admin |
| `pnpm seed:questions` | Ingests questions from `docs/Generic 2024 final 62.docx` |

All seed scripts read `apps/web/.env.local` and write directly to Neon. They are not run on Vercel — use them locally.

## Free tier limits to watch

| Resource | Vercel Hobby | When to upgrade |
|---|---|---|
| Function invocations | 100K / month | At ~70K, plan the Pro move ($20/mo, 1M) |
| Bandwidth | 100 GB / month | Won't hit at expected scale |
| Function timeout | 10 sec | Fine for current routes |
| Build minutes | Generous | n/a |

Watch the **Usage** tab in Vercel monthly. Function invocations are the constraint — each API call from the client and each non-static page render counts.

## What changed from the old setup

Before: separate `apps/web` (Next) and `apps/api` (Express) → required two deploys.

Now: everything in `apps/web`. The Express code is archived at `apps/_archive_api` (kept for reference, not built). The pnpm workspace only includes `apps/web` now.

If you ever need to nuke the archive:

```bash
rm -rf apps/_archive_api
```

(It's harmless either way — it's excluded from the workspace.)
