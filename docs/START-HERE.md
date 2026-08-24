# START HERE — Implementation Runbook

**Your next step is Session 1 below.** It takes about an hour, you do it yourself, and it unblocks everything else.

Nothing can be handed to an executing model until the foundation is in place and the migration is applied.

---

## Part 0 — Three things before any code is written

### 0.1 Check whether your `.env` is in git ⚠️ do this first

```bash
cd C:\Users\chifu\Documents\GitHub\tusha-booking
git ls-files | findstr /i env
```

**If `.env` appears in that output**, your `DATABASE_URL`, `JWT_SECRET` and `CLOUDINARY_API_SECRET` are in your repository history. If the repo is public, assume they are compromised — scrapers find committed secrets within minutes.

Fix, in this order:

1. **Rotate all three secrets** — new database password, new JWT secret (`openssl rand -base64 48`), new Cloudinary key pair. Rotating matters more than removing the file; git history keeps the old version forever.
2. Uncomment the env line in `.gitignore` — change `# .env*` to `.env*`
3. `git rm --cached .env`
4. `git commit -m "Stop tracking .env"`

If `.env` does **not** appear, just do step 2 anyway so it never starts being tracked.

### 0.2 Back up the database

```bash
pg_dump -Fc "%DATABASE_URL%" > backup_before_001.dump
```

Keep it. You will apply a migration in Session 1 and you want a way back.

### 0.3 Work on a branch

```bash
git checkout -b phase-a-security
```

Every task from here lands on this branch. Merge to main only when Phase A's definition of done is met.

---

## Part 1 — What each document is for

You have a lot of material now. This is what to open when.

| Document | Read it when |
|---|---|
| **START-HERE.md** (this file) | Now, and at the start of each work session |
| **ARCHITECTURE.md** | Before writing code. **Every executing model gets this attached, every time.** |
| **PHASE-A-TASKS.md** | The work queue. One card at a time. |
| **PHASE-C-EVENTS.md** | Much later. Conference booking, after Phases A and B. |
| `tusha-booking-security-review.md` | Reference — why each fix exists, with severity |
| `tusha-booking-business-model.md` | Reference — pricing, commission, unit economics |
| `tusha-business-onboarding.md` | Before Phase B — verification flow, permission model |
| `tusha-admin-dashboard-spec.md` | Alongside tasks A11–A14 |
| `tusha-onboarding-diagram.html` | Visual reference for the permission model |

**Rule of thumb:** the executing model only ever sees `ARCHITECTURE.md` plus one task card. Never hand it the business documents — they are context for you, and irrelevant detail degrades a smaller model's output.

---

## Part 2 — Session 1 runbook (~1 hour, you do this personally)

### Step 1 — Unzip the bundle at your repo root

```bash
cd C:\Users\chifu\Documents\GitHub\tusha-booking
tar -xf tusha-phase-a.zip     # or extract with Explorer
```

Paths already match your project. You should now have:

```
db/migrations/001_auth_approval_and_audit.sql
docs/ARCHITECTURE.md  PHASE-A-TASKS.md  PHASE-C-EVENTS.md  START-HERE.md
lib/tokens.ts  errors.ts  auth.ts  authz.ts  db.ts  audit.ts  pricing.ts
lib/services/bookings.ts
tests/pricing.test.ts  tokens.test.ts  bookings.integration.test.ts
vitest.config.ts
```

**Your existing `lib/auth.ts` and `lib/db.ts` are overwritten. That is intended.**

### Step 2 — Task A0: dependencies

```bash
npm install zod
npm install -D vitest
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

### Step 3 — Prove the foundation works

```bash
npm test
```

**Expect 30 passing tests** (pricing + tokens; the integration file skips without a test database). If they do not pass, stop — something went wrong in the unzip. Do not proceed.

```bash
npm run typecheck
```

This **will** show errors in your existing route files — they still reference the old auth API. That is expected and those errors are the Phase A work queue. Note them; do not fix them by hand.

### Step 4 — Task A2: apply the migration ⚠️ never delegate this

```bash
psql "%DATABASE_URL%" -v ON_ERROR_STOP=1 -f db/migrations/001_auth_approval_and_audit.sql
```

Then, **because this is your development database with test listings you want to keep visible**, run the optional block at the bottom of the migration file (uncomment it first):

```sql
UPDATE businesses SET status = 'active', tier = 'verified', is_verified = true;
UPDATE properties SET approval_status = 'approved';
```

Without this, every existing listing becomes `pending` and disappears from your site.

### Step 5 — Create your admin account

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR-STRONG-PASSWORD', 12))"
```

Paste the hash into the `INSERT` at the bottom of the migration file and run it in psql. **There is deliberately no signup route that can create an admin** — this is the only way, and that is the point.

### Step 6 — Re-dump the schema and commit

```bash
pg_dump --schema-only "%DATABASE_URL%" > db/schema.sql
git add -A
git commit -m "Phase A foundation: auth library, migration 001, test suite"
```

**Session 1 is complete.** You now have a verified foundation and a migrated database.

---

## Part 3 — How to hand a task to the executing model

This is the operational heart of your tiered setup. Use this wrapper **every time**, unchanged.

### The prompt template

```
You are implementing one task in an existing Next.js 16 + PostgreSQL codebase.

ATTACHED: ARCHITECTURE.md — this governs everything you write. Read it fully
before starting. If my task instructions contradict it, stop and tell me.

YOUR TASK:
<paste the single task card from PHASE-A-TASKS.md, verbatim>

RULES:
- Modify ONLY the files listed under "Scope" in the task card. If you believe
  another file must change, stop and explain why. Do not change it.
- Do not modify any file listed as verbatim in ARCHITECTURE.md §0.
- Do not refactor, reformat, or "improve" anything the task did not ask for.
- Do not add features, endpoints, fields, comments, or files beyond the task.
- Do not run database migrations.

WHEN DONE, REPORT:
1. Every file you changed, and one line on what changed in each.
2. Each "Accept" check from the card, and whether it passes. If you could not
   verify one, say so — do not claim it passes.
3. Anything you were unsure about.
```

### Two things that make this work

**One card per prompt. Never two.** The moment a model holds two tasks it starts blending scopes, and you lose the ability to review a clean diff.

**Follow the dependency order** at the bottom of `PHASE-A-TASKS.md`. A3 before A11. A10 before A8 before A9. Handing out a task whose dependency is unfinished produces confident code built on something that does not exist yet.

### For the copy-paste path (no repo access)

The model cannot see your files, so paste in the current contents of every file under **Scope** along with the task card. Add:

```
Return the COMPLETE contents of each modified file, not a diff and not
a fragment. I am pasting these directly over the existing files.
```

---

## Part 4 — The checkpoint loop

After each task, before moving on:

```bash
npm run typecheck        # no NEW errors
npm test                 # still 30+ passing
git diff --stat          # only the files the card listed
```

That third command is the one people skip and the one that catches trouble. If a task touched a file outside its scope, revert and re-run the task with the scope restated.

Then run the card's **Accept** checks yourself. Do not take the model's word for it — a smaller model will report success optimistically, not dishonestly, and the difference does not matter when the code is wrong.

Commit per task:

```bash
git add -A && git commit -m "A7: derive identity from session in all API routes"
```

**Send me the diff at these three points:**

- After **A7** — the security sweep. This is the one that must be right.
- After **A12** — the approval queue, because of the audit-log transaction.
- At the end of Phase A — a full review before merging to main.

---

## Part 5 — What you are working towards

Phase A ends when every box in the definition of done at the bottom of `PHASE-A-TASKS.md` is ticked. In plain terms:

- Nobody can act as anybody else by editing `localStorage`
- Logging out actually logs you out
- No listing reaches your homepage without you approving it
- Two people cannot book the same room
- The price shown is the price charged

At that point the platform is safe to put in front of real people, and you move to Phase B — business verification and onboarding.

---

## Part 6 — If something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| `JWT_SECRET environment variable is not set` | Missing from `.env` | Add it. The loud failure is deliberate — a silent empty key would make every token forgeable. |
| Build fails with a `pg`/Node module error in middleware | Something imported `lib/authz` or `lib/db` into `middleware.ts` | Middleware runs on Edge. Only `lib/auth` and `lib/tokens` may be imported there. |
| All listings vanished from the site | Migration applied without the dev block | Run the two `UPDATE` statements from Step 4. |
| `npm test` fails right after unzipping | Bundle extracted to the wrong place, or a verbatim file was edited | Re-extract. Do not hand-fix. |
| Integration tests skip | `TEST_DATABASE_URL` not set | Expected. They only run against a dedicated test database. |
| A model rewrote a verbatim file | Scope rule ignored | `git checkout -- <file>` and re-run the task with the rule restated. |

---

## Right now, in order

1. Run the `git ls-files` check in §0.1
2. Back up the database
3. Create the branch
4. Work through Session 1, Steps 1–6
5. Hand out task A3 using the Part 3 template

Then keep going down the queue.
