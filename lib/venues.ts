// Keys must match the backend's src/lib/validation/venues.ts.
import { formatCurrency } from './roomTypes';

export const SPACE_TYPES = [
  { value: 'conference_room', label: 'Conference room' },
  { value: 'boardroom', label: 'Boardroom' },
  { value: 'hall', label: 'Hall' },
  { value: 'garden', label: 'Garden' },
  { value: 'outdoor', label: 'Outdoor area' },
  { value: 'restaurant', label: 'Restaurant / private dining' },
  { value: 'other', label: 'Other' },
] as const;

export type SpaceType = (typeof SPACE_TYPES)[number]['value'];

export function spaceTypeLabel(value: string): string {
  return SPACE_TYPES.find((t) => t.value === value)?.label ?? value.replace(/_/g, ' ');
}

export const PACKAGE_GROUPS = [
  {
    title: 'Equipment',
    items: [
      { key: 'projector', label: 'Projector' },
      { key: 'screen', label: 'Screen' },
      { key: 'pa_system', label: 'PA system' },
      { key: 'microphones', label: 'Microphones' },
      { key: 'wifi', label: 'Wi-Fi' },
      { key: 'flipchart', label: 'Flipchart' },
      { key: 'stationery', label: 'Notepads & pens' },
    ],
  },
  {
    title: 'Comfort',
    items: [
      { key: 'aircon', label: 'Air conditioning' },
      { key: 'backup_power', label: 'Backup power' },
      { key: 'parking', label: 'Parking' },
    ],
  },
  {
    title: 'Food & drink',
    items: [
      { key: 'water', label: 'Drinking water' },
      { key: 'tea_breaks', label: 'Tea breaks' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'dinner', label: 'Dinner' },
      { key: 'catering_available', label: 'Catering on request' },
    ],
  },
  {
    title: 'Functions',
    items: [
      { key: 'tables_chairs', label: 'Tables & chairs' },
      { key: 'decor', label: 'Decor' },
      { key: 'stage', label: 'Stage' },
      { key: 'dance_floor', label: 'Dance floor' },
    ],
  },
] as const;

const PACKAGE_LABELS: Record<string, string> = Object.fromEntries(
  PACKAGE_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])),
);

export function packageLabel(key: string): string {
  return PACKAGE_LABELS[key] ?? key.replace(/_/g, ' ');
}

export const EVENT_TYPES = [
  { value: 'conference', label: 'Conference' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'workshop', label: 'Workshop / training' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'party', label: 'Party / celebration' },
  { value: 'church_event', label: 'Church event' },
  { value: 'funeral_gathering', label: 'Memorial / funeral gathering' },
  { value: 'other', label: 'Other' },
] as const;

export function eventTypeLabel(value: string): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const ENQUIRY_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-yellow-100 text-yellow-800' },
  viewed: { label: 'Seen', className: 'bg-gray-100 text-gray-700' },
  quoted: { label: 'Quoted', className: 'bg-blue-100 text-blue-800' },
  won: { label: 'Won', className: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', className: 'bg-red-100 text-red-700' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500' },
};

export interface EventSpace {
  space_id: number;
  space_name: string;
  space_type: string;
  description: string | null;
  max_capacity: number;
  theatre_capacity: number | null;
  banquet_capacity: number | null;
  cocktail_capacity: number | null;
  min_delegates: number | null;
  size_sqm: number | null;
  per_delegate_rate: number | null;
  half_day_delegate_rate: number | null;
  full_day_rate: number | null;
  half_day_rate: number | null;
  hourly_rate: number | null;
  package_includes: string[];
  images: string[];
  is_active: boolean | null;
}

/** The headline price for a space card, or null when the venue quotes on request. */
export function spacePriceLine(s: Pick<EventSpace, 'per_delegate_rate' | 'full_day_rate' | 'half_day_rate' | 'hourly_rate'>): string | null {
  if (s.per_delegate_rate) return `${formatCurrency(s.per_delegate_rate)} per person / day`;
  if (s.full_day_rate) return `${formatCurrency(s.full_day_rate)} per day`;
  if (s.half_day_rate) return `${formatCurrency(s.half_day_rate)} per half day`;
  if (s.hourly_rate) return `${formatCurrency(s.hourly_rate)} per hour`;
  return null;
}

/** "Theatre 150 · Banquet 100" — only the layouts the venue filled in. */
export function layoutLine(s: Pick<EventSpace, 'theatre_capacity' | 'banquet_capacity' | 'cocktail_capacity'>): string {
  return [
    s.theatre_capacity && `Theatre ${s.theatre_capacity}`,
    s.banquet_capacity && `Banquet ${s.banquet_capacity}`,
    s.cocktail_capacity && `Standing ${s.cocktail_capacity}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
