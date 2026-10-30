import React from 'react';
import StarRating from './StarRating';

interface PropertyCardProps {
  property: {
    property_id: number;
    property_name: string;
    description: string | null;
    area: string | null;
    city: string;
    country: string;
    images: string[];
    avg_rating: number;
    review_count: number;
    min_price: number;
  };
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const location = [property.area, property.city].filter(Boolean).join(', ') || property.country;

  return (
    <div onClick={onClick} className="group cursor-pointer h-full flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
          alt={property.property_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {property.review_count === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-900">
            New
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-md font-bold text-gray-900">{property.property_name}</h3>

        <p className="mt-2 min-h-[4.0rem] text-sm text-gray-700 leading-relaxed line-clamp-3">
          {property.description}
        </p>

        <div className="mt-5">
          <StarRating rating={property.avg_rating} size={16} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-sm font-medium text-gray-600 whitespace-nowrap">{location}</p>
          <p className="text-xl font-bold text-gray-900 whitespace-nowrap">K{property.min_price || '0'}</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard