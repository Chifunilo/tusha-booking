// lib/authz.ts
//
// Ownership checks. Node-only — uses the database, so this must NOT be
// imported by middleware.ts (which runs on Edge). Route handlers only.
//
// These functions are the practical expression of the core rule: a business
// role does not grant access to all business data, only to the caller's own.

import pool from '@/lib/db';
import { AuthError } from '@/lib/errors';

/** Returns the caller's business_id, or null if they have no business record. */
export async function getBusinessIdForUser(userId: number): Promise<number | null> {
  const result = await pool.query<{ business_id: number }>(
    'SELECT business_id FROM businesses WHERE user_id = $1',
    [userId],
  );
  return result.rows[0]?.business_id ?? null;
}

/**
 * Returns the caller's business_id, or throws 403.
 * Use this in any business-scoped write path.
 */
export async function requireBusinessId(userId: number): Promise<number> {
  const businessId = await getBusinessIdForUser(userId);
  if (businessId === null) {
    throw new AuthError(403, 'No business profile is linked to this account');
  }
  return businessId;
}

/**
 * Returns the caller's business_id only if the business is fully onboarded.
 * Required before creating or editing listings.
 */
export async function requireActiveBusinessId(userId: number): Promise<number> {
  const result = await pool.query<{ business_id: number; status: string }>(
    'SELECT business_id, status FROM businesses WHERE user_id = $1',
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new AuthError(403, 'No business profile is linked to this account');
  }
  if (row.status !== 'active') {
    throw new AuthError(403, 'Your business account is not yet approved');
  }
  return row.business_id;
}

/** Throws 404 unless the property belongs to the caller's business. */
export async function assertOwnsProperty(userId: number, propertyId: number): Promise<void> {
  const result = await pool.query(
    `SELECT 1
       FROM properties p
       JOIN businesses b ON p.business_id = b.business_id
      WHERE p.property_id = $1 AND b.user_id = $2`,
    [propertyId, userId],
  );
  if (result.rowCount === 0) {
    // 404 rather than 403: do not confirm that a property you don't own exists.
    throw new AuthError(404, 'Property not found');
  }
}

/** Throws 404 unless the room belongs to the caller's business. */
export async function assertOwnsRoom(userId: number, roomId: number): Promise<void> {
  const result = await pool.query(
    `SELECT 1
       FROM rooms r
       JOIN properties p  ON r.property_id = p.property_id
       JOIN businesses b  ON p.business_id = b.business_id
      WHERE r.room_id = $1 AND b.user_id = $2`,
    [roomId, userId],
  );
  if (result.rowCount === 0) {
    throw new AuthError(404, 'Room not found');
  }
}

/** Throws 404 unless the booking is on a property owned by the caller. */
export async function assertOwnsBooking(userId: number, bookingId: number): Promise<void> {
  const result = await pool.query(
    `SELECT 1
       FROM bookings bk
       JOIN properties p ON bk.property_id = p.property_id
       JOIN businesses b ON p.business_id = b.business_id
      WHERE bk.booking_id = $1 AND b.user_id = $2`,
    [bookingId, userId],
  );
  if (result.rowCount === 0) {
    throw new AuthError(404, 'Booking not found');
  }
}

/** Throws 404 unless the booking was made by this customer. */
export async function assertIsOwnBooking(userId: number, bookingId: number): Promise<void> {
  const result = await pool.query(
    'SELECT 1 FROM bookings WHERE booking_id = $1 AND user_id = $2',
    [bookingId, userId],
  );
  if (result.rowCount === 0) {
    throw new AuthError(404, 'Booking not found');
  }
}
