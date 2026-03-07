import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Get data from the form
    const { firstName, lastName, email, password, day, month, year } = await request.json();

    // Combine date of birth
    const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Check if customer already exists
    const existingCustomer = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );

    if (existingCustomer.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert customer into database
    const result = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, password, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id, email, first_name, last_name',
      [firstName, lastName, email, hashedPassword, dateOfBirth]
    );

    // Return success response
    return NextResponse.json({
      message: 'Account created successfully',
      customerId: result.rows[0].customer_id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}