"use client";

import React, { useEffect } from 'react';

export const inputClass =
  'w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 focus:border-yellow-500 focus:outline-none';

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

/** A bottom sheet on phones, a centred dialog on wider screens. Esc and the backdrop close it. */
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="px-1 text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
