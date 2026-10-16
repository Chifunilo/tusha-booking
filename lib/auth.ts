// lib/auth.ts
import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: { userId: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export interface Session {
  userId: number;
  email: string;
  userType?: string;
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as Session;
}

/** Verifies the auth cookie, returning the session or null instead of throwing. */
export async function getSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}