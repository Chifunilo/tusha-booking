"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

interface EventRow {
  event_id: number;
  event_name: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  tickets_available: number;
  tickets_sold: number;
  ticket_price: number;
  is_published: boolean;
  is_cancelled: boolean;
  property_id: number;
  property_name: string;
}

interface EligibleProperty {
  property_id: number;
  property_name: string;
}

interface EventForm {
  propertyId: string;
  eventName: string;
  eventType: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: string;
  ticketPrice: string;
  organizerName: string;
  organizerContact: string;
}

const EMPTY_FORM: EventForm = {
  propertyId: '',
  eventName: '',
  eventType: '',
  description: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  maxCapacity: '50',
  ticketPrice: '',
  organizerName: '',
  organizerContact: '',
};

const EVENT_TYPE_SUGGESTIONS = ['Concert', 'Conference', 'Wedding', 'Party', 'Workshop', 'Exhibition', 'Sports', 'Other'];

const inputClass = (hasError?: boolean) =>
  `w-full bg-transparent border-b-2 ${hasError ? 'border-red-500' : 'border-black'} py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`;

/** Lists a business's events across all its properties (with capacity/price/publish controls) and adds new ones. */
export default function EventsManager({ onChange }: { onChange?: () => void }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eligibleProperties, setEligibleProperties] = useState<EligibleProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, { maxCapacity: string; ticketPrice: string }>>({});
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch(`${API_URL}/api/events/mine`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : { events: [] })),
      fetch(`${API_URL}/api/events/eligible-properties`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : { properties: [] })),
    ])
      .then(([eventsData, propertiesData]) => {
        const list: EventRow[] = eventsData.events ?? [];
        setEvents(list);
        setDrafts(Object.fromEntries(list.map((e) => [e.event_id, { maxCapacity: String(e.max_capacity), ticketPrice: String(e.ticket_price) }])));
        setEligibleProperties(propertiesData.properties ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateEvent = async (eventId: number, body: Record<string, unknown>) => {
    setListError(null);
    const res = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setListError(data.error ?? 'Could not update this event');
    }
    load();
    onChange?.();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.propertyId) next.propertyId = 'Choose which property this event is at';
    if (!form.eventName.trim()) next.eventName = 'Give this event a name';
    if (!form.eventType.trim()) next.eventType = 'What kind of event is this?';
    if (!form.eventDate) next.eventDate = 'When is it?';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (!form.endTime) next.endTime = 'End time is required';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) next.endTime = 'Must be after the start time';
    if (!(Number(form.maxCapacity) >= 1)) next.maxCapacity = 'How many tickets are available?';
    if (!(Number(form.ticketPrice) > 0)) next.ticketPrice = 'Enter the ticket price';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      let eventImage: string | undefined;
      if (image) {
        const body = new FormData();
        body.append('file', image);
        const upload = await fetch(`${API_URL}/api/upload`, { method: 'POST', credentials: 'include', body });
        if (upload.ok) eventImage = (await upload.json()).url;
      }

      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: Number(form.propertyId),
          eventName: form.eventName.trim(),
          eventType: form.eventType.trim(),
          description: form.description.trim() || undefined,
          eventDate: form.eventDate,
          startTime: form.startTime,
          endTime: form.endTime,
          maxCapacity: Number(form.maxCapacity),
          ticketPrice: Number(form.ticketPrice),
          organizerName: form.organizerName.trim() || undefined,
          organizerContact: form.organizerContact.trim() || undefined,
          eventImage,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors({ form: data.error ?? 'Could not add this event' });
        return;
      }

      setNotice(`Added ${form.eventName.trim()}`);
      setForm(EMPTY_FORM);
      setImage(null);
      load();
      onChange?.();
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <section className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {events.length === 0 ? (
          <p className="p-8 text-gray-500">No events added yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white text-left text-sm">
              <tr>
                <th className="py-4 px-6 font-semibold">Event</th>
                <th className="py-4 px-6 font-semibold">Property</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Capacity</th>
                <th className="py-4 px-6 font-semibold">Price</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const draft = drafts[event.event_id] ?? { maxCapacity: String(event.max_capacity), ticketPrice: String(event.ticket_price) };
                const dirty = draft.maxCapacity !== String(event.max_capacity) || draft.ticketPrice !== String(event.ticket_price);

                return (
                  <tr key={event.event_id} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${event.is_cancelled ? 'opacity-50' : ''}`}>
                    <td className="py-4 px-6">
                      <p className="font-semibold">{event.event_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {event.event_type}
                        {event.is_cancelled && ' · cancelled'}
                        {!event.is_published && !event.is_cancelled && ' · unpublished'}
                      </p>
                    </td>
                    <td className="py-4 px-6">{event.property_name}</td>
                    <td className="py-4 px-6">
                      <p>{new Date(`${event.event_date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                      <p className="text-sm text-gray-500">{event.start_time}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={event.tickets_sold}
                          aria-label={`Capacity for ${event.event_name}`}
                          value={draft.maxCapacity}
                          onChange={(ev) => setDrafts((d) => ({ ...d, [event.event_id]: { ...draft, maxCapacity: ev.target.value } }))}
                          className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-500"
                        />
                        <span className="text-xs text-gray-500">({event.tickets_sold} sold)</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">K</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          aria-label={`Ticket price for ${event.event_name}`}
                          value={draft.ticketPrice}
                          onChange={(ev) => setDrafts((d) => ({ ...d, [event.event_id]: { ...draft, ticketPrice: ev.target.value } }))}
                          className="w-24 border-2 border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {dirty && (
                        <button
                          type="button"
                          onClick={() => updateEvent(event.event_id, { maxCapacity: Number(draft.maxCapacity), ticketPrice: Number(draft.ticketPrice) })}
                          className="text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 rounded-full px-3 py-1 mr-2"
                        >
                          Save
                        </button>
                      )}
                      {!event.is_cancelled && (
                        <button
                          type="button"
                          onClick={() => updateEvent(event.event_id, { isPublished: !event.is_published })}
                          className="text-sm text-gray-600 hover:text-black underline mr-3"
                        >
                          {event.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      )}
                      {!event.is_cancelled && (
                        <button
                          type="button"
                          onClick={() => updateEvent(event.event_id, { isCancelled: true })}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {listError && <p className="px-6 py-3 text-sm text-red-600 border-t border-gray-100">{listError}</p>}
      </section>

      <form onSubmit={handleSubmit} className="mt-12 space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Add an event</h2>

        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div>
            <label className="block text-xl font-medium mb-2">Property</label>
            <select value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)} className={inputClass(!!errors.propertyId)}>
              <option value="">Choose a property</option>
              {eligibleProperties.map((p) => (
                <option key={p.property_id} value={p.property_id}>{p.property_name}</option>
              ))}
            </select>
            {errors.propertyId && <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Event name</label>
            <input
              value={form.eventName}
              onChange={(e) => set('eventName', e.target.value)}
              placeholder="e.g. New Year's Eve Party"
              className={inputClass(!!errors.eventName)}
            />
            {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Event type</label>
            <input
              list="event-type-suggestions"
              value={form.eventType}
              onChange={(e) => set('eventType', e.target.value)}
              placeholder="e.g. Concert, Wedding"
              className={inputClass(!!errors.eventType)}
            />
            <datalist id="event-type-suggestions">
              {EVENT_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
            </datalist>
            {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Date</label>
            <input type="date" value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)} className={inputClass(!!errors.eventDate)} />
            {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-medium mb-2">Start time</label>
              <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputClass(!!errors.startTime)} />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-xl font-medium mb-2">End time</label>
              <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputClass(!!errors.endTime)} />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Ticket price (K)</label>
            <input type="number" min={0} step="0.01" value={form.ticketPrice} onChange={(e) => set('ticketPrice', e.target.value)} className={inputClass(!!errors.ticketPrice)} />
            {errors.ticketPrice && <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Capacity (tickets available)</label>
            <input type="number" min={1} value={form.maxCapacity} onChange={(e) => set('maxCapacity', e.target.value)} className={inputClass(!!errors.maxCapacity)} />
            {errors.maxCapacity && <p className="text-red-500 text-sm mt-1">{errors.maxCapacity}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Organizer name (optional)</label>
            <input value={form.organizerName} onChange={(e) => set('organizerName', e.target.value)} className={inputClass()} />
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Organizer contact (optional)</label>
            <input value={form.organizerContact} onChange={(e) => set('organizerContact', e.target.value)} className={inputClass()} />
          </div>
        </div>

        <div>
          <label className="block text-xl font-medium mb-2">Description (optional)</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${inputClass()} resize-none`} />
        </div>

        <div className="flex items-center justify-between gap-6">
          <label className="bg-gray-200 hover:bg-gray-300 px-8 py-5 rounded-2xl cursor-pointer transition-colors">
            <span className="text-lg font-semibold">{image ? 'Change photo' : 'Add a photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex items-center gap-4">
            {notice && <p className="text-green-700 font-medium">{notice}</p>}
            {errors.form && <p className="text-red-600 font-medium">{errors.form}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold text-xl px-10 py-5 rounded-full transition-colors"
            >
              {submitting ? 'Saving...' : 'Add event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
