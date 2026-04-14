"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
    countryCode: 'ZM +260',
    bookingFor: 'yourself',
  });

  const calculateStay = () => {
    if (!checkIn || !checkOut) return { nights: 0, totalPrice: 0 };
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const pricePerNight = 750;
    const totalPrice = nights * pricePerNight;
    
    return { nights, totalPrice };
  };

  const { nights, totalPrice } = calculateStay();

  const validateForm = () => {
    if (!bookingDetails.firstName.trim()) return alert('Please enter first name');
    if (!bookingDetails.lastName.trim()) return alert('Please enter last name');
    if (!bookingDetails.email.trim() || !bookingDetails.email.includes('@')) return alert('Please enter a valid email');
    if (!bookingDetails.phone.trim()) return alert('Please enter phone number');
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    const params = new URLSearchParams({
      propertyId: propertyId || '',
      roomTypeId: roomTypeId || '',
      guests: guests || '',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      firstName: bookingDetails.firstName,
      lastName: bookingDetails.lastName,
      email: bookingDetails.email,
      phone: bookingDetails.phone,
    });

    router.push(`/payment?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Booking Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column - Booking Summary (Now Darker) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Check-in/Check-out Card - DARKER */}
            <div className="bg-zinc-900 text-white rounded-3xl p-6 md:p-8 border border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Check-In</h3>
                  <p className="text-xl">
                    {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Not selected'}
                  </p>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Check-Out</h3>
                  <p className="text-xl">
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

            {/* Stay Information Card - DARKER */}
            <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden border border-zinc-700">
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-4">Stay information</h3>
                <p className="text-lg text-gray-300">
                  {nights} Days, 1 Executive Room, {guests} People
                </p>
              </div>
              <div className="bg-black text-white p-6 md:p-8 flex justify-between items-center border-t border-zinc-700">
                <span className="text-xl font-bold">Price</span>
                <span className="text-2xl font-bold">ZMW{totalPrice.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Right Column - Guest Details Form (No enclosing border as requested) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-8 md:p-10">
            
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-lg font-semibold mb-2">First name</label>
                <input
                  type="text"
                  value={bookingDetails.firstName}
                  onChange={(e) => setBookingDetails({...bookingDetails, firstName: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2">Last name</label>
                <input
                  type="text"
                  value={bookingDetails.lastName}
                  onChange={(e) => setBookingDetails({...bookingDetails, lastName: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-lg font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={bookingDetails.email}
                  onChange={(e) => setBookingDetails({...bookingDetails, email: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingDetails.phone}
                  onChange={(e) => setBookingDetails({...bookingDetails, phone: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Phone with Country Code */}
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-2">Phone Number</label>
              <div className="flex gap-3">
                <select 
                  value={bookingDetails.countryCode}
                  onChange={(e) => setBookingDetails({...bookingDetails, countryCode: e.target.value})}
                  className="px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none bg-white"
                >
                  <option>ZM +260</option>
                  <option>US +1</option>
                  <option>UK +44</option>
                  <option>ZA +27</option>
                  <option>KE +254</option>
                </select>
                <input
                  type="tel"
                  value={bookingDetails.phone}
                  onChange={(e) => setBookingDetails({...bookingDetails, phone: e.target.value})}
                  className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl text-lg focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Booking For Radio Buttons */}
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-4">Who are you booking for?</label>
              <div className="space-y-4">
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
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-14 py-4 rounded-2xl transition-colors duration-200"
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