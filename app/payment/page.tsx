import { Suspense } from 'react';
import PaymentPageContent from './PaymentPageContent';


export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-xl">Loading...</p>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}