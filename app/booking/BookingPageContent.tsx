"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import { API_URL } from '@/lib/api';

interface Quote {
  nights: number;
  pricePerNight: number;
  basePrice: number;
  isVatRegistered: boolean;
  vat: number;
  tourismLevy: number;
  total: number;
  deposit: number;
  balanceDueAtCheckIn: number;
}

// dateStr is a plain "YYYY-MM-DD" calendar date — force UTC so the viewer's
// own timezone can never shift the displayed day.
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not selected';
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function formatCurrency(amount: number): string {
  return `ZMW ${amount.toLocaleString()}`;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const roomType = searchParams.get('roomType');
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

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId || !roomType || !checkIn || !checkOut) {
      setQuoteLoading(false);
      return;
    }

    const params = new URLSearchParams({ propertyId, roomType, checkIn, checkOut });

    setQuoteLoading(true);
    setQuoteError(null);

    fetch(`${API_URL}/api/bookings/quote?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load price quote');
        setQuote(data.quote);
      })
      .catch((err) => setQuoteError(err.message))
      .finally(() => setQuoteLoading(false));
  }, [propertyId, roomType, checkIn, checkOut]);

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
      roomType: roomType || '',
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
                  <p className="text-xl font-semibold mt-1">{formatDate(checkIn)}</p>
                </div>

                <div className="w-px bg-yellow-400 self-stretch my-1"></div>

                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Check-Out</p>
                  <p className="text-xl font-semibold mt-1">{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>

            {/* Stay Information + Price Breakdown Card */}
            <div className="bg-white border-2 border-black-200 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Stay information</h3>
                <p className="text-lg text-gray-700">
                  {quote ? `${quote.nights} Night${quote.nights === 1 ? '' : 's'}` : '—'}, {roomType || 'Room'}, {guests || '—'} People
                </p>
              </div>

              {quoteLoading && (
                <div className="px-6 pb-6 text-gray-500">Loading price…</div>
              )}

              {quoteError && (
                <div className="px-6 pb-6 text-red-600">{quoteError}</div>
              )}

              {quote && (
                <div className="px-6 pb-6 space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Base price ({quote.nights} night{quote.nights === 1 ? '' : 's'} × {formatCurrency(quote.pricePerNight)})</span>
                    <span>{formatCurrency(quote.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tourism levy (1.5%)</span>
                    <span>{formatCurrency(quote.tourismLevy)}</span>
                  </div>
                  {quote.isVatRegistered && (
                    <div className="flex justify-between">
                      <span>VAT (16%)</span>
                      <span>{formatCurrency(quote.vat)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-black text-white px-6 py-5 flex justify-between items-center">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">{quote ? formatCurrency(quote.total) : '—'}</span>
              </div>

              {quote && (
                <div className="px-6 py-4 bg-yellow-50 space-y-1 text-sm">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Deposit due now</span>
                    <span>{formatCurrency(quote.deposit)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Balance due at check-in</span>
                    <span>{formatCurrency(quote.balanceDueAtCheckIn)}</span>
                  </div>
                </div>
              )}
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