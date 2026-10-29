// Keys must match ROOM_BLOCK_REASONS in the backend's src/lib/validation/roomBlocks.ts.
export const ROOM_BLOCK_REASONS = [
  { value: 'sold_elsewhere', label: 'Sold elsewhere', hint: 'Phone, walk-in, WhatsApp or another booking site' },
  { value: 'maintenance', label: 'Repairs or maintenance', hint: 'Out of order until it’s fixed' },
  { value: 'owner_use', label: 'Owner or staff use', hint: 'Family, staff or a complimentary stay' },
  { value: 'other', label: 'Other', hint: 'Add a note so you remember why' },
] as const;

export type RoomBlockReason = (typeof ROOM_BLOCK_REASONS)[number]['value'];

export const blockReasonLabel = (value: string) =>
  ROOM_BLOCK_REASONS.find((r) => r.value === value)?.label ?? value;

/** start_date and end_date are both nights the room is off sale (YYYY-MM-DD). */
export interface RoomBlock {
  block_id: number;
  room_id: number;
  room_number: string;
  property_name: string;
  start_date: string;
  end_date: string;
  nights: number;
  reason: RoomBlockReason;
  note: string | null;
  created_at: string;
}

/** Today in the browser's own timezone, as YYYY-MM-DD. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Calendar dates: format in UTC so the day never shifts.
export const formatNight = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
