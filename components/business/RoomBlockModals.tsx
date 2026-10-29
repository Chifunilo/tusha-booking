"use client";

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { blockReasonLabel, formatNight, localToday, ROOM_BLOCK_REASONS, RoomBlock, RoomBlockReason } from '@/lib/roomBlocks';

export interface BlockableRoom {
  room_id: number;
  room_number: string;
  property_name: string;
}

const inputClass =
  'w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 focus:border-yellow-500 focus:outline-none';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="px-1 text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Take one or more rooms off sale for a run of nights. */
export function BlockRoomsModal({
  rooms,
  initialRoomId,
  initialDate,
  onClose,
  onCreated,
}: {
  rooms: BlockableRoom[];
  initialRoomId?: number;
  initialDate?: string;
  onClose: () => void;
  onCreated: (blocks: RoomBlock[]) => void;
}) {
  const today = localToday();
  const start = initialDate && initialDate >= today ? initialDate : today;
  const [roomIds, setRoomIds] = useState<number[]>(initialRoomId ? [initialRoomId] : []);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(start);
  const [reason, setReason] = useState<RoomBlockReason>('sold_elsewhere');
  const [note, setNote] = useState('');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const properties = [...new Set(rooms.map((r) => r.property_name))];
  const nights = startDate && endDate && endDate >= startDate
    ? Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1
    : 0;

  const toggleRoom = (id: number) =>
    setRoomIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const toggleProperty = (name: string) => {
    const ids = rooms.filter((r) => r.property_name === name).map((r) => r.room_id);
    const allOn = ids.every((id) => roomIds.includes(id));
    setRoomIds((current) => (allOn ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIds.length === 0) {
      setError({ message: 'Choose at least one room', field: 'roomIds' });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/room-blocks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomIds, startDate, endDate, reason, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? 'Could not block these rooms', field: data.field });
        return;
      }
      onCreated(data.blocks);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => (error?.field === field ? error.message : undefined);

  return (
    <Modal label="Block rooms" onClose={onClose}>
      <p className="mb-5 text-sm text-gray-600">
        Blocked rooms can’t be booked on Tusha for those nights. Use this when you’ve sold a room another way, or it isn’t ready for guests.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="mb-2 block text-sm font-semibold text-gray-800">Rooms</span>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border-2 border-gray-200 p-3">
            {properties.map((name) => {
              const propertyRooms = rooms.filter((r) => r.property_name === name);
              return (
                <div key={name}>
                  {properties.length > 1 && (
                    <button type="button" onClick={() => toggleProperty(name)} className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-900">
                      {name} · select all
                    </button>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {propertyRooms.map((room) => {
                      const on = roomIds.includes(room.room_id);
                      return (
                        <button
                          key={room.room_id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleRoom(room.room_id)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium ${on ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          {room.room_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {properties.length === 1 && rooms.length > 1 && (
            <button type="button" onClick={() => toggleProperty(properties[0])} className="mt-1 text-sm font-medium text-gray-600 underline hover:text-gray-900">
              {rooms.every((r) => roomIds.includes(r.room_id)) ? 'Clear all' : 'Select all rooms'}
            </button>
          )}
          {fieldError('roomIds') && <span className="mt-1 block text-sm text-red-600">{fieldError('roomIds')}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="First night" error={fieldError('startDate')}>
            <input
              className={inputClass}
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              required
            />
          </Field>
          <Field label="Last night" error={fieldError('endDate')}>
            <input className={inputClass} type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </Field>
        </div>
        {nights > 0 && (
          <p className="-mt-2 text-sm text-gray-500">
            {nights} night{nights > 1 ? 's' : ''}. The room is free again from {formatNight(new Date(Date.parse(endDate) + 86_400_000).toISOString().slice(0, 10))}.
          </p>
        )}

        <Field label="Reason" error={fieldError('reason')}>
          <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value as RoomBlockReason)}>
            {ROOM_BLOCK_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">{ROOM_BLOCK_REASONS.find((r) => r.value === reason)?.hint}</span>
        </Field>

        <Field label="Note (only you see this)" error={fieldError('note')}>
          <input className={inputClass} value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Mr Banda, paid cash, 2 adults" />
        </Field>

        {error && !error.field && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50">
          {saving ? 'Blocking…' : roomIds.length > 1 ? `Block ${roomIds.length} rooms` : 'Block room'}
        </button>
      </form>
    </Modal>
  );
}

/** Details of one block, with a two-step remove. */
export function BlockDetailModal({
  block,
  onClose,
  onRemoved,
}: {
  block: RoomBlock;
  onClose: () => void;
  onRemoved: (blockId: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/room-blocks/${block.block_id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Could not remove this block');
        return;
      }
      onRemoved(block.block_id);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setRemoving(false);
    }
  };

  const rows = [
    { label: 'Room', value: `${block.room_number}, ${block.property_name}` },
    { label: 'First night', value: formatNight(block.start_date) },
    { label: 'Last night', value: formatNight(block.end_date) },
    { label: 'Nights', value: block.nights },
    { label: 'Reason', value: blockReasonLabel(block.reason) },
    ...(block.note ? [{ label: 'Note', value: block.note }] : []),
  ];

  return (
    <Modal label="Blocked dates" onClose={onClose}>
      <dl className="space-y-3 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-800">{value}</dd>
          </div>
        ))}
      </dl>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {confirming ? (
          <>
            <button onClick={remove} disabled={removing} className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {removing ? 'Removing…' : 'Yes, put these nights back on sale'}
            </button>
            <button onClick={() => setConfirming(false)} disabled={removing} className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold">
              Keep the block
            </button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            Remove block
          </button>
        )}
      </div>
    </Modal>
  );
}
