// API Route: /api/bookings/create/route.ts
// Creates a booking and updates room availability

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { jwtVerify } from 'jose';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Generate booking reference (format: BK-YYYY-XXXXXX)
function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `BK-${year}-${randomNum}`;
}

// Calculate total price
function calculateTotalPrice(
  pricePerNight: number,
  checkIn: string,
  checkOut: string
): { nights: number; basePrice: number; taxes: number; serviceFee: number; totalPrice: number } {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const basePrice = pricePerNight * nights;
  const taxes = basePrice * 0.16;
  const serviceFee = basePrice * 0.05;
  const totalPrice = basePrice + taxes + serviceFee;

  return { nights, basePrice, taxes, serviceFee, totalPrice };
}

// Get all dates between check-in and check-out
function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  while (start < end) {
    dates.push(start.toISOString().split('T')[0]);
    start.setDate(start.getDate() + 1);
  }

  return dates;
}

export async function POST(request: NextRequest) {
  // ── 1. Verify JWT from cookie — userId comes from here, NOT the request body
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'You must be logged in to make a booking' },
      { status: 401 }
    );
  }

  let userId: number;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as number;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired session. Please log in again.' },
      { status: 401 }
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  const client = await pool.connect();

  try {
    const body = await request.json();
    const {
      propertyId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      numGuests,
      guestName,
      guestEmail,
      guestPhone,
      paymentMethod,
      specialRequests,
      // userId intentionally excluded — it comes from the JWT above
    } = body;

    // Validate required fields
    if (!propertyId || !checkInDate || !checkOutDate || !numGuests || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query('BEGIN');

    // 2. Find an available room of the specified type
    const roomQuery = `
      SELECT 
        r.room_id,
        r.room_type,
        r.base_price,
        r.property_id
      FROM rooms r
      WHERE r.property_id = $1 
        AND r.room_type = (
          SELECT room_type 
          FROM rooms 
          WHERE property_id = $1 
          GROUP BY room_type 
          ORDER BY MIN(base_price)
          OFFSET $2 LIMIT 1
        )
        AND r.is_active = true
        AND r.room_id NOT IN (
          SELECT DISTINCT ra.room_id
          FROM room_availability ra
          WHERE ra.status = 'booked'
            AND ra.date >= $3
            AND ra.date < $4
        )
      LIMIT 1
    `;

    const roomResult = await client.query(roomQuery, [
      propertyId,
      parseInt(roomTypeId) - 1,
      checkInDate,
      checkOutDate,
    ]);

    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, message: 'No rooms available for selected dates' },
        { status: 400 }
      );
    }

    const room = roomResult.rows[0];

    // 3. Calculate pricing
    const pricing = calculateTotalPrice(room.base_price, checkInDate, checkOutDate);

    // 4. Generate booking reference
    const bookingReference = generateBookingReference();

    // 5. Create the booking
    const bookingQuery = `
      INSERT INTO bookings (
        booking_reference,
        user_id,
        property_id,
        booking_type,
        room_id,
        check_in_date,
        check_out_date,
        num_guests,
        base_price,
        taxes,
        service_fee,
        total_price,
        guest_name,
        guest_email,
        guest_phone,
        special_requests,
        status,
        payment_status,
        payment_method
      ) VALUES (
        $1, $2, $3, 'room', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'confirmed', 'paid', $16
      )
      RETURNING booking_id, booking_reference
    `;

    const bookingResult = await client.query(bookingQuery, [
      bookingReference,
      userId,           // ← from JWT cookie, guaranteed non-null
      propertyId,
      room.room_id,
      checkInDate,
      checkOutDate,
      numGuests,
      pricing.basePrice,
      pricing.taxes,
      pricing.serviceFee,
      pricing.totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests || null,
      paymentMethod || 'credit_card',
    ]);

    const booking = bookingResult.rows[0];

    // 6. Update room availability - mark dates as booked
    const dates = getDatesBetween(checkInDate, checkOutDate);

    for (const date of dates) {
      await client.query(
        `INSERT INTO room_availability (room_id, date, status, booking_id)
         VALUES ($1, $2, 'booked', $3)
         ON CONFLICT (room_id, date) 
         DO UPDATE SET status = 'booked', booking_id = $3`,
        [room.room_id, date, booking.booking_id]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Booking created successfully',
        bookingReference: booking.booking_reference,
        bookingId: booking.booking_id,
        totalPrice: pricing.totalPrice,
        nights: pricing.nights,
      },
      { status: 201 }
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}