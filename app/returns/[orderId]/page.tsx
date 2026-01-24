'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  order: {
    id: string;
    status: string;
    statusLabel: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    items: OrderItem[];
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
    createdAt: string;
  };
}

interface ReturnData {
  return: {
    id: string;
    order_id: string;
    type: string;
    reason: string;
    status: string;
    refund_status: string;
    refund_amount: number;
    reverse_awb?: string;
    pickup_date?: string;
    created_at: string;
  };
}

const RETURN_REASONS = [
  'Product damaged during delivery',
  'Wrong product received',
  'Product not as described',
  'Quality not as expected',
  'Changed my mind',
  'Other',
];

export default function ReturnPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [existingReturn, setExistingReturn] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (!orderResponse.ok) {
          setError('Order not found');
          setLoading(false);
          return;
        }
        const orderData = await orderResponse.json();
        setOrderData(orderData);

        // Check for existing return
        const returnResponse = await fetch(`/api/returns?orderId=${encodeURIComponent(orderId)}`);
        if (returnResponse.ok) {
          const returnData = await returnResponse.json();
          setExistingReturn(returnData);
        }
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a reason for return');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          reason,
          comments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit return request');
      }

      setSuccess(true);
      setExistingReturn(data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card bg-red-50 border-2 border-red-200 text-center">
          <p className="text-red-800">{error}</p>
          <Link href="/track" className="btn-primary mt-4 inline-block">
            Track Another Order
          </Link>
        </div>
      </div>
    );
  }

  // Check if order can be returned
  const canReturn = orderData?.order?.status === 'delivered';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href={`/track?order=${orderId}`} className="text-gray-500 hover:text-primary">
          Track Order
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Return Request</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        {existingReturn ? 'Return Status' : 'Request Return'}
      </h1>

      {/* Order Summary */}
      {orderData && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono font-semibold">{orderData.order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span>
                {(orderData.order.items as OrderItem[]).map((item) => item.name).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold">{formatCurrency(Number(orderData.order.total))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Existing Return Status */}
      {existingReturn && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Return Status</h2>

          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  existingReturn.return.status === 'refund_completed'
                    ? 'bg-green-100 text-green-800'
                    : existingReturn.return.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {existingReturn.return.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Return Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reason:</span>
                <span>{existingReturn.return.reason}</span>
              </div>
              {existingReturn.return.reverse_awb && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Return AWB:</span>
                  <span className="font-mono">{existingReturn.return.reverse_awb}</span>
                </div>
              )}
              {existingReturn.return.pickup_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Date:</span>
                  <span>
                    {new Date(existingReturn.return.pickup_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Refund Amount:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(existingReturn.return.refund_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Refund Status:</span>
                <span className={`font-semibold ${
                  existingReturn.return.refund_status === 'completed'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {existingReturn.return.refund_status.charAt(0).toUpperCase() +
                    existingReturn.return.refund_status.slice(1)}
                </span>
              </div>
            </div>

            {/* Pickup Instructions */}
            {existingReturn.return.status === 'initiated' ||
              existingReturn.return.status === 'pickup_scheduled' ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Pickup Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Keep the product in its original packaging</li>
                  <li>Include all accessories and documents</li>
                  <li>The pickup executive will contact you before pickup</li>
                  <li>Refund will be processed within 5-7 business days after we receive the item</li>
                </ul>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <Link href={`/track?order=${orderId}`} className="btn-secondary">
              Back to Order Tracking
            </Link>
          </div>
        </div>
      )}

      {/* Return Form */}
      {!existingReturn && canReturn && (
        <form onSubmit={handleSubmit}>
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Return Details</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Reason Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reason for Return *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Comments */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Please provide any additional details about your return request..."
              />
            </div>

            {/* Policy Note */}
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-2">Return Policy</p>
              <ul className="space-y-1">
                <li>Returns are accepted within 7 days of delivery</li>
                <li>Product must be in original condition with all accessories</li>
                <li>Refund will be processed within 5-7 business days after pickup</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className={`btn-primary flex-1 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
            <Link href={`/track?order=${orderId}`} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      )}

      {/* Cannot Return Message */}
      {!existingReturn && !canReturn && orderData && (
        <div className="card bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">Return Not Available</h3>
              <p className="text-sm text-yellow-800">
                {orderData.order.status === 'cancelled'
                  ? 'This order has been cancelled and cannot be returned.'
                  : 'Returns can only be requested after the order is delivered. Your order is currently: ' +
                    orderData.order.statusLabel}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link href={`/track?order=${orderId}`} className="btn-secondary">
              Track Order Status
            </Link>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="card bg-green-50 border-2 border-green-200 mt-6">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-green-900 mb-1">Return Request Submitted</h3>
              <p className="text-sm text-green-800">
                Your return request has been submitted successfully.
                We will contact you to arrange pickup.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
