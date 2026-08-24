# Tusha Booking — operating rules for Claude Code

## Read first, always

`docs/ARCHITECTURE.md` governs every line of code written in this repo. Read it
fully before writing code. If a task instruction contradicts it, **stop and say
so** — do not reconcile it yourself.

`docs/PHASE-A-TASKS.md` is the work queue. `plan/START-HERE.md` is the runbook
for the human operator.

## Scope discipline

- Work **one task card at a time**. Never hold two.
- Modify **only** the files listed under the card's **Scope**. If another file
  must change, stop and explain why — do not change it.
- Do not refactor, reformat, rename, or "improve" anything the card did not ask
  for. Do not add endpoints, fields, files, or comments beyond the task.
- Follow the dependency order from the bottom of `PHASE-A-TASKS.md`:

```
A0 -> A1 -> A2 -+-> A3 -> A11 -> A12 -> A14
                +-> A4, A5, A6        (independent, any order)
                +-> A7                (the big sweep)
                +-> A10 -> A8 -> A9 -> A15
                +-> A13
```

  A2 (the migration) blocks almost everything. Handing out a task whose
  dependency is unfinished produces confident code built on nothing.

## Verbatim files — never edit

Per `ARCHITECTURE.md` §0, these are final code. Copy in, do not touch:

- `lib/auth.ts`
- `lib/authz.ts`
- `lib/db.ts`
- `lib/audit.ts`
- `lib/services/bookings.ts`  (§0 calls it `lib/bookings.ts`; the bundle ships it
  under `lib/services/` — same file, treat the shipped path as authoritative)
- `db/migrations/*.sql`

Also do not edit without an explicit instruction: `lib/tokens.ts`,
`lib/errors.ts`, `lib/pricing.ts` — these ship as tested foundation code and
have suites in `tests/`.

## Never run migrations

Database migrations are applied by the human operator only. Do not run `psql`
against `DATABASE_URL` to apply, alter, or roll back schema. Read-only
inspection queries are fine.

## The one rule that matters most

> Identity comes from the JWT cookie. Never from the request body, the URL, a
> query parameter, or `localStorage`.

Role checks alone are never sufficient — business-scoped queries must enforce
**ownership** via a join derived from `session.userId`, not a `businessId` taken
from the client. See `ARCHITECTURE.md` §2.

Note: most existing `app/api/**` routes do not import `lib/auth` at all — they
trust client-supplied identity. This means **the TypeScript compiler will not
find them for you.** A7 requires a manual sweep of every route file.

## Stack — fixed

Next.js 16 App Router · TypeScript strict · PostgreSQL via `pg` (no ORM) ·
`jose` JWT in an HttpOnly cookie · Zod validation · Tailwind v4 · Vitest.

Do not introduce an ORM, a state library, a component library, or an auth
framework. Do not upgrade or downgrade existing dependencies.

Middleware runs on **Edge** — only `lib/auth` and `lib/tokens` may be imported
into `middleware.ts`. Importing `lib/db` or `lib/authz` there breaks the build.

## Checkpoint after every task

```bash
npm run typecheck     # no NEW errors
npm test              # 30+ passing
git diff --stat       # ONLY the files the card listed
```

Run the card's **Accept** checks and report each one honestly. If a check could
not be verified, say so — never report a pass you did not observe.

## Reporting format

When a task is done, report:

1. Every file changed, one line each on what changed.
2. Each Accept check, and whether it passes.
3. Anything you were unsure about.

## Secrets

`.env` is untracked as of commit 6c81a9f but its values are still in history
from bd97438. Never print secret values, and never re-add `.env` to the index.
