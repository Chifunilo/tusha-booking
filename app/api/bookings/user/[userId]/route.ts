// app/api/bookings/user/[userId]/route.ts
// Fetches all bookings for a business user's properties (used by the bookings calendar)

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // ── 1. Verify JWT from cookie ──────────────────────────────────────────────
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'You must be logged in to view bookings' },
      { status: 401 }
    );
  }

  let tokenUserId: number;
  try {
    const { payload } = await jwtVerify(token, secret);
    tokenUserId = payload.userId as number;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired session. Please log in again.' },
      { status: 401 }
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // ── 2. Ensure the requesting user can only access their own bookings ──────
    if (tokenUserId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'You are not authorised to view these bookings' },
        { status: 403 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Step 1: Get business_id from user_id
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    const businessId = businessResult.rows[0].business_id;

    // Step 2: Fetch all bookings for all properties owned by this business
    const result = await pool.query(
      `SELECT
        b.booking_id,
        b.booking_reference,
        b.room_id,
        r.room_number,
        b.check_in_date,
        b.check_out_date,
        b.num_guests,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.total_price,
        b.base_price,
        b.taxes,
        b.service_fee,
        b.payment_method,
        b.payment_status,
        b.status,
        b.special_requests,
        b.created_at,
        p.property_name,
        p.property_id
      FROM bookings b
      JOIN rooms r      ON b.room_id     = r.room_id
      JOIN properties p ON r.property_id = p.property_id
      WHERE p.business_id = $1
        AND b.status != 'cancelled'
      ORDER BY b.check_in_date ASC`,
      [businessId]
    );

    return NextResponse.json({
      bookings: result.rows,
    });

  } catch (error) {
    console.error('Error fetching bookings for user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}