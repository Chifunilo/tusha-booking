import React from 'react';
import { formatCurrency } from '@/lib/roomTypes';

interface EventCardProps {
  event: {
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
  };
  onClick: () => void;
}

function formatEventDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const location = event.city ? `${event.property_name}, ${event.city}` : event.property_name;
  const soldOut = event.tickets_available <= 0;

  return (
    <div onClick={onClick} className="group cursor-pointer h-full flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.event_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop'}
          alt={event.event_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold text-gray-900">{event.event_name}</h3>
        <p className="mt-2 text-sm text-gray-700">
          {formatEventDate(event.event_date)} &middot; {event.start_time}
        </p>
        <p className="mt-1 text-sm text-gray-500 truncate">{location}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-sm font-semibold text-gray-600 whitespace-nowrap">
            {soldOut ? 'Sold out' : `${event.tickets_available} left`}
          </p>
          <p className="text-2xl font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(event.ticket_price)}</p>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
