"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { MEAL_PLANS, MealPlan, formatZMW, mealPlanLabel } from '@/lib/roomTypes';

interface RoomType {
  room_type_id: number;
  name: string;
  max_occupancy: number;
  num_beds: number;
  bed_type: string | null;
  meal_plan: string;
  price: string;
  non_resident_price: string | null;
  is_active: boolean;
  unit_count: number;
}

interface RoomTypeForm {
  name: string;
  quantity: string;
  maxOccupancy: string;
  numBeds: string;
  bedType: string;
  sizeSqm: string;
  mealPlan: MealPlan;
  price: string;
  hasNonResidentRate: boolean;
  nonResidentPrice: string;
  amenities: string;
  description: string;
}

const EMPTY_FORM: RoomTypeForm = {
  name: '',
  quantity: '1',
  maxOccupancy: '2',
  numBeds: '1',
  bedType: '',
  sizeSqm: '',
  mealPlan: 'room_only',
  price: '',
  hasNonResidentRate: false,
  nonResidentPrice: '',
  amenities: '',
  description: '',
};

const NAME_SUGGESTIONS = ['Single Room', 'Double Room', 'Twin Room', 'Family Room', 'Chalet', 'Executive Suite', 'Self-contained Room', 'Entire Apartment', 'Entire House'];
const BED_TYPES = ['Single', 'Double', 'Queen', 'King', 'Bunk bed'];

const inputClass = (hasError?: boolean) =>
  `w-full bg-transparent border-b-2 ${hasError ? 'border-red-500' : 'border-black'} py-3 text-lg focus:outline-none focus:border-yellow-500 transition-colors`;

/** Lists a property's room types (with quantity / hide controls) and adds new ones. */
export default function RoomTypesManager({
  propertyId,
  onChange,
}: {
  propertyId: number;
  onChange?: () => void;
}) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<RoomTypeForm>(EMPTY_FORM);
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadRoomTypes = useCallback(() => {
    fetch(`${API_URL}/api/room-types/property/${propertyId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { roomTypes: [] }))
      .then((data) => {
        const list: RoomType[] = data.roomTypes ?? [];
        setRoomTypes(list);
        setQuantityDrafts(Object.fromEntries(list.map((rt) => [rt.room_type_id, String(rt.unit_count)])));
      });
  }, [propertyId]);

  useEffect(loadRoomTypes, [loadRoomTypes]);

  const set = <K extends keyof RoomTypeForm>(key: K, value: RoomTypeForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateRoomType = async (roomTypeId: number, body: Record<string, unknown>) => {
    setListError(null);
    const res = await fetch(`${API_URL}/api/room-types/${roomTypeId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setListError(data.error ?? 'Could not update this room type');
    }
    loadRoomTypes();
    onChange?.();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give this room type a name';
    if (!(Number(form.quantity) >= 1)) next.quantity = 'How many of these rooms do you have?';
    if (!(Number(form.maxOccupancy) >= 1)) next.maxOccupancy = 'How many guests can sleep in it?';
    if (!(Number(form.numBeds) >= 1)) next.numBeds = 'Number of beds is required';
    if (!(Number(form.price) > 0)) next.price = 'Enter the nightly price';
    if (form.hasNonResidentRate && !(Number(form.nonResidentPrice) > 0)) {
      next.nonResidentPrice = 'Enter the non-resident price, or untick the option';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const image of images) {
        const body = new FormData();
        body.append('file', image);
        const upload = await fetch(`${API_URL}/api/upload`, { method: 'POST', credentials: 'include', body });
        if (upload.ok) imageUrls.push((await upload.json()).url);
      }

      const res = await fetch(`${API_URL}/api/room-types`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          name: form.name.trim(),
          quantity: Number(form.quantity),
          maxOccupancy: Number(form.maxOccupancy),
          numBeds: Number(form.numBeds),
          bedType: form.bedType || undefined,
          sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
          mealPlan: form.mealPlan,
          price: Number(form.price),
          nonResidentPrice: form.hasNonResidentRate ? Number(form.nonResidentPrice) : undefined,
          amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
          description: form.description.trim() || undefined,
          images: imageUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors({ form: data.error ?? 'Could not add this room type' });
        return;
      }

      setNotice(`Added ${data.roomType.unit_count} × ${data.roomType.name}`);
      setForm(EMPTY_FORM);
      setImages([]);
      loadRoomTypes();
      onChange?.();
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {roomTypes.length === 0 ? (
          <p className="p-8 text-gray-500">No rooms added for this property yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white text-left text-sm">
              <tr>
                <th className="py-4 px-6 font-semibold">Room type</th>
                <th className="py-4 px-6 font-semibold">Sleeps</th>
                <th className="py-4 px-6 font-semibold">Meals</th>
                <th className="py-4 px-6 font-semibold">Price / night</th>
                <th className="py-4 px-6 font-semibold">How many</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((rt, i) => (
                <tr key={rt.room_type_id} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${rt.is_active ? '' : 'opacity-50'}`}>
                  <td className="py-4 px-6">
                    <p className="font-semibold">{rt.name}</p>
                    <p className="text-sm text-gray-500">
                      {rt.num_beds} bed{rt.num_beds === 1 ? '' : 's'}{rt.bed_type ? ` · ${rt.bed_type}` : ''}
                      {!rt.is_active && ' · hidden from guests'}
                    </p>
                  </td>
                  <td className="py-4 px-6">{rt.max_occupancy}</td>
                  <td className="py-4 px-6">{mealPlanLabel(rt.meal_plan)}</td>
                  <td className="py-4 px-6">
                    <p className="font-semibold">{formatZMW(rt.price)}</p>
                    {rt.non_resident_price && (
                      <p className="text-sm text-gray-500">Non-resident {formatZMW(rt.non_resident_price)}</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        aria-label={`Number of ${rt.name} rooms`}
                        value={quantityDrafts[rt.room_type_id] ?? ''}
                        onChange={(e) => setQuantityDrafts((d) => ({ ...d, [rt.room_type_id]: e.target.value }))}
                        className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-500"
                      />
                      {quantityDrafts[rt.room_type_id] !== String(rt.unit_count) && (
                        <button
                          type="button"
                          onClick={() => updateRoomType(rt.room_type_id, { quantity: Number(quantityDrafts[rt.room_type_id]) })}
                          className="text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 rounded-full px-3 py-1"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => updateRoomType(rt.room_type_id, { isActive: !rt.is_active })}
                      className="text-sm text-gray-600 hover:text-black underline"
                    >
                      {rt.is_active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {listError && <p className="px-6 py-3 text-sm text-red-600 border-t border-gray-100">{listError}</p>}
      </section>

      <form onSubmit={handleSubmit} className="mt-12 space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Add a room type</h2>

        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div>
            <label className="block text-xl font-medium mb-2">Name</label>
            <input
              list="room-type-names"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Double Room, River Chalet"
              className={inputClass(!!errors.name)}
            />
            <datalist id="room-type-names">
              {NAME_SUGGESTIONS.map((n) => <option key={n} value={n} />)}
            </datalist>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">How many of these do you have?</label>
            <input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className={inputClass(!!errors.quantity)} />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Sleeps (max guests)</label>
            <input type="number" min={1} value={form.maxOccupancy} onChange={(e) => set('maxOccupancy', e.target.value)} className={inputClass(!!errors.maxOccupancy)} />
            {errors.maxOccupancy && <p className="text-red-500 text-sm mt-1">{errors.maxOccupancy}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-medium mb-2">Beds</label>
              <input type="number" min={1} value={form.numBeds} onChange={(e) => set('numBeds', e.target.value)} className={inputClass(!!errors.numBeds)} />
              {errors.numBeds && <p className="text-red-500 text-sm mt-1">{errors.numBeds}</p>}
            </div>
            <div>
              <label className="block text-xl font-medium mb-2">Bed type</label>
              <select value={form.bedType} onChange={(e) => set('bedType', e.target.value)} className={inputClass()}>
                <option value="">—</option>
                {BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Price per night (ZMW)</label>
            <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass(!!errors.price)} />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasNonResidentRate}
                onChange={(e) => set('hasNonResidentRate', e.target.checked)}
                className="w-4 h-4 accent-yellow-500"
              />
              Charge non-residents (international guests) a different rate
            </label>
            {form.hasNonResidentRate && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Non-resident price per night (ZMW)</label>
                <input type="number" min={0} step="0.01" value={form.nonResidentPrice} onChange={(e) => set('nonResidentPrice', e.target.value)} className={inputClass(!!errors.nonResidentPrice)} />
                {errors.nonResidentPrice && <p className="text-red-500 text-sm mt-1">{errors.nonResidentPrice}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xl font-medium mb-2">Size (m², optional)</label>
            <input type="number" min={0} value={form.sizeSqm} onChange={(e) => set('sizeSqm', e.target.value)} className={inputClass()} />
          </div>
        </div>

        <div>
          <p className="text-xl font-medium mb-3">Meals included in the price</p>
          <div className="grid grid-cols-4 gap-3">
            {MEAL_PLANS.map((plan) => (
              <button
                type="button"
                key={plan.value}
                onClick={() => set('mealPlan', plan.value)}
                className={`text-left rounded-2xl border-2 px-4 py-3 transition-colors ${
                  form.mealPlan === plan.value ? 'border-black bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                }`}
              >
                <p className="font-semibold">{plan.label}</p>
                <p className="text-sm text-gray-500">{plan.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xl font-medium mb-2">Room amenities</label>
          <input value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="Aircon, Ensuite, DStv, Fan (comma separated)" className={inputClass()} />
        </div>

        <div>
          <label className="block text-xl font-medium mb-2">Description (optional)</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${inputClass()} resize-none`} />
        </div>

        <div className="flex items-center justify-between gap-6">
          <label className="bg-gray-200 hover:bg-gray-300 px-8 py-5 rounded-2xl cursor-pointer transition-colors">
            <span className="text-lg font-semibold">Add photos{images.length > 0 ? ` (${images.length})` : ''}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => setImages((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
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
              {submitting ? 'Saving...' : 'Add room type'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
