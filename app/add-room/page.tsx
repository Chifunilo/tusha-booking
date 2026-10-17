"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import RoomTypesManager from '@/components/business/RoomTypesManager';

interface Property {
  property_id: number;
  property_name: string;
}

export default function ManageRoomTypes() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.user_type !== 'business') {
      router.push('/');
      return;
    }

    fetch(`${API_URL}/api/properties/user/${user.user_id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { properties: [] }))
      .then((data) => {
        const list: Property[] = data.properties ?? [];
        setProperties(list);
        if (list.length > 0) setPropertyId(list[0].property_id);
      })
      .catch(() => setProperties([]));
  }, [router]);

  if (properties === null) {
    return <div className="min-h-screen bg-yellow-50 p-8 text-gray-500">Loading...</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">No properties yet</h2>
          <p className="text-gray-600 mb-6">Add your property first, then describe the rooms you offer.</p>
          <button
            onClick={() => router.push('/add-property')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Add property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 mb-4">← Back</button>
        <h1 className="text-5xl font-bold text-gray-800">Rooms</h1>
        <p className="mt-2 text-gray-600">
          Describe each kind of room once and say how many you have — you don&apos;t need to add rooms one by one.
        </p>

        <div className="mt-8 mb-8 max-w-md">
          <label className="block text-sm font-medium text-gray-600 mb-1">Property</label>
          <select
            value={propertyId ?? ''}
            onChange={(e) => setPropertyId(Number(e.target.value))}
            className="w-full bg-white border-2 border-black rounded-lg py-3 px-4 text-lg focus:outline-none focus:border-yellow-500"
          >
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>{p.property_name}</option>
            ))}
          </select>
        </div>

        {propertyId && <RoomTypesManager key={propertyId} propertyId={propertyId} />}
      </div>
    </div>
  );
}
