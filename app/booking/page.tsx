"use client";

import React, { useState } from 'react';
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
    if (!bookingDetails.firstName.trim()) {
      alert('Please enter first name');
      return false;
    }
    if (!bookingDetails.lastName.trim()) {
      alert('Please enter last name');
      return false;
    }
    if (!bookingDetails.email.trim() || !bookingDetails.email.includes('@')) {
      alert('Please enter a valid email');
      return false;
    }
    if (!bookingDetails.phone.trim()) {
      alert('Please enter phone number');
      return false;
    }
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
        activeTab="home"
        onTabChange={() => {}}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <h1 className="text-4xl font-bold mb-10">Booking Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Summary Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Check-in / Check-out Card */}
            <div className="bg-white border-2 border-black-200 rounded-2xl p-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Check-In</p>
                  <p className="text-xl font-semibold mt-1">
                    {checkIn 
                      ? new Date(checkIn).toLocaleDateString('en-US', { 
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        }) 
                      : 'Not selected'}
                  </p>
                </div>

                <div className="w-px bg-yellow-400 self-stretch my-1"></div>

                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Check-Out</p>
                  <p className="text-xl font-semibold mt-1">
                    {checkOut 
                      ? new Date(checkOut).toLocaleDateString('en-US', { 
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        }) 
                      : 'Not selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stay Information Card */}
            <div className="bg-white border-2 border-black-200 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Stay information</h3>
                <p className="text-lg text-gray-700">
                  {nights} Days, 1 Executive Room, {guests || '—'} People
                </p>
              </div>
              <div className="bg-black text-white px-6 py-5 flex justify-between items-center">
                <span className="text-lg font-medium">Price</span>
                <span className="text-2xl font-bold">ZMW{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 md:p-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">First name</label>
                <input
                  type="text"
                  value={bookingDetails.firstName}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, firstName: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
            
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Last name</label>
                <input
                  type="text"
                  value={bookingDetails.lastName}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, lastName: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
         
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingDetails.phone}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
               
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Email</label>
                <input
                  type="email"
                  value={bookingDetails.email}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
                
                />
              </div>
            </div>

            {/* Booking For */}
            <div className="mb-10">
              <label className="block text-sm font-medium text-gray-700 mb-4">Who are you booking for?</label>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="yourself"
                    checked={bookingDetails.bookingFor === 'yourself'}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, bookingFor: e.target.value })}
                    className="w-5 h-5 accent-yellow-400"
                  />
                  <span className="text-lg">Your Self</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="bookingFor"
                    value="someone_else"
                    checked={bookingDetails.bookingFor === 'someone_else'}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, bookingFor: e.target.value })}
                    className="w-5 h-5 accent-yellow-400"
                  />
                  <span className="text-lg">Someone else</span>
                </label>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-12 py-4 rounded-xl transition-all duration-200"
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