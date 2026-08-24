import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { signToken, verifyToken, TOKEN_TTL, COOKIE_MAX_AGE } from '@/lib/tokens';

const customer = { userId: 7, email: 'guest@example.zm', userType: 'customer' as const };
const business = { userId: 8, email: 'lodge@example.zm', userType: 'business' as const };
const admin = { userId: 1, email: 'admin@example.zm', userType: 'admin' as const };

describe('token round-trip', () => {
  it('verifies a token it just signed', async () => {
    const token = await signToken(customer);
    expect(await verifyToken(token)).toEqual(customer);
  });

  it('preserves userType, which is what role guards depend on', async () => {
    for (const user of [customer, business, admin]) {
      const session = await verifyToken(await signToken(user));
      expect(session?.userType).toBe(user.userType);
    }
  });
});

describe('token rejection', () => {
  it('rejects a token signed with a different secret', async () => {
    const attacker = new TextEncoder().encode('attacker-secret-attacker-secret-123');
    const forged = await new SignJWT({ ...admin })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(attacker);
    expect(await verifyToken(forged)).toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const token = await signToken(customer);
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...customer, userType: 'admin' }),
    ).toString('base64url');
    expect(await verifyToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const expired = await new SignJWT({ ...customer })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secret);
    expect(await verifyToken(expired)).toBeNull();
  });

  it('rejects the "alg: none" downgrade attack', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ ...admin })).toString('base64url');
    expect(await verifyToken(`${header}.${payload}.`)).toBeNull();
  });

  it('rejects garbage without throwing', async () => {
    for (const value of ['', 'not-a-token', 'a.b.c', '....']) {
      await expect(verifyToken(value)).resolves.toBeNull();
    }
  });

  it('rejects a validly-signed token carrying an unknown role', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const odd = await new SignJWT({ userId: 3, email: 'x@y.zm', userType: 'superuser' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
    expect(await verifyToken(odd)).toBeNull();
  });

  it('rejects a validly-signed token with a malformed userId', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    for (const userId of ['7', -1, 0, 1.5, null]) {
      const odd = await new SignJWT({ userId, email: 'x@y.zm', userType: 'customer' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);
      expect(await verifyToken(odd)).toBeNull();
    }
  });
});

describe('session lifetimes', () => {
  it('gives admins a much shorter session than ordinary users', () => {
    expect(TOKEN_TTL.admin).toBe('8h');
    expect(TOKEN_TTL.customer).toBe('7d');
    expect(COOKIE_MAX_AGE.admin).toBeLessThan(COOKIE_MAX_AGE.customer);
  });

  it('sets a cookie max-age consistent with the token TTL', async () => {
    const token = await signToken(admin);
    const [, payload] = token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims.exp - claims.iat).toBe(COOKIE_MAX_AGE.admin);
  });
});

describe('missing secret', () => {
  const original = process.env.JWT_SECRET;
  beforeEach(() => { delete process.env.JWT_SECRET; });
  afterEach(() => { process.env.JWT_SECRET = original; });

  it('fails loudly rather than signing with an empty key', async () => {
    await expect(signToken(customer)).rejects.toThrow(/JWT_SECRET/);
  });
});
