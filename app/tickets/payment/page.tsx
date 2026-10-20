import { Suspense } from 'react';
import TicketPaymentPageContent from './TicketPaymentPageContent';

export default function TicketPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-xl">Loading...</p>
      </div>
    }>
      <TicketPaymentPageContent />
    </Suspense>
  );
}
