"use client";

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavTab, navTabHref } from '@/lib/nav';
import type { Venue } from '@/components/customer/VenueCard';
import { API_URL } from '@/lib/api';

// Lazy load heavy components
const HeroSection = lazy(() => import('@/components/customer/HeroSection'));
const PropertyCard = lazy(() => import('@/components/customer/PropertyCard'));
const VenueCard = lazy(() => import('@/components/customer/VenueCard'));
const Footer = lazy(() => import('@/components/customer/Footer'));

interface Property {
  property_id: number;
  property_name: string;
  description: string | null;
  area: string | null;
  city: string;
  country: string;
  images: string[];
  avg_rating: number;
  review_count: number;
  total_rooms: number;
  min_price: number;
}

function CustomerHomepageContent() {
  const router = useRouter();
  // The tab lives in the URL (/?tab=venues) so the nav, footer and other pages can link to it.
  const tabParam = useSearchParams().get('tab');
  const activeTab: NavTab = tabParam === 'venues' || tabParam === 'popular' ? tabParam : 'home';
  const [properties, setProperties] = useState<Property[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth state — checked via JWT cookie through /api/me
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth on mount
  useEffect(() => {
    fetch(`${API_URL}/api/me`, {
      credentials: 'include',
    })
      .then(r => r.ok ? setIsLoggedIn(true) : setIsLoggedIn(false))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'venues') {
      fetchVenues();
    } else {
      fetchProperties();
    }
  }, [activeTab]);

  const fetchProperties = async (city?: string, maxPrice?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`${API_URL}/api/properties/customer?${params.toString()}`);
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

  const fetchVenues = async (city?: string, guests?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (guests && Number(guests) >= 1) params.append('guests', String(Math.floor(Number(guests))));

      const response = await fetch(`${API_URL}/api/spaces?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setVenues(data.venues || []);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  // The hero's second field is max price for stays and guest count for venues.
  const handleSearch = async (location: string, price: string) => {
    if (activeTab === 'venues') {
      fetchVenues(location, price);
    } else {
      fetchProperties(location, price);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    router.replace(navTabHref(tab), { scroll: false });
  };

  const handlePropertyClick = (propertyId: number) => {
    // Anyone can view a property page — auth is checked when they hit Book
    router.push(`/property/${propertyId}`);
  };

  const handleVenueClick = (venue: Venue) => {
    router.push(`/property/${venue.property_id}#space-${venue.space_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lazy loaded Hero Section with fallback */}
      <Suspense fallback={
        <div className="min-h-[60vh] bg-gray-900 flex items-center justify-center">
          <div className="text-white text-2xl">Loading hero section...</div>
        </div>
      }>
        <HeroSection
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearch={handleSearch}
        />
      </Suspense>

      {/* Properties Section */}
      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* Login prompt banner — shown only when not logged in */}
        {!isLoggedIn && (
          <div className="mb-6 flex items-center justify-between bg-yellow-50 border border-yellow-300 rounded-xl px-6 py-4">
            <p className="text-sm text-yellow-800 font-medium">
              Sign in to book properties and manage your reservations.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="ml-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-5 py-2 rounded-xl text-sm transition-colors duration-200 whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        )}

        {activeTab === 'popular' ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <h2 className="text-3xl font-bold text-gray-400">Coming Soon</h2>
            <p className="text-gray-500 mt-4">Popular properties will be displayed here</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <p className="text-2xl text-gray-500">Loading {activeTab === 'venues' ? 'venues' : 'properties'}...</p>
          </div>
        ) : activeTab === 'venues' ? (
          venues.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
              <h2 className="text-3xl font-bold text-gray-400">No venues found</h2>
              <p className="text-gray-500 mt-4">Try another town, or fewer guests</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">Loading venues...</p>
              </div>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {venues.map((venue) => (
                  <VenueCard key={venue.space_id} venue={venue} onClick={() => handleVenueClick(venue)} />
                ))}
              </div>
            </Suspense>
          )
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <h2 className="text-3xl font-bold text-gray-400">No properties found</h2>
            <p className="text-gray-500 mt-4">Try adjusting your search filters</p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">Loading properties...</p>
            </div>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.property_id}
                  property={property}
                  onClick={() => handlePropertyClick(property.property_id)}
                />
              ))}
            </div>
          </Suspense>
        )}
      </div>

      <Suspense fallback={<div className="h-64 bg-black" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for Next to prerender the page.
export default function CustomerHomepage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CustomerHomepageContent />
    </Suspense>
  );
}
