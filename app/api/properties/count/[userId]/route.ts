import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }  // ← params is now a Promise
) {
  try {
    const { userId } = await params;  // ← await params first

    // First get business_id from user_id
    const businessResult = await pool.query(
      'SELECT business_id FROM businesses WHERE user_id = $1',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const businessId = businessResult.rows[0].business_id;

    // Count properties for this business
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM properties WHERE business_id = $1',
      [businessId]
    );

    return NextResponse.json({
      count: parseInt(countResult.rows[0].count),
    });

  } catch (error) {
    console.error('Error counting properties:', error);
    return NextResponse.json(
      { error: 'Failed to count properties' },
      { status: 500 }
    );
  }
}