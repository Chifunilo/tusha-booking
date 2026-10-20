"use client";

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

// Lazy load heavy components
const HeroSection = lazy(() => import('@/components/customer/HeroSection'));
const PropertyCard = lazy(() => import('@/components/customer/PropertyCard'));
const EventCard = lazy(() => import('@/components/customer/EventCard'));
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

interface EventListing {
  event_id: number;
  event_name: string;
  event_date: string;
  start_time: string;
  ticket_price: number;
  tickets_available: number;
  event_image: string | null;
  property_name: string;
  city: string | null;
  country: string;
}

export default function CustomerHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'popular'>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [events, setEvents] = useState<EventListing[]>([]);
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
    if (activeTab === 'events') {
      fetchEvents();
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

  const fetchEvents = async (city?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);

      const response = await fetch(`${API_URL}/api/events/customer?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (location: string, price: string) => {
    if (activeTab === 'events') {
      fetchEvents(location);
    } else {
      fetchProperties(location, price);
    }
  };

  const handleTabChange = (tab: 'home' | 'events' | 'popular') => {
    setActiveTab(tab);
  };

  const handlePropertyClick = (propertyId: number) => {
    // Anyone can view a property page — auth is checked when they hit Book
    router.push(`/property/${propertyId}`);
  };

  const handleEventClick = (eventId: number) => {
    router.push(`/event/${eventId}`);
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
            <p className="text-2xl text-gray-500">Loading {activeTab === 'events' ? 'events' : 'properties'}...</p>
          </div>
        ) : activeTab === 'events' ? (
          events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
              <h2 className="text-3xl font-bold text-gray-400">No events found</h2>
              <p className="text-gray-500 mt-4">Try adjusting your search filters</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">Loading events...</p>
              </div>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.event_id}
                    event={event}
                    onClick={() => handleEventClick(event.event_id)}
                  />
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