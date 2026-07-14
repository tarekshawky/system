# نظام إدارة المخازن ومستودعات (Warehouse Management System)

Bilingual (Arabic/English) warehouse & inventory management system. Built with Next.js
(App Router), PostgreSQL + Prisma, and NextAuth.

## Stack

- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma ORM
- NextAuth (Auth.js) — credentials login, JWT sessions, role-based access
- next-intl — Arabic (default, RTL) / English
- Tailwind CSS + shadcn/ui

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a PostgreSQL connection
   string) and `AUTH_SECRET` (generate one with `openssl rand -base64 32`).

3. Run migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/[locale]/` — localized routes (`ar`/`en`), App Router
- `app/[locale]/(app)/` — authenticated app shell (sidebar/topbar) and pages
- `prisma/schema.prisma` — database schema
- `lib/prisma.ts` — Prisma client singleton (Postgres driver adapter)
- `i18n/` — next-intl routing/config
- `messages/` — translation files (`ar.json`, `en.json`)
- `components/layout/` — app shell (sidebar, topbar, locale switcher)
- `components/ui/` — shadcn/ui components
- `proxy.ts` — Next.js 16's renamed `middleware.ts`, handles locale routing (and, from
  Phase 1, auth route gating)
