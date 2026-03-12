import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // First get business_id from user_id
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const businessId = businessResult.rows[0].business_id;

    // Count rooms across all properties for this business
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM rooms r
       JOIN properties p ON r.property_id = p.property_id
       WHERE p.business_id = $1`,
      [businessId]
    );

    return NextResponse.json({
      count: parseInt(countResult.rows[0].count),
    });

  } catch (error) {
    console.error('Error counting rooms:', error);
    return NextResponse.json(
      { error: 'Failed to count rooms' },
      { status: 500 }
    );
  }
}