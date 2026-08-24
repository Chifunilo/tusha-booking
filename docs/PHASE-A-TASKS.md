# Phase A — Task Cards

**Read `ARCHITECTURE.md` first.** It governs everything here.
**Goal of Phase A:** close every critical security finding and gate publication behind admin approval. At the end, the platform is safe to put in front of real users.

**Working rules for every task:**
- Touch only the files listed under **Scope**. Nothing else.
- Do not modify any verbatim file (`lib/auth.ts`, `lib/tokens.ts`, `lib/errors.ts`, `lib/db.ts`, `lib/authz.ts`, `lib/audit.ts`, `lib/pricing.ts`, `lib/services/bookings.ts`, `db/migrations/*`).
- A task is done only when every **Accept** check passes.
- If a task seems to require changing something outside its scope, stop and say so. Do not improvise.

---

## A0 — Dependencies and scripts

**Scope:** `package.json`, `vitest.config.ts`
**Depends on:** nothing

Add `zod` to dependencies. Add `vitest` and `@types/pg` to devDependencies. Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

Copy `vitest.config.ts` from the spec bundle as-is.

**Accept:** `npm run typecheck` runs · `npm test` runs and reports 30 passing tests.
**Do not:** upgrade or change any existing dependency version.

---

## A1 — Install the verbatim foundation

**Scope:** `lib/tokens.ts`, `lib/errors.ts`, `lib/auth.ts`, `lib/authz.ts`, `lib/db.ts`, `lib/audit.ts`, `lib/pricing.ts`, `lib/services/bookings.ts`, `tests/**`
**Depends on:** A0

Copy these files from the spec bundle exactly. Do not reformat, rename, or "improve" them.

**Accept:** `npm run typecheck` passes · `npm test` shows 30 passing.
**Do not:** edit a single line of any of them.

---

## A2 — Apply migration 001 ⚠️ HUMAN ONLY

**Scope:** the database
**Depends on:** A1

**An automated agent must not perform this task.** Chifunilo runs it:

```bash
pg_dump -Fc "$DATABASE_URL" > backup_before_001.dump
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_auth_approval_and_audit.sql
```

Then run the **development-only** block at the bottom of the migration if this is a dev database with test listings that should stay visible. Then create the first admin using the commented `INSERT` at the very bottom, with a locally generated bcrypt hash (cost 12).

Finally re-dump: `pg_dump --schema-only "$DATABASE_URL" > db/schema.sql`

**Accept:** `SELECT approval_status FROM properties LIMIT 1` returns a value · an `admin` user exists · migration re-runs with no error.

---

## A3 — Extend middleware to the business and admin areas

**Scope:** `middleware.ts` only
**Depends on:** A1

Replace the inline `verifyToken` usage with `getSession` from `@/lib/auth`. Protect `/business-dashboard`, `/add-property`, `/add-room` in addition to the current three. Add `/admin` — but for `/admin`, a non-admin must be **rewritten to a 404 page**, not redirected to login.

```ts
const PROTECTED = ['/booking', '/payment', '/profile-page',
                   '/business-dashboard', '/add-property', '/add-room'];
```

Matcher must cover all of them plus `/admin/:path*`.

**Accept:** logged out, `/business-dashboard` redirects to `/login?redirect=...` · logged in as `customer`, `/admin` returns a 404 page · logged in as `admin`, `/admin` renders.
**Do not:** import `pg` or `lib/authz` here — middleware runs on Edge and the build will fail.

---

## A4 — Real logout ⭐ critical

**Scope:** `app/api/logout/route.ts` (new), `app/context/AuthContext.tsx`
**Depends on:** A1

Create `POST /api/logout` that clears the `auth_token` cookie:

```ts
response.cookies.set('auth_token', '', { httpOnly: true, path: '/', maxAge: 0 });
```

Make `AuthContext.logout()` `await fetch('/api/logout', { method: 'POST' })` **before** clearing local state and redirecting.

**Accept:** after logging out, `GET /api/me` returns 401 · the `auth_token` cookie is gone from devtools · navigating back to `/profile-page` redirects to login.
**Why:** currently the cookie survives logout for 7 days. This is the most serious auth bug in the codebase.

---

## A5 — Login route uses the shared token helper

**Scope:** `app/api/login/route.ts`
**Depends on:** A1

Replace the inline `SignJWT` block with `signToken` from `@/lib/auth`. Use `COOKIE_MAX_AGE[user.user_type]` for the cookie, so admin sessions get 8 hours rather than 7 days. Raise bcrypt comparison cost expectations to 12 for newly created accounts (A6). Wrap the handler in `try/catch` with `handleRouteError`. Validate the body with Zod (`email`, `password` required).

Keep the existing behaviour of returning an identical error for unknown email and wrong password.

**Accept:** login still works for customer and business · an admin login produces a cookie with `Max-Age=28800` · a malformed body returns 400 with a `fields` object.
**Do not:** return `password_hash` in the response.

---

## A6 — Signup creates an application, not a live business

**Scope:** `app/api/signup/route.ts`, `lib/validation/auth.ts` (new)
**Depends on:** A1

Zod schema: email (valid), password (min 8 chars), userType (`customer` | `business` only — **never `admin`**), plus `businessName` and `businessType` required when userType is `business`.

Hash with bcrypt cost **12**.

For business signups, insert the `businesses` row with `status = 'pending_verification'`, `tier = 'unverified'`, `onboarding_source = 'self_service'`, and **stop writing `'TBD'` into `address_line1`, `city`, `country`** — take them from the request body and require them in the schema.

Wrap user + business insert in a single transaction.

**Accept:** `userType: 'admin'` is rejected with 400 · a 5-character password is rejected · a new business has `status = 'pending_verification'` · no row contains `'TBD'` · if the business insert fails, no orphan user remains.

---

## A7 — Secure every existing route ⭐ the main sweep

**Scope:** the nine route files in the table below
**Depends on:** A1

This is the task that closes findings C2, C3, C6 and H5. **The pattern is identical every time** — here is the complete worked example for the first row, then apply the same shape to the rest.

### Worked example — `app/api/properties/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness, handleRouteError } from '@/lib/auth';
import { requireActiveBusinessId } from '@/lib/authz';
import { createPropertySchema } from '@/lib/validation/property';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await requireBusiness(request);
    // businessId is DERIVED, never accepted from the body
    const businessId = await requireActiveBusinessId(session.userId);
    const input = createPropertySchema.parse(await request.json());

    const result = await pool.query(
      `INSERT INTO properties (
         business_id, property_name, property_type,
         address_line1, address_line2, city, state_province, country, postal_code,
         description, amenities, phone, email, images,
         approval_status, is_active
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',true)
       RETURNING property_id, property_name, approval_status`,
      [businessId, input.propertyName, input.propertyType,
       input.addressLine1, input.addressLine2 ?? null, input.city,
       input.stateProvince ?? null, input.country, input.postalCode ?? null,
       input.description ?? null, input.amenities ?? [], input.phone ?? null,
       input.email, input.images ?? []],
    );

    return NextResponse.json({ property: result.rows[0] }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

Note three things: `businessId` comes from the session, `approval_status` is `'pending'` (never published on creation), and there is exactly one error path.

### Now apply the same shape to these

| # | File | Guard | Ownership rule |
|---|---|---|---|
| 1 | `app/api/properties/route.ts` | `requireBusiness` | derive `businessId`; `approval_status='pending'` **(worked example above)** |
| 2 | `app/api/rooms/route.ts` | `requireBusiness` | `assertOwnsProperty(session.userId, input.propertyId)` before insert |
| 3 | `app/api/upload/route.ts` | `requireBusiness` | none — presence of a valid session is the whole fix |
| 4 | `app/api/users/update/route.ts` | `requireUser` | **ignore any `user_id` in the body**; update `WHERE user_id = session.userId` |
| 5 | `app/api/users/profile/[userId]/route.ts` | `requireUser` | 404 unless `session.userId === Number(userId)` or `session.userType === 'admin'` |
| 6 | `app/api/properties/user/[userId]/route.ts` | `requireBusiness` | ignore the URL param; query by `businessId` derived from session |
| 7 | `app/api/rooms/user/[userId]/route.ts` | `requireBusiness` | same as row 6 |
| 8 | `app/api/business/[userId]/route.ts` | `requireBusiness` | same as row 6 |
| 9 | `app/api/dashboard/route.tsx` | `requireBusiness` | ignore `?userId=`; derive from session. Rename file to `route.ts` |

For rows 6–9 the `[userId]` segment becomes dead. **Leave the route path as-is for now** so the frontend keeps working — just stop trusting the value. Route cleanup is a later task.

Also in every one of these files: replace `new Pool(...)` with `import pool from '@/lib/db'` (rows 4 and 5 currently create their own).

**Accept — run each of these:**
- `curl -X PUT $BASE/api/users/update -d '{"user_id":1,"first_name":"hacked"}' -H 'Content-Type: application/json'` → **401**, and user 1 is unchanged
- `curl $BASE/api/users/profile/1` with no cookie → **401**
- logged in as user A, `GET /api/properties/user/<B's id>` → returns **A's** properties, not B's
- `curl -X POST $BASE/api/upload -F file=@x.jpg` with no cookie → **401**
- a newly created property has `approval_status = 'pending'` and does **not** appear on the homepage
- `npm run typecheck` passes

**Do not:** change any response shape the frontend already consumes, beyond what the table requires. Do not delete the `[userId]` route segments.

---

## A8 — Replace the booking creation logic

**Scope:** `app/api/bookings/create/route.ts`, `lib/validation/booking.ts` (new)
**Depends on:** A1, A2

Reduce the route to a thin handler over `createRoomBooking` from `@/lib/services/bookings`. Delete all inline SQL, the `calculateTotalPrice`/`getDatesBetween`/`generateBookingReference` helpers, and the local `Pool`.

```ts
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const input = createBookingSchema.parse(await request.json());
    const result = await createRoomBooking(session.userId, input);
    return NextResponse.json({
      booking_reference: result.bookingReference,
      booking_id: result.bookingId,
      quote: result.quote,
    }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

The Zod schema takes `roomType` as a **string** — the positional `roomTypeId` is gone. Dates must match `/^\d{4}-\d{2}-\d{2}$/`.

**Accept:** booking still succeeds end to end · two simultaneous bookings for a one-room property produce one success and one 409 · the route file contains no SQL.
**Do not:** reintroduce `roomTypeId`. Callers must be updated in A9.

---

## A9 — Frontend sends real dates and room types

**Scope:** `app/property/[propertyId]/page.tsx`, `app/booking/BookingPageContent.tsx`, `app/payment/PaymentPageContent.tsx`
**Depends on:** A8

Three fixes:

1. **Stop calling `.toISOString()` on dates.** Format as `YYYY-MM-DD` from the date-picker's local components. This is the day-shift bug.
2. **Pass `roomType` (the string), not `roomTypeId`** through the booking URL.
3. **Delete the hardcoded `const pricePerNight = 750`.** Fetch the real quote from `GET /api/bookings/quote?...` (built in A10) and render the full breakdown — base, tourism levy, VAT if any, total, deposit due now, balance at check-in.

Also remove the "A confirmation email has been sent" line from the success screen. No email is sent; do not tell the user otherwise.

**Accept:** booking 1–3 Sept produces `check_in_date = 2026-09-01` in the database, not 31 Aug · the price on the booking page equals `total_price` on the created booking · no `750` anywhere in the tree.

---

## A10 — Quote endpoint

**Scope:** `app/api/bookings/quote/route.ts` (new)
**Depends on:** A1

`GET /api/bookings/quote?propertyId=&roomType=&checkIn=&checkOut=` → calls `quoteRoomStay`, returns the `Quote`. Validate params with Zod. No auth required (guests need prices before logging in). No side effects.

**Accept:** returns a full breakdown · a VAT-registered property shows VAT, a non-registered one shows `vatNgwee: 0` · an unknown room type returns 404.

---

## A11 — Admin shell

**Scope:** `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/api/admin/stats/route.ts`
**Depends on:** A2, A3

Layout with sidebar nav (Overview, Properties, Bookings, Businesses, Audit). Overview shows an **action queue** first — count of properties awaiting approval, linked — then simple counts: bookings today/this week, active properties, new signups this week.

`GET /api/admin/stats` guarded by `requireAdmin`.

**Accept:** a customer hitting `/admin` gets 404, not a redirect · `/api/admin/stats` returns 404 for non-admins · pending count matches `SELECT COUNT(*) FROM properties WHERE approval_status='pending'`.
**Do not:** build charts yet.

---

## A12 — Property approval queue ⭐ the launch blocker

**Scope:** `app/admin/properties/page.tsx`, `app/admin/properties/[propertyId]/page.tsx`, `app/api/admin/properties/route.ts`, `app/api/admin/properties/[propertyId]/route.ts`, `app/api/admin/properties/[propertyId]/status/route.ts`
**Depends on:** A11

**List:** filter by `approval_status`, default `pending`, oldest first. Columns: property name, business, city, type, submitted date.

**Detail:** all fields, image gallery, owning business and account age, ZTA licence number, attached rooms with prices.

**Actions:** Approve · Reject (reason **required**) · Request changes (note) · Suspend a live listing.

The status handler must write the change **and** the audit entry in one transaction:

```ts
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const before = (await client.query('SELECT * FROM properties WHERE property_id=$1', [id])).rows[0];
  if (!before) throw new NotFoundError();
  const after = (await client.query(
    `UPDATE properties
        SET approval_status=$1, approval_note=$2, reviewed_by=$3, reviewed_at=now()
      WHERE property_id=$4 RETURNING *`,
    [status, reason ?? null, admin.userId, id])).rows[0];
  await writeAuditLog(client, {
    adminId: admin.userId, action: `property.${status}`,
    entityType: 'property', entityId: Number(id),
    before, after, reason, ip: clientIp(request),
  });
  await client.query('COMMIT');
  return NextResponse.json({ property: after });
} catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
finally { client.release(); }
```

**Accept:** rejecting without a reason returns 400 · approving makes the listing appear on the homepage · rejecting removes it · every action creates exactly one `admin_audit_log` row with populated `before` and `after` · a non-admin gets 404 on all five endpoints.

---

## A13 — Customer-facing queries respect approval

**Scope:** `app/api/properties/customer/route.ts`, `app/api/properties/customer/[propertyId]/route.ts`
**Depends on:** A2

Replace `WHERE p.is_published = true AND p.is_active = true` with:

```sql
WHERE p.approval_status = 'approved'
  AND p.is_active = true
  AND b.status = 'active'
```

…adding `JOIN businesses b ON p.business_id = b.business_id`. Import the shared pool. Remove `error.message` from responses. Remove the Unsplash placeholder-image fallback — a property with no images should show a neutral placeholder in the UI, not stock photos of a different hotel.

Also fix the price filter: the current `HAVING 1=1` construction breaks when `minPrice`/`maxPrice` are combined with `type`.

**Accept:** a pending property is absent from `/api/properties/customer` · suspending a business hides its listings · no response contains SQL text.

---

## A14 — Audit log viewer

**Scope:** `app/admin/audit/page.tsx`, `app/api/admin/audit/route.ts`
**Depends on:** A12

Read-only table: timestamp, admin email, action, entity, reason. Filter by admin, action, entity type, date range. Paginated, 50 per page.

**Accept:** entries appear immediately after an approval · there is no way to edit or delete an entry through the UI or API.

---

## A15 — Customer "My Bookings"

**Scope:** `app/bookings/page.tsx` (new), `app/api/bookings/mine/route.ts` (new)
**Depends on:** A8

`GET /api/bookings/mine` — `requireUser`, returns bookings `WHERE user_id = session.userId`, newest first, joined to property name and room number.

The payment success screen already links to `/bookings`, which currently **404s**. This fixes it.

**Accept:** a customer sees only their own bookings · the link from the success screen works · another user's booking is not reachable by changing any parameter.

---

## Order of work

```
A0 → A1 → A2 ─┬→ A3 → A11 → A12 → A14
              ├→ A4, A5, A6        (independent, any order)
              ├→ A7                (the big sweep)
              ├→ A10 → A8 → A9 → A15
              └→ A13
```

**A2 blocks almost everything** — apply the migration early.

**If you only get through A1–A7, you have still closed every critical security finding.** A11–A13 are what make launch safe. The rest is completeness.

---

## Phase A definition of done

- [ ] `npm run typecheck` and `npm test` both pass
- [ ] No route trusts a `userId` or `businessId` from a body, URL, or query string
- [ ] Logging out actually ends the session
- [ ] `new Pool(` appears exactly once in the codebase, in `lib/db.ts`
- [ ] No response anywhere contains `error.message`, SQL, or `password_hash`
- [ ] A new property does not reach the homepage until an admin approves it
- [ ] Two concurrent bookings for the last room yield one success and one 409
- [ ] The price shown on the booking page equals the price recorded on the booking
- [ ] Every admin action appears in `admin_audit_log`
