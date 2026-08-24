// lib/auth.ts
//
// Route guards and the single error path for API handlers.
//
// EDGE-SAFE: imported by middleware.ts, which runs on the Edge runtime.
// This file must NEVER import `pg`, `fs`, or any Node-only module.
// Database-backed ownership checks live in lib/authz.ts instead.

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyToken } from '@/lib/tokens';
import type { SessionUser } from '@/lib/tokens';
import { AuthError, NotFoundError, ServiceError } from '@/lib/errors';

export { AUTH_COOKIE, COOKIE_MAX_AGE, signToken, verifyToken } from '@/lib/tokens';
export type { SessionUser, UserType } from '@/lib/tokens';
export { AuthError, NotFoundError, ServiceError } from '@/lib/errors';

/** Reads and verifies the session cookie. Returns null when not logged in. */
export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser(request: NextRequest): Promise<SessionUser> {
  const session = await getSession(request);
  if (!session) {
    throw new AuthError(401, 'You must be logged in');
  }
  return session;
}

export async function requireBusiness(request: NextRequest): Promise<SessionUser> {
  const session = await requireUser(request);
  if (session.userType !== 'business') {
    throw new AuthError(403, 'A business account is required');
  }
  return session;
}

/**
 * Admin guard. Throws NotFoundError rather than AuthError so admin endpoints
 * return 404 to everyone else and never confirm that they exist.
 */
export async function requireAdmin(request: NextRequest): Promise<SessionUser> {
  const session = await getSession(request);
  if (!session || session.userType !== 'admin') {
    throw new NotFoundError();
  }
  return session;
}

/**
 * The single error path for every route handler. Guarantees that internal
 * detail — SQL text, stack traces, driver messages — never reaches a client.
 */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      error.fields
        ? { error: error.message, fields: error.fields }
        : { error: error.message },
      { status: error.status },
    );
  }

  // Zod errors are duck-typed so this file stays dependency-light.
  if (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
    const fields: Record<string, string> = {};
    for (const issue of issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: 'Validation failed', fields }, { status: 400 });
  }

  console.error('Unhandled route error:', error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
