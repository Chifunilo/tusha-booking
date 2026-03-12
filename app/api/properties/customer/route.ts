import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const type = searchParams.get('type'); // 'events' or null

    let query = `
      SELECT 
        p.property_id,
        p.property_name,
        p.property_type,
        p.city,
        p.country,
        p.images,
        p.amenities,
        COUNT(DISTINCT r.room_id) as total_rooms,
        COALESCE(AVG(rev.rating), 0) as avg_rating,
        COUNT(DISTINCT rev.review_id) as review_count,
        MIN(r.base_price) as min_price
      FROM properties p
      LEFT JOIN rooms r ON p.property_id = r.property_id
      LEFT JOIN reviews rev ON p.property_id = rev.property_id
      WHERE p.is_published = true AND p.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Filter by property type (events only)
    if (type === 'events') {
      query += ` AND (p.property_type = 'event_center' OR p.property_type = 'both')`;
    }

    // Filter by city
    if (city) {
      query += ` AND LOWER(p.city) LIKE LOWER($${paramIndex})`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query += ` GROUP BY p.property_id HAVING 1=1`;
      
      if (minPrice) {
        query += ` AND MIN(r.base_price) >= $${paramIndex}`;
        params.push(parseFloat(minPrice));
        paramIndex++;
      }
      
      if (maxPrice) {
        query += ` AND MIN(r.base_price) <= $${paramIndex}`;
        params.push(parseFloat(maxPrice));
        paramIndex++;
      }
    } else {
      query += ` GROUP BY p.property_id`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    // Format the data
    const properties = result.rows.map(row => ({
      ...row,
      avg_rating: parseFloat(row.avg_rating) || 0,
      review_count: parseInt(row.review_count) || 0,
      total_rooms: parseInt(row.total_rooms) || 0,
      min_price: parseFloat(row.min_price) || 0,
    }));

    return NextResponse.json({
      properties,
    });

  } catch (error) {
    console.error('Error fetching customer properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}