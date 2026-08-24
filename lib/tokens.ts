// lib/tokens.ts
//
// JWT signing and verification. Depends only on `jose` — no Next.js, no `pg`.
// Kept separate from lib/auth.ts so it is trivially unit-testable and provably
// safe to run on the Edge runtime.

import { jwtVerify, SignJWT } from 'jose';

export type UserType = 'customer' | 'business' | 'admin';

export interface SessionUser {
  userId: number;
  email: string;
  userType: UserType;
}

export const AUTH_COOKIE = 'auth_token';

/** Admin sessions are deliberately much shorter than ordinary ones. */
export const TOKEN_TTL: Record<UserType, string> = {
  customer: '7d',
  business: '7d',
  admin: '8h',
};

export const COOKIE_MAX_AGE: Record<UserType, number> = {
  customer: 60 * 60 * 24 * 7,
  business: 60 * 60 * 24 * 7,
  admin: 60 * 60 * 8,
};

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    // Fail loudly. Encoding `undefined` would yield an empty key and every
    // token in the system would become forgeable.
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(raw);
}

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL[payload.userType])
    .sign(getSecret());
}

/**
 * Returns the session, or null if the token is missing, malformed, tampered
 * with, signed by another key, or expired. Never throws.
 */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });

    const { userId, email, userType } = payload as Record<string, unknown>;

    if (
      typeof userId !== 'number' ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      typeof email !== 'string' ||
      (userType !== 'customer' && userType !== 'business' && userType !== 'admin')
    ) {
      return null;
    }

    return { userId, email, userType };
  } catch {
    return null;
  }
}
