"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { STAGE_BANNERS } from '@/lib/verification';

/** Dashboard prompt to finish business verification. Hidden once the business is verified. */
export default function VerificationBanner() {
  const [state, setState] = useState<{ stage: string; remaining: number; note: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/verification`, { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setState({
          stage: data.stage,
          remaining: data.checklist.filter((i: { done: boolean }) => !i.done).length,
          note: data.business.review_note,
        });
      } catch {
        // The banner is a nudge; the dashboard works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || state.stage === 'verified') return null;

  const banner = STAGE_BANNERS[state.stage] ?? STAGE_BANNERS.not_submitted;
  const actionable = state.stage === 'not_submitted' || state.stage === 'needs_info';

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5 ${banner.className}`}>
      <div className="max-w-2xl">
        <p className="font-semibold text-gray-900">{banner.title}</p>
        <p className="mt-1 text-sm text-gray-700">
          {state.stage === 'needs_info' && state.note ? state.note : banner.body}
        </p>
        {actionable && state.remaining > 0 && (
          <p className="mt-1 text-xs text-gray-600">{state.remaining} step{state.remaining === 1 ? '' : 's'} left</p>
        )}
      </div>
      <Link
        href="/business-dashboard/verification"
        className="rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-yellow-500"
      >
        {actionable ? (state.stage === 'needs_info' ? 'Update details' : 'Verify business') : 'View details'}
      </Link>
    </div>
  );
}
