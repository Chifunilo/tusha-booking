import { describe, it, expect } from 'vitest';
import {
  quote,
  kwachaToNgwee,
  ngweeToKwacha,
  nightsBetween,
  parseDateOnly,
  isTodayOrFuture,
  VAT_RATE,
  TOURISM_LEVY_RATE,
} from '@/lib/pricing';

describe('money conversion', () => {
  it('converts kwacha to ngwee without floating-point drift', () => {
    expect(kwachaToNgwee(800)).toBe(80000);
    expect(kwachaToNgwee('800.00')).toBe(80000);
    expect(kwachaToNgwee(0.1 + 0.2)).toBe(30); // 0.30000000000000004 -> 30
    expect(kwachaToNgwee('1234.56')).toBe(123456);
  });

  it('round-trips', () => {
    expect(ngweeToKwacha(kwachaToNgwee(1760.55))).toBe(1760.55);
  });

  it('rejects nonsense', () => {
    expect(() => kwachaToNgwee('not-money')).toThrow();
  });
});

describe('quote — the deposit equals the commission (invariant 7)', () => {
  const base = {
    unitRateNgwee: kwachaToNgwee(800),
    units: 2,
    commissionRate: 0.12,
  };

  it('never charges VAT for a property that is not VAT-registered', () => {
    const q = quote({ ...base, isVatRegistered: false });
    expect(q.vatNgwee).toBe(0);
    expect(q.baseNgwee).toBe(160000);
    expect(q.tourismLevyNgwee).toBe(Math.round(160000 * TOURISM_LEVY_RATE));
    expect(q.totalNgwee).toBe(160000 + 2400);
  });

  it('charges VAT for a property that is VAT-registered', () => {
    const q = quote({ ...base, isVatRegistered: true });
    expect(q.vatNgwee).toBe(Math.round(160000 * VAT_RATE));
    expect(q.totalNgwee).toBe(160000 + 2400 + 25600);
  });

  it('sets the deposit exactly equal to the commission', () => {
    for (const isVatRegistered of [true, false]) {
      for (const commissionRate of [0.08, 0.1, 0.12, 0.15]) {
        const q = quote({ ...base, commissionRate, isVatRegistered });
        expect(q.depositNgwee).toBe(q.commissionNgwee);
      }
    }
  });

  it('leaves the property exactly what it is owed, so nothing is held on their behalf', () => {
    const q = quote({ ...base, isVatRegistered: false });
    // Balance the property collects, minus the levy they must remit,
    // equals base minus commission.
    const propertyNet = q.balanceNgwee - q.tourismLevyNgwee;
    expect(propertyNet).toBe(q.baseNgwee - q.commissionNgwee);
  });

  it('charges commission on the base, never on taxes', () => {
    const withVat = quote({ ...base, isVatRegistered: true });
    const withoutVat = quote({ ...base, isVatRegistered: false });
    expect(withVat.commissionNgwee).toBe(withoutVat.commissionNgwee);
  });

  it('always reconciles: deposit + balance === total', () => {
    for (const units of [1, 2, 3, 7, 30]) {
      for (const isVatRegistered of [true, false]) {
        const q = quote({ ...base, units, isVatRegistered });
        expect(q.depositNgwee + q.balanceNgwee).toBe(q.totalNgwee);
      }
    }
  });

  it('produces whole ngwee only — no fractional currency anywhere', () => {
    const q = quote({ unitRateNgwee: 73333, units: 3, commissionRate: 0.12, isVatRegistered: true });
    for (const value of Object.values(q)) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('rejects invalid input rather than silently producing a wrong price', () => {
    expect(() => quote({ ...base, units: 0, isVatRegistered: false })).toThrow();
    expect(() => quote({ ...base, units: 1.5, isVatRegistered: false })).toThrow();
    expect(() => quote({ ...base, commissionRate: 0.9, isVatRegistered: false })).toThrow();
  });
});

describe('date handling — the UTC+2 day-shift trap', () => {
  it('counts nights correctly', () => {
    expect(nightsBetween('2026-09-01', '2026-09-03')).toBe(2);
    expect(nightsBetween('2026-09-01', '2026-09-02')).toBe(1);
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('handles month and leap-year boundaries', () => {
    expect(nightsBetween('2028-02-28', '2028-03-01')).toBe(2); // 2028 is a leap year
    expect(nightsBetween('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('refuses a check-out that is not after check-in', () => {
    expect(() => nightsBetween('2026-09-03', '2026-09-01')).toThrow();
    expect(() => nightsBetween('2026-09-01', '2026-09-01')).toThrow();
  });

  it('does NOT shift the day, which is the bug in the current code', () => {
    // The old code did new Date(x).toISOString().split('T')[0]. In a UTC+2
    // zone that returns the PREVIOUS day. parseDateOnly must be immune.
    const epoch = parseDateOnly('2026-09-01');
    const asUtc = new Date(epoch);
    expect(asUtc.getUTCFullYear()).toBe(2026);
    expect(asUtc.getUTCMonth()).toBe(8);
    expect(asUtc.getUTCDate()).toBe(1);
    expect(asUtc.toISOString().slice(0, 10)).toBe('2026-09-01');
  });

  it('rejects anything that is not a plain calendar date', () => {
    expect(() => parseDateOnly('2026-09-01T00:00:00.000Z')).toThrow();
    expect(() => parseDateOnly('01/09/2026')).toThrow();
    expect(() => parseDateOnly('2026-9-1')).toThrow();
    expect(() => parseDateOnly('')).toThrow();
  });

  it('rejects dates that do not exist', () => {
    expect(() => parseDateOnly('2026-02-30')).toThrow();
    expect(() => parseDateOnly('2026-13-01')).toThrow();
    expect(() => parseDateOnly('2026-00-10')).toThrow();
  });

  it('evaluates "today" in Zambian local time, not UTC', () => {
    // 22:30 UTC on 1 Sept is already 00:30 on 2 Sept in Lusaka.
    const lateUtc = new Date('2026-09-01T22:30:00.000Z');
    expect(isTodayOrFuture('2026-09-02', lateUtc)).toBe(true);
    expect(isTodayOrFuture('2026-09-01', lateUtc)).toBe(false);
  });
});
