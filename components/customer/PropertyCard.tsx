import React from 'react';

interface PropertyCardProps {
  property: {
    property_id: number;
    property_name: string;
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
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-1"
    >
      {/* Property Image - Half the card height */}
      <div className="relative h-48">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
          alt={property.property_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Property Details - Other half */}
      <div className="p-6 h-48 flex flex-col justify-between">
        {/* Top Section - Name and Location */}
        <div>
          <h3 className="text-xl font-bold mb-1">{property.property_name}</h3>
          <p className="text-gray-600 text-sm">{property.city}, {property.country}</p>
        </div>
        
        {/* Bottom Section - Rating and Price */}
        <div className="flex justify-between items-end">
          {/* Rating Badge - Yellow Square */}
          {property.review_count > 0 ? (
            <div className="bg-yellow-400 text-black font-bold text-2xl px-4 py-3 rounded-xl w-16 h-16 flex items-center justify-center">
              {property.avg_rating.toFixed(1)}
            </div>
          ) : (
            <div className="bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-3 rounded-xl">
              New
            </div>
          )}
          
          {/* Price */}
          <p className="text-2xl font-semibold">ZMW{property.min_price || '0'}</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;