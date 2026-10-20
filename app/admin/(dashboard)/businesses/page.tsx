"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { API_URL } from '@/lib/api';
import { fadeInVariants } from '@/lib/motion';

interface AdminBusiness {
  business_id: number;
  business_name: string;
  business_type: string;
  city: string;
  status: string;
  tier: string;
  onboarding_source: string | null;
  kyc_submitted_at: string | null;
  document_count: number;
  created_at: string;
  owner_email: string;
}

const STATUSES = ['pending_verification', 'active', 'needs_info', 'rejected', 'suspended', 'closed'] as const;

const statusBadgeClass: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  needs_info: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-200 text-gray-700',
  closed: 'bg-gray-200 text-gray-700',
};

export default function AdminBusinessesPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('pending_verification');
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  const changeStatus = (next: (typeof STATUSES)[number]) => {
    if (next === status) return;
    setLoading(true);
    setStatus(next);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/admin/businesses?status=${status}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => setBusinesses(data.businesses ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Businesses</h1>
      <p className="mt-1 text-sm text-gray-500">Review and verify business accounts.</p>

      <div className="mt-6 flex flex-wrap gap-2">
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
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No businesses with status &quot;{status.replace('_', ' ')}&quot;.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Business</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Owner</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">City</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Submitted</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business, index) => (
                <tr
                  key={business.business_id}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="py-4 px-6">
                    <Link href={`/admin/businesses/${business.business_id}`} className="font-medium text-gray-900 hover:underline">
                      {business.business_name}
                    </Link>
                  </td>
                  <td className="py-4 px-6">{business.owner_email}</td>
                  <td className="py-4 px-6">{business.city}</td>
                  <td className="py-4 px-6 capitalize">{business.business_type}</td>
                  <td className="py-4 px-6">
                    {business.kyc_submitted_at ? (
                      new Date(business.kyc_submitted_at).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400">Not yet · signed up {new Date(business.created_at).toLocaleDateString()}</span>
                    )}
                    <span className="block text-xs text-gray-500">
                      {business.document_count} document{business.document_count === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadgeClass[business.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {business.status.replace('_', ' ')}
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
