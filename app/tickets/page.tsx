"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@/lib/api';
import { formatCurrency } from '@/lib/roomTypes';

interface Ticket {
  ticket_id: number;
  quantity: number;
  total_price: number;
  ticket_code: string | null;
  status: string | null;
  created_at: string;
  event_name: string;
  event_date: string;
  start_time: string;
  property_id: number;
  property_name: string;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
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

    fetch(`${API_URL}/api/event-tickets/mine`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to load tickets');
        setTickets(data.tickets);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab="events" onTabChange={() => {}} />

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <h1 className="text-4xl font-bold mb-10">My Tickets</h1>

        {loading && <p className="text-gray-500">Loading your tickets…</p>}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
            <p className="text-lg text-gray-600 mb-6">You don&apos;t have any tickets yet.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-xl"
            >
              Browse events
            </button>
          </div>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.ticket_id} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{ticket.event_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {ticket.property_name} &middot; {ticket.quantity} ticket{ticket.quantity === 1 ? '' : 's'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(ticket.event_date)} &middot; {ticket.start_time}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Code: {ticket.ticket_code}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(ticket.total_price)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    ticket.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : ticket.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ticket.status}
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
