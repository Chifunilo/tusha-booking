"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { EVENT_TYPES, EventSpace } from "@/lib/venues";

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass =
  "w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 focus:border-yellow-500 focus:outline-none";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

/** Modal form for a guest to ask a venue about hosting their event. */
export default function EnquiryForm({
  space,
  propertyName,
  onClose,
}: {
  space: EventSpace;
  propertyName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    eventType: "conference",
    eventDate: "",
    multiDay: false,
    endDate: "",
    guests: space.min_delegates ? String(space.min_delegates) : "",
    message: "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const today = localToday();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const guests = Number(form.guests);
    if (form.name.trim().length < 2) next.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (form.phone.replace(/\D/g, "").length < 9) next.phone = "Enter a phone number the venue can call or WhatsApp";
    if (!form.eventDate) next.eventDate = "Choose the date of your event";
    if (form.multiDay && form.endDate && form.endDate < form.eventDate) next.endDate = "Must be on or after the start date";
    if (!(guests >= 1)) next.guests = "How many guests?";
    else if (guests > space.max_capacity) next.guests = `This space holds up to ${space.max_capacity}`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/enquiries`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: space.space_id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          eventType: form.eventType,
          eventDate: form.eventDate,
          endDate: form.multiDay ? form.endDate : "",
          guests: Number(form.guests),
          message: form.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.field ? { [data.field]: data.error } : { form: data.error ?? "Couldn’t send your enquiry" });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: "Couldn’t send your enquiry. Check your connection and try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Enquire about ${space.space_name}`} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enquire about {space.space_name}</h2>
            <p className="text-sm text-gray-600">{propertyName}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="rounded-2xl bg-green-50 p-4 text-green-900">
              <strong>Enquiry sent.</strong> {propertyName} will contact you on {form.phone} or {form.email} with availability and a quote.
            </p>
            <p className="text-sm text-gray-600">Nothing is booked or paid yet. You agree the details directly with the venue.</p>
            <button onClick={onClose} className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type of event">
                <select className={inputClass} value={form.eventType} onChange={(e) => set("eventType", e.target.value)}>
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Number of guests" error={errors.guests}>
                <input className={inputClass} type="number" min={1} max={space.max_capacity} value={form.guests} onChange={(e) => set("guests", e.target.value)} />
              </Field>
              <Field label={form.multiDay ? "First day" : "Date"} error={errors.eventDate}>
                <input className={inputClass} type="date" min={today} value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
              </Field>
              {form.multiDay && (
                <Field label="Last day" error={errors.endDate}>
                  <input className={inputClass} type="date" min={form.eventDate || today} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </Field>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="h-4 w-4 accent-yellow-500" checked={form.multiDay} onChange={(e) => set("multiDay", e.target.checked)} />
              It runs over more than one day
            </label>

            <Field label="Your name" error={errors.name}>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone (WhatsApp if possible)" error={errors.phone}>
                <input className={inputClass} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="0977 123 456" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </Field>
            </div>
            <Field label="Anything the venue should know? (optional)" error={errors.message}>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Timings, layout, catering, equipment, budget…"
              />
            </Field>

            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
            <button type="submit" disabled={sending} className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500 disabled:opacity-50">
              {sending ? "Sending…" : "Send enquiry"}
            </button>
            <p className="text-center text-xs text-gray-500">Free, and nothing is booked yet. The venue replies to you directly.</p>
          </form>
        )}
      </div>
    </div>
  );
}
