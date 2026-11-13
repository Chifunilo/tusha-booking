// The deposit checkout (backend PHASEBPAYMENTS.md). Shapes match the backend's checkoutView.

export type MobileNetwork = 'mtn' | 'airtel' | 'zamtel';

export interface CheckoutPaymentView {
  status: 'pending' | 'succeeded' | 'failed' | 'expired' | 'refund_due';
  method: 'mobile_money' | 'card';
  network: MobileNetwork | null;
  /** Masked, e.g. "097 ••• 567". */
  phone: string | null;
  amount: number;
  failureReason: string | null;
  startedAt: string;
}

export interface CheckoutView {
  reference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  paymentStatus: string;
  holdExpiresAt: string | null;
  propertyName: string;
  roomTypeName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  numGuests: number | null;
  total: number;
  deposit: number;
  balanceDue: number;
  cancellationPolicy: string;
  payment: CheckoutPaymentView | null;
  refundDue: boolean;
  /** Only right after a payment starts: the provider's page to go to. */
  redirectUrl: string | null;
  /** Development only: the fake provider's simulated phone. */
  simulatorUrl: string | null;
}

export const NETWORK_LABELS: Record<MobileNetwork, string> = { mtn: 'MTN MoMo', airtel: 'Airtel Money', zamtel: 'Zamtel Kwacha' };

// Must match NETWORK_PREFIXES in the backend's src/lib/validation/checkout.ts.
const PREFIXES: Record<string, MobileNetwork> = { '96': 'mtn', '76': 'mtn', '97': 'airtel', '77': 'airtel', '95': 'zamtel', '75': 'zamtel' };

/** The network of a Zambian mobile number as the guest types it; null until it's recognisable. */
export function detectNetwork(input: string): MobileNetwork | null {
  const digits = input.replace(/\D/g, '');
  const national = digits.startsWith('260') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return national.length >= 2 ? PREFIXES[national.slice(0, 2)] ?? null : null;
}

/** "Thu, 5 Nov" for a YYYY-MM-DD calendar date, in UTC so the day never shifts. */
export const formatStayDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '—';
