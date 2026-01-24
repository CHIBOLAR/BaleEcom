'use client';

import { useFormContext } from 'react-hook-form';
import { formatCurrency } from '@/lib/shipping';

interface CouponData {
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  influencer_name?: string;
}

interface ReviewStepProps {
  paymentMethod: 'prepaid' | 'cod';
  onEditAddress: () => void;
  onEditPayment: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
  isCheckingStock: boolean;
  stockError: string | null;
  // Coupon props
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  appliedCoupon: CouponData | null;
  couponDiscount: number;
  couponLoading: boolean;
  couponError: string | null;
  // Totals
  subtotal: number;
  shipping: number;
  grandTotal: number;
}

export default function ReviewStep({
  paymentMethod,
  onEditAddress,
  onEditPayment,
  onSubmit,
  isProcessing,
  isCheckingStock,
  stockError,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  couponDiscount,
  couponLoading,
  couponError,
  subtotal,
  shipping,
  grandTotal,
}: ReviewStepProps) {
  const { watch } = useFormContext();

  const name = watch('name');
  const phone = watch('phone');
  const email = watch('email');
  const address = watch('address');
  const apartment = watch('apartment');
  const city = watch('city');
  const state = watch('state');
  const pincode = watch('pincode');

  const fullAddress = [
    address,
    apartment,
    `${city}, ${state} - ${pincode}`,
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Address Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Shipping Address</h3>
          <button
            type="button"
            onClick={onEditAddress}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="text-gray-700">
          <p className="font-semibold">{name}</p>
          <p className="mt-1">{fullAddress}</p>
          <p className="mt-1">{phone}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Payment Method</h3>
          <button
            type="button"
            onClick={onEditPayment}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="flex items-center gap-3">
          {paymentMethod === 'prepaid' ? (
            <>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pay Online</p>
                <p className="text-sm text-gray-500">UPI, Card, Net Banking</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Cash on Delivery</p>
                <p className="text-sm text-gray-500">Pay when delivered</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Coupon Section */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Have a coupon?</h3>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div>
              <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
              <span className="text-sm text-green-600 ml-2">
                ({appliedCoupon.discount_type === 'percentage'
                  ? `${appliedCoupon.discount_value}% off`
                  : `₹${appliedCoupon.discount_value} off`})
              </span>
              {appliedCoupon.influencer_name && (
                <p className="text-xs text-green-600 mt-1">
                  Code from {appliedCoupon.influencer_name}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
              placeholder="Enter coupon code"
            />
            <button
              type="button"
              onClick={onApplyCoupon}
              disabled={couponLoading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-red-500 text-sm mt-2">{couponError}</p>
        )}
      </div>

      {/* Order Total Summary */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Total</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-semibold">-{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Shipping</span>
            <span className="font-semibold">
              {shipping > 0 ? formatCurrency(shipping) : (
                <span className="text-secondary">FREE</span>
              )}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary text-xl">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Error */}
      {stockError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{stockError}</p>
        </div>
      )}

      {/* Place Order Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing || isCheckingStock || !!stockError}
        className={`btn-primary w-full text-lg py-4 ${
          (isProcessing || isCheckingStock || stockError) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isCheckingStock
          ? 'Checking Stock...'
          : isProcessing
          ? 'Processing...'
          : stockError
          ? 'Cannot Checkout - Stock Issue'
          : paymentMethod === 'cod'
          ? 'Place Order (COD)'
          : 'Pay Now'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {paymentMethod === 'prepaid'
          ? 'Powered by PhonePe Payment Gateway'
          : 'Pay when you receive your order'}
      </p>
    </div>
  );
}
