'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { formatCurrency, calculateShipping, FREE_SHIPPING_THRESHOLD, SHIPPING_RATE } from '@/lib/shipping';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total } = useCartStore();

  const subtotal = total();
  const shipping = calculateShipping(subtotal);
  const grandTotal = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Add some items to your cart to get started!
          </p>
          <Link href="/product" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Shopping Cart</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card flex gap-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>

                {/* Product Info */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-primary font-bold mb-2">
                    {formatCurrency(item.price)} each
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border-2 border-gray-300 rounded hover:border-primary transition-colors font-semibold text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 h-8 border-2 border-gray-300 rounded text-center font-semibold text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border-2 border-gray-300 rounded hover:border-primary transition-colors font-semibold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Item Total & Remove */}
                <div className="text-right">
                  <p className="font-bold text-gray-900 mb-4">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              href="/product"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
            >
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span className="font-semibold">
                  {shipping > 0 ? formatCurrency(shipping) : (
                    <span className="text-secondary">FREE</span>
                  )}
                </span>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-800">
                    Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                  </p>
                </div>
              )}

              {subtotal >= FREE_SHIPPING_THRESHOLD && shipping === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-green-800 font-semibold">
                    You qualify for free shipping!
                  </p>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-primary text-xl">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="btn-primary w-full mb-3"
            >
              Proceed to Checkout
            </button>

            <p className="text-xs text-gray-500 text-center">
              Secure checkout powered by PhonePe
            </p>

            {/* Trust Badges */}
            <div className="flex items-center justify-around pt-6 mt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xl mb-1">🔒</div>
                <p className="text-xs text-gray-600">Secure</p>
              </div>
              <div className="text-center">
                <div className="text-xl mb-1">🚚</div>
                <p className="text-xs text-gray-600">Fast Ship</p>
              </div>
              <div className="text-center">
                <div className="text-xl mb-1">💯</div>
                <p className="text-xs text-gray-600">Quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
