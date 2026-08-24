# Tusha Booking — Architecture Specification

**Version:** 1.0 · 29 July 2026
**Status:** Authoritative. This document governs all code written for this project.
**Audience:** Any model or developer implementing tasks. **Read this file before writing any code.**

---

## 0. How to use this document

This is the constitution. Task cards (`PHASE-A-TASKS.md`, etc.) tell you *what* to build; this file tells you *how everything must be built*. If a task card contradicts this document, this document wins — stop and flag it.

**Verbatim files.** Some files are provided as complete, final code:

- `lib/auth.ts`
- `lib/authz.ts`
- `lib/db.ts`
- `lib/audit.ts`
- `lib/bookings.ts`
- `db/migrations/*.sql`

**Do not rewrite, refactor, "improve", or reformat these.** Copy them in exactly. Everything else is yours to implement against the rules below.

---

## 1. Stack — fixed, do not change

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Node.js for route handlers; **Edge for middleware** |
| Language | TypeScript, `strict` |
| Database | PostgreSQL 18.3, accessed via `pg` (no ORM) |
| Auth | JWT (HS256) via `jose`, in an HttpOnly cookie |
| Validation | **Zod** — add as a dependency |
| Styling | Tailwind CSS v4 |
| Images | Cloudinary (public); private bucket for documents |
| Testing | **Vitest** — add as a dependency |

**Do not introduce** an ORM, a state management library, a component library, or any auth framework (NextAuth etc.). Do not upgrade or downgrade existing dependencies.

---

## 2. The one rule that matters most

> **Identity comes from the JWT cookie. Never from the request body, the URL, a query parameter, or `localStorage`.**

Every current security hole in this codebase is a violation of that sentence. When implementing any endpoint:

```ts
// ❌ NEVER — the client can send any value
const { userId } = await request.json();
const businessId = params.businessId;

// ✅ ALWAYS — derived server-side from the signed token
const session = await requireBusiness(request);
const businessId = await getBusinessIdForUser(session.userId);
```

**Corollary — ownership, not seniority.** A `business` role does not grant access to all business data; it grants access to *that user's own* business data. Every business-scoped query must filter by an ownership join derived from `session.userId`. A role check alone is never sufficient.

```ts
// ❌ role check only — any business reads any other business
'SELECT * FROM properties WHERE business_id = $1'      // $1 from client

// ✅ ownership enforced in the query
`SELECT p.* FROM properties p
   JOIN businesses b ON p.business_id = b.business_id
  WHERE b.user_id = $1`                                 // $1 from session
```

---

## 3. Layering — where code lives

```
app/api/**/route.ts     HTTP only: auth guard → validate → call service → shape response
lib/services/*.ts       Business logic + SQL. No HTTP types. Reusable.
lib/auth.ts             Token signing/verification. EDGE-SAFE — must not import `pg`.
lib/authz.ts            Ownership checks. Node-only (uses the database).
lib/db.ts               The single connection pool.
lib/audit.ts            Audit log writer.
lib/validation/*.ts     Zod schemas, one file per domain.
app/**/page.tsx         UI. Fetches via API routes. No direct database access.
components/**           Presentational. No data fetching.
```

**Hard rules:**

1. **`lib/db.ts` is the only place `new Pool()` may appear.** Four route files currently create their own pools — all must import from `lib/db`.
2. **`lib/auth.ts` must never import `pg`** or anything Node-only. Middleware runs on the Edge runtime and will fail at build time otherwise. Database-backed authorisation lives in `lib/authz.ts`.
3. **Route handlers contain no SQL.** Move it to `lib/services/`.
4. **Admin actions call the same service functions as everything else.** Never write ad-hoc `UPDATE` statements from an admin route — that is how `room_availability` and the commission ledger silently drift out of sync.

---

## 4. Standard route handler shape

Every API route follows this exactly:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth';
import { handleRouteError } from '@/lib/auth';
import { createPropertySchema } from '@/lib/validation/property';
import { createProperty } from '@/lib/services/properties';

export async function POST(request: NextRequest) {
  try {
    const session = await requireBusiness(request);          // 1. authenticate + authorise
    const body = createPropertySchema.parse(await request.json()); // 2. validate
    const property = await createProperty(session.userId, body);   // 3. delegate
    return NextResponse.json({ property }, { status: 201 });       // 4. shape
  } catch (error) {
    return handleRouteError(error);                          // 5. single error path
  }
}
```

For dynamic routes, `params` is a Promise in Next.js 15+:

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;
  ...
}
```

---

## 5. Response and error conventions

**Success** — always a named object, never a bare array:

```jsonc
{ "property": { ... } }          // single resource
{ "properties": [ ... ] }        // collection
{ "properties": [...], "total": 42, "page": 1 }   // paginated
```

**Error** — always this shape:

```jsonc
{ "error": "Human-readable message" }
{ "error": "Validation failed", "fields": { "email": "Invalid email" } }
```

**Status codes:** `200` ok · `201` created · `400` validation · `401` not logged in · `403` logged in but not allowed · `404` not found *(also used to hide `/admin/*` from non-admins)* · `409` conflict (room taken, duplicate) · `500` server error.

**Never** return `error.message`, stack traces, or SQL text to the client. `handleRouteError` enforces this — always use it.

---

## 6. Database conventions

- **Parameterised queries only.** Never build SQL by string concatenation with user input.
- **Money:** `NUMERIC(10,2)`. `pg` returns numerics as **strings** — always `parseFloat()` before arithmetic, and never do money maths in JavaScript floats where precision matters. Prefer calculating in SQL.
- **Dates:** `check_in_date` / `check_out_date` are `DATE`. Pass and receive `'YYYY-MM-DD'` strings **only**. **Never call `.toISOString()` on a calendar date** — it converts to UTC and shifts the day for UTC+2 users.
- **Multi-statement writes run in a transaction** with `BEGIN` / `COMMIT` / `ROLLBACK` and `client.release()` in `finally`.
- **Existing trigger:** `update_updated_at_column()` already maintains `updated_at` on `bookings`, `businesses`, `event_spaces`, `properties`, `rooms`, `users`. Attach it to any new table with an `updated_at` column. Never set `updated_at` manually.
- **Migrations are numbered and forward-only:** `db/migrations/001_*.sql`. Never edit a migration that has been applied — add a new one.

---

## 7. Domain invariants — never violate these

1. **A listing is publicly visible only when** `properties.approval_status = 'approved'` **and** `properties.is_active = true` **and** the owning business has `businesses.status = 'active'`. All three. Every customer-facing query.
2. **Only an admin may set `approval_status = 'approved'`.** Businesses create and edit; they never publish.
3. **A room cannot be double-booked.** Enforced by the `unique_room_date UNIQUE (room_id, date)` constraint plus `ON CONFLICT DO NOTHING` with a row-count check — never by a `SELECT` followed by an `INSERT`.
4. **`bookings.user_id` always comes from the JWT.**
5. **Money quoted to the guest equals money charged.** The server produces the quote; the client only displays it. No prices hardcoded in UI.
6. **VAT is applied only when `properties.is_vat_registered = true`.** Never charge VAT on behalf of a property below the K800,000 threshold.
7. **The deposit equals the commission.** The property is paid the balance directly. Tusha never holds funds belonging to a property.
8. **Every privileged action writes to `admin_audit_log` in the same transaction as the change.**
9. **A review requires a completed booking.** `reviews.booking_id` is `NOT NULL` and unique — the schema already enforces one review per booking.

---

## 8. Naming

- Database: `snake_case`, plural tables (`properties`), `<singular>_id` primary keys.
- TypeScript: `camelCase` variables, `PascalCase` types.
- **API JSON uses `snake_case`** to match the database — do not transform casing between layers. Consistency beats convention here; the existing code already does this.
- Routes: kebab-case (`/api/admin/business-documents`).
- Services: verb-first (`createProperty`, `approveProperty`, `listPendingProperties`).

---

## 9. Security requirements

| | |
|---|---|
| Passwords | bcrypt, cost **12** |
| Session | JWT in HttpOnly cookie, `secure` in production, `sameSite: 'lax'` |
| Token lifetime | 7 days for customer/business, **8 hours for admin** |
| Logout | `POST /api/logout` clears the cookie. **Required** — clearing `localStorage` is not logout. |
| Admin routes | `requireAdmin()` in every handler; return **404** to non-admins |
| Uploads | Authenticated only. Documents to a **private** bucket, never public Cloudinary |
| Rate limits | Login 5/15min per IP+email; admin login 3/15min |
| PII | Never `SELECT *` on `users`. Never return `password_hash`. Log admin reads of personal data |
| Secrets | `.env` must be gitignored. Fail loudly at boot if `JWT_SECRET` is missing |

---

## 10. What NOT to do

Applies to every task unless a task card explicitly says otherwise:

- Do not refactor or reformat code outside the files named in your task.
- Do not add features, endpoints, fields, or UI that were not asked for.
- Do not add comments explaining what obvious code does.
- Do not modify `package.json` except to add a dependency a task card names.
- Do not modify any verbatim file listed in §0.
- Do not run migrations against a live database — output SQL only; a human applies it.
- Do not add `console.log` outside `catch` blocks.
- Do not use `any`. Use `unknown` and narrow, or define the type.
- Do not create `README`s, docs, or example files unless asked.
- Do not upgrade dependencies.

---

## 11. Definition of done

A task is complete only when all of these hold:

1. `npx tsc --noEmit` passes with no new errors.
2. `npm run lint` passes.
3. Every acceptance check in the task card passes.
4. No file outside the task's declared scope has been modified.
5. No secret, credential, or personal data appears in any response payload.

---

## 12. Known schema facts

Confirmed against the live dump — build on these, do not re-derive:

- `users.user_type` is a **CHECK constraint** (`customer`, `business`), not an enum. Migration 001 adds `admin`.
- `unique_room_date UNIQUE (room_id, date)` **exists** on `room_availability` — the concurrency fix depends on it.
- `check_in_date` / `check_out_date` are **`DATE`**. The timezone bug is client-side only.
- `properties.is_published` **defaults to `false`**; the API currently overrides it with a hardcoded `true`.
- `bookings.payment_status` already permits **`partially_paid`** — this is the deposit state.
- `bookings.status` already permits **`no_show`**.
- `bookings` already models **both** room and event bookings via `booking_type` plus the `check_room_booking` / `check_event_booking` constraints.
- `unique_business_per_user UNIQUE (user_id)` — **one business per user account**.
- `businesses.is_verified` already exists (currently unused).
- `reviews.booking_id` is `NOT NULL` with `unique_review_per_booking`.
- The `btree_gist` extension is installed — migration 001 uses it for the event-space overlap constraint.
- `event_spaces` and `space_availability` are **in scope from Phase C** (see `PHASE-C-EVENTS.md`). Migration 001 adds delegate pricing and `booking_mode`.
- `events` and `event_tickets` (public ticket sales) are **out of scope indefinitely** — a different product. Leave the tables untouched; write no code against them.

### Migration 001 verification

Migration 001 has been executed against a clean load of `db/schema.sql` and verified:

- applies with no errors, and is **idempotent** (re-running is a no-op)
- `user_type = 'admin'` accepted; unknown types still rejected
- an `instant` space with no published price is rejected
- overlapping event-space bookings are rejected; adjacent slots (17:00 after 08:00–17:00) are accepted
- `ON CONFLICT (room_id, date) DO NOTHING` returns a short row count on collision, which is what the booking service checks

Do not modify this migration. If something further is needed, add `002_*.sql`.
