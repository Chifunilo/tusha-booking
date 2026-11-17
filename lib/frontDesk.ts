// Keys must match BOOKING_SOURCES / FRONT_DESK_PAYMENT_METHODS in the backend's src/lib/validation/frontDesk.ts.
export const BOOKING_SOURCES = [
  { value: 'tusha', label: 'Tusha' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'ota', label: 'Other booking site' },
  { value: 'other', label: 'Other' },
] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number]['value'];

/** The sources the front desk can record; Tusha bookings only come from the marketplace. */
export const FRONT_DESK_SOURCES = BOOKING_SOURCES.filter((s) => s.value !== 'tusha');

export const bookingSourceLabel = (value: string) =>
  BOOKING_SOURCES.find((s) => s.value === value)?.label ?? value;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export const paymentMethodLabel = (value: string | null | undefined) =>
  value ? PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value.replace(/_/g, ' ') : null;

/** A room free for every night of the stay, from GET /api/frontdesk/free-rooms. */
export interface FreeRoom {
  room_id: number;
  room_number: string;
  property_id: number;
  property_name: string;
  room_type_id: number;
  room_type: string;
  max_occupancy: number;
  meal_plan: string;
  price: number;
  non_resident_price: number | null;
}

/** YYYY-MM-DD plus n days. Calendar dates, so done in UTC to avoid DST/timezone shifts. */
export const addNights = (d: string, n: number) =>
  new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

export const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const formatKwacha = (n: number) =>
  `K${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A booking as the owner's calendar gets it (GET /api/bookings/user/:id, POST /api/frontdesk/bookings). */
export interface OwnerBooking {
  booking_id: number;
  booking_reference: string;
  room_id: number;
  room_number: string;
  property_id: number;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string;
  num_guests: number;
  total_price: number | string;
  base_price: number | string;
  /** Standard rate × nights, set only when the front desk agreed a different price. */
  list_price: number | string | null;
  payment_method: string | null;
  payment_status: string;
  status: string;
  source: BookingSource;
  created_by_name: string | null;
  special_requests?: string | null;
  /** What the guest still owes the property. */
  balance_due: number;
  checked_in_at: string | null;
  checked_out_at: string | null;
}

// ─── Stays (backend PHASEDLODGE.md step 3) ────────────────────────────────────

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting deposit',
  confirmed: 'Confirmed',
  checked_in: 'In house',
  completed: 'Checked out',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export const bookingStatusLabel = (status: string) => BOOKING_STATUS_LABELS[status] ?? status;

export const bookingStatusClass = (status: string) =>
  ({
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-sky-100 text-sky-800',
    completed: 'bg-gray-100 text-gray-700',
  })[status] ?? 'bg-red-100 text-red-800';

// Keys must match HOUSEKEEPING_STATUSES in the backend's src/lib/validation/frontDesk.ts.
export const HOUSEKEEPING = [
  { value: 'dirty', label: 'Dirty' },
  { value: 'clean', label: 'Clean' },
  { value: 'inspected', label: 'Inspected' },
] as const;

export type HousekeepingStatus = (typeof HOUSEKEEPING)[number]['value'];

/** A room on the Today board (GET /api/frontdesk/today). */
export interface TodayRoom {
  room_id: number;
  room_number: string;
  property_id: number;
  property_name: string;
  room_type: string;
  housekeeping_status: HousekeepingStatus;
  /** The guest checked in to it, if any. */
  occupied_by: string | null;
}

export interface TodayView {
  /** The lodge's today (Zambia), YYYY-MM-DD. */
  date: string | null;
  /** Confirmed and due: today, or late (check-in already passed). */
  arrivals: OwnerBooking[];
  inHouse: OwnerBooking[];
  /** In house and due out today, or overdue. */
  departures: OwnerBooking[];
  rooms: TodayRoom[];
}
