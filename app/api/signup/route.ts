import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      userType,
      businessName,
      businessType 
    } = await request.json();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into users table
    // For business: first_name and last_name will be NULL
    // For customer: use provided firstName and lastName
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, email, user_type`,
      [
        email, 
        hashedPassword, 
        userType, 
        userType === 'customer' ? firstName : null,
        userType === 'customer' ? lastName : null
      ]
    );

    const newUser = userResult.rows[0];

    // If business user, create business record
    if (userType === 'business') {
      await pool.query(
        `INSERT INTO businesses (user_id, business_name, business_type, address_line1, city, country) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newUser.user_id, 
          businessName, 
          businessType || 'hotel',  // Default to 'hotel' if not provided
          'TBD', 
          'TBD', 
          'TBD'
        ]
      );
    }

    return NextResponse.json({
      message: 'Account created successfully',
      userId: newUser.user_id,
      email: newUser.email,
      userType: newUser.user_type,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}