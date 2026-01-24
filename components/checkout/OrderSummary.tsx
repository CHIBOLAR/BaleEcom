'use client';

import Image from 'next/image';
import { CartItem } from '@/lib/store';
import { formatCurrency } from '@/lib/shipping';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  shipping: number;
  grandTotal: number;
}

export default function OrderSummary({
  items,
  subtotal,
  couponDiscount,
  shipping,
  grandTotal,
}: OrderSummaryProps) {
  return (
    <div className="card sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
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
        <div className="border-t pt-2">
          <div className="flex justify-between text-lg">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-primary text-xl">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
