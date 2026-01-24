'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
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
    createdAt: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');
  const paymentMethodParam = searchParams.get('paymentMethod');
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  const isCOD = paymentMethodParam === 'cod' || orderDetails?.order?.paymentMethod === 'cod';

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

        {/* Order Details Card */}
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
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-gray-900 capitalize">
                {isCOD ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Payment Status:</span>
              {isCOD ? (
                <span className="font-semibold text-yellow-600">Pay on Delivery</span>
              ) : (
                <span className="font-semibold text-green-600">Paid</span>
              )}
            </div>
          </div>
        </div>

        {/* Order Items (if loaded) */}
        {orderDetails && (
          <div className="card mb-8 text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              {(orderDetails.order.items as OrderItem[]).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary">
                {formatCurrency(Number(orderDetails.order.total))}
              </span>
            </div>

            {/* Shipping Address */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Shipping To</h3>
              <p className="text-gray-700">
                {orderDetails.order.customer.name}<br />
                {orderDetails.order.shippingAddress.address}<br />
                {orderDetails.order.shippingAddress.city}, {orderDetails.order.shippingAddress.state} - {orderDetails.order.shippingAddress.pincode}
              </p>
            </div>

            {/* AWB Number if available */}
            {orderDetails.order.awbNumber && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Tracking Number:</span>{' '}
                  <span className="font-mono">{orderDetails.order.awbNumber}</span>
                  {orderDetails.order.courierName && (
                    <span className="text-blue-600"> via {orderDetails.order.courierName}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* COD Payment Reminder */}
        {isCOD && orderDetails && (
          <div className="card bg-yellow-50 border-2 border-yellow-200 mb-8 text-left">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-yellow-900 mb-1">Payment on Delivery</h3>
                <p className="text-sm text-yellow-800">
                  Please keep {formatCurrency(Number(orderDetails.order.total))} ready for the delivery person.
                  Exact change is appreciated.
                </p>
              </div>
            </div>
          </div>
        )}

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
              <span>You'll receive an order confirmation email shortly</span>
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
          {orderId && (
            <Link href={`/track?order=${orderId}`} className="btn-primary">
              Track Your Order
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
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
