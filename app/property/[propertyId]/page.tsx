"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/customer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Amenity {
  amenity_id: number;
  name: string;
}

interface RoomType {
  room_type_id: number;
  type_name: string;
  max_guests: number;
  amenities_count: number;
  available_count: number;
  price_per_night: number;
}

interface PropertyDetail {
  property_id: number;
  property_name: string;
  city: string;
  country: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: Amenity[];
  room_types: RoomType[];
  avg_rating: number;
  review_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `ZMW ${amount.toLocaleString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Yellow pill badge used for amenities */
function AmenityPill({ name }: { name: string }) {
  return (
    <span className="inline-block border border-yellow-400 text-yellow-600 text-sm font-medium px-4 py-1 rounded-full bg-yellow-50 whitespace-nowrap">
      {name}
    </span>
  );
}

/** Image gallery: one large image on the left, two stacked on the right */
function PropertyGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  const display = images.length > 0 ? images : ["/placeholder.jpg"];

  return (
    <div className="flex gap-2 h-80">
      {/* Main image */}
      <div className="flex-1 rounded-xl overflow-hidden cursor-pointer">
        <img
          src={display[selected]}
          alt="Property main"
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails stack */}
      {display.length > 1 && (
        <div className="flex flex-col gap-2 w-44">
          {display.slice(0, 3).map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelected(idx)}
              className={`flex-1 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                selected === idx ? "border-yellow-400" : "border-transparent"
              }`}
            >
              <img
                src={img}
                alt={`Property ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Show Map placeholder */
function MapPlaceholder({ address }: { address: string }) {
  const [clicked, setClicked] = useState(false);

  const handleShowMap = () => {
    setClicked(true);
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className="bg-gray-100 rounded-2xl h-full flex flex-col items-center justify-center min-h-48 border border-gray-200">
      <div className="text-gray-400 mb-4">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25l-4.72-4.72a9 9 0 1112.44 0L12 20.25l-3-3z" />
          <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <button
        onClick={handleShowMap}
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-xl transition-colors duration-200 text-base"
      >
        Show map
      </button>
    </div>
  );
}

/** Booking filter bar: guests + date range */
function BookingFilter({
  guests,
  setGuests,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
}: {
  guests: number;
  setGuests: (n: number) => void;
  checkIn: Date | null;
  setCheckIn: (d: Date | null) => void;
  checkOut: Date | null;
  setCheckOut: (d: Date | null) => void;
}) {
  const dateLabel =
    checkIn && checkOut
      ? `${formatDate(checkIn)} – ${formatDate(checkOut)}`
      : "Check-in – Check-out";

  return (
    <div className="flex items-center gap-3 mt-6">
      {/* Guest count */}
      <div className="flex items-center border-2 border-gray-800 rounded-xl px-4 py-3 gap-3 min-w-[120px]">
        <button
          onClick={() => setGuests(Math.max(1, guests - 1))}
          className="text-gray-600 hover:text-black font-bold text-lg leading-none"
        >
          −
        </button>
        <span className="text-base font-semibold w-4 text-center">{guests}</span>
        <button
          onClick={() => setGuests(guests + 1)}
          className="text-gray-600 hover:text-black font-bold text-lg leading-none"
        >
          +
        </button>
        <svg className="text-gray-500 ml-1" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20c0-2.21-2.239-4-5-4s-5 1.79-5 4M12 13a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </div>

      {/* Date range picker */}
      <div className="flex items-center border-2 border-gray-800 rounded-xl px-4 py-3 gap-3 flex-1">
        <span className="text-sm font-medium text-gray-700 flex-1">{dateLabel}</span>
        <label className="cursor-pointer relative">
          <svg className="text-gray-600" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <input
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value) : null;
              setCheckIn(d);
              if (checkOut && d && d >= checkOut) setCheckOut(null);
            }}
          />
        </label>
      </div>

      {/* Check-out */}
      {checkIn && (
        <div className="flex items-center border-2 border-yellow-400 rounded-xl px-4 py-3 gap-3">
          <span className="text-sm text-gray-500">Check-out</span>
          <input
            type="date"
            className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            min={checkIn.toISOString().split("T")[0]}
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value) : null;
              setCheckOut(d);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Rooms table */
function RoomsTable({
  rooms,
  guests,
  onBook,
}: {
  rooms: RoomType[];
  guests: number;
  onBook: (room: RoomType) => void;
}) {
  const filtered = rooms.filter((r) => r.max_guests >= guests);

  return (
    <div className="mt-10 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="text-left px-6 py-4 font-semibold">Room Type</th>
            <th className="text-center px-6 py-4 font-semibold">Max Guests</th>
            <th className="text-center px-6 py-4 font-semibold">Amenities</th>
            <th className="text-center px-6 py-4 font-semibold">Available</th>
            <th className="text-center px-6 py-4 font-semibold">Price</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400">
                No rooms available for {guests} guest{guests > 1 ? "s" : ""}
              </td>
            </tr>
          ) : (
            filtered.map((room, idx) => (
              <tr
                key={room.room_type_id}
                className={`border-t border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-yellow-50 transition-colors duration-150`}
              >
                <td className="px-6 py-4 font-medium text-gray-800">{room.type_name}</td>
                <td className="px-6 py-4 text-center text-gray-600">{room.max_guests}</td>
                <td className="px-6 py-4 text-center text-gray-600">{room.amenities_count}</td>
                <td className="px-6 py-4 text-center text-gray-600">{room.available_count}</td>
                <td className="px-6 py-4 text-center font-semibold text-gray-800">
                  {formatCurrency(room.price_per_night)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onBook(room)}
                    disabled={room.available_count === 0}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-colors duration-200 ${
                      room.available_count === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer"
                    }`}
                  >
                    {room.available_count === 0 ? "Full" : "Book"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropertyDetail({ params }: { params: Promise<{ propertyId: string }> }) {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);

  // Booking filter state
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<"home" | "events" | "popular">("home");

  // Unwrap params (Next.js 15+)
  useEffect(() => {
    params.then((resolvedParams) => {
      const id = parseInt(resolvedParams.propertyId);
      console.log('Property ID from URL:', id);
      setPropertyId(id);
    });
  }, [params]);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    if (!propertyId) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching property:', propertyId);
      const res = await fetch(`/api/properties/customer/${propertyId}`);
      const data = await res.json();
      console.log('API Response:', data);
      
      if (res.ok) {
        setProperty(data.property);
      } else {
        setError(data.message || "Property not found");
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError("Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (room: RoomType) => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before booking.");
      return;
    }
    router.push(
      `/booking?propertyId=${propertyId}&roomTypeId=${room.room_type_id}&guests=${guests}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`
    );
  };

  const handleSearch = async (location: string, price: string) => {
    const params = new URLSearchParams();
    if (location) params.append("city", location);
    if (price) params.append("maxPrice", price);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <p className="text-2xl text-gray-500">Loading property...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <h2 className="text-3xl font-bold text-gray-400">{error}</h2>
            <button
              onClick={() => router.back()}
              className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-xl"
            >
              Go back
            </button>
          </div>
        )}

        {!loading && property && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {property.property_name}
            </h1>

            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-5">
                <PropertyGallery images={property.images} />
              </div>

              <div className="col-span-3">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.length > 0 ? (
                    property.amenities.map((a) => (
                      <AmenityPill key={a.amenity_id} name={a.name} />
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No amenities listed</p>
                  )}
                </div>
              </div>

              <div className="col-span-4 h-full">
                <MapPlaceholder
                  address={`${property.address}, ${property.city}, ${property.country}`}
                />
              </div>
            </div>

            <BookingFilter
              guests={guests}
              setGuests={setGuests}
              checkIn={checkIn}
              setCheckIn={setCheckIn}
              checkOut={checkOut}
              setCheckOut={setCheckOut}
            />

            <RoomsTable
              rooms={property.room_types}
              guests={guests}
              onBook={handleBook}
            />
          </>
        )}
      </div>
    </div>
  );
}