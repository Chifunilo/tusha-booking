"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ConciergeBell, DoorOpen, LogOut, Phone, Sparkles } from 'lucide-react';
import { API_URL } from '@/lib/api';
import {
  addNights,
  bookingSourceLabel,
  formatKwacha,
  FreeRoom,
  HOUSEKEEPING,
  HousekeepingStatus,
  nightsBetween,
  OwnerBooking,
  PAYMENT_METHODS,
  PaymentMethod,
  TodayRoom,
  TodayView,
} from '@/lib/frontDesk';
import { Modal } from './FormModal';
import WalkInBookingModal from './WalkInBookingModal';

// The front desk's day (backend PHASEDLODGE.md step 3): who's arriving, who's here,
// who's leaving and which rooms need cleaning. Built for a phone at the counter.

const chip = (on: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-medium ${on ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;

const day = (d: string) => d.slice(0, 10);
const shortDay = (d: string) =>
  new Date(`${day(d)}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const HOUSEKEEPING_CLASS: Record<HousekeepingStatus, string> = {
  dirty: 'bg-red-100 text-red-800',
  clean: 'bg-green-100 text-green-800',
  inspected: 'bg-sky-100 text-sky-800',
};

type Kind = 'arrival' | 'in_house' | 'departure';

interface Actions {
  busy: string | null;
  today: string;
  onCheckIn: (b: OwnerBooking) => void;
  onNoShow: (b: OwnerBooking) => void;
  onCheckOut: (b: OwnerBooking) => void;
  onMove: (b: OwnerBooking) => void;
}

function GuestCard({ booking: b, kind, actions }: { booking: OwnerBooking; kind: Kind; actions: Actions }) {
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const nights = nightsBetween(day(b.check_in_date), day(b.check_out_date));
  const busy = ['check-in', 'no-show', 'check-out', 'move'].some((a) => actions.busy === `${a}:${b.booking_id}`);
  const stayEnded = kind === 'arrival' && day(b.check_out_date) <= actions.today;
  const late = kind === 'arrival' && !stayEnded && day(b.check_in_date) < actions.today;
  const overdue = kind === 'departure' && day(b.check_out_date) < actions.today;

  const button = 'rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50';

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{b.guest_name}</p>
          <p className="text-sm text-gray-600">
            Room {b.room_number} · {shortDay(b.check_in_date)} to {shortDay(b.check_out_date)} · {nights} night{nights === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {bookingSourceLabel(b.source)} · {b.num_guests} guest{b.num_guests === 1 ? '' : 's'}
            {b.guest_phone && (
              <>
                {' · '}
                <a href={`tel:${b.guest_phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 font-medium text-gray-700 underline">
                  <Phone size={11} />
                  {b.guest_phone}
                </a>
              </>
            )}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${b.balance_due > 0 ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'}`}>
          {b.balance_due > 0 ? `Owes ${formatKwacha(b.balance_due)}` : 'Paid'}
        </span>
      </div>

      {(late || stayEnded || overdue) && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
          {stayEnded
            ? `Never arrived: the stay ended ${shortDay(b.check_out_date)}. Mark it as a no-show to free the room.`
            : late
              ? `Was due ${shortDay(b.check_in_date)}`
              : `Was due out ${shortDay(b.check_out_date)}`}
        </p>
      )}
      {b.special_requests && <p className="mt-2 text-xs text-gray-600">Note: {b.special_requests}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {kind === 'arrival' && !confirmNoShow && (
          <>
            {!stayEnded && (
              <button onClick={() => actions.onCheckIn(b)} disabled={busy} className={`${button} bg-yellow-400 text-black hover:bg-yellow-500`}>
                {actions.busy === `check-in:${b.booking_id}` ? 'Checking in…' : 'Check in'}
              </button>
            )}
            <button onClick={() => setConfirmNoShow(true)} disabled={busy} className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
              No-show
            </button>
            {!stayEnded && (
              <button onClick={() => actions.onMove(b)} disabled={busy} className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
                Change room
              </button>
            )}
          </>
        )}
        {kind === 'arrival' && confirmNoShow && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-2">
            <span className="flex-1 text-sm text-gray-700">Mark {b.guest_name} as a no-show and free the room?</span>
            <button onClick={() => actions.onNoShow(b)} disabled={busy} className={`${button} bg-black text-white`}>
              {actions.busy === `no-show:${b.booking_id}` ? 'Saving…' : 'Yes, no-show'}
            </button>
            <button onClick={() => setConfirmNoShow(false)} disabled={busy} className={`${button} bg-white text-gray-800 ring-1 ring-gray-200`}>
              Keep
            </button>
          </div>
        )}
        {kind !== 'arrival' && (
          <>
            <button
              onClick={() => actions.onCheckOut(b)}
              disabled={busy}
              className={`${button} ${kind === 'departure' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              {kind === 'departure' ? 'Check out' : 'Check out early'}
            </button>
            <button onClick={() => actions.onMove(b)} disabled={busy} className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
              Move room
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function Section({ title, icon, empty, children, count }: { title: string; icon: React.ReactNode; empty: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900">
        {icon}
        {title}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{count}</span>
      </h2>
      {count === 0 ? <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">{empty}</p> : <ul className="space-y-3">{children}</ul>}
    </section>
  );
}

function CheckOutModal({ booking: b, today, saving, error, onClose, onConfirm }: {
  booking: OwnerBooking;
  today: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (body: { balancePaid: boolean; paymentMethod?: PaymentMethod }) => void;
}) {
  const [paidNow, setPaidNow] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const owes = b.balance_due > 0;
  // A stay keeps at least its first night, so a same-day departure frees the room from tomorrow.
  const freedFrom = day(b.check_in_date) === today ? addNights(today, 1) : today;
  const early = day(b.check_out_date) > freedFrom;

  return (
    <Modal label={`Check out ${b.guest_name}`} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Room {b.room_number} · {shortDay(b.check_in_date)} to {shortDay(b.check_out_date)}
        </p>
        {early && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Leaving early: the room goes back on sale from {freedFrom === today ? 'tonight' : shortDay(freedFrom)}. The price of the stay
            isn&apos;t changed.
          </p>
        )}
        {owes ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Balance due: {formatKwacha(b.balance_due)}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={paidNow} onClick={() => setPaidNow(true)} className={chip(paidNow)}>Paid now</button>
              <button type="button" aria-pressed={!paidNow} onClick={() => setPaidNow(false)} className={chip(!paidNow)}>Not paid, collect later</button>
            </div>
            {paidNow && (
              <div className="mt-2 flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.value} type="button" aria-pressed={method === m.value} onClick={() => setMethod(m.value)} className={chip(method === m.value)}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-green-50 p-3 text-sm text-green-900">Nothing to pay: the stay is settled.</p>
        )}
        <p className="text-sm text-gray-500">The room will be marked dirty for housekeeping.</p>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          onClick={() => onConfirm(owes && paidNow ? { balancePaid: true, paymentMethod: method } : { balancePaid: false })}
          disabled={saving}
          className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50"
        >
          {saving ? 'Checking out…' : 'Check out'}
        </button>
      </div>
    </Modal>
  );
}

function MoveRoomModal({ booking: b, today, saving, error, onClose, onConfirm }: {
  booking: OwnerBooking;
  today: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (roomId: number) => void;
}) {
  const from = day(b.check_in_date) > today ? day(b.check_in_date) : today;
  const to = day(b.check_out_date);
  const key = `${from}:${to}`;
  const [result, setResult] = useState<{ key: string; rooms: FreeRoom[]; error?: string } | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);

  useEffect(() => {
    if (from >= to) return;
    let stale = false;
    const params = new URLSearchParams({ checkInDate: from, checkOutDate: to });
    fetch(`${API_URL}/api/frontdesk/free-rooms?${params}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!stale) setResult({ key, rooms: res.ok ? data.rooms : [], error: res.ok ? undefined : data.error });
      })
      .catch(() => !stale && setResult({ key, rooms: [], error: "Couldn't load free rooms. Check your connection." }));
    return () => {
      stale = true;
    };
  }, [from, to, key]);

  const loaded = result?.key === key ? result : null;
  const rooms = loaded?.rooms.filter((r) => r.property_id === b.property_id && r.room_id !== b.room_id) ?? null;

  return (
    <Modal label={`Move ${b.guest_name}`} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Now in room {b.room_number}. Rooms free from {shortDay(from)} to {shortDay(to)}:
        </p>
        {from >= to ? (
          <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">There are no nights left in this stay to move.</p>
        ) : rooms === null ? (
          <p className="text-sm text-gray-500">Finding free rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">{loaded?.error ?? 'No other room is free for all of these nights.'}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => (
              <button key={r.room_id} type="button" aria-pressed={roomId === r.room_id} onClick={() => setRoomId(r.room_id)} className={chip(roomId === r.room_id)}>
                {r.room_number} <span className="font-normal opacity-70">· {r.room_type}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500">The price of the stay doesn&apos;t change.</p>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          onClick={() => roomId && onConfirm(roomId)}
          disabled={saving || !roomId}
          className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50"
        >
          {saving ? 'Moving…' : `Move to ${rooms?.find((r) => r.room_id === roomId)?.room_number ?? 'room'}`}
        </button>
      </div>
    </Modal>
  );
}

function RoomRow({ room, busy, showProperty, onSet }: {
  room: TodayRoom;
  busy: boolean;
  showProperty: boolean;
  onSet: (status: HousekeepingStatus) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">
          {room.room_number}{' '}
          <span className="text-sm font-normal text-gray-500">
            · {showProperty ? `${room.property_name}, ` : ''}{room.room_type}
          </span>
        </p>
        <p className="text-xs text-gray-500">{room.occupied_by ? `In house: ${room.occupied_by}` : 'Empty'}</p>
      </div>
      <div className="flex gap-1" role="group" aria-label={`Room ${room.room_number} housekeeping`}>
        {HOUSEKEEPING.map((h) => (
          <button
            key={h.value}
            aria-pressed={room.housekeeping_status === h.value}
            disabled={busy}
            onClick={() => room.housekeeping_status !== h.value && onSet(h.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
              room.housekeeping_status === h.value ? HOUSEKEEPING_CLASS[h.value] : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export default function TodayBoard() {
  const [view, setView] = useState<TodayView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [propertyId, setPropertyId] = useState<number | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<OwnerBooking | null>(null);
  const [moving, setMoving] = useState<OwnerBooking | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [walkIn, setWalkIn] = useState(false);

  useEffect(() => {
    let stale = false;
    fetch(`${API_URL}/api/frontdesk/today`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (stale) return;
        if (res.ok) {
          setView(data);
          setLoadError(null);
        } else {
          setLoadError(data.error ?? "Couldn't load today's arrivals and departures.");
        }
      })
      .catch(() => !stale && setLoadError("Couldn't reach Tusha. Check your connection and try again."));
    return () => {
      stale = true;
    };
  }, [reload]);

  const properties = useMemo(() => {
    const seen = new Map<number, string>();
    view?.rooms.forEach((r) => seen.set(r.property_id, r.property_name));
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [view]);

  if (!view) {
    return loadError
      ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
      : <p className="text-sm text-gray-500">Loading today…</p>;
  }

  const today = view.date ?? '';
  const inProperty = <T extends { property_id: number }>(rows: T[]) => (propertyId === 'all' ? rows : rows.filter((r) => r.property_id === propertyId));
  const arrivals = inProperty(view.arrivals);
  const inHouse = inProperty(view.inHouse);
  const departures = inProperty(view.departures);
  const rooms = inProperty(view.rooms);
  const toClean = rooms.filter((r) => r.housekeeping_status === 'dirty').length;

  /** Runs a front-desk action; on success refreshes the board and returns the response. */
  async function act(key: string, path: string, method: 'POST' | 'PATCH', body: object, inModal = false) {
    setBusy(key);
    setError(null);
    setModalError(null);
    setNotice(null);
    try {
      const res = await fetch(`${API_URL}/api/frontdesk/${path}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        (inModal ? setModalError : setError)(data.error ?? 'Something went wrong. Try again.');
        return null;
      }
      setReload((n) => n + 1);
      return data;
    } catch {
      (inModal ? setModalError : setError)("Couldn't reach Tusha. Check your connection and try again.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  const actions: Actions = {
    busy,
    today,
    onCheckIn: async (b) => {
      if (await act(`check-in:${b.booking_id}`, `bookings/${b.booking_id}/check-in`, 'POST', {})) {
        setNotice(`${b.guest_name} is checked in to room ${b.room_number}.`);
      }
    },
    onNoShow: async (b) => {
      if (await act(`no-show:${b.booking_id}`, `bookings/${b.booking_id}/no-show`, 'POST', {})) {
        setNotice(`${b.guest_name} marked as a no-show. Room ${b.room_number} is back on sale.`);
      }
    },
    onCheckOut: (b) => {
      setModalError(null);
      setCheckingOut(b);
    },
    onMove: (b) => {
      setModalError(null);
      setMoving(b);
    },
  };

  const tiles = [
    { label: 'Arriving', value: arrivals.length },
    { label: 'In house', value: inHouse.length + departures.length },
    { label: 'Leaving', value: departures.length },
    { label: 'To clean', value: toClean },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Today</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">{today ? longDay(today) : '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {properties.length > 1 && (
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              aria-label="Property"
              className="rounded-xl border-2 border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button onClick={() => setWalkIn(true)} className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
            New booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-gray-50 p-4">
            <p className="text-3xl font-semibold tracking-tight text-gray-900">{t.value}</p>
            <p className="text-sm text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-2xl bg-green-50 p-4 text-sm text-green-900">{notice}</p>}

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-8">
          <Section title="Arriving" icon={<ConciergeBell size={18} />} count={arrivals.length} empty="No one is due in today.">
            {arrivals.map((b) => <GuestCard key={b.booking_id} booking={b} kind="arrival" actions={actions} />)}
          </Section>
          <Section title="Leaving" icon={<LogOut size={18} />} count={departures.length} empty="No one is due out today.">
            {departures.map((b) => <GuestCard key={b.booking_id} booking={b} kind="departure" actions={actions} />)}
          </Section>
          <Section title="In house" icon={<DoorOpen size={18} />} count={inHouse.length} empty="No other guests are staying tonight.">
            {inHouse.map((b) => <GuestCard key={b.booking_id} booking={b} kind="in_house" actions={actions} />)}
          </Section>
        </div>
        <Section title="Rooms" icon={<Sparkles size={18} />} count={rooms.length} empty="No rooms yet. Add them under Manage Rooms.">
          {rooms.map((r) => (
            <RoomRow
              key={r.room_id}
              room={r}
              busy={busy === `room:${r.room_id}`}
              showProperty={propertyId === 'all' && properties.length > 1}
              onSet={(status) => act(`room:${r.room_id}`, `rooms/${r.room_id}/housekeeping`, 'PATCH', { status })}
            />
          ))}
        </Section>
      </div>

      {checkingOut && (
        <CheckOutModal
          booking={checkingOut}
          today={today}
          saving={busy === `check-out:${checkingOut.booking_id}`}
          error={modalError}
          onClose={() => setCheckingOut(null)}
          onConfirm={async (body) => {
            const b = checkingOut;
            const data = await act(`check-out:${b.booking_id}`, `bookings/${b.booking_id}/check-out`, 'POST', body, true);
            if (data) {
              setCheckingOut(null);
              setNotice(`${b.guest_name} checked out. Room ${b.room_number} needs cleaning.`);
            }
          }}
        />
      )}
      {moving && (
        <MoveRoomModal
          booking={moving}
          today={today}
          saving={busy === `move:${moving.booking_id}`}
          error={modalError}
          onClose={() => setMoving(null)}
          onConfirm={async (roomId) => {
            const b = moving;
            const data = await act(`move:${b.booking_id}`, `bookings/${b.booking_id}/room`, 'PATCH', { roomId }, true);
            if (data) {
              setMoving(null);
              setNotice(`${b.guest_name} moved to room ${data.booking.room_number}.`);
            }
          }}
        />
      )}
      {walkIn && (
        <WalkInBookingModal
          onClose={() => setWalkIn(false)}
          onCreated={(booking) => {
            setWalkIn(false);
            setNotice(`Booking saved for ${booking.guest_name}, room ${booking.room_number}.`);
            setReload((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
