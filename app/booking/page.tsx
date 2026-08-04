import { Suspense } from 'react';
import BookingPageContent from './BookingPageContent';

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-xl">Loading...</p>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}