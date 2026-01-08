'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-12 h-12 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Order Confirmed!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully placed!
        </p>

        {/* Order Details */}
        <div className="card bg-gray-50 mb-8 text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            {orderId && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold text-gray-900">{orderId}</span>
              </div>
            )}
            {transactionId && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono font-semibold text-gray-900">{transactionId}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-semibold text-green-600">Paid</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="card bg-blue-50 border-2 border-blue-200 mb-8 text-left">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            What Happens Next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>You'll receive an order confirmation email within 5 minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Your order will be packed and shipped within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>You'll receive tracking information via email once shipped</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Estimated delivery: 3-5 business days</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/digital-game" className="btn-secondary">
            Pre-Register for Digital Game
          </Link>
        </div>

        {/* Digital Game Promo */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-white text-left">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎮</div>
            <div>
              <h3 className="font-bold text-xl mb-2">Want to Play Online?</h3>
              <p className="mb-4 text-gray-100">
                Pre-register for the digital version of Bale and be the first to play when it launches!
                Get exclusive early access and rewards.
              </p>
              <Link
                href="/digital-game"
                className="inline-block bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Pre-Register Now
              </Link>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions about your order?{' '}
            <Link href="/contact" className="text-primary hover:text-primary-dark font-medium">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
