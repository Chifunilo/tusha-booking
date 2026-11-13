"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import { API_URL } from '@/lib/api';
import { CheckoutView, detectNetwork, formatStayDate, NETWORK_LABELS } from '@/lib/checkout';
import { formatKwacha } from '@/lib/frontDesk';

interface Quote {
  roomTypeName: string;
  nights: number;
  total: number;
  deposit: number;
  balanceDueAtCheckIn: number;
}

/** A prompt is retried after this long without an answer (the backend refuses sooner). */
const RETRY_AFTER_MS = 3 * 60 * 1000;

const waitingForPhone = (v: CheckoutView | null) => v?.status === 'pending' && v.payment?.status === 'pending';

function Countdown({ until, now }: { until: string; now: number }) {
  const left = Math.max(0, Date.parse(until) - now);
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <span className={`font-semibold tabular-nums ${left < 3 * 60_000 ? 'text-red-600' : 'text-gray-900'}`}>
      {left === 0 ? 'time is up' : `${m}:${String(s).padStart(2, '0')}`}
    </span>
  );
}

function MobileMoneyForm({
  phone,
  onPhoneChange,
  onSubmit,
  busy,
  label,
  error,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  label: string;
  error?: string;
}) {
  const network = detectNetwork(phone);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-gray-800">Mobile money number</span>
        <div className="relative">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="097 123 4567"
            className="w-full rounded-xl border-2 border-gray-300 px-5 py-4 pr-36 text-lg focus:border-yellow-400 focus:outline-none"
            required
          />
          {network && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {NETWORK_LABELS[network]}
            </span>
          )}
        </div>
        <span className="mt-1 block text-sm text-gray-500">MTN, Airtel or Zamtel. You&apos;ll get a prompt on this phone to enter your PIN.</span>
        {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
      </label>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-yellow-400 py-4 text-lg font-bold text-black hover:bg-yellow-500 disabled:opacity-50">
        {busy ? 'Sending prompt…' : label}
      </button>
    </form>
  );
}

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const propertyId = searchParams.get('propertyId');
  const roomTypeId = searchParams.get('roomTypeId');
  const residency = searchParams.get('residency') === 'non_resident' ? 'non_resident' : 'resident';
  const guests = searchParams.get('guests');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const firstName = searchParams.get('firstName') ?? '';
  const lastName = searchParams.get('lastName') ?? '';
  const email = searchParams.get('email') ?? '';
  const guestPhone = searchParams.get('phone') ?? '';

  const [quote, setQuote] = useState<Quote | null>(null);
  const [view, setView] = useState<CheckoutView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [phone, setPhone] = useState(guestPhone);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [simulatorUrl, setSimulatorUrl] = useState<string | null>(null);
  const [pollKey, setPollKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // A new checkout: the quote, so the guest sees the deposit before paying.
  useEffect(() => {
    if (ref || !propertyId || !roomTypeId || !checkIn || !checkOut) return;
    let cancelled = false;
    const params = new URLSearchParams({ propertyId, roomTypeId, checkIn, checkOut, residency });
    if (guests) params.set('guests', guests);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/bookings/quote?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setQuote(data.quote);
        else setLoadError(data.error ?? 'Could not load the price');
      } catch {
        if (!cancelled) setLoadError('Could not reach the server. Check your connection and try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref, propertyId, roomTypeId, checkIn, checkOut, residency, guests]);

  // An existing checkout: load it, and keep asking while the guest's phone has a prompt open.
  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/checkout/${encodeURIComponent(ref)}`, { credentials: 'include' });
        if (cancelled) return;
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error ?? 'Could not load your booking');
          return;
        }
        setView(data.checkout);
        if (waitingForPhone(data.checkout)) timer = setTimeout(load, 3000);
      } catch {
        if (!cancelled) timer = setTimeout(load, 5000);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref, pollKey]);

  // The hold countdown.
  const holding = view?.status === 'pending' && !!view.holdExpiresAt;
  useEffect(() => {
    if (!holding) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [holding]);

  const started = (checkout: CheckoutView) => {
    if (checkout.redirectUrl) {
      window.location.assign(checkout.redirectUrl);
      return;
    }
    setView(checkout);
    setSimulatorUrl(checkout.simulatorUrl);
    if (checkout.reference === ref) setPollKey((k) => k + 1);
    else router.replace(`/checkout?ref=${encodeURIComponent(checkout.reference)}`);
  };

  const post = async (url: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? 'Something went wrong. Try again.', field: data.field });
        return;
      }
      started(data.checkout);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  };

  const payNew = () =>
    post(`${API_URL}/api/checkout`, {
      propertyId,
      roomTypeId,
      residency,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numGuests: guests,
      guestName: `${firstName} ${lastName}`.trim(),
      guestEmail: email,
      guestPhone,
      payment: { method: 'mobile_money', phone },
    });

  const payAgain = () => post(`${API_URL}/api/checkout/${encodeURIComponent(ref!)}/pay`, { payment: { method: 'mobile_money', phone } });

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/checkout/${encodeURIComponent(ref!)}/cancel`, { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setView(data.checkout);
    } finally {
      setBusy(false);
    }
  };

  const cardHref = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('ref');
    return `/payment?${params}`;
  })();

  // ── Summary ──
  const summary = view
    ? {
        title: view.propertyName,
        line: `${view.roomTypeName ?? 'Room'} · ${formatStayDate(view.checkIn)} to ${formatStayDate(view.checkOut)}`,
        total: view.total,
        deposit: view.deposit,
        balance: view.balanceDue,
      }
    : quote
      ? {
          title: quote.roomTypeName,
          line: `${quote.nights} night${quote.nights === 1 ? '' : 's'} · ${formatStayDate(checkIn)} to ${formatStayDate(checkOut)}${guests ? ` · ${guests} guest${guests === '1' ? '' : 's'}` : ''}`,
          total: quote.total,
          deposit: quote.deposit,
          balance: quote.balanceDueAtCheckIn,
        }
      : null;

  const fieldError = error?.field === 'payment.phone' ? error.message : undefined;
  const generalError = error && error.field !== 'payment.phone' ? error.message : null;
  const promptAge = view?.payment ? now - Date.parse(view.payment.startedAt) : 0;

  let panel: React.ReactNode;
  if (needsLogin) {
    panel = (
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Log in to pay</h2>
        <p className="mb-6 text-gray-600">You need a Tusha account to book, so we can send you your booking.</p>
        <Link href="/login" className="inline-block rounded-xl bg-yellow-400 px-10 py-4 font-bold text-black hover:bg-yellow-500">
          Log in
        </Link>
      </div>
    );
  } else if (loadError && !view && !quote) {
    panel = <p className="rounded-xl bg-red-50 p-4 text-red-700">{loadError}</p>;
  } else if (!ref) {
    panel = (
      <>
        <h2 className="mb-1 text-2xl font-bold">Pay your deposit</h2>
        <p className="mb-6 text-gray-600">
          Pay {summary ? formatKwacha(summary.deposit) : 'the deposit'} now to confirm the room. You pay the rest at the property.
        </p>
        <MobileMoneyForm
          phone={phone}
          onPhoneChange={setPhone}
          onSubmit={payNew}
          busy={busy || !summary}
          label={summary ? `Pay ${formatKwacha(summary.deposit)}` : 'Pay deposit'}
          error={fieldError}
        />
        {generalError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{generalError}</p>}
        <p className="mt-6 text-center text-sm text-gray-500">
          Paying by card?{' '}
          <Link href={cardHref} className="font-semibold text-gray-800 underline">
            Use the card form
          </Link>
        </p>
      </>
    );
  } else if (!view) {
    panel = <p className="text-gray-500">Loading your booking…</p>;
  } else if (view.status === 'confirmed') {
    panel = (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-3xl font-bold">You&apos;re booked</h2>
        <p className="mb-6 text-gray-600">
          Deposit of {formatKwacha(view.deposit)} received. Pay the balance of {formatKwacha(view.balanceDue)} at the property when you arrive.
        </p>
        <div className="mb-8 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-5">
          <p className="text-sm text-gray-600">Booking reference</p>
          <p className="text-2xl font-bold tracking-wide">{view.reference}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/bookings" className="rounded-xl bg-gray-100 px-8 py-4 font-bold text-gray-800 hover:bg-gray-200">
            My bookings
          </Link>
          <Link href="/" className="rounded-xl bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-500">
            Back to home
          </Link>
        </div>
      </div>
    );
  } else if (view.status === 'cancelled') {
    panel = view.refundDue ? (
      <div>
        <h2 className="mb-2 text-2xl font-bold">We&apos;ll refund your payment</h2>
        <p className="text-gray-600">
          Your payment of {formatKwacha(view.deposit)} arrived after the room was released, so this booking isn&apos;t confirmed. We&apos;ll send the money back to
          the number you paid from. Reference {view.reference}.
        </p>
      </div>
    ) : (
      <div>
        <h2 className="mb-2 text-2xl font-bold">This room was released</h2>
        <p className="mb-6 text-gray-600">No payment was taken. The 20 minutes to pay ran out, or the payment was cancelled.</p>
        <Link href="/" className="inline-block rounded-xl bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-500">
          Find a room
        </Link>
      </div>
    );
  } else if (waitingForPhone(view)) {
    const p = view.payment!;
    panel = (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-400" aria-hidden />
          <h2 className="text-2xl font-bold">Check your phone</h2>
        </div>
        <p className="mb-4 text-gray-700">
          {p.method === 'mobile_money' ? (
            <>
              We sent a prompt to <strong>{p.phone}</strong>
              {p.network && ` (${NETWORK_LABELS[p.network]})`}. Enter your PIN to pay <strong>{formatKwacha(p.amount)}</strong> to Tusha.
            </>
          ) : (
            <>Finishing your card payment of {formatKwacha(p.amount)}…</>
          )}
        </p>
        {view.holdExpiresAt && (
          <p className="mb-6 text-sm text-gray-600">
            We&apos;re holding the room for you: <Countdown until={view.holdExpiresAt} now={now} />
          </p>
        )}
        {simulatorUrl && (
          <a href={simulatorUrl} target="_blank" rel="noreferrer" className="mb-6 block rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">
            Test mode: open the simulated phone
          </a>
        )}
        {promptAge > RETRY_AFTER_MS ? (
          <>
            <p className="mb-3 text-sm text-gray-600">No prompt, or it timed out? Send a new one.</p>
            <MobileMoneyForm phone={phone} onPhoneChange={setPhone} onSubmit={payAgain} busy={busy} label="Send a new prompt" error={fieldError} />
          </>
        ) : (
          <p className="text-sm text-gray-500">No prompt after a minute? Check the number, or dial your mobile money menu to approve pending payments.</p>
        )}
        {generalError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{generalError}</p>}
      </div>
    );
  } else {
    // Pending booking, last payment failed (or none started): try again while the hold lasts.
    panel = (
      <div>
        <h2 className="mb-2 text-2xl font-bold">The payment didn&apos;t go through</h2>
        {view.payment?.failureReason && <p className="mb-2 text-gray-700">{view.payment.failureReason.replace(/\.$/, '')}.</p>}
        {view.holdExpiresAt && (
          <p className="mb-6 text-sm text-gray-600">
            The room is still held for you: <Countdown until={view.holdExpiresAt} now={now} />
          </p>
        )}
        <MobileMoneyForm phone={phone} onPhoneChange={setPhone} onSubmit={payAgain} busy={busy} label={`Try again: pay ${formatKwacha(view.deposit)}`} error={fieldError} />
        {generalError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{generalError}</p>}
        <button onClick={cancel} disabled={busy} className="mt-6 w-full text-center text-sm font-medium text-gray-600 underline hover:text-gray-900">
          Cancel and release the room
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab="home" onTabChange={() => {}} />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
        <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

        {summary && (
          <div className="mb-6 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white">
            <div className="p-6">
              <p className="text-xl font-bold">{summary.title}</p>
              <p className="mt-1 text-gray-600">{summary.line}</p>
            </div>
            <div className="space-y-1 border-t border-gray-100 px-6 py-4 text-gray-700">
              <div className="flex justify-between">
                <span>Total for the stay</span>
                <span>{formatKwacha(summary.total)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Deposit, paid now</span>
                <span>{formatKwacha(summary.deposit)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Balance, paid at the property</span>
                <span>{formatKwacha(summary.balance)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 sm:p-10">{panel}</div>
      </div>
    </div>
  );
}
