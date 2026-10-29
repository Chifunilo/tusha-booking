"use client";

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { Field, inputClass, Modal } from '@/components/business/FormModal';
import {
  addNights,
  formatKwacha,
  FreeRoom,
  FRONT_DESK_SOURCES,
  nightsBetween,
  OwnerBooking,
  PAYMENT_METHODS,
  PaymentMethod,
} from '@/lib/frontDesk';
import { localToday, RoomBlock } from '@/lib/roomBlocks';

type Source = (typeof FRONT_DESK_SOURCES)[number]['value'];
type Residency = 'resident' | 'non_resident';

const chip = (on: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-medium ${on ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;

const rateFor = (room: FreeRoom | undefined, residency: Residency) =>
  room ? (residency === 'non_resident' && room.non_resident_price !== null ? room.non_resident_price : room.price) : 0;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Record a booking the lodge took itself: walk-in, phone, WhatsApp… Built to be
 * done in under 30 seconds at the counter: dates, a free room (pre-selected),
 * the guest's name and phone, and where the booking came from.
 */
export default function WalkInBookingModal({
  initialRoomId,
  initialDate,
  fromBlock,
  onClose,
  onCreated,
  onBlockInstead,
}: {
  initialRoomId?: number;
  initialDate?: string;
  /** Turn this block into the booking; the block is removed when the booking is saved. */
  fromBlock?: RoomBlock;
  onClose: () => void;
  onCreated: (booking: OwnerBooking, removedBlockId?: number) => void;
  onBlockInstead?: (roomId: number | undefined, date: string) => void;
}) {
  const today = localToday();
  const earliest = addNights(today, -1);
  const firstNight = fromBlock?.start_date ?? (initialDate && initialDate >= earliest ? initialDate : today);

  const [checkIn, setCheckIn] = useState(firstNight);
  const [checkOut, setCheckOut] = useState(fromBlock ? addNights(fromBlock.end_date, 1) : addNights(firstNight, 1));
  const [result, setResult] = useState<{ key: string; rooms: FreeRoom[] } | null>(null);
  const [rates, setRates] = useState({ vatRate: 0, tourismLevyRate: 0 });
  const [roomId, setRoomId] = useState<number | undefined>(fromBlock?.room_id ?? initialRoomId);
  const [residency, setResidency] = useState<Residency>('resident');
  // null: follow the room's rate. A string: the price the front desk typed.
  const [priceInput, setPriceInput] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [source, setSource] = useState<Source>(fromBlock ? 'phone' : 'walk_in');
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState(fromBlock?.note ?? '');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const key = `${checkIn}|${checkOut}|${reload}`;
  // null while loading the free rooms for these dates.
  const freeRooms = nights < 1 ? [] : result?.key === key ? result.rooms : null;
  const room = freeRooms?.find((r) => r.room_id === roomId);
  const rate = rateFor(room, residency);
  const price = priceInput ?? (room ? String(rate) : '');

  // Free rooms for the chosen nights. Keeps the chosen room if it's still free, else picks the first.
  useEffect(() => {
    if (nights < 1) return;
    let cancelled = false;
    const params = new URLSearchParams({ checkInDate: checkIn, checkOutDate: checkOut });
    if (fromBlock) params.set('blockId', String(fromBlock.block_id));
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/frontdesk/free-rooms?${params}`, { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError({ message: data.error ?? 'Could not load free rooms', field: data.field });
          setResult({ key, rooms: [] });
          return;
        }
        const rooms: FreeRoom[] = data.rooms;
        setResult({ key, rooms });
        setRates({ vatRate: data.vatRate, tourismLevyRate: data.tourismLevyRate });
        setRoomId((current) => (rooms.some((r) => r.room_id === current) ? current : rooms[0]?.room_id));
      } catch {
        if (!cancelled) {
          setError({ message: 'Could not reach the server. Check your connection and try again.' });
          setResult({ key, rooms: [] });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, nights, fromBlock, key]);

  const pricePerNight = price === '' ? NaN : Number(price);
  const base = round2((Number.isFinite(pricePerNight) ? pricePerNight : 0) * Math.max(nights, 0));
  const vat = round2(base * rates.vatRate);
  const levy = round2(base * rates.tourismLevyRate);
  const total = round2(base + vat + levy);

  const groups = [...new Set((freeRooms ?? []).map((r) => `${r.property_name} · ${r.room_type}`))];
  const multipleProperties = new Set((freeRooms ?? []).map((r) => r.property_id)).size > 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !room) {
      setError({ message: 'Choose a room', field: 'roomId' });
      return;
    }
    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      setError({ message: 'Enter the price per night', field: 'pricePerNight' });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/frontdesk/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numGuests,
          residency,
          guestName,
          guestPhone,
          guestEmail,
          source,
          pricePerNight,
          paid,
          paymentMethod: paid ? paymentMethod : undefined,
          specialRequests: notes,
          fromBlockId: fromBlock?.block_id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? 'Could not save the booking', field: data.field });
        // Someone took the room a moment ago: show what's still free.
        if (res.status === 409) setReload((n) => n + 1);
        return;
      }
      onCreated(data.booking, fromBlock?.block_id);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => (error?.field === field ? error.message : undefined);

  return (
    <Modal label={fromBlock ? 'Record the booking' : 'New booking'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in" error={fieldError('checkInDate')}>
            <input
              className={inputClass}
              type="date"
              min={earliest}
              value={checkIn}
              onChange={(e) => {
                const value = e.target.value;
                setCheckIn(value);
                if (value && value >= checkOut) setCheckOut(addNights(value, 1));
              }}
              required
            />
          </Field>
          <Field label="Check-out" error={fieldError('checkOutDate')}>
            <input className={inputClass} type="date" min={checkIn ? addNights(checkIn, 1) : today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
          </Field>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-gray-800">
            Room{nights > 0 && <span className="font-normal text-gray-500"> · free for all {nights} night{nights > 1 ? 's' : ''}</span>}
          </span>
          {freeRooms === null ? (
            <p className="text-sm text-gray-500">Finding free rooms…</p>
          ) : freeRooms.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">No room is free for all of these nights. Try other dates.</p>
          ) : (
            <div className="max-h-48 space-y-3 overflow-y-auto rounded-xl border-2 border-gray-200 p-3">
              {groups.map((group) => (
                <div key={group}>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {multipleProperties ? group : group.split(' · ')[1]}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {freeRooms
                      .filter((r) => `${r.property_name} · ${r.room_type}` === group)
                      .map((r) => (
                        <button key={r.room_id} type="button" aria-pressed={r.room_id === roomId} onClick={() => setRoomId(r.room_id)} className={chip(r.room_id === roomId)}>
                          {r.room_number}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {fieldError('roomId') && <span className="mt-1 block text-sm text-red-600">{fieldError('roomId')}</span>}
        </div>

        <Field label="Guest name" error={fieldError('guestName')}>
          <input className={inputClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="off" required />
        </Field>
        <Field label="Phone" error={fieldError('guestPhone')}>
          <input className={inputClass} type="tel" inputMode="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="e.g. 0977 123 456" autoComplete="off" required />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-semibold text-gray-800">Booked by</span>
          <div className="flex flex-wrap gap-2">
            {FRONT_DESK_SOURCES.map((s) => (
              <button key={s.value} type="button" aria-pressed={source === s.value} onClick={() => setSource(s.value)} className={chip(source === s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Guests" error={fieldError('numGuests')}>
            <input className={inputClass} type="number" min={1} max={room?.max_occupancy} value={numGuests} onChange={(e) => setNumGuests(Number(e.target.value))} required />
          </Field>
          <Field label="Price per night (K)" error={fieldError('pricePerNight')}>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPriceInput(e.target.value)}
              required
            />
          </Field>
        </div>
        {room?.non_resident_price != null && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {(['resident', 'non_resident'] as const).map((r) => (
              <button key={r} type="button" aria-pressed={residency === r} onClick={() => setResidency(r)} className={chip(residency === r)}>
                {r === 'resident' ? 'Resident rate' : 'Non-resident rate'}
              </button>
            ))}
          </div>
        )}
        {room && priceInput !== null && pricePerNight !== rate && (
          <p className="-mt-2 text-sm text-gray-500">
            Standard rate {formatKwacha(rate)}.{' '}
            <button type="button" className="underline hover:text-gray-900" onClick={() => setPriceInput(null)}>
              Use it
            </button>
          </p>
        )}

        {nights > 0 && room && Number.isFinite(pricePerNight) && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>{nights} night{nights > 1 ? 's' : ''} × {formatKwacha(pricePerNight)}</span>
              <span>{formatKwacha(base)}</span>
            </div>
            {vat > 0 && (
              <div className="flex justify-between"><span>VAT</span><span>{formatKwacha(vat)}</span></div>
            )}
            <div className="flex justify-between"><span>Tourism levy</span><span>{formatKwacha(levy)}</span></div>
            <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
              <span>Total</span><span>{formatKwacha(total)}</span>
            </div>
          </div>
        )}

        <div>
          <span className="mb-2 block text-sm font-semibold text-gray-800">Payment</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!paid} onClick={() => setPaid(false)} className={chip(!paid)}>Not paid yet</button>
            <button type="button" aria-pressed={paid} onClick={() => setPaid(true)} className={chip(paid)}>Paid in full</button>
          </div>
          {paid && (
            <div className="mt-2 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} type="button" aria-pressed={paymentMethod === m.value} onClick={() => setPaymentMethod(m.value)} className={chip(paymentMethod === m.value)}>
                  {m.label}
                </button>
              ))}
            </div>
          )}
          {fieldError('paymentMethod') && <span className="mt-1 block text-sm text-red-600">{fieldError('paymentMethod')}</span>}
        </div>

        <Field label="Email (optional)" error={fieldError('guestEmail')}>
          <input className={inputClass} type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Notes (only you see this)" error={fieldError('specialRequests')}>
          <input className={inputClass} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Arriving late, needs a cot" />
        </Field>

        {error && !error.field && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

        <button type="submit" disabled={saving || !room} className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save booking'}
        </button>

        {onBlockInstead && !fromBlock && (
          <button type="button" onClick={() => onBlockInstead(roomId, checkIn)} className="w-full text-center text-sm font-medium text-gray-600 underline hover:text-gray-900">
            Just block the room instead
          </button>
        )}
      </form>
    </Modal>
  );
}
