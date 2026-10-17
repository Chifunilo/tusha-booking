// Keys must match FACILITIES in the backend's src/lib/validation/properties.ts.
export const FACILITY_GROUPS = [
  {
    title: 'Power & water',
    items: [
      { key: 'backup_generator', label: 'Backup generator' },
      { key: 'solar_power', label: 'Solar power' },
      { key: 'borehole_water', label: 'Borehole water' },
      { key: 'water_tank', label: 'Water storage tank' },
      { key: 'hot_water', label: 'Hot water' },
    ],
  },
  {
    title: 'Safety & security',
    items: [
      { key: 'security_guard', label: '24-hour security guard' },
      { key: 'secure_parking', label: 'Secure parking' },
      { key: 'cctv', label: 'CCTV' },
      { key: 'electric_fence', label: 'Electric fence' },
    ],
  },
  {
    title: 'Comfort',
    items: [
      { key: 'wifi', label: 'Wi-Fi' },
      { key: 'aircon', label: 'Air conditioning' },
      { key: 'dstv', label: 'DStv' },
      { key: 'fans', label: 'Fans' },
      { key: 'swimming_pool', label: 'Swimming pool' },
      { key: 'garden', label: 'Garden' },
    ],
  },
  {
    title: 'Food & drink',
    items: [
      { key: 'restaurant', label: 'Restaurant' },
      { key: 'bar', label: 'Bar' },
      { key: 'breakfast_available', label: 'Breakfast available' },
      { key: 'self_catering', label: 'Self-catering kitchen' },
      { key: 'braai_area', label: 'Braai area' },
    ],
  },
  {
    title: 'Services',
    items: [
      { key: 'airport_transfer', label: 'Airport transfer' },
      { key: 'laundry', label: 'Laundry service' },
      { key: 'conference_room', label: 'Conference room' },
      { key: 'room_service', label: 'Room service' },
      { key: 'tours', label: 'Tours & activities' },
    ],
  },
  {
    title: 'Accessibility & family',
    items: [
      { key: 'wheelchair_access', label: 'Wheelchair accessible' },
      { key: 'ground_floor_rooms', label: 'Ground-floor rooms' },
      { key: 'kids_play_area', label: "Children's play area" },
    ],
  },
] as const;

const FACILITY_LABELS: Record<string, string> = Object.fromEntries(
  FACILITY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])),
);

export function facilityLabel(key: string): string {
  return FACILITY_LABELS[key] ?? key.replace(/_/g, ' ');
}

export const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'motel', label: 'Motel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'chalet', label: 'Chalet / cottage' },
  { value: 'resort', label: 'Resort' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'campsite', label: 'Campsite' },
  { value: 'entire_home', label: 'Entire home' },
  { value: 'event_center', label: 'Event centre' },
  { value: 'both', label: 'Accommodation & events' },
] as const;

export const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible', detail: 'Full deposit refund if cancelled at least 24 hours before check-in' },
  { value: 'moderate', label: 'Moderate', detail: 'Full deposit refund if cancelled at least 48 hours before check-in' },
  { value: 'strict', label: 'Strict', detail: 'The deposit is non-refundable' },
] as const;

export const PAYMENT_ON_ARRIVAL = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
] as const;

export const ZAMBIA_PROVINCES = [
  'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka',
  'Muchinga', 'North-Western', 'Northern', 'Southern', 'Western',
];

/**
 * Pulls coordinates out of a shared map link or a pasted "lat, lng" pair.
 * Handles Google Maps (@lat,lng / ?q=lat,lng / !3d…!4d…) and plain coordinates.
 */
export function parseCoordinates(text: string): { lat: number; lng: number } | null {
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export function propertyTypeLabel(value: string): string {
  return PROPERTY_TYPES.find((t) => t.value === value)?.label ?? value.replace(/_/g, ' ');
}

/**
 * International digits for a phone number, assuming Zambia (+260) when it's
 * written locally ("0977 123 456" → "260977123456"). Used for wa.me and tel: links.
 */
export function internationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+') || digits.startsWith('260')) return digits;
  if (digits.startsWith('0')) return `260${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(phone: string, message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${internationalDigits(phone)}${text}`;
}

/** OpenStreetMap embed URL centred on a point — no API key or map library needed. */
export function osmEmbedUrl(lat: number, lng: number, zoomDelta = 0.01): string {
  const bbox = [lng - zoomDelta, lat - zoomDelta, lng + zoomDelta, lat + zoomDelta].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
