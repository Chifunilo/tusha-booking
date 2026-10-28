"use client";

import React, { useState, useEffect } from 'react';
import { NavTab } from '@/lib/nav';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingHeader from '@/components/customer/BookingHeader';
import PaymentCardFields from '@/components/payment/PaymentCardFields';
import { API_URL } from '@/lib/api';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get booking details from URL params
  const propertyId = searchParams.get('propertyId');
  const roomTypeId = searchParams.get('roomTypeId');
  const residency = searchParams.get('residency') === 'non_resident' ? 'non_resident' : 'resident';
  const guests = searchParams.get('guests');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  // Payment form state
  const [paymentDetails, setPaymentDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expirationDate: '',
    cvc: '',
  });

  const validateForm = () => {
    if (!paymentDetails.cardholderName.trim()) {
      alert('Please enter cardholder name');
      return false;
    }
    if (paymentDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Please enter a valid 16-digit card number');
      return false;
    }
    if (paymentDetails.expirationDate.length !== 5) {
      alert('Please enter expiration date (MM/YY)');
      return false;
    }
    if (paymentDetails.cvc.length !== 3) {
      alert('Please enter a valid 3-digit CVC');
      return false;
    }
    return true;
  };

  const handleCompleteBooking = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking in database
      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          roomTypeId,
          residency,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numGuests: guests,
          guestName: `${firstName} ${lastName}`,
          guestEmail: email,
          guestPhone: phone,
          paymentMethod: 'credit_card',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingReference(data.bookingReference);
        setShowSuccess(true);
      } else {
        alert(data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while processing your booking');
    } finally {
      setLoading(false);
    }
  };

  // Success Modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BookingHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="max-w-2xl mx-auto px-8 py-20">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your booking has been successfully processed
            </p>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
              <p className="text-3xl font-bold text-gray-900">{bookingReference}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/bookings')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-8 py-4 rounded-xl transition-colors duration-200"
              >
                View My Bookings
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl transition-colors duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Form
  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-12">Make Payment</h1>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12">
          {/* Cardholder Name */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Cardholder's name
            </label>
            <input
              type="text"
              value={paymentDetails.cardholderName}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, cardholderName: e.target.value })}
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-yellow-400 focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          <PaymentCardFields
            cardNumber={paymentDetails.cardNumber}
            expirationDate={paymentDetails.expirationDate}
            cvc={paymentDetails.cvc}
            onCardNumberChange={(value) => setPaymentDetails({ ...paymentDetails, cardNumber: value })}
            onExpirationDateChange={(value) => setPaymentDetails({ ...paymentDetails, expirationDate: value })}
            onCvcChange={(value) => setPaymentDetails({ ...paymentDetails, cvc: value })}
          />

          {/* Complete Booking Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCompleteBooking}
              disabled={loading}
              className={`px-12 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              }`}
            >
              {loading ? 'Processing...' : 'Complete Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}