import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      propertyId,
      roomNumber,
      roomType,
      floorNumber,
      squareMeters,
      numBeds,
      bedType,
      maxOccupancy,
      basePrice,
      amenities,
      description,
    } = await request.json();

    // Check if room number already exists for this property
    const existingRoom = await pool.query(
      'SELECT * FROM rooms WHERE property_id = $1 AND room_number = $2',
      [propertyId, roomNumber]
    );

    if (existingRoom.rows.length > 0) {
      return NextResponse.json(
        { error: 'Room number already exists for this property' },
        { status: 400 }
      );
    }

    // Insert room into database
    const result = await pool.query(
      `INSERT INTO rooms (
        property_id, room_number, room_type, floor_number, size_sqm,
        num_beds, bed_type, max_occupancy, base_price, amenities, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING room_id, room_number, room_type`,
      [
        propertyId,
        roomNumber,
        roomType,
        floorNumber,
        squareMeters,
        numBeds,
        bedType,
        maxOccupancy,
        basePrice,
        amenities || [],
        true // is_active
      ]
    );

    return NextResponse.json({
      message: 'Room added successfully',
      room: result.rows[0],
    });

  } catch (error) {
    console.error('Error adding room:', error);
    return NextResponse.json(
      { error: 'Failed to add room' },
      { status: 500 }
    );
  }
}