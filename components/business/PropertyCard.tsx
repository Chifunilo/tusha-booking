import React from 'react';

interface PropertyCardProps {
  property: {
    property_id: number;
    property_name: string;
    city: string;
    country: string;
    amenities: string[];
    images: string[];
property_type: string;
  };
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Property Image - Half the card height */}
      <div className="relative h-60">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
          alt={property.property_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Property Details - Other half */}
      <div className="p-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">{property.property_name}</h3>
        <p className="text-gray-500 text-sm">{property.city}, {property.country}</p>
        <p className="text-gray-700 text-sm">{property.amenities.join(', ')}</p>
        <p className="text-gray-500 text-sm capitalize">{property.property_type}</p>
      </div>

      <div className="flex px-6 pb-6">
        <button
          className="inline-flex items-center rounded-full bg-yellow-400 px-8 py-2 text-sm font-semibold text-black shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 ease-out hover:bg-yellow-500 active:scale-[0.97]"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;