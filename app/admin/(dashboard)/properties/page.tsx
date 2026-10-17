"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { API_URL } from '@/lib/api';
import { fadeInVariants } from '@/lib/motion';

interface AdminProperty {
  property_id: number;
  property_name: string;
  property_type: string;
  city: string;
  approval_status: string;
  created_at: string;
  business_name: string;
}

const STATUSES = ['pending', 'approved', 'changes_requested', 'rejected', 'suspended'] as const;

const statusBadgeClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  changes_requested: 'bg-blue-100 text-blue-800',
  suspended: 'bg-gray-200 text-gray-700',
};

export default function AdminPropertiesPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('pending');
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const changeStatus = (next: (typeof STATUSES)[number]) => {
    if (next === status) return;
    setLoading(true);
    setStatus(next);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/admin/properties?approval_status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { properties: [] }))
      .then((data) => setProperties(data.properties ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Properties</h1>
      <p className="mt-1 text-sm text-gray-500">Review and approve property listings.</p>

      <div className="mt-6 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              status === s ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <motion.div
        key={status}
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="mt-6 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No {status.replace('_', ' ')} properties.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Property</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Business</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">City</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Submitted</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property, index) => (
                <tr
                  key={property.property_id}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="py-4 px-6">
                    <Link href={`/admin/properties/${property.property_id}`} className="font-medium text-gray-900 hover:underline">
                      {property.property_name}
                    </Link>
                  </td>
                  <td className="py-4 px-6">{property.business_name}</td>
                  <td className="py-4 px-6">{property.city}</td>
                  <td className="py-4 px-6 capitalize">{property.property_type.replace('_', ' ')}</td>
                  <td className="py-4 px-6">{new Date(property.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadgeClass[property.approval_status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {property.approval_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
