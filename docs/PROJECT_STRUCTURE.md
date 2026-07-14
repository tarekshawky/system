# Project structure & API reference

## Folder layout

```
app/
  [locale]/                    # localized routes — "ar" or "en"
    (auth)/login/              # login page (public)
    (app)/                     # authenticated app shell (sidebar + topbar)
      dashboard/
      warehouses/
      categories/
      products/
      suppliers/
      customers/
      movements/                 # stock in/out/transfer/adjustment
      reports/                   # inventory valuation / low stock / movements
      audit-log/                  # admin-only
      users/                      # admin-only
      settings/                   # admin-only
    layout.tsx                  # sets <html lang/dir>, loads messages
    page.tsx                    # redirects "/" -> "/dashboard"
    unauthorized.tsx / forbidden.tsx   # 401 / 403 pages
  api/
    auth/[...nextauth]/route.ts       # NextAuth handlers
    reports/[type]/route.ts           # PDF/Excel report export

auth.ts                        # NextAuth config (Credentials provider, JWT callbacks)
proxy.ts                       # Next.js 16's renamed middleware.ts — locale routing +
                                # auth/role route gating (runs on every request)

lib/
  actions/                     # Server Actions — the app's real "API" (see below)
  auth/
    permissions.ts             # PERMISSIONS map: permission key -> allowed roles
    guard.ts                   # requireAuth() / requirePermission() for pages & actions
  audit/logAudit.ts            # writes to the AuditLog table
  reports/                     # report queries + HTML/PDF/Excel generation
  prisma.ts                    # Prisma client singleton (Postgres driver adapter)
  generated/prisma/            # generated Prisma client (gitignored, regenerate with
                                # `npx prisma generate`)

prisma/
  schema.prisma                # full data model
  migrations/                  # SQL migrations, applied in order
  seed.ts                      # demo data

i18n/                          # next-intl routing/navigation config
messages/{ar,en}.json          # all UI translation strings

components/
  layout/                      # app shell: sidebar, topbar, locale switcher
  data-table/                  # reusable search input, pagination, select filter
  dashboard/                   # Recharts trend chart
  ui/                          # shadcn/ui primitives (Base UI under the hood)
```

## Data model

See `prisma/schema.prisma` for the authoritative definitions. Summary:

- **User** — `role` is one of `ADMIN` / `MANAGER` / `STAFF`.
- **Warehouse**, **Category** (self-referential parent/child), **Product** (belongs to a
  Category, has `costPrice`/`sellPrice`/`reorderLevel`), **Supplier**, **Customer** — all
  soft-deleted via `isActive`, never hard-deleted (their history must stay valid).
- **Stock** — the current quantity of a Product in a Warehouse (composite primary key
  `productId + warehouseId`).
- **StockMovement** — the append-only ledger. `quantity` is **signed** (positive for
  IN/transfer-in, negative for OUT/transfer-out); `SUM(quantity)` grouped by
  `(productId, warehouseId)` always equals the corresponding `Stock.quantity`. A transfer
  is two StockMovement rows sharing a `transferGroupId`.
- **AuditLog** — one row per mutation, login, logout, and report export, with `before`/
  `after` JSON snapshots.
- **Setting** — a singleton row (id=1) holding company name/logo/address, used on PDF
  report headers.

## Permission matrix

Defined in `lib/auth/permissions.ts`, enforced in three places: `proxy.ts` (coarse route
gating), every Server Action via `requirePermission()` (the real security boundary), and
conditionally in the UI (hiding buttons the user can't use).

| Action | Admin | Manager | Staff |
|---|---|---|---|
| User management | Y | – | – |
| Master data read | Y | Y | Y |
| Master data write/deactivate | Y | Y | – |
| Stock IN/OUT | Y | Y | Y |
| Stock TRANSFER/ADJUSTMENT | Y | Y | – |
| Reports view + export | Y | Y | Y |
| Cost price / inventory valuation | Y | Y | – |
| Audit log | Y | – | – |
| Settings | Y | – | – |

## "API" — Server Actions

Most of the app's mutations go through **Next.js Server Actions**, not REST endpoints —
there is no separate API layer to keep in sync, and every action re-derives the session
server-side rather than trusting the client. Each file in `lib/actions/` exports one
action per operation:

| File | Exports |
|---|---|
| `auth.ts` | `loginAction`, `logoutAction` |
| `users.ts` | `createUser`, `updateUser` |
| `warehouses.ts` | `createWarehouse`, `updateWarehouse` |
| `categories.ts` | `createCategory`, `updateCategory` |
| `products.ts` | `createProduct`, `updateProduct` |
| `suppliers.ts` | `createSupplier`, `updateSupplier` |
| `customers.ts` | `createCustomer`, `updateCustomer` |
| `movements.ts` | `createMovementAction` (type: `IN` \| `OUT` \| `TRANSFER` \| `ADJUSTMENT`) |
| `settings.ts` | `updateSettings` |

Every action: checks `requirePermission(...)` first, performs the mutation (wrapped in
`prisma.$transaction` for anything touching `Stock`), calls `logAudit(...)`, then
`revalidatePath(...)` the affected page.

## HTTP API routes

Only two things need real HTTP endpoints — OAuth-style auth callbacks and binary file
downloads (Server Actions can't stream a file response):

### `GET/POST /api/auth/[...nextauth]`
Handled entirely by NextAuth (`auth.ts`). Not called directly by the UI — the login form
posts through NextAuth's `signIn()`.

### `GET /api/reports/[type]`
Generates and streams a report file.

- `type` — path param, one of `inventory` | `low-stock` | `movements`
- Query params:
  - `format` — `pdf` (default) or `excel`
  - `locale` — `ar` (default) or `en`, controls the report's language and PDF direction
  - For `movements` only: `from`, `to` (ISO dates), `warehouseId`, `type` (movement type)
- Auth: requires `report.view`; the `inventory` report additionally requires `cost.view`
  (Admin/Manager only)
- Response: `application/pdf` or the `.xlsx` MIME type, with
  `Content-Disposition: attachment`
- Side effect: writes an `EXPORT` row to `AuditLog` with the format and row count

## Environment variables

See `.env.example`. `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` are required; there
are no optional integrations in this MVP (no email provider, no external storage).
