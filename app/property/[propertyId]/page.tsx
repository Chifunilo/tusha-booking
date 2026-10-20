"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookingHeader from "@/components/customer/BookingHeader";
import PropertyGallery from "@/components/property/PropertyGallery";
import RoomTypeCard, { RoomType, priceFor } from "@/components/property/RoomTypeCard";
import { API_URL } from "@/lib/api";
import { formatCurrency, Residency } from "@/lib/roomTypes";
import {
  CANCELLATION_POLICIES,
  FACILITY_GROUPS,
  PAYMENT_ON_ARRIVAL,
  facilityLabel,
  internationalDigits,
  osmEmbedUrl,
  propertyTypeLabel,
  whatsappLink,
} from "@/lib/facilities";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyDetail {
  property_id: number;
  property_name: string;
  property_type: string;
  description: string | null;
  street: string | null;
  area: string | null;
  city: string | null;
  province: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  directions: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  images: string[];
  amenities: { amenity_id: number; name: string }[];
  room_types: RoomType[];
  avg_rating: number;
  review_count: number;
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  children_allowed: boolean | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
  payment_on_arrival: string[];
  house_rules: string | null;
}

type Availability = { key: string; available: Record<number, number> | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000);
}

// "14:00" → "2:00 PM"
function formatTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-gray-200 py-8 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="shrink-0 text-green-600" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="shrink-0 text-gray-400" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5a7 7 0 1114 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function About({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 450;
  return (
    <div>
      <p className={`whitespace-pre-line leading-relaxed text-gray-700 ${long && !expanded ? "line-clamp-5" : ""}`}>{text}</p>
      {long && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-sm font-semibold text-gray-900 underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function Facilities({ keys }: { keys: string[] }) {
  const owned = new Set(keys);
  const groups = FACILITY_GROUPS.map((g) => ({ title: g.title, items: g.items.filter((i) => owned.has(i.key)) })).filter(
    (g) => g.items.length > 0,
  );
  const known = new Set<string>(FACILITY_GROUPS.flatMap((g) => g.items.map((i) => i.key)));
  const other = keys.filter((k) => !known.has(k));

  if (keys.length === 0) return <p className="text-gray-500">The property hasn&apos;t listed its facilities yet.</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{g.title}</h3>
          <ul className="space-y-1.5">
            {g.items.map((i) => (
              <li key={i.key} className="flex items-center gap-2 text-gray-800"><Check ok /> {i.label}</li>
            ))}
          </ul>
        </div>
      ))}
      {other.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Other</h3>
          <ul className="space-y-1.5">
            {other.map((k) => (
              <li key={k} className="flex items-center gap-2 capitalize text-gray-800"><Check ok /> {facilityLabel(k)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Location({ property, locationLine }: { property: PropertyDetail; locationLine: string }) {
  const { latitude: lat, longitude: lng } = property;
  const hasPin = lat !== null && lng !== null;
  const destination = hasPin ? `${lat},${lng}` : [property.street, locationLine].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      {hasPin && (
        <iframe
          title={`Map showing ${property.property_name}`}
          src={osmEmbedUrl(lat, lng, 0.008)}
          className="h-72 w-full rounded-2xl border border-gray-200"
          loading="lazy"
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-gray-700">
          {property.street && <p className="font-medium text-gray-900">{property.street}</p>}
          <p>{locationLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            <PinIcon /> Get directions
          </a>
          {hasPin && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Larger map
            </a>
          )}
        </div>
      </div>
      {property.directions && (
        <div className="rounded-2xl bg-yellow-50 p-4">
          <p className="mb-1 text-sm font-semibold text-gray-900">How to get there</p>
          <p className="whitespace-pre-line text-sm text-gray-700">{property.directions}</p>
        </div>
      )}
    </div>
  );
}

function Policies({ property }: { property: PropertyDetail }) {
  const policy = CANCELLATION_POLICIES.find((p) => p.value === property.cancellation_policy);
  const payments = PAYMENT_ON_ARRIVAL.filter((p) => property.payment_on_arrival?.includes(p.value)).map((p) => p.label);
  const checkIn = formatTime(property.check_in_time);
  const checkOut = formatTime(property.check_out_time);
  const rules: { label: string; allowed: boolean | null }[] = [
    { label: "Children welcome", allowed: property.children_allowed },
    { label: "Pets allowed", allowed: property.pets_allowed },
    { label: "Smoking allowed", allowed: property.smoking_allowed },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {(checkIn || checkOut) && (
        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Check-in &amp; check-out</h3>
          {checkIn && <p className="text-gray-700">Check-in from <strong>{checkIn}</strong></p>}
          {checkOut && <p className="text-gray-700">Check-out by <strong>{checkOut}</strong></p>}
        </div>
      )}

      {policy && (
        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Cancellation · {policy.label}</h3>
          <p className="text-gray-700">{policy.detail}.</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold text-gray-900">House rules</h3>
        <ul className="space-y-1.5">
          {rules
            .filter((r) => r.allowed !== null)
            .map((r) => (
              <li key={r.label} className={`flex items-center gap-2 ${r.allowed ? "text-gray-800" : "text-gray-500"}`}>
                <Check ok={!!r.allowed} /> {r.allowed ? r.label : r.label.replace(/allowed|welcome/, "not allowed")}
              </li>
            ))}
        </ul>
        {property.house_rules && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{property.house_rules}</p>}
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-gray-900">Paying</h3>
        <p className="text-gray-700">You pay a deposit online to confirm. The balance is paid at the property.</p>
        {payments.length > 0 && (
          <p className="mt-1 text-gray-700">
            At the property: <strong>{payments.join(", ")}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Booking panel (sticky on desktop) ────────────────────────────────────────

function BookingPanel({
  property,
  fromPrice,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  maxGuests,
  residency,
  setResidency,
  showResidency,
  dateHint,
  checkInRef,
  onSeeRooms,
}: {
  property: PropertyDetail;
  fromPrice: number | null;
  checkIn: string;
  setCheckIn: (d: string) => void;
  checkOut: string;
  setCheckOut: (d: string) => void;
  guests: number;
  setGuests: (n: number) => void;
  maxGuests: number;
  residency: Residency;
  setResidency: (r: Residency) => void;
  showResidency: boolean;
  dateHint: boolean;
  checkInRef: React.RefObject<HTMLInputElement | null>;
  onSeeRooms: () => void;
}) {
  const today = localToday();
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : null;
  const contactMessage = `Hi, I found ${property.property_name} on Tusha and have a question.`;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      {fromPrice !== null && (
        <p className="text-gray-600">
          From <span className="text-2xl font-bold text-gray-900">{formatCurrency(fromPrice)}</span> / night
        </p>
      )}

      {property.room_types.length > 0 && (
        <>
          <div className={`grid grid-cols-2 overflow-hidden rounded-xl border-2 ${dateHint ? "border-red-500" : "border-gray-800"}`}>
            <label className={`border-r-2 px-3 py-2 ${dateHint ? "border-red-500" : "border-gray-800"}`}>
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-600">Check-in</span>
              <input
                ref={checkInRef}
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) setCheckOut("");
                }}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="px-3 py-2">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-600">Check-out</span>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          {dateHint && <p className="-mt-2 text-sm text-red-600">Choose your check-in and check-out dates first.</p>}

          <div className="flex items-center justify-between rounded-xl border-2 border-gray-800 px-3 py-2">
            <span className="text-sm font-semibold text-gray-800">Guests</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                disabled={guests <= 1}
                aria-label="Fewer guests"
                className="h-8 w-8 rounded-full border border-gray-400 text-lg leading-none disabled:opacity-30"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                disabled={guests >= maxGuests}
                aria-label="More guests"
                className="h-8 w-8 rounded-full border border-gray-400 text-lg leading-none disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
          {guests >= maxGuests && maxGuests > 1 && (
            <p className="-mt-2 text-xs text-gray-500">The largest room here sleeps {maxGuests}. Bigger groups can book more than one room.</p>
          )}

          {showResidency && (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-gray-800">Rates for</p>
              <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                {(
                  [
                    { value: "resident", label: "Zambian resident" },
                    { value: "non_resident", label: "Non-resident" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setResidency(o.value)}
                    className={`rounded-lg px-2 py-1.5 text-sm font-semibold ${residency === o.value ? "bg-white text-gray-900 shadow" : "text-gray-600"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">You may be asked for an NRC or passport at check-in.</p>
            </div>
          )}

          <button onClick={onSeeRooms} className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500">
            {nights ? `See rooms for ${nights} night${nights === 1 ? "" : "s"}` : "See rooms"}
          </button>
        </>
      )}

      {(property.whatsapp || property.phone) && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800">Questions? Contact the property</p>
          <div className="flex gap-2">
            {property.whatsapp && (
              <a
                href={whatsappLink(property.whatsapp, contactMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-600 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            )}
            {property.phone && (
              <a
                href={`tel:+${internationalDigits(property.phone)}`}
                className="flex-1 rounded-xl border border-gray-300 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Call
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const propertyId = Number(use(params).propertyId);
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [residency, setResidency] = useState<Residency>("resident");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [dateHint, setDateHint] = useState(false);
  const checkInRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/properties/customer/${propertyId}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setProperty(data.property);
        else setError(data.message || "Property not found");
      } catch {
        if (!cancelled) setError("Failed to load property details");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const datesKey = checkIn && checkOut && checkOut > checkIn ? `${checkIn}_${checkOut}` : null;

  useEffect(() => {
    if (!datesKey || !property?.room_types.length) return;
    let cancelled = false;
    (async () => {
      const [ci, co] = datesKey.split("_");
      try {
        const res = await fetch(`${API_URL}/api/properties/customer/${propertyId}/availability?checkIn=${ci}&checkOut=${co}`);
        const data = await res.json();
        if (!cancelled) setAvailability({ key: datesKey, available: res.ok ? data.available : null });
      } catch {
        // Availability is a hint; without it the cards just don't show counts.
        if (!cancelled) setAvailability({ key: datesKey, available: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [datesKey, propertyId, property?.room_types.length]);

  const available = availability && availability.key === datesKey ? availability.available : null;
  const nights = datesKey ? nightsBetween(checkIn, checkOut) : null;

  const derived = useMemo(() => {
    if (!property) return null;
    const rooms = property.room_types;
    return {
      locationLine: [property.area, property.city, property.province, property.country].filter(Boolean).join(", "),
      maxGuests: rooms.length ? Math.max(...rooms.map((r) => r.max_occupancy)) : 1,
      showResidency: rooms.some((r) => r.non_resident_price !== null),
    };
  }, [property]);

  const fromPrice = property?.room_types.length ? Math.min(...property.room_types.map((r) => priceFor(r, residency))) : null;
  const effectiveGuests = derived ? Math.min(guests, derived.maxGuests) : guests;

  const scrollToRooms = () => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });

  const handleSelect = (room: RoomType) => {
    if (!datesKey) {
      setDateHint(true);
      checkInRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      checkInRef.current?.focus();
      return;
    }
    router.push(
      `/booking?propertyId=${propertyId}&roomTypeId=${room.room_type_id}&residency=${residency}&guests=${effectiveGuests}&checkIn=${checkIn}&checkOut=${checkOut}`,
    );
  };

  const setDate = (setter: (d: string) => void) => (d: string) => {
    setter(d);
    setDateHint(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        {!property && !error && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200 md:h-[420px]" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg md:p-20">
            <h1 className="text-2xl font-bold text-gray-500 md:text-3xl">{error}</h1>
            <button onClick={() => router.push("/")} className="mt-6 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black hover:bg-yellow-500">
              Browse properties
            </button>
          </div>
        )}

        {property && derived && (
          <>
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-yellow-600">{propertyTypeLabel(property.property_type)}</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">{property.property_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1"><PinIcon /> {derived.locationLine}</span>
                {property.review_count > 0 && (
                  <span>
                    ★ <strong className="text-gray-900">{Number(property.avg_rating).toFixed(1)}</strong> · {property.review_count} review
                    {property.review_count === 1 ? "" : "s"}
                  </span>
                )}
                {property.latitude !== null && (
                  <a href="#location" className="font-semibold text-gray-900 underline">Show on map</a>
                )}
              </div>
            </div>

            <PropertyGallery images={property.images} name={property.property_name} />

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {property.description && (
                  <Section title="About this place">
                    <About text={property.description} />
                  </Section>
                )}

                <Section title="Facilities">
                  <Facilities keys={property.amenities.map((a) => a.name)} />
                </Section>

                {property.room_types.length > 0 ? (
                  <Section id="rooms" title="Rooms">
                    {!datesKey && <p className="mb-4 text-sm text-gray-600">Add your dates to see what&apos;s available.</p>}
                    <div className="space-y-4">
                      {property.room_types.map((room) => (
                        <RoomTypeCard
                          key={room.room_type_id}
                          room={room}
                          residency={residency}
                          guests={effectiveGuests}
                          nights={nights}
                          available={available ? (available[room.room_type_id] ?? 0) : undefined}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </Section>
                ) : (
                  <Section id="rooms" title="Bookings">
                    <p className="text-gray-700">This venue doesn&apos;t take room bookings on Tusha yet. Contact the property to make arrangements.</p>
                  </Section>
                )}

                <Section id="location" title="Location">
                  <Location property={property} locationLine={derived.locationLine} />
                </Section>

                <Section title="Policies">
                  <Policies property={property} />
                </Section>
              </div>

              <aside className="order-first lg:order-none">
                <div className="lg:sticky lg:top-6">
                  <BookingPanel
                    property={property}
                    fromPrice={fromPrice}
                    checkIn={checkIn}
                    setCheckIn={setDate(setCheckIn)}
                    checkOut={checkOut}
                    setCheckOut={setDate(setCheckOut)}
                    guests={effectiveGuests}
                    setGuests={setGuests}
                    maxGuests={derived.maxGuests}
                    residency={residency}
                    setResidency={setResidency}
                    showResidency={derived.showResidency}
                    dateHint={dateHint}
                    checkInRef={checkInRef}
                    onSeeRooms={scrollToRooms}
                  />
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
