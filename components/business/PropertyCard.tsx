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
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-1"
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
      <div className="p-6 h-48 flex flex-col justify-between">
        {/* Top Section - Name and Location */}
        <div>
          <h3 className="text-xl font-bold mb-1">{property.property_name}</h3>
          <p className="text-gray-600 text-sm">{property.city}, {property.country}</p>
          <p className="text-gray-700 font-semibold text-sm px-2 py-1">
            {property.amenities.join(', ')}
          </p>
          <p className="text-gray-700 font-semibold text-sm px-2 py-1 ">
               {property.property_type}
            </p>
      

        </div>
      
       
      </div >
      <div className='flex p-6'><button 
            // onClick={() => router.push(`/edit-property/${propertyId}`)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2 rounded-full transition-colors"
          >
            Edit
          </button></div>
       
    </div>
  );
};

export default PropertyCard;