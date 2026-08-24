# Phase C — Event Spaces: Conference Booking & Venue Enquiries

**Fidelity:** architectural. Contracts, data flow and invariants are fixed here; line-level task cards are written when Phase C is actually started.
**Depends on:** Phases A and B complete (auth guards, approval workflow, business onboarding, deposit checkout).
**Migration:** already included in `001_auth_approval_and_audit.sql` §9–§11.

---

## 1. Why this phase exists

Conference bookings are worth far more per transaction than room bookings, and they land on the strongest segment of the Zambian market — business travel is **63% of national tourism spending**, and Zambia ranks first in Southern Africa for business tourism.

Using a real published rate as the anchor — [Fringilla Lodge](https://fringillalodge.com/conferences/) charges **K400 per delegate per day** for groups of 20–150:

| Booking | GBV | Commission @12% | vs one room booking |
|---|---|---|---|
| Room booking (2.2 nights @ K800) | K1,760 | K211 | 1× |
| 20-pax one-day conference | K8,000 | K960 | 4.5× |
| 40-pax one-day conference | K16,000 | K1,920 | 9× |
| 150-pax one-day conference | K60,000 | K7,200 | 34× |
| 50-pax 2-day **+ room block** | K140,000 | K16,800 | **80×** |

Break-even for a founder salary is ~92 room bookings/month, or **~10 mid-sized conferences**.

Two secondary effects matter as much as the revenue:

- **Conferences fill rooms mid-week**, exactly when leisure demand is weakest. You are selling lodges yield management, not just bookings.
- **A residential conference books a room block.** The venue is the hook; the room block is where the commission actually accumulates.

---

## 2. The critical split — three products, not one

The existing schema conflates things that behave completely differently. Phase C separates them.

| | **Instant** | **Enquiry** | **Ticketing** |
|---|---|---|---|
| Examples | Boardroom, conference room, day-delegate package | Wedding, garden function, gala | Public event ticket sales |
| Price | Published, per-delegate or per-day | Negotiated | Per ticket |
| Decision cycle | Minutes | Weeks to months | Minutes |
| Creates | A `bookings` row | A `venue_enquiries` row | — |
| Commission | Charged, deposit-backed | **None initially** | — |
| **Status** | **Build** | **Build (cheap)** | **Do not build** |

**`booking_mode` on `event_spaces` is the switch.** A space is either `'instant'` or `'enquiry'`. The business chooses per space — a lodge may list its boardroom as instant and its garden as enquiry.

### Why weddings are not commissionable

A couple enquires, visits the venue, negotiates catering, decor and timing directly with the lodge over several weeks, and pays the lodge directly. There is no transaction for the platform to sit inside, so a commission is unenforceable in practice. This is why wedding-venue platforms worldwide are advertising businesses rather than marketplaces.

Build enquiries anyway: it costs roughly a week, it is a strong supply-acquisition argument ("we bring you wedding leads for free"), and it captures demand you can monetise later once you can prove conversion.

### Why ticketing is out

`events` and `event_tickets` describe selling tickets to the public. That means payment handling, fraud, refunds, capacity management, door validation, and competing with established ticketing platforms — for a different customer (event organisers, not accommodation owners). Leave the tables in place; write no code against them.

---

## 3. Data model

Migration 001 already provides everything below.

**`event_spaces`** — added: `per_delegate_rate`, `half_day_delegate_rate`, `min_delegates`, `package_includes text[]`, `booking_mode`. Existing `hourly_rate` / `half_day_rate` / `full_day_rate` are retained; a space may price by time, by delegate, or both. Constraint `event_spaces_instant_needs_price` guarantees an instant-bookable space has at least one published price.

**`space_availability`** — protected by an exclusion constraint:

```sql
EXCLUDE USING gist (
  space_id WITH =,
  (tsrange(date + start_time, date + end_time, '[)')) WITH &&
) WHERE (status IN ('booked','blocked'))
```

This is stronger than the room equivalent and deliberately different. A room is booked by whole days, so `unique_room_date` works. A space legitimately takes several bookings a day, so only *overlap* may be forbidden. Half-open `'[)'` ranges mean a booking ending at 17:00 and one starting at 17:00 do not conflict. **Verified by test.**

**`bookings`** — needs no change. `booking_type = 'event'` already exists, and the `check_event_booking` constraint already requires `space_id` and `event_date`. Use the existing `expected_attendance` column for delegate count.

**`venue_enquiries`** — new. A lead, never a booking. Status flow: `new → viewed → quoted → won | lost | expired`.

---

## 4. Pricing

Conference quotes are produced **server-side only**, exactly as with rooms. Invariant 5 applies without exception.

```
delegates        = max(requested_delegates, space.min_delegates)
base             = delegates × per_delegate_rate × days
                   (or half_day_delegate_rate, or the time-based rate)
tourism_levy     = base × 0.015          -- always; 25+ attendee events are levied
vat              = base × 0.16           -- ONLY if property.is_vat_registered
total            = base + tourism_levy + vat
commission       = base × business.commission_rate
deposit          = commission            -- invariant 7
```

Two notes specific to conferences:

- **`min_delegates` is billable, not advisory.** A 12-person meeting in a room with `min_delegates = 20` is charged for 20. This is standard practice and lodges will expect it.
- **Conference venues are usually VAT-registered.** A venue running 40-pax days at K400/head clears the K800,000 threshold quickly, unlike the small guesthouses. The per-property `is_vat_registered` flag handles both correctly — do not hardcode either way.

---

## 5. Booking flow — instant

1. Customer searches spaces: city, date, delegate count, `booking_mode = 'instant'`.
2. Results show capacity by setup style (`theatre_capacity`, `banquet_capacity`, `cocktail_capacity` already exist), the delegate rate, and `package_includes`.
3. Customer selects date, start/end time and delegate count → server returns a full quote breakdown.
4. Customer confirms and pays the deposit (= commission) via the Phase B checkout.
5. In **one transaction**: insert the `bookings` row (`booking_type='event'`), insert the `space_availability` row, insert the `commission_ledger` row. If the exclusion constraint raises `exclusion_violation`, roll back and return **409** with "That space is no longer available for those times."
6. Balance is paid to the property directly, as with rooms.

**Never pre-check availability with a `SELECT` and then insert.** Attempt the insert and catch the constraint violation — the database is the referee. Postgres error code for the exclusion violation is `23P01`.

## 6. Booking flow — enquiry

1. Customer views an `enquiry` space and submits the enquiry form.
2. `venue_enquiries` row created with status `new`. Notify the business by email and SMS.
3. Business sees it in their dashboard, replies with a quote → status `quoted`.
4. Business marks `won` or `lost` when they know. **No money moves through the platform.**
5. Track the `quoted → won` ratio. That number is what tells you whether enquiries are ever worth charging for.

Rate-limit enquiry submission (3 per hour per IP) — an open contact form on a public site will be found by spam bots.

---

## 7. New endpoints

```
GET    /api/spaces?city=&date=&delegates=&mode=instant   public search
GET    /api/spaces/[spaceId]                             public detail
POST   /api/spaces/quote                                 server-side quote (no side effects)
POST   /api/bookings/event                               instant booking (requireUser)
POST   /api/enquiries                                    submit enquiry (rate-limited)

GET    /api/business/spaces                              own spaces (requireBusiness)
POST   /api/business/spaces                              create (requireActiveBusinessId)
PATCH  /api/business/spaces/[spaceId]                    edit (assertOwnsSpace)
GET    /api/business/enquiries                           own enquiries
PATCH  /api/business/enquiries/[enquiryId]               reply / set status

GET    /api/admin/spaces?status=pending                  approval queue
```

`assertOwnsSpace(userId, spaceId)` must be added to `lib/authz.ts`, following the exact pattern of `assertOwnsRoom` (join `event_spaces → properties → businesses`, throw 404 on miss).

**Spaces inherit their property's approval.** A space on an approved property is live; a space on a pending property is not. Do not build a second approval queue.

---

## 8. Invariants added by this phase

10. **A space is publicly visible only if its parent property is `approved` and `is_active`, and the space is `is_active`.**
11. **An `enquiry`-mode space can never produce a `bookings` row.** Reject at the API boundary.
12. **Event-space overlap is prevented by the database constraint, never by an application check.**
13. **`min_delegates` is applied to the billed quantity**, not merely validated.
14. **Ticketing tables are untouched.** No code reads or writes `events` or `event_tickets`.

---

## 9. Build order and effort

| Step | Effort | Notes |
|---|---|---|
| 1. Space CRUD for businesses + `assertOwnsSpace` | 3 days | Reuses the room-management pattern |
| 2. Public space search + detail pages | 3 days | Reuses property search |
| 3. Enquiry submission + business inbox | 4 days | Ship this first — cheap, wins supply |
| 4. Server-side quote endpoint | 2 days | Pure function, easy to unit-test |
| 5. Instant conference booking + ledger | 5 days | Reuses Phase B checkout |
| 6. Admin visibility | 2 days | Extends existing admin screens |

**Ship steps 1–3 before 4–6.** Enquiries are cheap and immediately useful as a sales argument to property owners, and the enquiry volume tells you whether instant booking is worth building at all. If nobody enquires, do not build the checkout.

---

## 10. Open questions for when Phase C starts

1. **Multi-day residential conferences** — should the room block be bookable in the same transaction as the venue, or as a linked follow-on booking? Linked is simpler and probably right; a single transaction spanning venue plus 40 rooms is a large blast radius.
2. **Corporate payment terms.** Companies pay by invoice and bank transfer on 30-day terms, not mobile money upfront. The deposit model may need a purchase-order path for corporate accounts. Worth researching before step 5.
3. **Catering.** Day-delegate rates bundle it. If a customer wants a bespoke menu, that is a negotiation — which means the booking should fall back to the enquiry path. Define that boundary explicitly.
