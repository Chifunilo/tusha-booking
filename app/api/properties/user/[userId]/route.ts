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
      return NextResponse.json({ properties: [] });
    }

    const businessId = businessResult.rows[0].business_id;

    // Fetch all properties for this business with room count
    const result = await pool.query(
      `SELECT 
        p.property_id,
        p.property_name,
        p.property_type,
        p.city,
        p.country,
        p.amenities,
        p.images,
        COUNT(r.room_id) as room_count,
        MIN(r.base_price) as base_price
       FROM properties p
       LEFT JOIN rooms r ON p.property_id = r.property_id
       WHERE p.business_id = $1
       GROUP BY p.property_id
       ORDER BY p.created_at DESC`,
      [businessId]
    );

    return NextResponse.json({
      properties: result.rows,
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}