// lib/pricing.ts
//
// All money maths for the platform. Pure functions with no I/O, so they are
// exhaustively unit-testable and can never differ between the quote shown to
// a guest and the amount actually charged (invariant 5).
//
// MONEY IS HANDLED IN NGWEE (integer hundredths of a kwacha). Never do money
// arithmetic in floating-point kwacha — 0.1 + 0.2 problems become real money.

/** Zambian VAT. Applied ONLY when the property is VAT-registered. */
export const VAT_RATE = 0.16;

/** Zambian tourism levy — 1.5% of the accommodation/event bill. Always applies. */
export const TOURISM_LEVY_RATE = 0.015;

export function kwachaToNgwee(kwacha: number | string): number {
  const value = typeof kwacha === 'string' ? Number.parseFloat(kwacha) : kwacha;
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid monetary value: ${String(kwacha)}`);
  }
  return Math.round(value * 100);
}

export function ngweeToKwacha(ngwee: number): number {
  return Math.round(ngwee) / 100;
}

/** Formats for display: 123456 -> "1,234.56" */
export function formatNgwee(ngwee: number): string {
  return ngweeToKwacha(ngwee).toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface QuoteInput {
  /** Nightly (or per-unit) rate in ngwee. */
  unitRateNgwee: number;
  /** Nights, or delegate-days. Must be a positive integer. */
  units: number;
  /** The property's commission rate, e.g. 0.12. */
  commissionRate: number;
  /** Whether THIS property is VAT-registered. Never assume. */
  isVatRegistered: boolean;
}

export interface Quote {
  units: number;
  baseNgwee: number;
  tourismLevyNgwee: number;
  vatNgwee: number;
  /** What the guest pays in total, across both payments. */
  totalNgwee: number;
  /** Tusha's commission — charged on the base, never on taxes. */
  commissionNgwee: number;
  /** Paid online. Equals the commission (invariant 7). */
  depositNgwee: number;
  /** Paid to the property directly at check-in. */
  balanceNgwee: number;
}

/**
 * The single source of truth for what a stay costs.
 *
 * Commission is charged on the base only. You do not earn commission on the
 * government's VAT or on the tourism levy.
 *
 * The deposit equals the commission exactly, so the balance the property
 * collects is precisely what it is owed and Tusha never holds their money.
 */
export function quote(input: QuoteInput): Quote {
  const { unitRateNgwee, units, commissionRate, isVatRegistered } = input;

  if (!Number.isInteger(units) || units <= 0) {
    throw new Error(`units must be a positive integer, received ${units}`);
  }
  if (!Number.isInteger(unitRateNgwee) || unitRateNgwee < 0) {
    throw new Error(`unitRateNgwee must be a non-negative integer, received ${unitRateNgwee}`);
  }
  if (commissionRate < 0 || commissionRate > 0.5) {
    throw new Error(`commissionRate out of range: ${commissionRate}`);
  }

  const baseNgwee = unitRateNgwee * units;
  const tourismLevyNgwee = Math.round(baseNgwee * TOURISM_LEVY_RATE);
  const vatNgwee = isVatRegistered ? Math.round(baseNgwee * VAT_RATE) : 0;
  const totalNgwee = baseNgwee + tourismLevyNgwee + vatNgwee;
  const commissionNgwee = Math.round(baseNgwee * commissionRate);
  const depositNgwee = commissionNgwee;
  const balanceNgwee = totalNgwee - depositNgwee;

  return {
    units,
    baseNgwee,
    tourismLevyNgwee,
    vatNgwee,
    totalNgwee,
    commissionNgwee,
    depositNgwee,
    balanceNgwee,
  };
}

/**
 * Nights between two calendar dates given as 'YYYY-MM-DD'.
 *
 * Parses the components explicitly and does the arithmetic in UTC. Never use
 * `new Date('2026-09-01')` followed by `.toISOString()` — at UTC+2 that shifts
 * the day backwards and silently books the wrong dates.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDateOnly(checkIn);
  const b = parseDateOnly(checkOut);
  const nights = Math.round((b - a) / 86_400_000);
  if (nights <= 0) {
    throw new Error('Check-out must be after check-in');
  }
  return nights;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Validates and parses 'YYYY-MM-DD' into a UTC epoch. Rejects anything else. */
export function parseDateOnly(value: string): number {
  if (!DATE_ONLY.test(value)) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}"`);
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const epoch = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(epoch);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    throw new Error(`Not a real calendar date: "${value}"`);
  }
  return epoch;
}

/** True when the date is today or later, evaluated in Zambian local time (UTC+2). */
export function isTodayOrFuture(value: string, now: Date = new Date()): boolean {
  const zambiaNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const todayUtc = Date.UTC(
    zambiaNow.getUTCFullYear(),
    zambiaNow.getUTCMonth(),
    zambiaNow.getUTCDate(),
  );
  return parseDateOnly(value) >= todayUtc;
}
