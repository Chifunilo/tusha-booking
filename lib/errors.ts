// lib/errors.ts
//
// Error types shared by services and route handlers.
// Deliberately free of Next.js and `pg` imports so that service code — and its
// tests — never has to pull in the HTTP layer.

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Thrown when an admin-only resource is requested by anyone else. */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Raised by service functions for expected, reportable failures. */
export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
