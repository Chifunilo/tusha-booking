"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyCard, HeroSection } from '@/components/customer';

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

  const handleSearch = async (location: string, price: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (location) params.append('city', location);
      if (price) params.append('maxPrice', price);
      
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

  const handleTabChange = (tab: 'home' | 'events' | 'popular') => {
    setActiveTab(tab);
  };

const handlePropertyClick = (propertyId: number) => {
    console.log('Property ID clicked:', propertyId); // Check browser console
  console.log('Navigating to:', `/property/${propertyId}`);
  router.push(`/property/${propertyId}`);   // Using query parameter
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Component */}
      <HeroSection 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
      />

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'popular' ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <h2 className="text-3xl font-bold text-gray-400">Coming Soon</h2>
            <p className="text-gray-500 mt-4">Popular properties will be displayed here</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <p className="text-2xl text-gray-500">Loading...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
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