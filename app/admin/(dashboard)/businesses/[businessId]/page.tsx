"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, MessageSquare, X, Ban, Eye, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { fadeInVariants, staggerContainerVariants } from '@/lib/motion';
import DocumentViewer from '@/components/verification/DocumentViewer';
import { DOCUMENT_STATUS_BADGES, VerificationDocument, documentLabel, formatBytes } from '@/lib/verification';

interface BusinessDetail {
  business_id: number;
  business_name: string;
  business_type: string;
  status: string;
  tier: string;
  city: string;
  country: string;
  address_line1: string;
  state_province: string | null;
  business_phone: string | null;
  business_email: string | null;
  website: string | null;
  registration_number: string | null;
  tax_id: string | null;
  tpin: string | null;
  is_vat_registered: boolean;
  owner_full_name: string | null;
  owner_id_type: string | null;
  owner_id_number: string | null;
  kyc_submitted_at: string | null;
  review_note: string | null;
  agreement_version: string | null;
  agreement_accepted_at: string | null;
  created_at: string;
  users: { user_id: number; email: string; created_at: string };
  business_documents: VerificationDocument[];
  onboarding_events: { stage: string; status: string; note: string | null; created_at: string }[];
  properties: { property_id: number; property_name: string; approval_status: string }[];
}

type ActionStatus = 'active' | 'needs_info' | 'rejected' | 'suspended';

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-800',
  needs_info: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-200 text-gray-700',
  closed: 'bg-gray-200 text-gray-700',
};

const ACTION_LABELS: Record<ActionStatus, string> = {
  active: 'Approved',
  rejected: 'Rejected',
  needs_info: 'Marked as needs info',
  suspended: 'Suspended',
};

const STAGE_LABELS: Record<string, string> = {
  application: 'Application',
  documents: 'Documents',
  verification: 'Verification',
  agreement: 'Agreement',
  first_listing: 'First listing',
  live: 'Live',
};

const card = 'bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6';

function DocumentReview({ doc, onView, onReviewed }: { doc: VerificationDocument; onView: () => void; onReviewed: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badge = DOCUMENT_STATUS_BADGES[doc.status];

  const review = async (status: 'accepted' | 'rejected') => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/documents/${doc.document_id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to review the document');
        return;
      }
      setRejecting(false);
      setReason('');
      onReviewed();
    } catch {
      setError('Failed to review the document');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{documentLabel(doc.doc_type)}</p>
          <p className="truncate text-xs text-gray-500">
            {doc.original_name ?? 'untitled'} · {formatBytes(doc.size_bytes)} · {new Date(doc.uploaded_at).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
          <button onClick={onView} className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold hover:bg-white">
            <Eye size={14} /> View
          </button>
          {doc.status !== 'accepted' && (
            <button disabled={busy} onClick={() => review('accepted')} className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {busy && <Loader2 size={12} className="animate-spin" />} Accept
            </button>
          )}
          {doc.status !== 'rejected' && (
            <button disabled={busy} onClick={() => setRejecting((r) => !r)} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              Reject
            </button>
          )}
        </div>
      </div>
      {doc.status === 'rejected' && doc.reject_reason && <p className="mt-2 text-xs text-red-700">Rejected: {doc.reject_reason}</p>}
      {rejecting && (
        <div className="mt-3 flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason the owner will see, e.g. the photo is blurry"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
          />
          <button disabled={busy || !reason.trim()} onClick={() => review('rejected')} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Confirm reject
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}

export default function AdminBusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<ActionStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<ActionStatus | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<VerificationDocument | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const submitting = loadingAction !== null;

  const fetchBusiness = () => {
    return fetch(`${API_URL}/api/admin/businesses/${businessId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBusiness(data?.business ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  const needsNote = pendingAction === 'rejected' || pendingAction === 'needs_info';

  const submitAction = async (status: ActionStatus) => {
    if ((status === 'rejected' || status === 'needs_info') && !note.trim()) {
      setPendingAction(status);
      setError('A reason is required for this action.');
      return;
    }

    setLoadingAction(status);
    setError(null);
    setSuccessMessage(null);

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
      await fetchBusiness();
      setSuccessMessage(ACTION_LABELS[status]);
      setTimeout(() => setSuccessMessage((msg) => (msg === ACTION_LABELS[status] ? null : msg)), 3000);
    } catch {
      setError('Failed to update business status');
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!business) return <div className="text-gray-500">Business not found.</div>;

  const idAccepted = business.business_documents.some((d) => d.doc_type === 'national_id' && d.status === 'accepted');

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
          <span className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium capitalize ${STATUS_BADGE_CLASS[business.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {business.status.replace('_', ' ')}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <motion.div variants={fadeInVariants} className="col-span-2 space-y-6">
          <div className={card}>
            <h2 className="text-lg font-semibold tracking-tight mb-4">Owner identity</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Name on ID</dt><dd className="font-medium">{business.owner_full_name ?? '—'}</dd></div>
              <div>
                <dt className="text-gray-500">{business.owner_id_type === 'passport' ? 'Passport' : 'NRC'} number</dt>
                <dd className="font-medium">{business.owner_id_number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Partner agreement</dt>
                <dd className="font-medium">
                  {business.agreement_accepted_at
                    ? `${business.agreement_version} · accepted ${new Date(business.agreement_accepted_at).toLocaleDateString()}`
                    : 'Not accepted'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Submitted for verification</dt>
                <dd className="font-medium">{business.kyc_submitted_at ? new Date(business.kyc_submitted_at).toLocaleString() : 'Not yet'}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">Check the name and number against the ID document, and call the business phone before approving.</p>
          </div>

          <div className={card}>
            <h2 className="text-lg font-semibold tracking-tight mb-1">Documents</h2>
            <p className="mb-4 text-xs text-gray-500">Opening a document is recorded in the audit log.</p>
            {business.business_documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {business.business_documents.map((doc) => (
                  <DocumentReview key={doc.document_id} doc={doc} onView={() => setViewing(doc)} onReviewed={fetchBusiness} />
                ))}
              </ul>
            )}
          </div>

          <div className={card}>
            <h2 className="text-lg font-semibold tracking-tight mb-4">Business details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Account email</dt><dd className="font-medium">{business.users.email}</dd></div>
              <div><dt className="text-gray-500">Account created</dt><dd className="font-medium">{new Date(business.users.created_at).toLocaleDateString()}</dd></div>
              <div><dt className="text-gray-500">Business phone</dt><dd className="font-medium">{business.business_phone ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Business email</dt><dd className="font-medium">{business.business_email ?? '—'}</dd></div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium">{[business.address_line1, business.city, business.state_province].filter(Boolean).join(', ')}</dd>
              </div>
              <div><dt className="text-gray-500">Website</dt><dd className="font-medium">{business.website ?? '—'}</dd></div>
              <div><dt className="text-gray-500">PACRA registration</dt><dd className="font-medium">{business.registration_number ?? '—'}</dd></div>
              <div><dt className="text-gray-500">TPIN</dt><dd className="font-medium">{business.tpin ?? '—'}</dd></div>
              <div><dt className="text-gray-500">VAT registered</dt><dd className="font-medium">{business.is_vat_registered ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-gray-500">Tier</dt><dd className="font-medium capitalize">{business.tier}</dd></div>
            </dl>
          </div>

          <div className={card}>
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

        <motion.div variants={fadeInVariants} className="space-y-6">
          <div className={card}>
            <h2 className="text-lg font-semibold tracking-tight mb-3">Review</h2>
            {business.status === 'pending_verification' && !business.kyc_submitted_at && (
              <p className="mb-3 flex gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-900">
                <AlertTriangle size={16} className="shrink-0" />
                The owner hasn&apos;t submitted their verification yet. Only approve now if you&apos;ve verified them in person.
              </p>
            )}
            {!idAccepted && business.status !== 'active' && (
              <p className="mb-3 flex gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <AlertTriangle size={16} className="shrink-0" />
                No ID document accepted yet.
              </p>
            )}
            {business.review_note && (
              <p className="mb-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700"><strong>Last note:</strong> {business.review_note}</p>
            )}
            <AnimatePresence>
              {successMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
                >
                  <CheckCircle2 size={16} /> {successMessage}
                </motion.p>
              )}
            </AnimatePresence>
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
                {loadingAction === 'active' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loadingAction === 'active' ? 'Approving...' : 'Approve'}
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('rejected')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loadingAction === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                {loadingAction === 'rejected' ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('needs_info')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAction === 'needs_info' ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                {loadingAction === 'needs_info' ? 'Submitting...' : 'Needs info'}
              </button>
              <button
                disabled={submitting}
                onClick={() => submitAction('suspended')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {loadingAction === 'suspended' ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                {loadingAction === 'suspended' ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>

          {business.onboarding_events.length > 0 && (
            <div className={card}>
              <h2 className="text-lg font-semibold tracking-tight mb-3">Onboarding</h2>
              <ol className="space-y-2 text-sm">
                {business.onboarding_events.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {STAGE_LABELS[e.stage] ?? e.stage} <span className="text-gray-500">{e.status}</span>
                    </span>
                    <span className="text-gray-500">{new Date(e.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      </div>

      {viewing && (
        <DocumentViewer
          fileUrl={`${API_URL}/api/admin/documents/${viewing.document_id}/file`}
          title={`${business.business_name} — ${documentLabel(viewing.doc_type)}`}
          onClose={closeViewer}
        />
      )}
    </motion.div>
  );
}
