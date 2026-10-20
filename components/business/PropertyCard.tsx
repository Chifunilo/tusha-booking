import React from 'react';
import { facilityLabel } from '@/lib/facilities';

interface PropertyCardProps {
  property: {
    property_id: number;
    property_name: string;
    city: string | null;
    country: string;
    amenities: string[];
    images: string[];
    property_type: string;
    approval_status?: string;
    approval_note?: string | null;
  };
  onClick: () => void;
}

const NOTE_BOX_CLASS: Record<string, string> = {
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  changes_requested: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  suspended: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Under review', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Live', className: 'bg-green-100 text-green-800' },
  changes_requested: { label: 'Changes requested', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Not approved', className: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspended', className: 'bg-gray-200 text-gray-700' },
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const badge = property.approval_status ? STATUS_BADGES[property.approval_status] : undefined;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="relative h-60 bg-gray-100">
        {property.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.images[0]} alt={property.property_name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No photos yet</div>
        )}
        {badge && (
          <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">{property.property_name}</h3>
        <p className="text-gray-500 text-sm">{[property.city, property.country].filter(Boolean).join(', ')}</p>
        <p className="text-gray-700 text-sm">{property.amenities.map(facilityLabel).join(', ')}</p>
        <p className="text-gray-500 text-sm capitalize">{property.property_type.replace('_', ' ')}</p>
        {property.approval_note && NOTE_BOX_CLASS[property.approval_status ?? ''] && (
          <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${NOTE_BOX_CLASS[property.approval_status ?? '']}`}>
            <span className="font-semibold">Admin note: </span>
            {property.approval_note}
          </p>
        )}
      </div>

      <div className="flex px-6 pb-6">
        <button
          className="inline-flex items-center rounded-full bg-yellow-400 px-8 py-2 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
        >
          {property.approval_status === 'draft' ? 'Continue setup' : 'Edit'}
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;
