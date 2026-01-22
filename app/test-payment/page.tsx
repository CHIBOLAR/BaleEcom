'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestPaymentPage() {
  const [amount, setAmount] = useState(1);
  const [name, setName] = useState('Test User');
  const [email, setEmail] = useState('test@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const orderId = `TEST${Date.now()}`;

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderId,
          customerId: email,
          customerPhone: phone,
          customerName: name,
          shippingAddress: {
            address: 'Test Address',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
          items: [{ name: 'Test Item', quantity: 1, price: amount }],
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
        window.location.href = data.data.instrumentResponse.redirectInfo.url;
      } else {
        setError(data.error || 'Payment initialization failed');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Test Payment</span>
      </nav>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Payment</h1>
        <p className="text-gray-600 mb-6">
          Use this page to test PhonePe payment integration with a small amount.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amount (Rs)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing || amount < 1}
            className={`btn-primary w-full mt-4 ${
              isProcessing || amount < 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Processing...' : `Pay Rs ${amount}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Powered by PhonePe Payment Gateway
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Test Mode Info</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>- This page is for testing the payment flow</li>
          <li>- Default amount is Rs 1 for minimal testing</li>
          <li>- Real payment will be processed</li>
        </ul>
      </div>
    </div>
  );
}
