// Integration tests. Require a real Postgres with schema.sql + migration 001
// applied. Skipped automatically when TEST_DATABASE_URL is not set.
//
//   createdb tusha_test
//   psql tusha_test -f db/schema.sql
//   psql tusha_test -f db/migrations/001_auth_approval_and_audit.sql
//   TEST_DATABASE_URL=postgres://... npx vitest run tests/bookings.integration.test.ts

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const CONNECTION = process.env.TEST_DATABASE_URL;
const describeDb = CONNECTION ? describe : describe.skip;

describeDb('room booking — concurrency and correctness', () => {
  let pool: import('pg').Pool;
  let createRoomBooking: typeof import('@/lib/services/bookings')['createRoomBooking'];

  const PROPERTY = 9001;
  const BUSINESS = 9001;
  const OWNER = 9001;
  const GUEST_A = 9002;
  const GUEST_B = 9003;

  beforeAll(async () => {
    process.env.DATABASE_URL = CONNECTION;
    process.env.PGSSL_DISABLE = 'true';
    ({ createRoomBooking } = await import('@/lib/services/bookings'));
    pool = (await import('@/lib/db')).default;
  });

  beforeEach(async () => {
    await pool.query(`
      DELETE FROM commission_ledger WHERE business_id = ${BUSINESS};
      DELETE FROM room_availability WHERE room_id IN (SELECT room_id FROM rooms WHERE property_id = ${PROPERTY});
      DELETE FROM bookings  WHERE property_id = ${PROPERTY};
      DELETE FROM rooms      WHERE property_id = ${PROPERTY};
      DELETE FROM properties WHERE property_id = ${PROPERTY};
      DELETE FROM businesses WHERE business_id = ${BUSINESS};
      DELETE FROM users      WHERE user_id IN (${OWNER}, ${GUEST_A}, ${GUEST_B});

      INSERT INTO users (user_id, email, password_hash, user_type) VALUES
        (${OWNER},  'owner@test.zm', 'x', 'business'),
        (${GUEST_A},'a@test.zm',     'x', 'customer'),
        (${GUEST_B},'b@test.zm',     'x', 'customer');

      INSERT INTO businesses (business_id, user_id, business_name, address_line1, city, country,
                              business_type, status, tier, commission_rate)
      VALUES (${BUSINESS}, ${OWNER}, 'Test Lodge', '1 Rd', 'Lusaka', 'Zambia',
              'hotel', 'active', 'verified', 0.1200);

      INSERT INTO properties (property_id, business_id, property_name, property_type,
                              address_line1, city, country, approval_status, is_active, is_vat_registered)
      VALUES (${PROPERTY}, ${BUSINESS}, 'Test Property', 'lodge',
              '1 Rd', 'Lusaka', 'Zambia', 'approved', true, false);

      -- exactly ONE standard room, so the race has a single winner
      INSERT INTO rooms (property_id, room_number, room_type, base_price, max_occupancy)
      VALUES (${PROPERTY}, '101', 'standard', 800.00, 2);
    `);
  });

  afterAll(async () => { await pool?.end(); });

  const booking = (name: string) => ({
    propertyId: PROPERTY,
    roomType: 'standard',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-03',
    numGuests: 2,
    guestName: name,
    guestEmail: `${name}@test.zm`,
    guestPhone: '0977000000',
  });

  it('creates a booking with a server-computed price', async () => {
    const result = await createRoomBooking(GUEST_A, booking('Alice'));

    expect(result.quote.units).toBe(2);
    expect(result.quote.baseNgwee).toBe(160000);        // 800 x 2 nights
    expect(result.quote.vatNgwee).toBe(0);              // property is not VAT-registered
    expect(result.quote.tourismLevyNgwee).toBe(2400);   // 1.5%
    expect(result.quote.commissionNgwee).toBe(19200);   // 12% of base
    expect(result.quote.depositNgwee).toBe(result.quote.commissionNgwee);
    expect(result.bookingReference).toMatch(/^BK-\d{4}-\d{6}$/);
  });

  it('claims exactly one availability row per night, and no more', async () => {
    await createRoomBooking(GUEST_A, booking('Alice'));
    const rows = await pool.query(
      `SELECT date::text FROM room_availability
        WHERE room_id = (SELECT room_id FROM rooms WHERE property_id = $1)
        ORDER BY date`,
      [PROPERTY],
    );
    // Check-out day is NOT claimed — the room is free that night.
    expect(rows.rows.map((r) => r.date)).toEqual(['2026-09-01', '2026-09-02']);
  });

  it('records the commission in the ledger', async () => {
    const result = await createRoomBooking(GUEST_A, booking('Alice'));
    const ledger = await pool.query(
      'SELECT commission_due, status FROM commission_ledger WHERE booking_id = $1',
      [result.bookingId],
    );
    expect(ledger.rowCount).toBe(1);
    expect(Number(ledger.rows[0].commission_due)).toBeCloseTo(192.0, 2);
    expect(ledger.rows[0].status).toBe('accrued');
  });

  it('THE RACE: two simultaneous bookings for the last room — exactly one wins', async () => {
    const results = await Promise.allSettled([
      createRoomBooking(GUEST_A, booking('Alice')),
      createRoomBooking(GUEST_B, booking('Bob')),
    ]);

    const won = results.filter((r) => r.status === 'fulfilled');
    const lost = results.filter((r) => r.status === 'rejected');

    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);

    // The loser must be told, not silently overwritten.
    const error = (lost[0] as PromiseRejectedResult).reason;
    expect(error.status).toBe(409);

    // And the database must hold exactly one booking, not two.
    const bookings = await pool.query(
      `SELECT COUNT(*)::int AS n FROM bookings WHERE property_id = $1 AND status <> 'cancelled'`,
      [PROPERTY],
    );
    expect(bookings.rows[0].n).toBe(1);

    // Every availability row must point at the winning booking.
    const avail = await pool.query(
      `SELECT DISTINCT booking_id FROM room_availability
        WHERE room_id = (SELECT room_id FROM rooms WHERE property_id = $1)`,
      [PROPERTY],
    );
    expect(avail.rowCount).toBe(1);
    expect(avail.rows[0].booking_id).toBe(
      (won[0] as PromiseFulfilledResult<{ bookingId: number }>).value.bookingId,
    );
  });

  it('rolls back completely when it loses the race — no orphan booking or ledger row', async () => {
    await createRoomBooking(GUEST_A, booking('Alice'));
    await expect(createRoomBooking(GUEST_B, booking('Bob'))).rejects.toMatchObject({ status: 409 });

    const bookings = await pool.query(
      'SELECT COUNT(*)::int AS n FROM bookings WHERE property_id = $1',
      [PROPERTY],
    );
    const ledger = await pool.query(
      'SELECT COUNT(*)::int AS n FROM commission_ledger WHERE business_id = $1',
      [BUSINESS],
    );
    expect(bookings.rows[0].n).toBe(1);
    expect(ledger.rows[0].n).toBe(1);
  });

  it('allows a back-to-back stay starting on the previous guest\'s check-out day', async () => {
    await createRoomBooking(GUEST_A, booking('Alice'));
    const next = await createRoomBooking(GUEST_B, {
      ...booking('Bob'),
      checkInDate: '2026-09-03',
      checkOutDate: '2026-09-05',
    });
    expect(next.bookingId).toBeGreaterThan(0);
  });

  it('applies VAT only when the property is VAT-registered', async () => {
    await pool.query('UPDATE properties SET is_vat_registered = true WHERE property_id = $1', [PROPERTY]);
    const result = await createRoomBooking(GUEST_A, booking('Alice'));
    expect(result.quote.vatNgwee).toBe(25600);  // 16% of 160000
    expect(result.quote.commissionNgwee).toBe(19200); // unchanged — commission is on base
  });

  it('refuses to book a property that is not approved', async () => {
    await pool.query(`UPDATE properties SET approval_status = 'pending' WHERE property_id = $1`, [PROPERTY]);
    await expect(createRoomBooking(GUEST_A, booking('Alice'))).rejects.toMatchObject({ status: 404 });
  });

  it('refuses to book when the owning business is suspended', async () => {
    await pool.query(`UPDATE businesses SET status = 'suspended' WHERE business_id = $1`, [BUSINESS]);
    await expect(createRoomBooking(GUEST_A, booking('Alice'))).rejects.toMatchObject({ status: 404 });
  });

  it('rejects malformed or impossible dates before touching the database', async () => {
    await expect(createRoomBooking(GUEST_A, { ...booking('Alice'), checkInDate: '2026-09-01T00:00:00Z' })).rejects.toThrow();
    await expect(createRoomBooking(GUEST_A, { ...booking('Alice'), checkOutDate: '2026-08-30' })).rejects.toThrow();
    await expect(createRoomBooking(GUEST_A, { ...booking('Alice'), checkInDate: '2026-02-30' })).rejects.toThrow();
  });
});
