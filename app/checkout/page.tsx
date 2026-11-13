import { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500 text-xl">Loading...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
