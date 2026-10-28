/* eslint-disable @next/next/no-img-element -- Cloudinary URLs */

import React from 'react';
import { layoutLine, packageLabel, spacePriceLine, spaceTypeLabel } from '@/lib/venues';

export interface Venue {
  space_id: number;
  property_id: number;
  space_name: string;
  space_type: string;
  max_capacity: number;
  theatre_capacity: number | null;
  banquet_capacity: number | null;
  cocktail_capacity: number | null;
  per_delegate_rate: number | null;
  full_day_rate: number | null;
  half_day_rate: number | null;
  hourly_rate: number | null;
  package_includes: string[];
  property_name: string;
  city: string | null;
  area: string | null;
  cover_image: string | null;
}

const VenueCard: React.FC<{ venue: Venue; onClick: () => void }> = ({ venue, onClick }) => {
  const location = [venue.area, venue.city].filter(Boolean).join(', ');
  const layouts = layoutLine(venue);
  const price = spacePriceLine(venue);

  return (
    <div onClick={onClick} className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {venue.cover_image ? (
          <img src={venue.cover_image} alt={venue.space_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No photos yet</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-900">
          Up to {venue.max_capacity} guests
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">{spaceTypeLabel(venue.space_type)}</p>
        <h3 className="mt-1 text-md font-bold text-gray-900">{venue.space_name}</h3>
        <p className="text-sm text-gray-600">{venue.property_name}</p>

        {layouts && <p className="mt-3 text-sm text-gray-700">{layouts}</p>}
        {venue.package_includes.length > 0 && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">Includes {venue.package_includes.slice(0, 4).map(packageLabel).join(', ').toLowerCase()}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-sm font-medium text-gray-600">{location}</p>
          <p className="text-right text-sm font-bold text-gray-900">{price ?? 'Price on request'}</p>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
