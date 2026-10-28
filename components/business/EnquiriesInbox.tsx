"use client";

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { formatCurrency } from '@/lib/roomTypes';
import { whatsappLink } from '@/lib/facilities';
import { ENQUIRY_STATUS_BADGES, eventTypeLabel } from '@/lib/venues';

interface Enquiry {
  enquiry_id: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  event_type: string;
  event_date: string;
  end_date: string | null;
  guests: number;
  message: string | null;
  status: string;
  notes: string | null;
  quoted_amount: number | null;
  created_at: string;
  space_name: string;
  property_name: string;
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'viewed', label: 'Seen' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'expired', label: 'Expired' },
];

// event_date is a calendar date; format in UTC so the day never shifts.
const formatDay = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function EnquiryCard({ enquiry, onUpdated }: { enquiry: Enquiry; onUpdated: (e: Enquiry) => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(enquiry.notes ?? '');
  const [amount, setAmount] = useState(enquiry.quoted_amount === null ? '' : String(enquiry.quoted_amount));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badge = ENQUIRY_STATUS_BADGES[enquiry.status] ?? ENQUIRY_STATUS_BADGES.new;
  const closed = enquiry.status === 'won' || enquiry.status === 'lost' || enquiry.status === 'expired';

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/enquiries/business/${enquiry.enquiry_id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not update this enquiry');
        return;
      }
      onUpdated(data.enquiry);
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setOpen((o) => !o);
    if (!open && enquiry.status === 'new') patch({ status: 'viewed' });
  };

  const dates = enquiry.end_date && enquiry.end_date !== enquiry.event_date
    ? `${formatDay(enquiry.event_date)} – ${formatDay(enquiry.end_date)}`
    : formatDay(enquiry.event_date);
  const greeting = `Hi ${enquiry.contact_name.split(' ')[0]}, thank you for your enquiry about ${enquiry.space_name} at ${enquiry.property_name} for ${dates}.`;

  return (
    <li className={`rounded-3xl bg-white shadow-lg ring-1 ring-black/5 ${enquiry.status === 'new' ? 'ring-2 ring-yellow-400' : ''}`}>
      <button onClick={toggle} className="flex w-full items-start justify-between gap-4 p-6 text-left">
        <div>
          <p className="text-lg font-semibold">
            {eventTypeLabel(enquiry.event_type)} · {enquiry.guests} guests
          </p>
          <p className="text-gray-600">{dates}</p>
          <p className="text-sm text-gray-500">
            {enquiry.contact_name} · {enquiry.space_name}, {enquiry.property_name}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          <span className="text-xs text-gray-400">received {new Date(enquiry.created_at).toLocaleDateString('en-GB')}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-gray-100 p-6">
          {enquiry.message && <p className="whitespace-pre-line rounded-2xl bg-gray-50 p-4 text-gray-800">{enquiry.message}</p>}

          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappLink(enquiry.contact_phone, greeting)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Reply on WhatsApp
            </a>
            <a href={`tel:${enquiry.contact_phone}`} className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold hover:bg-gray-50">
              Call {enquiry.contact_phone}
            </a>
            <a
              href={`mailto:${enquiry.contact_email}?subject=${encodeURIComponent(`Your enquiry: ${enquiry.space_name}`)}&body=${encodeURIComponent(greeting)}`}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Email
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Your notes (only you see these)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Sent quote on WhatsApp, waiting for their budget approval"
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:border-yellow-400 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-semibold text-gray-700">Amount quoted (K)</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:border-yellow-400 focus:outline-none"
              />
              {enquiry.quoted_amount !== null && <span className="mt-1 block text-xs text-gray-500">Saved: {formatCurrency(enquiry.quoted_amount)}</span>}
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => patch({ notes, quotedAmount: amount })} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Save notes
            </button>
            {!closed && (
              <button
                disabled={busy}
                onClick={() => patch({ status: 'quoted', notes, quotedAmount: amount })}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Mark as quoted
              </button>
            )}
            {enquiry.status !== 'won' && (
              <button disabled={busy} onClick={() => patch({ status: 'won', notes, quotedAmount: amount })} className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Booked — mark as won
              </button>
            )}
            {enquiry.status !== 'lost' && (
              <button disabled={busy} onClick={() => patch({ status: 'lost', notes })} className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold disabled:opacity-50">
                Didn’t go ahead
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Venue enquiries across all of the owner's properties. */
export default function EnquiriesInbox() {
  const [filter, setFilter] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/enquiries/business${filter ? `?status=${filter}` : ''}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (cancelled) return;
        setEnquiries(data.enquiries);
        setCounts(data.counts);
        setError(null);
      } catch {
        if (!cancelled) setError('Couldn’t load your enquiries.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const onUpdated = (updated: Enquiry) => {
    setEnquiries((list) => list?.map((e) => (e.enquiry_id === updated.enquiry_id ? updated : e)) ?? null);
    setCounts((c) => {
      const before = enquiries?.find((e) => e.enquiry_id === updated.enquiry_id)?.status;
      if (!before || before === updated.status) return c;
      return { ...c, [before]: (c[before] ?? 1) - 1, [updated.status]: (c[updated.status] ?? 0) + 1 };
    });
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const decided = (counts.won ?? 0) + (counts.lost ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Venue enquiries</h2>
          <p className="mt-1 text-gray-600">Guests asking to hold events at your spaces. Reply quickly. Planners usually contact several venues.</p>
        </div>
        {decided > 0 && (
          <p className="text-sm text-gray-600">
            Won {counts.won ?? 0} of {decided} decided ({Math.round(((counts.won ?? 0) / decided) * 100)}%)
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.value ? counts[f.value] ?? 0 : total;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f.value ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {f.label} {n > 0 && <span className="opacity-70">{n}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {enquiries === null && !error && <p className="text-gray-500">Loading…</p>}
      {enquiries?.length === 0 && (
        <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-lg ring-1 ring-black/5">
          {filter ? 'No enquiries here.' : 'No enquiries yet. Add event spaces to your properties so planners can find you on the Venues page.'}
        </div>
      )}
      {enquiries && enquiries.length > 0 && (
        <ul className="space-y-4">
          {enquiries.map((e) => (
            <EnquiryCard key={e.enquiry_id} enquiry={e} onUpdated={onUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}
