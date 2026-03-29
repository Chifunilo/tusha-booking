"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';

// Sample booking page - you'll expand this with your full form
export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get booking details from URL params
  const propertyId = searchParams.get('propertyId');
  const roomTypeId = searchParams.get('roomTypeId');
  const guests = searchParams.get('guests');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'popular'>('home');
  const [bookingDetails, setBookingDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bookingFor: 'yourself', // 'yourself' or 'someone_else'
  });

  // Calculate number of nights and total price
  const calculateStay = () => {
    if (!checkIn || !checkOut) return { nights: 0, totalPrice: 0 };
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // You'll get the actual price from your API
    const pricePerNight = 750; // Placeholder
    const totalPrice = nights * pricePerNight;
    
    return { nights, totalPrice };
  };

  const { nights, totalPrice } = calculateStay();

  const handleContinue = () => {
    // Validate form and proceed to payment
    console.log('Booking details:', bookingDetails);
    // Navigate to payment page or submit booking
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Booking Header Component */}
      <BookingHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userProfileImage="/path-to-user-image.jpg" // Optional: pass user's profile image
      />

      {/* Booking Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Booking Details</h1>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Booking Summary */}
          <div className="col-span-5 space-y-6">
            
            {/* Check-in/Check-out Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Check-In</h3>
                  <p className="text-lg">
                    {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Not selected'}
                  </p>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h3 className="text-xl font-bold mb-2">Check-Out</h3>
                  <p className="text-lg">
                    {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Not selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stay Information Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Stay information</h3>
                <p className="text-lg text-gray-700">
                  {nights} Days, 1 Executive Room, {guests} People
                </p>
              </div>
              <div className="bg-black text-white p-6 flex justify-between items-center">
                <span className="text-xl font-bold">Price</span>
                <span className="text-2xl font-bold">ZMW{totalPrice.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Right Column - Guest Details Form */}
          <div className="col-span-7 bg-white rounded-2xl border-2 border-gray-200 p-8">
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-lg font-semibold mb-2">First name</label>
                <input
                  type="text"
                  value={bookingDetails.firstName}
                  onChange={(e) => setBookingDetails({...bookingDetails, firstName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2">Last name</label>
                <input
                  type="text"
                  value={bookingDetails.lastName}
                  onChange={(e) => setBookingDetails({...bookingDetails, lastName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-lg font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingDetails.phone}
                  onChange={(e) => setBookingDetails({...bookingDetails, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={bookingDetails.email}
                  onChange={(e) => setBookingDetails({...bookingDetails, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter email"
                />
              </div>
            </div>

            {/* Phone with Country Code */}
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-2">Phone Number</label>
              <div className="flex gap-3">
                <select className="px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none">
                  <option>ZM +260</option>
                  <option>US +1</option>
                  <option>UK +44</option>
                  {/* Add more country codes */}
                </select>
                <input
                  type="tel"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Booking For Radio Buttons */}
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-4">Who are you booking for?</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="yourself"
                    checked={bookingDetails.bookingFor === 'yourself'}
                    onChange={(e) => setBookingDetails({...bookingDetails, bookingFor: e.target.value})}
                    className="w-5 h-5 text-yellow-400 border-gray-300 focus:ring-yellow-400"
                  />
                  <span className="text-lg">Your Self</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="someone_else"
                    checked={bookingDetails.bookingFor === 'someone_else'}
                    onChange={(e) => setBookingDetails({...bookingDetails, bookingFor: e.target.value})}
                    className="w-5 h-5 text-yellow-400 border-gray-300 focus:ring-yellow-400"
                  />
                  <span className="text-lg">Someone else</span>
                </label>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-12 py-4 rounded-xl transition-colors duration-200"
              >
                Continue
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}