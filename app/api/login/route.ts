import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Find user by email
    const result = await pool.query(
      'SELECT user_id, first_name, last_name, email, password_hash, user_type FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If business user, fetch business name
    let businessName = null;
    if (user.user_type === 'business') {
      const businessResult = await pool.query(
        'SELECT business_name FROM businesses WHERE user_id = $1',
        [user.user_id]
      );
      
      if (businessResult.rows.length > 0) {
        businessName = businessResult.rows[0].business_name;
      }
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        businessName: businessName, // Add business name to user object
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}