"use client";

/* eslint-disable @next/next/no-img-element -- Cloudinary URLs */

import { useState } from "react";
import { EventSpace, layoutLine, packageLabel, spacePriceLine, spaceTypeLabel } from "@/lib/venues";

export default function EventSpaceCard({ space, onEnquire }: { space: EventSpace; onEnquire: (space: EventSpace) => void }) {
  const [photo, setPhoto] = useState(0);
  const layouts = layoutLine(space);
  const price = spacePriceLine(space);

  return (
    <article id={`space-${space.space_id}`} className="flex scroll-mt-6 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:flex-row">
      <div className="relative h-48 shrink-0 bg-gray-100 md:h-auto md:w-64">
        {space.images.length > 0 ? (
          <>
            <img src={space.images[photo]} alt={space.space_name} className="h-full w-full object-cover" />
            {space.images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {space.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhoto(i)}
                    aria-label={`${space.space_name} photo ${i + 1}`}
                    className={`h-2 w-2 rounded-full ${i === photo ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center text-sm text-gray-400">No photos of this space yet</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">{spaceTypeLabel(space.space_type)}</p>
          <h3 className="text-lg font-semibold text-gray-900">{space.space_name}</h3>
          <p className="mt-0.5 text-sm text-gray-600">
            Up to {space.max_capacity} guests
            {layouts ? ` · ${layouts}` : ""}
            {space.size_sqm ? ` · ${space.size_sqm} m²` : ""}
          </p>
        </div>

        {space.description && <p className="text-sm text-gray-700">{space.description}</p>}

        {space.package_includes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {space.package_includes.map((key) => (
              <li key={key} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">{packageLabel(key)}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{price ?? "Price on request"}</p>
            <p className="text-xs text-gray-500">
              {space.min_delegates ? `Minimum ${space.min_delegates} guests · ` : ""}
              The venue confirms the final price with you
            </p>
          </div>
          <button onClick={() => onEnquire(space)} className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black hover:bg-yellow-500">
            Enquire
          </button>
        </div>
      </div>
    </article>
  );
}
