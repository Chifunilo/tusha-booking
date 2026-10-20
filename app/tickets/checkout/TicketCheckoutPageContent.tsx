"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import { API_URL } from '@/lib/api';
import { formatCurrency } from '@/lib/roomTypes';

interface TicketQuote {
  eventId: number;
  eventName: string;
  eventDate: string;
  startTime: string;
  ticketPrice: number;
  quantity: number;
  total: number;
  ticketsAvailable: number;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export default function TicketCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const quantity = searchParams.get('quantity') ?? '1';

  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [quote, setQuote] = useState<TicketQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setQuoteLoading(false);
      return;
    }

    const params = new URLSearchParams({ eventId, quantity });

    setQuoteLoading(true);
    setQuoteError(null);

    fetch(`${API_URL}/api/event-tickets/quote?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load ticket quote');
        setQuote(data.quote);
      })
      .catch((err) => setQuoteError(err.message))
      .finally(() => setQuoteLoading(false));
  }, [eventId, quantity]);

  const validateForm = () => {
    if (!guestDetails.firstName.trim()) {
      alert('Please enter first name');
      return false;
    }
    if (!guestDetails.lastName.trim()) {
      alert('Please enter last name');
      return false;
    }
    if (!guestDetails.email.trim() || !guestDetails.email.includes('@')) {
      alert('Please enter a valid email');
      return false;
    }
    if (!guestDetails.phone.trim()) {
      alert('Please enter phone number');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    const params = new URLSearchParams({
      eventId: eventId || '',
      quantity,
      firstName: guestDetails.firstName,
      lastName: guestDetails.lastName,
      email: guestDetails.email,
      phone: guestDetails.phone,
    });

    router.push(`/tickets/payment?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab="events" onTabChange={() => {}} />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <h1 className="text-4xl font-bold mb-10">Ticket Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border-2 border-black-200 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Event</h3>
                {quoteLoading && <p className="text-gray-500">Loading...</p>}
                {quoteError && <p className="text-red-600">{quoteError}</p>}
                {quote && (
                  <>
                    <p className="text-lg text-gray-700">{quote.eventName}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(quote.eventDate)} &middot; {quote.startTime}</p>
                  </>
                )}
              </div>

              {quote && (
                <>
                  <div className="px-6 pb-6 space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>{quote.quantity} ticket{quote.quantity === 1 ? '' : 's'} &times; {formatCurrency(quote.ticketPrice)}</span>
                      <span>{formatCurrency(quote.total)}</span>
                    </div>
                  </div>

                  <div className="bg-black text-white px-6 py-5 flex justify-between items-center">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-2xl font-bold">{formatCurrency(quote.total)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">First name</label>
                <input
                  type="text"
                  value={guestDetails.firstName}
                  onChange={(e) => setGuestDetails({ ...guestDetails, firstName: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Last name</label>
                <input
                  type="text"
                  value={guestDetails.lastName}
                  onChange={(e) => setGuestDetails({ ...guestDetails, lastName: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={guestDetails.phone}
                  onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black-700 mb-2">Email</label>
                <input
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                  className="w-full px-5 py-2 border-2 border-black-300 rounded-lg text-lg focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

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
