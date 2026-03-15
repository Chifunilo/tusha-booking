import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      businessId,
      propertyName,
      propertyType,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      country,
      postalCode,
      description,
      amenities,
      phone,
      email,
      images, 
    } = await request.json();

    // Insert property into database
    const result = await pool.query(
      `INSERT INTO properties (
        business_id, property_name, property_type,
        address_line1, address_line2, city, state_province, country, postal_code,
        description, amenities, phone, email, images, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING property_id, property_name`,
      [
        businessId,
        propertyName,
        propertyType,
        addressLine1,
        addressLine2 || null,
        city,
        stateProvince || null,
        country,
        postalCode || null,
        description || null,
        amenities || [],
        phone || null,
        email,
        images || [],
        true // is_published
      ]
    );

    return NextResponse.json({
      message: 'Property added successfully',
      property: result.rows[0],
    });

  } catch (error) {
    console.error('Error adding property:', error);
    return NextResponse.json(
      { error: 'Failed to add property' },
      { status: 500 }
    );
  }
}