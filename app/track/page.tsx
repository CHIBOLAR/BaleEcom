'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description?: string;
  event_time: string;
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
    awbNumber?: string;
    courierName?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    isRTO: boolean;
    createdAt: string;
  };
  tracking: {
    events: TrackingEvent[];
  };
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    in_transit: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    rto_initiated: 'bg-red-100 text-red-800',
    rto_delivered: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusIcon(status: string): React.ReactNode {
  if (status === 'delivered') {
    return (
      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'out_for_delivery') {
    return (
      <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    );
  }
  if (status.includes('rto')) {
    return (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order');
  const [orderId, setOrderId] = useState(orderIdParam || '');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderIdParam) {
      fetchOrder(orderIdParam);
    }
  }, [orderIdParam]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(id)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrderData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      window.history.pushState({}, '', `/track?order=${encodeURIComponent(orderId)}`);
      fetchOrder(orderId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Track Order</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Track Your Order</h1>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Order ID (e.g., BALE1234567890)"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-2 border-red-200 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Order Details */}
      {orderData && (
        <div className="space-y-6">
          {/* Status Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order ID</p>
                <p className="text-xl font-mono font-bold text-gray-900">{orderData.order.id}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(orderData.order.status)}`}
              >
                {orderData.order.statusLabel}
              </span>
            </div>

            {/* Status Icon & Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {getStatusIcon(orderData.order.status)}
              <div>
                <p className="font-semibold text-gray-900">
                  {orderData.order.status === 'delivered'
                    ? 'Order Delivered!'
                    : orderData.order.status === 'out_for_delivery'
                    ? 'Out for Delivery'
                    : orderData.order.status.includes('rto')
                    ? 'Returning to Seller'
                    : 'Order in Progress'}
                </p>
                {orderData.order.awbNumber && (
                  <p className="text-sm text-gray-600">
                    AWB: <span className="font-mono">{orderData.order.awbNumber}</span>
                    {orderData.order.courierName && ` via ${orderData.order.courierName}`}
                  </p>
                )}
                {orderData.order.estimatedDelivery && !orderData.order.actualDelivery && (
                  <p className="text-sm text-gray-600">
                    Expected by: {new Date(orderData.order.estimatedDelivery).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {orderData.order.actualDelivery && (
                  <p className="text-sm text-green-600">
                    Delivered on: {formatDate(orderData.order.actualDelivery)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          {orderData.tracking.events.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Tracking History</h2>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Events */}
                <div className="space-y-6">
                  {orderData.tracking.events.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 pl-10">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                          index === 0 ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />

                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{event.status}</p>
                        {event.location && (
                          <p className="text-sm text-gray-600">{event.location}</p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-500">{event.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(event.event_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              {(orderData.order.items as OrderItem[]).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary">{formatCurrency(Number(orderData.order.total))}</span>
            </div>

            {/* Payment Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Payment: <span className="font-semibold capitalize">{orderData.order.paymentMethod}</span>
                {orderData.order.paymentStatus === 'completed' && (
                  <span className="ml-2 text-green-600">(Paid)</span>
                )}
                {orderData.order.paymentMethod === 'cod' && orderData.order.paymentStatus !== 'completed' && (
                  <span className="ml-2 text-yellow-600">(Pay on delivery)</span>
                )}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p className="font-semibold">{orderData.order.customer.name}</p>
              <p>{orderData.order.shippingAddress.address}</p>
              <p>
                {orderData.order.shippingAddress.city}, {orderData.order.shippingAddress.state} -{' '}
                {orderData.order.shippingAddress.pincode}
              </p>
              <p className="mt-2">Phone: {orderData.order.customer.phone}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {orderData.order.status === 'delivered' && (
              <Link
                href={`/returns/${orderData.order.id}`}
                className="btn-secondary"
              >
                Request Return
              </Link>
            )}
            <Link href="/contact" className="btn-secondary">
              Need Help?
            </Link>
          </div>
        </div>
      )}

      {/* No Order Yet */}
      {!loading && !error && !orderData && !orderIdParam && (
        <div className="card bg-gray-50 text-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Enter your Order ID</h2>
          <p className="text-gray-500">
            You can find your Order ID in the confirmation email or on your order receipt.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
