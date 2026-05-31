import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    // Sign JWT token
    const token = await new SignJWT({
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    // Build response first, then attach cookie before returning
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        businessName,
      },
    });

    // Set JWT as HttpOnly cookie (cannot be read by JS — XSS safe)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}