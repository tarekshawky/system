# نظام إدارة المخازن ومستودعات (Warehouse Management System)

Bilingual (Arabic/English) MVP for warehouse & inventory management: multi-warehouse stock
tracking, products/categories, suppliers/customers, stock movements (in/out/transfer/
adjustment) with low-stock alerts, a dashboard, PDF/Excel reports, role-based access
control, and an audit log.

## Stack & why

- **Next.js 16** (App Router, TypeScript) — full-stack in one codebase, fast to build and
  deploy for an MVP.
- **PostgreSQL + Prisma ORM** — a robust, scalable relational database matches the
  transactional nature of stock movements (see `lib/actions/movements.ts`, which wraps
  every quantity change in a DB transaction).
- **NextAuth (Auth.js)** — credentials login with JWT sessions and role-based access
  (Admin / Manager / Staff).
- **next-intl** — Arabic (default, RTL) and English, fully bilingual UI.
- **Tailwind CSS + shadcn/ui** — consistent, accessible UI components, responsive out of
  the box.
- **Playwright** (rendering an HTML template) for PDF export — chosen over
  `@react-pdf/renderer` because it uses a real browser text engine, which shapes Arabic
  text correctly; **exceljs** for Excel export.

## Prerequisites

- Node.js 20.9+ and npm
- A PostgreSQL 14+ database (local or hosted)

## Getting started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Install the Chromium browser used for PDF export** (one-time, downloads ~200MB):

   ```bash
   npx playwright install chromium
   ```

3. **Configure environment variables.** Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a PostgreSQL connection string, e.g.
     `postgresql://user:password@localhost:5432/warehouse_mvp?schema=public`
   - `AUTH_SECRET` — generate one with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev

4. **Run migrations** (creates all tables):

   ```bash
   npx prisma migrate dev
   ```

5. **Seed demo data** (an admin/manager/staff user, a warehouse, a category, and a
   product):

   ```bash
   npx prisma db seed
   ```

   Demo accounts (all use password `password123`):

   | Email | Role |
   |---|---|
   | admin@example.com | Admin |
   | manager@example.com | Manager |
   | staff@example.com | Staff |

6. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — it redirects to `/ar` or `/en`
   based on your browser's language, then to the login page.

## Deploying to Vercel

1. **Import the repo.** On [vercel.com/new](https://vercel.com/new), import this GitHub
   repository. Vercel auto-detects Next.js — no build settings need to change (`npm run
   build` already runs `prisma migrate deploy` before `next build`, so every deploy
   applies any new migrations automatically).

2. **Add a Postgres database.** In the project's **Storage** tab, create a **Postgres**
   database (Vercel's managed Postgres, powered by Neon) and connect it to the project.
   This injects its own env vars (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.) — copy the
   pooled connection string into a `DATABASE_URL` env var yourself (Project Settings →
   Environment Variables), since that's the name `prisma.config.ts` and `lib/prisma.ts`
   read. If you'd rather use another provider (Neon, Supabase, Railway…), just set
   `DATABASE_URL` to its connection string instead.

3. **Set the remaining env vars** (Project Settings → Environment Variables):
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-project.vercel.app`

4. **Deploy.** First deploy creates the schema via `prisma migrate deploy`. Seed the
   production database once, from your machine, by pointing `DATABASE_URL` at the
   production connection string and running `npx prisma db seed` — or create the first
   admin user directly in the database.

**PDF export on Vercel**: the report PDF route (`app/api/reports/[type]/route.ts`) uses
`playwright-core` + `@sparticuz/chromium` (a Linux-only prebuilt Chromium made for
serverless functions) instead of full Playwright — this is required because Vercel's
serverless functions can't run the ~280MB Chromium build that `npx playwright install`
downloads locally. Locally, the same code path uses your local Playwright install
(`npx playwright install chromium`, done once during setup above); nothing to configure
either way, the route auto-detects the environment.

## Building for production (self-hosted)

```bash
npm run build
npm start
```

Set `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` (your production domain) in the
deployment environment. If you're not on Vercel (no serverless size limits), you can
simplify PDF export back to full Playwright — but as shipped, it already works anywhere
via the Linux `@sparticuz/chromium` binary, so no change is required.

## Documentation

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the folder layout, the
data model, the permission matrix, and the API route reference.
