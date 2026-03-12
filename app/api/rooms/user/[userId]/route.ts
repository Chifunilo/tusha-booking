import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get business_id from user_id
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ rooms: [] });
    }

    const businessId = businessResult.rows[0].business_id;

    // Fetch all rooms for all properties owned by this business
    const result = await pool.query(
      `SELECT 
        r.room_id,
        r.room_number,
        r.room_type,
        r.base_price,
        r.amenities,
        r.property_id,
        p.property_name
       FROM rooms r
       JOIN properties p ON r.property_id = p.property_id
       WHERE p.business_id = $1
       ORDER BY p.property_name, r.room_number`,
      [businessId]
    );

    return NextResponse.json({
      rooms: result.rows,
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}