"use client";

/* eslint-disable @next/next/no-img-element -- private blob URLs, not optimisable */

import { useEffect, useState } from "react";

/**
 * Shows a private verification document in-page. The file is fetched with the
 * session cookie and displayed from a blob URL, so it never has a shareable
 * link and isn't left in the browser cache.
 */
export default function DocumentViewer({
  fileUrl,
  title,
  onClose,
}: {
  fileUrl: string;
  title: string;
  onClose: () => void;
}) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(fileUrl, { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setFile({ url: objectUrl, type: blob.type });
      } catch {
        if (!cancelled) setError("Couldn’t open this document.");
      }
    })();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
        <span className="truncate text-sm font-medium">{title}</span>
        <button onClick={onClose} aria-label="Close document" className="rounded-full p-2 hover:bg-white/10">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {error && <p className="text-white">{error}</p>}
        {!error && !file && <p className="text-gray-300">Loading…</p>}
        {file?.type === "application/pdf" && <iframe src={file.url} title={title} className="h-full w-full max-w-4xl rounded bg-white" />}
        {file && file.type !== "application/pdf" && <img src={file.url} alt={title} className="max-h-full max-w-full object-contain" />}
      </div>
    </div>
  );
}
