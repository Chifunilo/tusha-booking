// lib/db.ts
//
// The ONLY place in this codebase where a Pool may be constructed.
// Every module that needs the database imports from here.

import { Pool, types } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings rather than
// JavaScript Date objects. Without this, node-postgres constructs a Date at
// local midnight, and any later .toISOString() shifts the day backwards for
// UTC+2 (Zambia). Calendar dates must never become timestamps.
types.setTypeParser(1082, (value: string) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: process.env.PGSSL_DISABLE === 'true' ? false : { rejectUnauthorized: true },
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error);
});

export default pool;
