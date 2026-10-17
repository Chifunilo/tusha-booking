"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { fadeInVariants } from '@/lib/motion';

interface AuditEntry {
  audit_id: string;
  action: string;
  entity_type: string;
  entity_id: number;
  reason: string | null;
  created_at: string;
  admin_email: string;
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [adminId, setAdminId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // The inputs above are drafts; only the filters applied via "Apply" drive the fetch.
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    for (const [key, value] of Object.entries(appliedFilters)) {
      if (value) params.set(key, value);
    }

    fetch(`${API_URL}/api/admin/audit?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setEntries(data.entries ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, appliedFilters]);

  const goToPage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  const applyFilters = () => {
    setLoading(true);
    setPage(1);
    setAppliedFilters({ adminId, action, entityType, dateFrom, dateTo });
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Audit Log</h1>
      <p className="mt-1 text-sm text-gray-500">Every admin action, read-only.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Admin ID</label>
          <input value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="e.g. 3" className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. property.approved" className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Entity type</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400">
            <option value="">All</option>
            <option value="property">Property</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400" />
        </div>
        <button
          onClick={applyFilters}
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Apply
        </button>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className="mt-6 bg-white rounded-3xl shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No audit entries match these filters.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Timestamp</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Admin</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Action</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Entity</th>
                <th className="text-left py-4 px-6 text-sm font-semibold tracking-tight">Reason</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.audit_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-6 whitespace-nowrap text-sm">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="py-3 px-6 text-sm">{entry.admin_email}</td>
                  <td className="py-3 px-6 text-sm font-mono">{entry.action}</td>
                  <td className="py-3 px-6 text-sm">{entry.entity_type} #{entry.entity_id}</td>
                  <td className="py-3 px-6 text-sm text-gray-600">{entry.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(Math.max(1, page - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
