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
}
