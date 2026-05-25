# Way to Residency

SaaS prep platform for Pakistani medical graduates studying for **FCPS Part 1** and the **Aga Khan Residency** exam. Built around a 62-question bank with tutor + timed-quiz modes, an admin LMS, and an HBLPay-shaped billing layer.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) — both the website and the API live in `apps/web`
- **Better Auth** (email + password, Drizzle adapter, cross-route cookies)
- **Drizzle ORM** + **Neon serverless Postgres**
- **Tailwind v4**, **Tiptap 3** (admin question editor)
- **pnpm** workspaces (single deployable: `@waytoresidency/web`)

## Repo layout

```
waytoresidency/
├── apps/
│   ├── web/                ← the only deployed app
│   │   ├── app/            ← Next App Router pages + route handlers
│   │   │   ├── (auth)/     ← /sign-in, /sign-up
│   │   │   ├── (marketing)/← /, /about, /services, /books, /contact, /dr-rashid
│   │   │   ├── (app)/      ← /dashboard, /account, /quiz, /tutor, /attempts, /billing
│   │   │   ├── admin/      ← /admin/* (users, payments, messages, content, …)
│   │   │   └── api/        ← all 35 server endpoints (Better Auth, billing, attempts, admin)
│   │   ├── lib/            ← db client, auth config, helpers, web-side api client
│   │   ├── drizzle/        ← SQL migrations
│   │   └── scripts/        ← admin:seed, admin:promote, seed:questions, test-e2e.sh
│   └── _archive_api/       ← old Express server (no longer built)
├── vercel.json             ← Vercel deploy config
├── DEPLOY.md               ← step-by-step Vercel deployment guide
└── pnpm-workspace.yaml
```

## Local dev

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local   # if missing, see DEPLOY.md
pnpm db:migrate                                       # apply migrations to Neon
pnpm admin:seed                                       # create the default admin
pnpm dev                                              # http://localhost:3000
```

Default admin:
- Email: `admin@waytoresidency.com`
- Password: `WtrAdmin2026!`

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate a new Drizzle migration |
| `pnpm db:migrate` | Apply pending migrations to Neon |
| `pnpm db:studio` | Drizzle Studio UI |
| `pnpm admin:seed` | Create / re-promote the default admin |
| `pnpm admin:promote <email>` | Promote a user to admin |
| `pnpm seed:questions` | Ingest the 62 questions from the source DOCX |
| `bash apps/web/scripts/test-e2e.sh` | Run the 70-test end-to-end suite against `localhost:3000` |

## Deployment

Single Vercel deploy. See **[DEPLOY.md](./DEPLOY.md)** for the full walkthrough.
