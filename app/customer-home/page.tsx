"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

interface Property {
  property_id: number;
  property_name: string;
  city: string;
  country: string;
  images: string[];
  avg_rating: number;
  review_count: number;
  total_rooms: number;
  min_price: number;
}

export default function CustomerHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'popular'>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    location: '',
    price: '',
  });

  useEffect(() => {
    fetchProperties();
  }, [activeTab]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = '/api/properties/customer';
      
      if (activeTab === 'events') {
        url = '/api/properties/customer?type=events';
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.location) params.append('city', searchParams.location);
      if (searchParams.price) params.append('maxPrice', searchParams.price);
      
      let url = `/api/properties/customer?${params.toString()}`;
      if (activeTab === 'events') {
        url += '&type=events';
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId: number) => {
    router.push(`/property/${propertyId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative h-[805vh] bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=800&fit=crop')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Navigation Bar */}
          <nav className="flex justify-end px-12 py-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-6 py-2 text-lg transition-colors rounded-lg ${
                  activeTab === 'home' 
                    ? 'text-white bg-white/20 font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-2 text-lg transition-colors rounded-lg ${
                  activeTab === 'events' 
                    ? 'text-white bg-white/20 font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-6 py-2 text-lg transition-colors rounded-lg ${
                  activeTab === 'popular' 
                    ? 'text-white bg-white/20 font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 text-lg bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Sign In
              </button>
            </div>
          </nav>

          {/* Spacer to push search div down */}
          <div className="flex-1"></div>

          {/* Search Div - Centered near bottom */}
          <div className="flex justify-center pb-16">
            <div className="bg-white rounded-2xl shadow-2xl p-3 flex gap-3 w-[700px]">
              {/* Input 1 - Location */}
              <div className="flex-1 px-4 py-3 border-2 border-yellow-400 rounded-xl">
                <input
                  type="text"
                  placeholder="Location"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full outline-none text-base"
                />
              </div>

              {/* Input 2 - Price */}
              <div className="flex-1 px-4 py-3 border-2 border-yellow-400 rounded-xl">
                <input
                  type="number"
                  placeholder="Price"
                  value={searchParams.price}
                  onChange={(e) => setSearchParams({ ...searchParams, price: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full outline-none text-base"
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid - 4 Columns */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'popular' ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-400">Coming Soon</h2>
            <p className="text-gray-500 mt-4">Popular properties will be displayed here</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">Loading...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-400">No properties found</h2>
            <p className="text-gray-500 mt-4">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.property_id}
                property={property}
                onClick={() => handlePropertyClick(property.property_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Property Card Component
interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
    >
      {/* Property Image */}
      <div className="relative h-56">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
          alt={property.property_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Property Details */}
      <div className="p-5">
        <h3 className="text-xl font-bold mb-1 truncate">{property.property_name}</h3>
        <p className="text-gray-600 text-sm mb-4">{property.city}, {property.country}</p>
        
        {/* Bottom Row - Rating and Price */}
        <div className="flex justify-between items-center">
          {/* Rating Badge */}
          {property.review_count > 0 ? (
            <div className="bg-yellow-400 text-black font-bold text-lg px-3 py-1 rounded-xl flex items-center gap-1">
              {property.avg_rating.toFixed(1)}
            </div>
          ) : (
            <div className="bg-gray-300 text-gray-700 font-semibold text-xs px-3 py-1 rounded-xl">
              New
            </div>
          )}
          
          {/* Price */}
          <p className="text-xl font-bold">ZMW{property.min_price || '0'}</p>
        </div>
      </div>
    </div>
  );
};