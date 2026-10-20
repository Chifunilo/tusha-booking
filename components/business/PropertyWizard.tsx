"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import {
  CANCELLATION_POLICIES,
  FACILITY_GROUPS,
  PAYMENT_ON_ARRIVAL,
  PROPERTY_TYPES,
  ZAMBIA_PROVINCES,
  osmEmbedUrl,
  parseCoordinates,
} from '@/lib/facilities';
import RoomTypesManager from './RoomTypesManager';

const MIN_PHOTOS = 3;

const STEPS = ['Basics', 'Location', 'Facilities', 'Photos', 'Rooms', 'Policies', 'Review'] as const;
type Step = (typeof STEPS)[number];

interface Draft {
  propertyName: string;
  propertyType: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  country: string;
  directions: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  paymentOnArrival: string[];
  houseRules: string;
}

const EMPTY_DRAFT: Draft = {
  propertyName: '',
  propertyType: '',
  description: '',
  phone: '',
  whatsapp: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  country: 'Zambia',
  directions: '',
  latitude: null,
  longitude: null,
  amenities: [],
  images: [],
  checkInTime: '14:00',
  checkOutTime: '10:00',
  cancellationPolicy: 'moderate',
  childrenAllowed: true,
  petsAllowed: false,
  smokingAllowed: false,
  paymentOnArrival: ['cash', 'mobile_money'],
  houseRules: '',
};

const STEP_FIELDS: Partial<Record<Step, (keyof Draft)[]>> = {
  Basics: ['propertyName', 'propertyType', 'description', 'phone', 'whatsapp', 'email'],
  Location: ['addressLine1', 'addressLine2', 'city', 'stateProvince', 'country', 'directions', 'latitude', 'longitude'],
  Facilities: ['amenities'],
  Photos: ['images'],
  Policies: ['checkInTime', 'checkOutTime', 'cancellationPolicy', 'childrenAllowed', 'petsAllowed', 'smokingAllowed', 'paymentOnArrival', 'houseRules'],
};

const CHECKLIST_STEP: Record<string, Step> = {
  description: 'Basics',
  contact: 'Basics',
  city: 'Location',
  location: 'Location',
  photos: 'Photos',
  times: 'Policies',
  rooms: 'Rooms',
};

const TIME_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`;
});

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function draftFromProperty(p: any): Draft {
  return {
    propertyName: p.property_name ?? '',
    propertyType: p.property_type ?? '',
    description: p.description ?? '',
    phone: p.phone ?? '',
    whatsapp: p.whatsapp ?? '',
    email: p.email ?? '',
    addressLine1: p.address_line1 ?? '',
    addressLine2: p.address_line2 ?? '',
    city: p.city ?? '',
    stateProvince: p.state_province ?? '',
    country: p.country ?? 'Zambia',
    directions: p.directions ?? '',
    latitude: p.latitude,
    longitude: p.longitude,
    amenities: p.amenities ?? [],
    images: p.images ?? [],
    checkInTime: p.check_in_time ?? EMPTY_DRAFT.checkInTime,
    checkOutTime: p.check_out_time ?? EMPTY_DRAFT.checkOutTime,
    cancellationPolicy: p.cancellation_policy ?? 'moderate',
    childrenAllowed: p.children_allowed ?? true,
    petsAllowed: p.pets_allowed ?? false,
    smokingAllowed: p.smoking_allowed ?? false,
    paymentOnArrival: p.payment_on_arrival ?? [],
    houseRules: p.house_rules ?? '',
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const STATUS_COPY: Record<string, { label: string; className: string; detail: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700', detail: 'Only you can see this property. Submit it for review when it is ready.' },
  pending: { label: 'Under review', className: 'bg-yellow-100 text-yellow-800', detail: 'Our team is reviewing your property. You can keep editing in the meantime.' },
  approved: { label: 'Live', className: 'bg-green-100 text-green-800', detail: 'Guests can find and book this property.' },
  changes_requested: { label: 'Changes requested', className: 'bg-blue-100 text-blue-800', detail: 'Please update the property and submit it again.' },
  rejected: { label: 'Not approved', className: 'bg-red-100 text-red-800', detail: 'You can fix the issues below and submit again.' },
  suspended: { label: 'Suspended', className: 'bg-gray-200 text-gray-700', detail: 'This property is hidden from guests. Contact support for help.' },
};

const textInput = 'w-full bg-transparent border-b-2 border-black py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-lg font-medium mb-1">{label}</label>
      {hint && <p className="text-sm text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

export default function PropertyWizard({ initialPropertyId }: { initialPropertyId: number | null }) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<number | null>(initialPropertyId);
  const [step, setStep] = useState<Step>('Basics');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<string>('draft');
  const [approvalNote, setApprovalNote] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(initialPropertyId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLink, setMapLink] = useState('');
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(0);

  const applyManageView = useCallback((data: { property: unknown; checklist: ChecklistItem[]; canSubmit: boolean }) => {
    const p = data.property as { approval_status: string; approval_note: string | null };
    setDraft(draftFromProperty(data.property));
    setStatus(p.approval_status);
    setApprovalNote(p.approval_note);
    setChecklist(data.checklist);
    setCanSubmit(data.canSubmit);
  }, []);

  const refresh = useCallback(() => {
    if (!propertyId) return;
    fetch(`${API_URL}/api/properties/${propertyId}/manage`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Property not found');
        applyManageView(await r.json());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [propertyId, applyManageView]);

  useEffect(refresh, [refresh]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const toggleIn = (key: 'amenities' | 'paymentOnArrival', value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));

  const payloadFor = (s: Step): Record<string, unknown> => {
    const body: Record<string, unknown> = {};
    for (const field of STEP_FIELDS[s] ?? []) {
      body[field] = draft[field];
    }
    return body;
  };

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const nextStep = () => goTo(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]);

  const saveAndContinue = async () => {
    setError(null);

    if (step === 'Basics' && (!draft.propertyName.trim() || !draft.propertyType)) {
      setError('Add the property name and choose its type to continue.');
      return;
    }

    if (!STEP_FIELDS[step]) {
      nextStep();
      return;
    }

    setSaving(true);
    try {
      const isNew = propertyId === null;
      const res = await fetch(`${API_URL}/api/properties${isNew ? '' : `/${propertyId}`}`, {
        method: isNew ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(step)),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = data.fields ? Object.keys(data.fields).join(', ') : '';
        setError(`${data.error ?? 'Could not save'}${fieldErrors ? ` — check: ${fieldErrors}` : ''}`);
        return;
      }

      if (isNew) {
        const id = data.property.property_id as number;
        // Update the URL without remounting, so a refresh reopens this draft.
        window.history.replaceState(null, '', `/add-property/${id}`);
        setPropertyId(id);
      } else {
        applyManageView(data);
      }
      nextStep();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/${propertyId}/submit`, { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not submit');
        refresh();
        return;
      }
      applyManageView(data);
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser cannot share its location. Paste a map link instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({ ...d, latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) }));
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Allow location access, or paste a map link instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const useMapLink = () => {
    const coords = parseCoordinates(mapLink);
    if (!coords) {
      setError('No location found in that link. Short links (maps.app.goo.gl) need to be opened first — copy the full link from your browser, or paste the coordinates like -15.4167, 28.2833.');
      return;
    }
    setError(null);
    setDraft((d) => ({ ...d, latitude: Number(coords.lat.toFixed(6)), longitude: Number(coords.lng.toFixed(6)) }));
    setMapLink('');
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);
    setUploading(list.length);
    const urls: string[] = [];
    for (const file of list) {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', credentials: 'include', body }).catch(() => null);
      if (res?.ok) urls.push((await res.json()).url);
      setUploading((n) => n - 1);
    }
    if (urls.length < list.length) setError(`${list.length - urls.length} photo(s) failed to upload. Try them again.`);
    setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
  };

  const moveToCover = (index: number) =>
    setDraft((d) => ({ ...d, images: [d.images[index], ...d.images.filter((_, i) => i !== index)] }));

  const removePhoto = (index: number) => setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));

  if (loading) {
    return <div className="min-h-screen bg-yellow-50 p-8 text-gray-500">Loading...</div>;
  }

  const statusCopy = STATUS_COPY[status] ?? STATUS_COPY.draft;
  const isRoomBased = draft.propertyType !== 'event_center';
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/business-dashboard')} className="text-gray-600 hover:text-gray-800 mb-4">
          ← Back to dashboard
        </button>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{draft.propertyName || 'New property'}</h1>
            <p className="mt-1 text-gray-600">{statusCopy.detail}</p>
          </div>
          {propertyId && (
            <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${statusCopy.className}`}>{statusCopy.label}</span>
          )}
        </div>

        {approvalNote && (status === 'changes_requested' || status === 'rejected') && (
          <div className="mt-4 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Note from the Tusha team</p>
            <p className="text-blue-900">{approvalNote}</p>
          </div>
        )}

        {/* Step navigation */}
        <nav className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const reachable = propertyId !== null || i === 0;
            return (
              <button
                key={s}
                disabled={!reachable}
                onClick={() => goTo(s)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  s === step ? 'bg-black text-white' : reachable ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-white/50 text-gray-400'
                }`}
              >
                {i + 1}. {s}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 bg-white/70 rounded-3xl p-8 space-y-8">
          {step === 'Basics' && (
            <>
              <Field label="Property name">
                <input className={textInput} value={draft.propertyName} onChange={(e) => set('propertyName', e.target.value)} />
              </Field>

              <div>
                <p className="text-lg font-medium mb-3">What kind of place is it?</p>
                <div className="grid grid-cols-4 gap-3">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set('propertyType', t.value)}
                      className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors ${
                        draft.propertyType === t.value ? 'border-black bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Description" hint="What makes your place special? Mention the view, nearby attractions, and what guests can expect.">
                <textarea className={`${textInput} resize-none`} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">{draft.description.trim().length} characters (at least 30)</p>
              </Field>

              <div className="grid grid-cols-3 gap-8">
                <Field label="Phone number">
                  <input type="tel" className={textInput} value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0977 123 456" />
                </Field>
                <Field label="WhatsApp number">
                  <input type="tel" className={textInput} value={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="0977 123 456" />
                </Field>
                <Field label="Email (optional)">
                  <input type="email" className={textInput} value={draft.email} onChange={(e) => set('email', e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {step === 'Location' && (
            <>
              <div className="grid grid-cols-2 gap-8">
                <Field label="Street address" hint="Plot number and street, if there is one">
                  <input className={textInput} value={draft.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
                </Field>
                <Field label="Area / neighbourhood">
                  <input className={textInput} value={draft.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} placeholder="e.g. Kabulonga" />
                </Field>
                <Field label="Town or city">
                  <input className={textInput} value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Lusaka, Livingstone" />
                </Field>
                <Field label="Province">
                  <select className={textInput} value={draft.stateProvince} onChange={(e) => set('stateProvince', e.target.value)}>
                    <option value="">—</option>
                    {ZAMBIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Directions" hint="How would you explain it to a taxi driver? Landmarks help most.">
                <textarea
                  className={`${textInput} resize-none`}
                  rows={3}
                  value={draft.directions}
                  onChange={(e) => set('directions', e.target.value)}
                  placeholder="e.g. Off Great East Road, turn left after the Total filling station, third gate on the right (green gate)"
                />
              </Field>

              <div>
                <p className="text-lg font-medium mb-1">Pin it on the map</p>
                <p className="text-sm text-gray-500 mb-3">
                  If you are at the property now, use your current location. Otherwise, share the location from Google Maps and paste the link here.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="rounded-full bg-black text-white px-5 py-2.5 font-semibold disabled:opacity-50"
                  >
                    {locating ? 'Finding you...' : 'Use my current location'}
                  </button>
                  <span className="text-gray-400">or</span>
                  <input
                    className="flex-1 min-w-64 border-2 border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-yellow-500"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    placeholder="Paste a Google Maps link or coordinates"
                  />
                  <button type="button" onClick={useMapLink} className="rounded-full bg-yellow-400 hover:bg-yellow-500 px-5 py-2.5 font-semibold">
                    Use link
                  </button>
                </div>

                {draft.latitude !== null && draft.longitude !== null ? (
                  <div className="mt-4">
                    <iframe
                      title="Property location"
                      src={osmEmbedUrl(draft.latitude, draft.longitude)}
                      className="w-full h-72 rounded-2xl border-2 border-gray-200"
                    />
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span>Pinned at {draft.latitude}, {draft.longitude}</span>
                      <button type="button" onClick={() => setDraft((d) => ({ ...d, latitude: null, longitude: null }))} className="underline">
                        Remove pin
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-gray-100 p-6 text-center text-gray-500">No location pinned yet</p>
                )}
              </div>
            </>
          )}

          {step === 'Facilities' && (
            <div className="grid grid-cols-2 gap-8">
              {FACILITY_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-lg font-semibold mb-3">{group.title}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.amenities.includes(item.key)}
                          onChange={() => toggleIn('amenities', item.key)}
                          className="w-5 h-5 accent-yellow-500"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'Photos' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">Photos of the property</p>
                  <p className="text-sm text-gray-500">
                    At least {MIN_PHOTOS}. Show the outside, the entrance, common areas and the view. The first photo is the cover.
                  </p>
                </div>
                <label className="rounded-full bg-black text-white px-5 py-2.5 font-semibold cursor-pointer">
                  {uploading > 0 ? `Uploading ${uploading}...` : 'Add photos'}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
                </label>
              </div>

              {draft.images.length === 0 ? (
                <p className="rounded-2xl bg-gray-100 p-12 text-center text-gray-500">No photos yet</p>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {draft.images.map((src, i) => (
                    <div key={src} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-36 w-full rounded-xl object-cover" />
                      {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-black text-white text-xs px-2 py-0.5">Cover</span>}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {i !== 0 && (
                          <button type="button" onClick={() => moveToCover(i)} className="rounded-full bg-white/90 text-xs px-2 py-1 font-semibold">
                            Make cover
                          </button>
                        )}
                        <button type="button" onClick={() => removePhoto(i)} className="rounded-full bg-red-500 text-white text-xs px-2 py-1 font-semibold">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600">{draft.images.length} of at least {MIN_PHOTOS} photos</p>
            </>
          )}

          {step === 'Rooms' && propertyId && (
            isRoomBased ? (
              <RoomTypesManager propertyId={propertyId} onChange={refresh} />
            ) : (
              <p className="text-gray-600">Event centres don&apos;t need room types. Event space listings are coming soon.</p>
            )
          )}

          {step === 'Policies' && (
            <>
              <div className="grid grid-cols-2 gap-8">
                <Field label="Check-in from">
                  <select className={textInput} value={draft.checkInTime} onChange={(e) => set('checkInTime', e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Check-out by">
                  <select className={textInput} value={draft.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div>
                <p className="text-lg font-medium mb-3">Cancellation policy</p>
                <div className="grid grid-cols-3 gap-3">
                  {CANCELLATION_POLICIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('cancellationPolicy', p.value)}
                      className={`rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                        draft.cancellationPolicy === p.value ? 'border-black bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                      }`}
                    >
                      <p className="font-semibold">{p.label}</p>
                      <p className="text-sm text-gray-500">{p.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-lg font-medium mb-1">House rules</p>
                  {([
                    ['childrenAllowed', 'Children welcome'],
                    ['petsAllowed', 'Pets allowed'],
                    ['smokingAllowed', 'Smoking allowed'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} className="w-5 h-5 accent-yellow-500" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium mb-1">Guests can pay the balance at check-in by</p>
                  {PAYMENT_ON_ARRIVAL.map((m) => (
                    <label key={m.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.paymentOnArrival.includes(m.value)}
                        onChange={() => toggleIn('paymentOnArrival', m.value)}
                        className="w-5 h-5 accent-yellow-500"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Field label="Anything else guests should know? (optional)">
                <textarea
                  className={`${textInput} resize-none`}
                  rows={3}
                  value={draft.houseRules}
                  onChange={(e) => set('houseRules', e.target.value)}
                  placeholder="e.g. Quiet hours after 22:00. Visitors must sign in at the gate."
                />
              </Field>
            </>
          )}

          {step === 'Review' && (
            <>
              <div>
                <p className="text-lg font-semibold mb-3">Before you submit</p>
                <ul className="space-y-2">
                  {checklist.map((item) => (
                    <li key={item.key} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {item.done ? '✓' : '!'}
                        </span>
                        {item.label}
                      </span>
                      {!item.done && CHECKLIST_STEP[item.key] && (
                        <button type="button" onClick={() => goTo(CHECKLIST_STEP[item.key])} className="text-sm font-semibold underline">
                          Fix
                        </button>
                      )}
                      {!item.done && item.key === 'business_verification' && (
                        <a href="/business-dashboard/verification" className="text-sm font-semibold underline">
                          Verify business
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {['draft', 'changes_requested', 'rejected'].includes(status) ? (
                <button
                  type="button"
                  onClick={submitForReview}
                  disabled={!canSubmit || saving}
                  className="w-full rounded-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed py-4 text-xl font-bold"
                >
                  {saving ? 'Submitting...' : 'Submit for review'}
                </button>
              ) : (
                <p className="rounded-2xl bg-white p-4 text-gray-700">{statusCopy.detail}</p>
              )}
            </>
          )}

          {error && <p className="text-red-600 font-medium">{error}</p>}

          {step !== 'Review' && (
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => goTo(STEPS[Math.max(stepIndex - 1, 0)])}
                disabled={stepIndex === 0}
                className="rounded-full px-6 py-3 font-semibold text-gray-700 hover:bg-white disabled:invisible"
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveAndContinue}
                disabled={saving || uploading > 0}
                className="rounded-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 px-10 py-3 text-lg font-bold"
              >
                {saving ? 'Saving...' : STEP_FIELDS[step] ? 'Save & continue' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
