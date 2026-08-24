-- =====================================================================
-- Migration 001 — admin role, approval workflow, onboarding, audit, ledger
--
-- Target: PostgreSQL 18.3
-- Written against the schema dump of db/schema.sql.
--
-- HOW TO APPLY (a human runs this, never an automated agent):
--   1. Take a backup:  pg_dump -Fc <db> > backup_before_001.dump
--   2. Run:            psql <connection-string> -v ON_ERROR_STOP=1 -f 001_auth_approval_and_audit.sql
--   3. Re-dump schema: pg_dump --schema-only <db> > db/schema.sql
--
-- Safe to re-run: every statement is guarded.
-- New tables use timestamptz deliberately — audit and financial records must
-- be unambiguous across time zones, unlike the older tables.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Allow the 'admin' user type
-- ---------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('customer', 'business', 'admin'));

-- Account suspension
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at        timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspension_reason   text;

-- ---------------------------------------------------------------------
-- 2. Property approval workflow
--    approval_status becomes the authority for public visibility.
--    is_published is retained for backward compatibility but is no longer
--    read by application code after this migration.
-- ---------------------------------------------------------------------
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approval_status     varchar(20) NOT NULL DEFAULT 'pending';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approval_note       text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_by         integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_at         timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS zta_licence_number  varchar(100);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_vat_registered   boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tpin                varchar(50);

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_approval_status_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_reviewed_by_fkey;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id);

-- Backfill: anything already live stays live.
UPDATE public.properties
   SET approval_status = 'approved'
 WHERE is_published = true
   AND approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_properties_approval
  ON public.properties USING btree (approval_status);

-- ---------------------------------------------------------------------
-- 3. Business onboarding, verification tiers and commission
--    businesses.is_verified already exists; status/tier supersede it.
-- ---------------------------------------------------------------------
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status                varchar(30) NOT NULL DEFAULT 'pending_verification';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tier                  varchar(20) NOT NULL DEFAULT 'unverified';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS commission_rate       numeric(5,4) NOT NULL DEFAULT 0.1200;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verified_by           integer;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verified_at           timestamptz;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS review_note           text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tpin                  varchar(50);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_vat_registered     boolean NOT NULL DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS agreement_version     varchar(20);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS agreement_accepted_ip inet;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS onboarding_source     varchar(20) NOT NULL DEFAULT 'self_service';

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_status_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_status_check
  CHECK (status IN ('pending_verification','needs_info','active','suspended','rejected','closed'));

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_tier_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_tier_check
  CHECK (tier IN ('unverified','verified','trusted'));

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_commission_rate_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_commission_rate_check
  CHECK (commission_rate >= 0 AND commission_rate <= 0.5);

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_onboarding_source_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_onboarding_source_check
  CHECK (onboarding_source IN ('self_service','admin_created'));

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_verified_by_fkey;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_verified_by_fkey
  FOREIGN KEY (verified_by) REFERENCES public.users(user_id);

UPDATE public.businesses
   SET status = 'active', tier = 'verified'
 WHERE is_verified = true
   AND status = 'pending_verification';

CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses USING btree (status);

-- ---------------------------------------------------------------------
-- 4. Verification documents (private storage keys, never public URLs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_documents (
    document_id    serial PRIMARY KEY,
    business_id    integer NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    doc_type       varchar(40) NOT NULL,
    storage_key    text NOT NULL,
    original_name  varchar(255),
    status         varchar(20) NOT NULL DEFAULT 'submitted',
    reject_reason  text,
    reviewed_by    integer REFERENCES public.users(user_id),
    reviewed_at    timestamptz,
    uploaded_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT business_documents_doc_type_check CHECK (doc_type IN
      ('pacra_certificate','zta_licence','national_id',
       'proof_of_ownership','tax_clearance','other')),
    CONSTRAINT business_documents_status_check CHECK (status IN
      ('submitted','accepted','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_business_documents_business
  ON public.business_documents USING btree (business_id, status);

COMMENT ON TABLE public.business_documents IS
  'Verification documents. storage_key points at a PRIVATE bucket, never a public URL.';

-- ---------------------------------------------------------------------
-- 5. Commission ledger — one row per booking
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commission_ledger (
    ledger_id          serial PRIMARY KEY,
    booking_id         integer NOT NULL REFERENCES public.bookings(booking_id),
    business_id        integer NOT NULL REFERENCES public.businesses(business_id),
    booking_total      numeric(12,2) NOT NULL,
    commission_rate    numeric(5,4)  NOT NULL,
    commission_due     numeric(12,2) NOT NULL,
    deposit_collected  numeric(12,2) NOT NULL DEFAULT 0,
    status             varchar(20) NOT NULL DEFAULT 'accrued',
    settled_at         timestamptz,
    note               text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT commission_ledger_status_check CHECK (status IN
      ('accrued','settled','waived','refunded')),
    CONSTRAINT unique_ledger_per_booking UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_business
  ON public.commission_ledger USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status
  ON public.commission_ledger USING btree (status);

-- ---------------------------------------------------------------------
-- 6. Admin audit log — append-only
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    log_id       bigserial PRIMARY KEY,
    admin_id     integer NOT NULL REFERENCES public.users(user_id),
    action       varchar(60) NOT NULL,
    entity_type  varchar(40) NOT NULL,
    entity_id    integer NOT NULL,
    before       jsonb,
    after        jsonb,
    reason       text,
    ip_address   inet,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON public.admin_audit_log USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin
  ON public.admin_audit_log USING btree (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action
  ON public.admin_audit_log USING btree (action, created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS
  'Append-only record of privileged actions. Never UPDATE or DELETE from this table.';

-- ---------------------------------------------------------------------
-- 7. Onboarding progress
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    event_id     bigserial PRIMARY KEY,
    business_id  integer NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    stage        varchar(30) NOT NULL,
    status       varchar(20) NOT NULL,
    note         text,
    actor_id     integer REFERENCES public.users(user_id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT onboarding_events_stage_check CHECK (stage IN
      ('application','documents','verification','agreement','first_listing','live')),
    CONSTRAINT onboarding_events_status_check CHECK (status IN
      ('entered','completed','blocked'))
);

CREATE INDEX IF NOT EXISTS idx_onboarding_business
  ON public.onboarding_events USING btree (business_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 8. Reviews must be moderated before they appear
-- ---------------------------------------------------------------------
ALTER TABLE public.reviews ALTER COLUMN is_published SET DEFAULT false;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reported_at    timestamptz;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reported_count integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- 9. Event spaces — conference pricing and booking mode
--
--    The existing schema prices spaces by TIME (hourly/half-day/full-day).
--    The Zambian market prices conferences by DELEGATE (a "day delegate
--    package" — e.g. K400/head including tea, lunch and stationery).
--    Both models are now supported; a space may use either or both.
--
--    booking_mode separates the two genuinely different products:
--      'instant'  — published price, fixed date, bookable without negotiation
--                   (boardrooms, conference rooms, day-delegate packages)
--      'enquiry'  — negotiated (weddings, gardens, social functions).
--                   Produces a venue_enquiry, never a booking.
-- ---------------------------------------------------------------------
ALTER TABLE public.event_spaces ADD COLUMN IF NOT EXISTS per_delegate_rate       numeric(10,2);
ALTER TABLE public.event_spaces ADD COLUMN IF NOT EXISTS half_day_delegate_rate  numeric(10,2);
ALTER TABLE public.event_spaces ADD COLUMN IF NOT EXISTS min_delegates           integer;
ALTER TABLE public.event_spaces ADD COLUMN IF NOT EXISTS package_includes        text[];
ALTER TABLE public.event_spaces ADD COLUMN IF NOT EXISTS booking_mode            varchar(20) NOT NULL DEFAULT 'enquiry';

ALTER TABLE public.event_spaces DROP CONSTRAINT IF EXISTS event_spaces_booking_mode_check;
ALTER TABLE public.event_spaces
  ADD CONSTRAINT event_spaces_booking_mode_check
  CHECK (booking_mode IN ('instant', 'enquiry'));

ALTER TABLE public.event_spaces DROP CONSTRAINT IF EXISTS event_spaces_min_delegates_check;
ALTER TABLE public.event_spaces
  ADD CONSTRAINT event_spaces_min_delegates_check
  CHECK (min_delegates IS NULL OR min_delegates > 0);

-- An instantly bookable space must have at least one published price.
ALTER TABLE public.event_spaces DROP CONSTRAINT IF EXISTS event_spaces_instant_needs_price;
ALTER TABLE public.event_spaces
  ADD CONSTRAINT event_spaces_instant_needs_price
  CHECK (
    booking_mode <> 'instant'
    OR per_delegate_rate IS NOT NULL
    OR full_day_rate IS NOT NULL
    OR half_day_rate IS NOT NULL
    OR hourly_rate IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_spaces_booking_mode
  ON public.event_spaces USING btree (booking_mode);

-- ---------------------------------------------------------------------
-- 10. Prevent overlapping event-space bookings
--
--     Rooms are protected by unique_room_date (room_id, date) because a room
--     is booked for whole days. A space is different: several bookings per
--     day are legitimate, provided their TIME RANGES do not overlap. A UNIQUE
--     constraint would be wrong here; an exclusion constraint is correct.
--
--     Requires the btree_gist extension, which is already installed.
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.space_availability DROP CONSTRAINT IF EXISTS space_no_overlapping_bookings;
ALTER TABLE public.space_availability
  ADD CONSTRAINT space_no_overlapping_bookings
  EXCLUDE USING gist (
    space_id WITH =,
    (tsrange(date + start_time, date + end_time, '[)')) WITH &&
  )
  WHERE (status IN ('booked', 'blocked'));

COMMENT ON CONSTRAINT space_no_overlapping_bookings ON public.space_availability IS
  'Two bookings for the same space may not overlap in time. Enforced by the database; do not rely on application checks.';

-- ---------------------------------------------------------------------
-- 11. Venue enquiries — the non-transactable path
--     Weddings and social functions are negotiated, not instant-booked.
--     An enquiry is a lead, not a booking, and never touches `bookings`.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venue_enquiries (
    enquiry_id       serial PRIMARY KEY,
    space_id         integer NOT NULL REFERENCES public.event_spaces(space_id) ON DELETE CASCADE,
    property_id      integer NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    user_id          integer REFERENCES public.users(user_id),
    contact_name     varchar(255) NOT NULL,
    contact_email    varchar(255) NOT NULL,
    contact_phone    varchar(20)  NOT NULL,
    event_type       varchar(100) NOT NULL,
    preferred_date   date NOT NULL,
    alternate_date   date,
    expected_guests  integer NOT NULL,
    budget_estimate  numeric(12,2),
    message          text,
    status           varchar(20) NOT NULL DEFAULT 'new',
    quoted_amount    numeric(12,2),
    business_reply   text,
    replied_at       timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT venue_enquiries_status_check CHECK (status IN
      ('new','viewed','quoted','won','lost','expired')),
    CONSTRAINT venue_enquiries_guests_check CHECK (expected_guests > 0)
);

CREATE INDEX IF NOT EXISTS idx_venue_enquiries_property
  ON public.venue_enquiries USING btree (property_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_enquiries_space
  ON public.venue_enquiries USING btree (space_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_venue_enquiries_user
  ON public.venue_enquiries USING btree (user_id);

COMMENT ON TABLE public.venue_enquiries IS
  'Leads for negotiated venue hire (weddings, social functions). Never becomes a row in bookings.';

-- ---------------------------------------------------------------------
-- 12. Housekeeping
--     idx_room_availability_date duplicates the index created automatically
--     by the unique_room_date constraint on (room_id, date).
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_room_availability_date;

COMMIT;

-- =====================================================================
-- OPTIONAL — development/seed data only. DO NOT run in production.
-- Grandfathers every existing business so local test listings stay visible.
-- =====================================================================
-- BEGIN;
-- UPDATE public.businesses SET status = 'active', tier = 'verified', is_verified = true;
-- UPDATE public.properties SET approval_status = 'approved';
-- COMMIT;

-- =====================================================================
-- Creating the first admin — run manually, never from application code.
-- Generate the hash locally first:
--   node -e "console.log(require('bcryptjs').hashSync('<strong-password>', 12))"
-- =====================================================================
-- INSERT INTO public.users (email, password_hash, user_type, first_name, last_name, is_active, is_verified)
-- VALUES ('admin@tushabooking.com', '<paste-bcrypt-hash>', 'admin', 'Site', 'Admin', true, true);
