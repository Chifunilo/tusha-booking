"use client";

import { CreditCard, Calendar, Lock } from 'lucide-react';
import { usePaymentInputs } from 'react-payment-inputs';
import images, { type CardImages } from 'react-payment-inputs/images';

interface PaymentCardFieldsProps {
  cardNumber: string;
  expirationDate: string;
  cvc: string;
  onCardNumberChange: (value: string) => void;
  onExpirationDateChange: (value: string) => void;
  onCvcChange: (value: string) => void;
}

export default function PaymentCardFields({
  cardNumber,
  expirationDate,
  cvc,
  onCardNumberChange,
  onExpirationDateChange,
  onCvcChange,
}: PaymentCardFieldsProps) {
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } =
    usePaymentInputs();

  const showError = (field: 'cardNumber' | 'expiryDate' | 'cvc') =>
    meta.touchedInputs[field] && meta.erroredInputs[field];

  return (
    <>
      {/* Card Number */}
      <div className="mb-8">
        <label className="block text-lg font-semibold mb-3">Card Number</label>
        <div className="relative">
          <input
            {...getCardNumberProps({
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCardNumberChange(e.target.value),
            })}
            value={cardNumber}
            className={`w-full px-6 py-4 pr-14 border-2 rounded-xl text-lg focus:outline-none ${
              showError('cardNumber') ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-yellow-400'
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400">
            {meta.cardType ? (
              <svg className="w-8 h-6" {...getCardImageProps({ images: images as unknown as CardImages })} />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
          </div>
        </div>
        {showError('cardNumber') && (
          <p className="mt-2 text-sm text-red-500">{meta.erroredInputs.cardNumber}</p>
        )}
      </div>

      {/* Expiration Date and CVC */}
      <div className="grid grid-cols-2 gap-6 mb-12">
        <div>
          <label className="block text-lg font-semibold mb-3">Expiration Date</label>
          <div className="relative">
            <input
              {...getExpiryDateProps({
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => onExpirationDateChange(e.target.value),
              })}
              value={expirationDate}
              className={`w-full px-6 py-4 pr-12 border-2 rounded-xl text-lg focus:outline-none ${
                showError('expiryDate') ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-yellow-400'
              }`}
            />
            <Calendar className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {showError('expiryDate') && (
            <p className="mt-2 text-sm text-red-500">{meta.erroredInputs.expiryDate}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-semibold mb-3">CVC</label>
          <div className="relative">
            <input
              {...getCVCProps({
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCvcChange(e.target.value),
              })}
              value={cvc}
              className={`w-full px-6 py-4 pr-12 border-2 rounded-xl text-lg focus:outline-none ${
                showError('cvc') ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-yellow-400'
              }`}
            />
            <Lock className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {showError('cvc') && (
            <p className="mt-2 text-sm text-red-500">{meta.erroredInputs.cvc}</p>
          )}
        </div>
      </div>
    </>
  );
}
