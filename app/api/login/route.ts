import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Get email and password from form
    const { email, password } = await request.json();

    // Find customer by email (READ operation - not creating!)
    const result = await pool.query(
      'SELECT customer_id, first_name, last_name, email, password FROM customers WHERE email = $1',
      [email]
    );

    // Check if customer EXISTS (opposite of signup!)
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const customer = result.rows[0];

    // Compare the password they entered with the hashed password in database
    const passwordMatch = await bcrypt.compare(password, customer.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Success! Remove password from response for security
    const { password: _, ...customerWithoutPassword } = customer;

    return NextResponse.json({
      message: 'Log in successful',
      customer: customerWithoutPassword,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}