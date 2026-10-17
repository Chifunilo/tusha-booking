"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Check, MessageSquare, X, Ban } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { fadeInVariants, staggerContainerVariants } from '@/lib/motion';

interface BusinessDetail {
  business_id: number;
  business_name: string;
  business_type: string;
  status: string;
  tier: string;
  city: string;
  country: string;
  address_line1: string;
  website: string | null;
  registration_number: string | null;
  tax_id: string | null;
  tpin: string | null;
  is_vat_registered: boolean;
  created_at: string;
  users: { user_id: number; email: string; created_at: string };
  business_documents: { document_id: number; doc_type: string; status: string; original_name: string | null; uploaded_at: string; reject_reason: string | null }[];
  properties: { property_id: number; property_name: string; approval_status: string }[];
}

type ActionStatus = 'active' | 'needs_info' | 'rejected' | 'suspended';

export default function AdminBusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<ActionStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = () => {
    fetch(`${API_URL}/api/admin/businesses/${businessId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBusiness(data?.business ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBusiness, [businessId]);

  const needsNote = pendingAction === 'rejected' || pendingAction === 'needs_info';

  const submitAction = async (status: ActionStatus) => {
    if ((status === 'rejected' || status === 'needs_info') && !note.trim()) {
      setPendingAction(status);
      setError('A reason is required for this action.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/businesses/${businessId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Failed to update business status');
        return;
      }

      setNote('');
      setPendingAction(null);
      fetchBusiness();
    } catch {
      setError('Failed to update business status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!business) return <div className="text-gray-500">Business not found.</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="space-y-6">
      <motion.div variants={fadeInVariants}>
        <button
          onClick={() => router.push('/admin/businesses')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to businesses
        </button>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{business.business_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {business.city}, {business.country} &middot; {business.business_type}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800 capitalize">
            {business.status.replace('_', ' ')}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <motion.div variants={fadeInVariants} className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Business details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Owner email</dt><dd className="font-medium">{business.users.email}</dd></div>
              <div><dt className="text-gray-500">Account created</dt><dd className="font-medium">{new Date(business.users.created_at).toLocaleDateString()}</dd></div>
              <div><dt className="text-gray-500">Address</dt><dd className="font-medium">{business.address_line1}</dd></div>
              <div><dt className="text-gray-500">Website</dt><dd className="font-medium">{business.website ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Registration number</dt><dd className="font-medium">{business.registration_number ?? '—'}</dd></div>
              <div><dt className="text-gray-500">TPIN</dt><dd className="font-medium">{business.tpin ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Tax ID</dt><dd className="font-medium">{business.tax_id ?? '—'}</dd></div>
              <div><dt className="text-gray-500">VAT registered</dt><dd className="font-medium">{business.is_vat_registered ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-gray-500">Tier</dt><dd className="font-medium capitalize">{business.tier}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Documents</h2>
            {business.business_documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {business.business_documents.map((doc) => (
                  <li key={doc.document_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                    <span className="capitalize">{doc.doc_type.replace('_', ' ')} — {doc.original_name ?? 'untitled'}</span>
                    <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs capitalize">{doc.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Properties ({business.properties.length})</h2>
            {business.properties.length === 0 ? (
              <p className="text-sm text-gray-400">No properties submitted yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {business.properties.map((property) => (
                  <li key={property.property_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                    <Link href={`/admin/properties/${property.property_id}`} className="font-medium hover:underline">
                      {property.property_name}
                    </Link>
                    <span className="capitalize text-gray-500">{property.approval_status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInVariants}>
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-3">Review</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={needsNote ? 'Reason (required)...' : 'Note (optional)...'}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                disabled={submitting}
                onClick={() => submitAction('active')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <Check size={16} /> Approve
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('rejected')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <X size={16} /> Reject
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('needs_info')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <MessageSquare size={16} /> Needs info
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('suspended')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                <Ban size={16} /> Suspend
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
