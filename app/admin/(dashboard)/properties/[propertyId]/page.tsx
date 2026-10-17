"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Check, X, MessageSquare, Ban } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { fadeInVariants, staggerContainerVariants } from '@/lib/motion';

interface PropertyDetail {
  property_id: number;
  property_name: string;
  property_type: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  country: string;
  description: string | null;
  amenities: string[];
  images: string[];
  phone: string | null;
  email: string | null;
  approval_status: string;
  approval_note: string | null;
  businesses: {
    business_id: number;
    business_name: string;
    business_type: string;
    status: string;
    tier: string;
    created_at: string;
    business_documents: { document_id: number; doc_type: string; status: string; uploaded_at: string }[];
  };
  rooms: { room_id: number; room_number: string; room_type: string; base_price: string; is_active: boolean }[];
}

type ActionStatus = 'approved' | 'rejected' | 'changes_requested' | 'suspended';

function accountAge(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'}`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? '' : 's'}`;
}

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<ActionStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = () => {
    fetch(`${API_URL}/api/admin/properties/${propertyId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProperty(data?.property ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProperty, [propertyId]);

  const needsNote = pendingAction === 'rejected' || pendingAction === 'changes_requested';

  const submitAction = async (status: ActionStatus) => {
    if ((status === 'rejected' || status === 'changes_requested') && !note.trim()) {
      setPendingAction(status);
      setError('A reason is required for this action.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Failed to update property status');
        return;
      }

      setNote('');
      setPendingAction(null);
      fetchProperty();
    } catch {
      setError('Failed to update property status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!property) return <div className="text-gray-500">Property not found.</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="space-y-6">
      <motion.div variants={fadeInVariants}>
        <button
          onClick={() => router.push('/admin/properties')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to properties
        </button>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{property.property_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {property.city}, {property.country} &middot; {property.property_type.replace('_', ' ')}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800 capitalize">
            {property.approval_status.replace('_', ' ')}
          </span>
        </div>
      </motion.div>

      {/* Image gallery */}
      <motion.div variants={fadeInVariants}>
        {property.images.length === 0 ? (
          <div className="bg-gray-100 rounded-2xl p-12 text-center text-gray-400">No images uploaded</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {property.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="h-40 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Details */}
        <motion.div variants={fadeInVariants} className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Address</dt><dd className="font-medium">{property.address_line1}{property.address_line2 ? `, ${property.address_line2}` : ''}</dd></div>
              <div><dt className="text-gray-500">State/Province</dt><dd className="font-medium">{property.state_province ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{property.phone ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{property.email ?? '—'}</dd></div>
              <div className="col-span-2"><dt className="text-gray-500">Amenities</dt><dd className="font-medium">{property.amenities.join(', ') || '—'}</dd></div>
              <div className="col-span-2"><dt className="text-gray-500">Description</dt><dd className="font-medium">{property.description ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Rooms ({property.rooms.length})</h2>
            {property.rooms.length === 0 ? (
              <p className="text-sm text-gray-400">No rooms added yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2">Room</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {property.rooms.map((room) => (
                    <tr key={room.room_id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2">{room.room_number}</td>
                      <td className="py-2">{room.room_type}</td>
                      <td className="py-2">ZMW{room.base_price}</td>
                      <td className="py-2">{room.is_active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Business + actions */}
        <motion.div variants={fadeInVariants} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Business</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{property.businesses.business_name}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="font-medium capitalize">{property.businesses.business_type}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd className="font-medium capitalize">{property.businesses.status.replace('_', ' ')}</dd></div>
              <div><dt className="text-gray-500">Tier</dt><dd className="font-medium capitalize">{property.businesses.tier}</dd></div>
              <div><dt className="text-gray-500">Account age</dt><dd className="font-medium">{accountAge(property.businesses.created_at)}</dd></div>
              <div>
                <dt className="text-gray-500">Documents</dt>
                <dd className="font-medium">
                  {property.businesses.business_documents.length === 0
                    ? '—'
                    : property.businesses.business_documents.map((doc) => (
                        <span key={doc.document_id} className="mr-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                          {doc.doc_type.replace('_', ' ')}: {doc.status}
                        </span>
                      ))}
                </dd>
              </div>
            </dl>
          </div>

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
                onClick={() => submitAction('approved')}
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
                onClick={() => submitAction('changes_requested')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <MessageSquare size={16} /> Request changes
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
