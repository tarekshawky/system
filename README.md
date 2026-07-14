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

## Building for production

```bash
npm run build
npm start
```

Set `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` (your production domain) in the
deployment environment. Run `npx prisma migrate deploy` against the production database
before starting the app. The PDF export route needs the Playwright Chromium browser
available at runtime — run `npx playwright install chromium --with-deps` on the deploy
target (or use a Docker base image that includes it).

## Documentation

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the folder layout, the
data model, the permission matrix, and the API route reference.
