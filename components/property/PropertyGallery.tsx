"use client";

/* eslint-disable @next/next/no-img-element -- Cloudinary URLs, not configured for next/image */

import { useCallback, useEffect, useState } from "react";

/**
 * Cover photo plus two stacked photos to its right; the bottom one shows how
 * many more there are. Any photo opens the full-screen viewer at that photo.
 */
export default function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const [viewing, setViewing] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 md:h-[420px]">
        No photos yet
      </div>
    );
  }

  const thumbs = images.slice(1, 3);
  const remaining = images.length - 3;

  return (
    <>
      <div className={`grid h-64 gap-2 md:h-[420px] ${thumbs.length > 0 ? "md:grid-cols-3 md:grid-rows-2" : ""}`}>
        <button
          onClick={() => setViewing(0)}
          className="relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2"
        >
          <img src={images[0]} alt={name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
          {/* Phones only see the cover, so the count goes on it there. */}
          {images.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white md:hidden">
              1 / {images.length}
            </span>
          )}
        </button>
        {thumbs.map((src, i) => {
          const isLast = i === 1;
          return (
            <button
              key={i}
              onClick={() => setViewing(i + 1)}
              aria-label={isLast && remaining > 0 ? `View ${remaining} more photos` : undefined}
              className={`group relative hidden overflow-hidden rounded-2xl md:block ${thumbs.length === 1 ? "md:row-span-2" : ""}`}
            >
              <img src={src} alt={`${name} photo ${i + 2}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              {isLast && remaining > 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-3xl font-bold text-white transition-colors group-hover:bg-black/60">
                  +{remaining}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {images.length > 1 && (
        <button
          onClick={() => setViewing(0)}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Show all {images.length} photos
        </button>
      )}

      {viewing !== null && (
        <Lightbox images={images} name={name} index={viewing} onChange={setViewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}

function Lightbox({
  images,
  name,
  index,
  onChange,
  onClose,
}: {
  images: string[];
  name: string;
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const step = useCallback(
    (delta: number) => onChange((index + delta + images.length) % images.length),
    [index, images.length, onChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm">{index + 1} / {images.length}</span>
        <button onClick={onClose} aria-label="Close photos" className="rounded-full p-2 hover:bg-white/10">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 pb-4 md:px-16">
        <img src={images[index]} alt={`${name} photo ${index + 1}`} className="max-h-full max-w-full object-contain" />
        {images.length > 1 && (
          <>
            <button onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 md:left-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 md:right-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
