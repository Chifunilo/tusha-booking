"use client";

/* eslint-disable @next/next/no-img-element -- Cloudinary URLs, not configured for next/image */

import { useState } from "react";
import { MEAL_PLANS, formatCurrency, Residency } from "@/lib/roomTypes";

export interface RoomType {
  room_type_id: number;
  name: string;
  description: string | null;
  max_occupancy: number;
  num_beds: number;
  bed_type: string | null;
  size_sqm: number | null;
  amenities: string[];
  images: string[];
  meal_plan: string;
  price: number;
  non_resident_price: number | null;
  unit_count: number;
}

export function priceFor(room: RoomType, residency: Residency): number {
  return residency === "non_resident" && room.non_resident_price !== null ? room.non_resident_price : room.price;
}

/**
 * `available` is the number of free units for the chosen dates — undefined
 * while there are no dates (or they're still loading), so nothing is claimed.
 */
export default function RoomTypeCard({
  room,
  residency,
  guests,
  nights,
  available,
  onSelect,
}: {
  room: RoomType;
  residency: Residency;
  guests: number;
  nights: number | null;
  available: number | undefined;
  onSelect: (room: RoomType) => void;
}) {
  const [photo, setPhoto] = useState(0);
  const price = priceFor(room, residency);
  const meal = MEAL_PLANS.find((m) => m.value === room.meal_plan) ?? MEAL_PLANS[0];
  const tooSmall = guests > room.max_occupancy;
  const soldOut = available === 0;
  const disabled = tooSmall || soldOut;

  const facts = [
    `Sleeps ${room.max_occupancy}`,
    `${room.num_beds} ${room.bed_type ? `${room.bed_type} ` : ""}bed${room.num_beds === 1 ? "" : "s"}`,
    room.size_sqm ? `${room.size_sqm} m²` : null,
  ].filter(Boolean);

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm md:flex-row ${disabled ? "border-gray-200" : "border-gray-200 hover:border-yellow-400"}`}>
      <div className="relative h-48 shrink-0 bg-gray-100 md:h-auto md:w-64">
        {room.images.length > 0 ? (
          <>
            <img src={room.images[photo]} alt={room.name} className="h-full w-full object-cover" />
            {room.images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {room.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setPhoto(i)}
                    aria-label={`${room.name} photo ${i + 1}`}
                    className={`h-2 w-2 rounded-full ${i === photo ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center text-sm text-gray-400">No room photos</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
          <p className="mt-0.5 text-sm text-gray-600">{facts.join(" · ")}</p>
        </div>

        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${room.meal_plan === "room_only" ? "bg-gray-100 text-gray-700" : "bg-green-50 text-green-800"}`}>
          {meal.label} — {meal.detail.toLowerCase()}
        </span>

        {room.description && <p className="text-sm text-gray-700">{room.description}</p>}

        {room.amenities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {room.amenities.map((a) => (
              <li key={a} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">{a}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-3">
          <div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(price)} <span className="text-sm font-normal text-gray-500">/ night</span>
            </p>
            <p className="text-xs text-gray-500">
              {nights ? `${formatCurrency(price * nights)} for ${nights} night${nights === 1 ? "" : "s"} · ` : ""}
              per room, levies added at checkout
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {tooSmall ? (
              <span className="text-xs font-medium text-gray-500">Sleeps up to {room.max_occupancy}</span>
            ) : soldOut ? (
              <span className="text-xs font-medium text-red-600">Sold out for these dates</span>
            ) : available !== undefined && available <= 3 && available < room.unit_count ? (
              <span className="text-xs font-medium text-orange-600">Only {available} left</span>
            ) : null}
            <button
              onClick={() => onSelect(room)}
              disabled={disabled}
              className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {soldOut ? "Sold out" : "Select"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
