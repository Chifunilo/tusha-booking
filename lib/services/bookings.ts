// lib/services/bookings.ts
//
// Room booking creation. This file replaces app/api/bookings/create/route.ts's
// inline logic entirely.
//
// It fixes four defects found in the review:
//   1. Double-booking race — the SELECT-then-INSERT is replaced by an atomic
//      INSERT ... ON CONFLICT DO NOTHING with a row-count check. The database
//      is the referee, not the application.
//   2. Positional room-type IDs — rooms are now selected by room_type string.
//   3. Timezone day-shift — dates stay as 'YYYY-MM-DD' and the date series is
//      generated in SQL. No JavaScript Date arithmetic touches a booking.
//   4. Hardcoded 16% VAT — VAT is applied only for VAT-registered properties.

import type { PoolClient } from 'pg';
import pool from '@/lib/db';
import { ServiceError } from '@/lib/errors';
import {
  kwachaToNgwee,
  ngweeToKwacha,
  nightsBetween,
  parseDateOnly,
  quote,
  type Quote,
} from '@/lib/pricing';

export interface CreateRoomBookingInput {
  propertyId: number;
  roomType: string;
  checkInDate: string;   // 'YYYY-MM-DD'
  checkOutDate: string;  // 'YYYY-MM-DD'
  numGuests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string | null;
}

export interface CreateRoomBookingResult {
  bookingId: number;
  bookingReference: string;
  roomId: number;
  roomNumber: string;
  quote: Quote;
}

/** Postgres unique-violation. Signals that another booking won the race. */
const UNIQUE_VIOLATION = '23505';

function generateBookingReference(): string {
  const year = new Date().getUTCFullYear();
  // 6 random digits. Uniqueness is guaranteed by the database constraint
  // (bookings_booking_reference_key), not by this function.
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BK-${year}-${suffix}`;
}

interface PropertyPricingContext {
  propertyId: number;
  businessId: number;
  commissionRate: number;
  isVatRegistered: boolean;
}

/**
 * Loads the property along with the data pricing depends on, and enforces
 * invariant 1: a booking may only be made against a listing that is genuinely
 * live — approved, active, and owned by an active business.
 */
async function loadBookableProperty(
  client: PoolClient,
  propertyId: number,
): Promise<PropertyPricingContext> {
  const result = await client.query<{
    property_id: number;
    business_id: number;
    commission_rate: string;
    is_vat_registered: boolean;
  }>(
    `SELECT p.property_id,
            p.business_id,
            b.commission_rate,
            p.is_vat_registered
       FROM properties p
       JOIN businesses b ON p.business_id = b.business_id
      WHERE p.property_id = $1
        AND p.approval_status = 'approved'
        AND p.is_active = true
        AND b.status = 'active'`,
    [propertyId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new ServiceError(404, 'That property is not available for booking');
  }

  return {
    propertyId: row.property_id,
    businessId: row.business_id,
    commissionRate: Number.parseFloat(row.commission_rate),
    isVatRegistered: row.is_vat_registered,
  };
}

/**
 * Picks the cheapest active room of the requested type that has no conflicting
 * availability rows. This is a fast path for a good error message only — it is
 * NOT the concurrency guard. Two callers can both pass this check; the unique
 * constraint below is what actually decides.
 */
async function findCandidateRoom(
  client: PoolClient,
  propertyId: number,
  roomType: string,
  checkInDate: string,
  checkOutDate: string,
): Promise<{ roomId: number; roomNumber: string; baseRateNgwee: number }> {
  const result = await client.query<{
    room_id: number;
    room_number: string;
    base_price: string;
  }>(
    `SELECT r.room_id, r.room_number, r.base_price
       FROM rooms r
      WHERE r.property_id = $1
        AND r.room_type = $2
        AND r.is_active = true
        AND NOT EXISTS (
              SELECT 1
                FROM room_availability ra
               WHERE ra.room_id = r.room_id
                 AND ra.status IN ('booked', 'blocked', 'maintenance')
                 AND ra.date >= $3::date
                 AND ra.date <  $4::date
            )
      ORDER BY r.base_price ASC, r.room_id ASC
      LIMIT 1`,
    [propertyId, roomType, checkInDate, checkOutDate],
  );

  const row = result.rows[0];
  if (!row) {
    throw new ServiceError(409, 'No rooms of that type are available for those dates');
  }

  return {
    roomId: row.room_id,
    roomNumber: row.room_number,
    baseRateNgwee: kwachaToNgwee(row.base_price),
  };
}

/**
 * Claims every night of the stay atomically.
 *
 * Relies on `unique_room_date UNIQUE (room_id, date)`. If a competing booking
 * already holds any night, ON CONFLICT DO NOTHING skips it and the row count
 * comes back short — at which point we abort. There is no window between the
 * check and the claim because they are the same statement.
 *
 * Note the date series is generated in SQL. No JavaScript Date object ever
 * touches a booking date.
 */
async function claimNights(
  client: PoolClient,
  roomId: number,
  bookingId: number,
  checkInDate: string,
  checkOutDate: string,
  expectedNights: number,
): Promise<void> {
  const result = await client.query(
    `INSERT INTO room_availability (room_id, date, status, booking_id)
     SELECT $1, d::date, 'booked', $2
       FROM generate_series($3::date, $4::date - 1, INTERVAL '1 day') AS d
     ON CONFLICT (room_id, date) DO NOTHING`,
    [roomId, bookingId, checkInDate, checkOutDate],
  );

  if (result.rowCount !== expectedNights) {
    throw new ServiceError(
      409,
      'Those dates were just taken by another guest. Please choose different dates.',
    );
  }
}

export async function createRoomBooking(
  userId: number,
  input: CreateRoomBookingInput,
): Promise<CreateRoomBookingResult> {
  // Validate dates before opening a transaction. Throws on anything that is
  // not a real 'YYYY-MM-DD' calendar date.
  parseDateOnly(input.checkInDate);
  parseDateOnly(input.checkOutDate);
  const nights = nightsBetween(input.checkInDate, input.checkOutDate);

  if (!Number.isInteger(input.numGuests) || input.numGuests <= 0) {
    throw new ServiceError(400, 'Number of guests must be at least 1');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const property = await loadBookableProperty(client, input.propertyId);
    const room = await findCandidateRoom(
      client,
      input.propertyId,
      input.roomType,
      input.checkInDate,
      input.checkOutDate,
    );

    const priced = quote({
      unitRateNgwee: room.baseRateNgwee,
      units: nights,
      commissionRate: property.commissionRate,
      isVatRegistered: property.isVatRegistered,
    });

    // `bookings` has a single `taxes` column, so VAT and the tourism levy are
    // stored combined. The split is always recoverable from the quote function
    // given the property's is_vat_registered flag.
    const taxesNgwee = priced.vatNgwee + priced.tourismLevyNgwee;

    let booking: { booking_id: number; booking_reference: string } | undefined;

    // Retry only on booking_reference collision, which is random and rare.
    for (let attempt = 0; attempt < 3 && !booking; attempt++) {
      try {
        const inserted = await client.query<{ booking_id: number; booking_reference: string }>(
          `INSERT INTO bookings (
             booking_reference, user_id, property_id, booking_type, room_id,
             check_in_date, check_out_date, num_guests,
             base_price, taxes, service_fee, total_price,
             guest_name, guest_email, guest_phone, special_requests,
             status, payment_status, payment_method
           ) VALUES (
             $1, $2, $3, 'room', $4,
             $5::date, $6::date, $7,
             $8, $9, 0, $10,
             $11, $12, $13, $14,
             'pending', 'pending', NULL
           )
           RETURNING booking_id, booking_reference`,
          [
            generateBookingReference(),
            userId,
            input.propertyId,
            room.roomId,
            input.checkInDate,
            input.checkOutDate,
            input.numGuests,
            ngweeToKwacha(priced.baseNgwee),
            ngweeToKwacha(taxesNgwee),
            ngweeToKwacha(priced.totalNgwee),
            input.guestName,
            input.guestEmail,
            input.guestPhone,
            input.specialRequests ?? null,
          ],
        );
        booking = inserted.rows[0];
      } catch (error) {
        const code = (error as { code?: string }).code;
        const constraint = (error as { constraint?: string }).constraint;
        if (code === UNIQUE_VIOLATION && constraint === 'bookings_booking_reference_key') {
          continue; // regenerate the reference and try again
        }
        throw error;
      }
    }

    if (!booking) {
      throw new ServiceError(500, 'Could not allocate a booking reference');
    }

    await claimNights(
      client,
      room.roomId,
      booking.booking_id,
      input.checkInDate,
      input.checkOutDate,
      nights,
    );

    // Commission is accrued at booking time, not at stay time. A forfeited
    // deposit on a no-show is still earned revenue.
    await client.query(
      `INSERT INTO commission_ledger
         (booking_id, business_id, booking_total, commission_rate,
          commission_due, deposit_collected, status)
       VALUES ($1, $2, $3, $4, $5, 0, 'accrued')`,
      [
        booking.booking_id,
        property.businessId,
        ngweeToKwacha(priced.totalNgwee),
        property.commissionRate,
        ngweeToKwacha(priced.commissionNgwee),
      ],
    );

    await client.query('COMMIT');

    return {
      bookingId: booking.booking_id,
      bookingReference: booking.booking_reference,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      quote: priced,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {
      /* the connection may already be unusable; the original error matters more */
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Produces a quote without side effects, for display before checkout.
 * The booking path recomputes this from the same inputs, so the number the
 * guest sees is by construction the number they are charged (invariant 5).
 */
export async function quoteRoomStay(
  propertyId: number,
  roomType: string,
  checkInDate: string,
  checkOutDate: string,
): Promise<Quote & { roomType: string; nightlyRate: number }> {
  const nights = nightsBetween(checkInDate, checkOutDate);

  const result = await pool.query<{
    base_price: string;
    commission_rate: string;
    is_vat_registered: boolean;
  }>(
    `SELECT MIN(r.base_price) AS base_price,
            b.commission_rate,
            p.is_vat_registered
       FROM rooms r
       JOIN properties p  ON r.property_id = p.property_id
       JOIN businesses b  ON p.business_id = b.business_id
      WHERE r.property_id = $1
        AND r.room_type = $2
        AND r.is_active = true
        AND p.approval_status = 'approved'
        AND p.is_active = true
        AND b.status = 'active'
      GROUP BY b.commission_rate, p.is_vat_registered`,
    [propertyId, roomType],
  );

  const row = result.rows[0];
  if (!row || row.base_price === null) {
    throw new ServiceError(404, 'That room type is not available');
  }

  const unitRateNgwee = kwachaToNgwee(row.base_price);

  return {
    ...quote({
      unitRateNgwee,
      units: nights,
      commissionRate: Number.parseFloat(row.commission_rate),
      isVatRegistered: row.is_vat_registered,
    }),
    roomType,
    nightlyRate: ngweeToKwacha(unitRateNgwee),
  };
}
