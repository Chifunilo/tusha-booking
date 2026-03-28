// API Route: /api/properties/customer/[propertyId]/route.ts
// Updated to match marketplace_schema.sql with proper TypeScript types

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Type definitions
interface RoomType {
  room_type_id: number;
  type_name: string;
  max_guests: number;
  amenities_count: number;
  available_count: number;
  price_per_night: number;
}

interface Amenity {
  amenity_id: number;
  name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  // Await the params (Next.js 15+)
  const { propertyId: propertyIdString } = await params;
  const propertyId = parseInt(propertyIdString);

  if (isNaN(propertyId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid property ID' },
      { status: 400 }
    );
  }

  try {
    // Fetch property details from the new schema
    const propertyQuery = `
      SELECT 
        p.property_id,
        p.property_name,
        p.city,
        p.country,
        p.address_line1 || COALESCE(', ' || p.address_line2, '') as address,
        p.star_rating as avg_rating,
        p.description,
        p.amenities,
        p.images,
        p.phone,
        p.email,
        p.property_type
      FROM properties p
      WHERE p.property_id = $1 
        AND p.is_published = true 
        AND p.is_active = true
    `;

    const propertyResult = await pool.query(propertyQuery, [propertyId]);

    if (propertyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Property not found or not available' },
        { status: 404 }
      );
    }

    const property = propertyResult.rows[0];

    // Fetch room types with aggregated data (only if property has hotel rooms)
    let room_types: RoomType[] = [];  // ✅ Added proper type annotation
    
    if (property.property_type === 'hotel' || property.property_type === 'both') {
      const roomTypesQuery = `
        SELECT 
          room_type,
          MAX(max_occupancy) as max_guests,
          COUNT(DISTINCT UNNEST(amenities)) as amenities_count,
          COUNT(*) FILTER (WHERE is_active = true) as available_count,
          MIN(base_price) as price_per_night,
          ROW_NUMBER() OVER (ORDER BY MIN(base_price)) as room_type_id
        FROM rooms
        WHERE property_id = $1 AND is_active = true
        GROUP BY room_type
        ORDER BY MIN(base_price) ASC
      `;

      const roomTypesResult = await pool.query(roomTypesQuery, [propertyId]);

      // Transform room types to match expected format
      room_types = roomTypesResult.rows.map(room => ({
        room_type_id: Number(room.room_type_id),
        type_name: String(room.room_type),
        max_guests: Number(room.max_guests),
        amenities_count: Number(room.amenities_count),
        available_count: Number(room.available_count),
        price_per_night: parseFloat(room.price_per_night),
      }));
    }

    // Transform property amenities to expected format
    const amenities: Amenity[] = (property.amenities || []).map((name: string, index: number) => ({
      amenity_id: index + 1,
      name: name,
    }));

    // Use images from database, or fallback to placeholders
    const images: string[] = property.images && property.images.length > 0 
      ? property.images 
      : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        ];

    // Get actual review count and average rating
    const reviewQuery = `
      SELECT 
        COUNT(*) as review_count,
        COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews
      WHERE property_id = $1 
        AND is_published = true
    `;

    const reviewResult = await pool.query(reviewQuery, [propertyId]);
    const reviewData = reviewResult.rows[0];

    // Build final response
    const responseData = {
      success: true,
      property: {
        property_id: property.property_id,
        property_name: property.property_name,
        city: property.city,
        country: property.country,
        address: property.address,
        images: images,
        amenities: amenities,
        room_types: room_types,
        avg_rating: parseFloat(reviewData.avg_rating) || parseFloat(property.avg_rating) || 0,
        review_count: parseInt(reviewData.review_count) || 0,
        description: property.description,
        phone: property.phone,
        email: property.email,
        property_type: property.property_type,
      },
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error fetching property details:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}