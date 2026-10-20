"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import PropertyGallery from '@/components/property/PropertyGallery';
import { API_URL } from '@/lib/api';
import { formatCurrency } from '@/lib/roomTypes';

interface EventDetail {
  event_id: number;
  event_name: string;
  event_type: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  tickets_available: number;
  ticket_price: number;
  organizer_name: string | null;
  organizer_contact: string | null;
  event_image: string | null;
  property_name: string;
  city: string | null;
  country: string;
}

function formatEventDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

const MAX_PER_ORDER = 10;

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/api/events/customer/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEvent(data?.event ?? null))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BookingHeader activeTab="events" onTabChange={() => {}} />
        <p className="p-12 text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BookingHeader activeTab="events" onTabChange={() => {}} />
        <p className="p-12 text-center text-gray-500">This event could not be found.</p>
      </div>
    );
  }

  const location = event.city ? `${event.property_name}, ${event.city}` : event.property_name;
  const maxQuantity = Math.max(0, Math.min(MAX_PER_ORDER, event.tickets_available));
  const soldOut = event.tickets_available <= 0;

  const handleBuy = () => {
    router.push(`/tickets/checkout?eventId=${event.event_id}&quantity=${quantity}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab="events" onTabChange={() => {}} />

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
        <PropertyGallery images={event.event_image ? [event.event_image] : []} name={event.event_name} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.event_name}</h1>
              <p className="mt-1 text-gray-500">{location}</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <p className="text-lg font-semibold">{formatEventDate(event.event_date)}</p>
              <p className="text-gray-600">{event.start_time} – {event.end_time}</p>
            </div>

            {event.description && (
              <div>
                <h2 className="text-xl font-bold mb-2">About this event</h2>
                <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {(event.organizer_name || event.organizer_contact) && (
              <div>
                <h2 className="text-xl font-bold mb-2">Organizer</h2>
                <p className="text-gray-700">{event.organizer_name}</p>
                {event.organizer_contact && <p className="text-gray-500 text-sm">{event.organizer_contact}</p>}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white rounded-2xl border-2 border-gray-200 p-6">
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(event.ticket_price)}<span className="text-base font-normal text-gray-500"> / ticket</span></p>
              <p className="mt-1 text-sm text-gray-500">
                {soldOut ? 'Sold out' : `${event.tickets_available} ticket${event.tickets_available === 1 ? '' : 's'} left`}
              </p>

              {!soldOut && (
                <>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-medium">Tickets</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-full border-2 border-gray-300 text-lg font-bold hover:border-yellow-400"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                        className="w-9 h-9 rounded-full border-2 border-gray-300 text-lg font-bold hover:border-yellow-400"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(event.ticket_price * quantity)}</span>
                  </div>

                  <button
                    onClick={handleBuy}
                    className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-4 rounded-xl transition-colors duration-200"
                  >
                    Buy tickets
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
