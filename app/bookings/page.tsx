"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@/lib/api';
import { mealPlanLabel } from '@/lib/roomTypes';

interface Booking {
  booking_id: number;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number | null;
  total_price: string;
  status: string;
  payment_status: string | null;
  created_at: string;
  property_id: number;
  property_name: string;
  room_number: string | null;
  room_type_name: string | null;
  meal_plan: string | null;
}

// dateStr comes back as an ISO instant (midnight UTC) for what is really a
// plain calendar date — format with timeZone: 'UTC' so it can't shift a day.
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function formatCurrency(amount: string): string {
  return `K${Number(amount).toLocaleString()}`;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for AuthContext's own localStorage check to finish — isAuthenticated
    // starts false on every mount, even for an already-logged-in user.
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/bookings/mine`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to load bookings');
        setBookings(data.bookings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab="home" onTabChange={() => {}} />

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <h1 className="text-4xl font-bold mb-10">My Bookings</h1>

        {loading && <p className="text-gray-500">Loading your bookings…</p>}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <p className="text-lg text-gray-600 mb-6">You don&apos;t have any bookings yet.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-xl"
            >
              Browse properties
            </button>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.booking_id} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{booking.property_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.room_type_name ? `${booking.room_type_name} · ` : ''}
                    {booking.meal_plan ? `${mealPlanLabel(booking.meal_plan)} · ` : ''}
                    {booking.num_guests ?? '—'} guest{booking.num_guests === 1 ? '' : 's'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(booking.check_in_date)} – {formatDate(booking.check_out_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Ref: {booking.booking_reference}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(booking.total_price)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
