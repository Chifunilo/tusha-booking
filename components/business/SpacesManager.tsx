"use client";

/* eslint-disable @next/next/no-img-element -- Cloudinary URLs */

import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import {
  EventSpace,
  PACKAGE_GROUPS,
  SPACE_TYPES,
  SpaceType,
  layoutLine,
  packageLabel,
  spacePriceLine,
  spaceTypeLabel,
} from '@/lib/venues';

interface ManagedSpace extends EventSpace {
  enquiry_count: number;
}

interface SpaceForm {
  name: string;
  spaceType: SpaceType;
  description: string;
  maxCapacity: string;
  theatreCapacity: string;
  banquetCapacity: string;
  cocktailCapacity: string;
  minDelegates: string;
  sizeSqm: string;
  perDelegateRate: string;
  fullDayRate: string;
  halfDayRate: string;
  packageIncludes: string[];
  images: string[];
}

const EMPTY_FORM: SpaceForm = {
  name: '',
  spaceType: 'conference_room',
  description: '',
  maxCapacity: '',
  theatreCapacity: '',
  banquetCapacity: '',
  cocktailCapacity: '',
  minDelegates: '',
  sizeSqm: '',
  perDelegateRate: '',
  fullDayRate: '',
  halfDayRate: '',
  packageIncludes: [],
  images: [],
};

const str = (n: number | null) => (n === null ? '' : String(n));

function toForm(s: EventSpace): SpaceForm {
  return {
    name: s.space_name,
    spaceType: s.space_type as SpaceType,
    description: s.description ?? '',
    maxCapacity: String(s.max_capacity),
    theatreCapacity: str(s.theatre_capacity),
    banquetCapacity: str(s.banquet_capacity),
    cocktailCapacity: str(s.cocktail_capacity),
    minDelegates: str(s.min_delegates),
    sizeSqm: str(s.size_sqm),
    perDelegateRate: str(s.per_delegate_rate),
    fullDayRate: str(s.full_day_rate),
    halfDayRate: str(s.half_day_rate),
    packageIncludes: s.package_includes,
    images: s.images,
  };
}

const inputClass = (hasError?: boolean) =>
  `w-full bg-transparent border-b-2 ${hasError ? 'border-red-500' : 'border-black'} py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`;

function NumberField({
  label,
  hint,
  value,
  error,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-lg font-medium mb-1">{label}</label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass(!!error)} />
      {error ? <p className="text-red-500 text-sm mt-1">{error}</p> : hint && <p className="text-gray-500 text-sm mt-1">{hint}</p>}
    </div>
  );
}

/** Lists a property's event spaces and adds or edits them. Guests enquire; prices are a guide. */
export default function SpacesManager({ propertyId, onChange }: { propertyId: number; onChange?: () => void }) {
  const [spaces, setSpaces] = useState<ManagedSpace[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSpaces = useCallback(() => {
    fetch(`${API_URL}/api/spaces/property/${propertyId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { spaces: [] }))
      .then((data) => setSpaces(data.spaces ?? []));
  }, [propertyId]);

  useEffect(loadSpaces, [loadSpaces]);

  const set = <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const togglePackage = (key: string) =>
    set('packageIncludes', form.packageIncludes.includes(key) ? form.packageIncludes.filter((k) => k !== key) : [...form.packageIncludes, key]);

  const startEdit = (space: ManagedSpace) => {
    setEditingId(space.space_id);
    setForm(toForm(space));
    setErrors({});
    setNotice(null);
    document.getElementById('space-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const toggleActive = async (space: ManagedSpace) => {
    setListError(null);
    const res = await fetch(`${API_URL}/api/spaces/${space.space_id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !space.is_active }),
    });
    if (!res.ok) setListError((await res.json().catch(() => ({}))).error ?? 'Could not update this space');
    loadSpaces();
    onChange?.();
  };

  const uploadPhotos = async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', credentials: 'include', body });
        if (res.ok) urls.push((await res.json()).url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      if (urls.length < files.length) setErrors((prev) => ({ ...prev, images: 'Some photos could not be uploaded' }));
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const max = Number(form.maxCapacity);
    if (form.name.trim().length < 2) next.name = 'Give the space a name, e.g. Main Hall';
    if (!(max >= 1)) next.maxCapacity = 'How many guests fit at most?';
    for (const key of ['theatreCapacity', 'banquetCapacity', 'cocktailCapacity', 'minDelegates'] as const) {
      if (form[key] && max >= 1 && Number(form[key]) > max) next[key] = `Can't be more than ${max}`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Blank optional fields are sent as '' so the server clears them on edit.
      const body = {
        ...(editingId === null ? { propertyId } : {}),
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
      };
      const res = await fetch(`${API_URL}/api/spaces${editingId === null ? '' : `/${editingId}`}`, {
        method: editingId === null ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.field ? { [data.field]: data.error } : { form: data.error ?? 'Could not save this space' });
        return;
      }

      setNotice(editingId === null ? `Added ${data.space.space_name}` : `Saved ${data.space.space_name}`);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadSpaces();
      onChange?.();
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {spaces.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-gray-500 shadow-lg">No event spaces added yet.</p>
      ) : (
        <ul className="space-y-3">
          {spaces.map((s) => (
            <li key={s.space_id} className={`flex items-center gap-4 rounded-3xl bg-white p-4 shadow-lg ${s.is_active ? '' : 'opacity-60'}`}>
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                {s.images[0] && <img src={s.images[0]} alt={s.space_name} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {s.space_name} <span className="font-normal text-gray-500">· {spaceTypeLabel(s.space_type)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Up to {s.max_capacity} guests{layoutLine(s) ? ` · ${layoutLine(s)}` : ''}
                </p>
                <p className="text-sm text-gray-600">
                  {spacePriceLine(s) ?? 'Price on request'}
                  {s.enquiry_count > 0 && ` · ${s.enquiry_count} enquir${s.enquiry_count === 1 ? 'y' : 'ies'}`}
                  {!s.is_active && ' · hidden from guests'}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <button type="button" onClick={() => startEdit(s)} className="font-semibold underline">Edit</button>
                <button type="button" onClick={() => toggleActive(s)} className="text-gray-600 underline hover:text-black">
                  {s.is_active ? 'Hide' : 'Show'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {listError && <p className="mt-3 text-sm text-red-600">{listError}</p>}

      <form id="space-form" onSubmit={handleSubmit} className="mt-12 space-y-8 scroll-mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">{editingId === null ? 'Add an event space' : `Edit ${form.name || 'space'}`}</h2>
          {editingId !== null && (
            <button type="button" onClick={cancelEdit} className="text-sm font-semibold underline">Cancel</button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-16 gap-y-8 md:grid-cols-2">
          <div>
            <label className="block text-lg font-medium mb-1">Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Main Hall, Garden, Boardroom" className={inputClass(!!errors.name)} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Type of space</label>
            <select value={form.spaceType} onChange={(e) => set('spaceType', e.target.value as SpaceType)} className={inputClass()}>
              {SPACE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <NumberField label="Maximum guests" value={form.maxCapacity} error={errors.maxCapacity} onChange={(v) => set('maxCapacity', v)} />
          <NumberField
            label="Minimum guests (optional)"
            hint="Smaller groups are charged for this many"
            value={form.minDelegates}
            error={errors.minDelegates}
            onChange={(v) => set('minDelegates', v)}
          />
        </div>

        <div>
          <p className="text-lg font-medium">Capacity by layout (optional)</p>
          <p className="text-sm text-gray-500 mb-2">Planners search by how they’ll set the room up.</p>
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-4">
            <NumberField label="Theatre (rows)" value={form.theatreCapacity} error={errors.theatreCapacity} onChange={(v) => set('theatreCapacity', v)} />
            <NumberField label="Banquet (tables)" value={form.banquetCapacity} error={errors.banquetCapacity} onChange={(v) => set('banquetCapacity', v)} />
            <NumberField label="Standing" value={form.cocktailCapacity} error={errors.cocktailCapacity} onChange={(v) => set('cocktailCapacity', v)} />
            <NumberField label="Size (m²)" value={form.sizeSqm} error={errors.sizeSqm} onChange={(v) => set('sizeSqm', v)} />
          </div>
        </div>

        <div>
          <p className="text-lg font-medium">Guide prices in Kwacha (optional)</p>
          <p className="text-sm text-gray-500 mb-2">
            Guests send you an enquiry and you agree the final price with them. Leave these blank to show “Price on request”.
          </p>
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
            <NumberField label="Per person per day" hint="Day-delegate package" value={form.perDelegateRate} error={errors.perDelegateRate} onChange={(v) => set('perDelegateRate', v)} />
            <NumberField label="Full-day hire" value={form.fullDayRate} error={errors.fullDayRate} onChange={(v) => set('fullDayRate', v)} />
            <NumberField label="Half-day hire" value={form.halfDayRate} error={errors.halfDayRate} onChange={(v) => set('halfDayRate', v)} />
          </div>
        </div>

        <div>
          <p className="text-lg font-medium mb-3">What’s included</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {PACKAGE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 font-semibold text-gray-700">{group.title}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <label key={item.key} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.packageIncludes.includes(item.key)}
                        onChange={() => togglePackage(item.key)}
                        className="h-4 w-4 accent-yellow-500"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium mb-1">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="What makes this space good for events? Natural light, a view, a separate entrance…"
            className={`${inputClass(!!errors.description)} resize-none`}
          />
        </div>

        <div>
          <p className="text-lg font-medium mb-2">Photos</p>
          <div className="flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={i} className="relative h-24 w-32 overflow-hidden rounded-xl bg-gray-100">
                <img src={src} alt={`Space photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            ))}
            <label className="flex h-24 w-32 cursor-pointer items-center justify-center rounded-xl bg-gray-200 text-sm font-semibold hover:bg-gray-300">
              {uploading ? 'Uploading…' : '+ Add photos'}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length) uploadPhotos(files);
                }}
              />
            </label>
          </div>
          {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          {form.packageIncludes.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">Includes: {form.packageIncludes.map(packageLabel).join(', ')}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-4">
          {notice && <p className="text-green-700 font-medium">{notice}</p>}
          {errors.form && <p className="text-red-600 font-medium">{errors.form}</p>}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold text-xl px-10 py-5 rounded-full transition-colors"
          >
            {submitting ? 'Saving…' : editingId === null ? 'Add space' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
