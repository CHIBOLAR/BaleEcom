'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { product, reviews, faqs } from '@/lib/product';
import { formatCurrency } from '@/lib/shipping';
import { useCartStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

interface StockInfo {
  available: number;
  inStock: boolean;
  lowStock: boolean;
  loading: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo>({
    available: product.stock,
    inStock: true,
    lowStock: false,
    loading: true,
  });
  const { addItem, clearCart } = useCartStore();

  const fetchStock = useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory?sku=${product.id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setStockInfo({
          available: data.data.available,
          inStock: data.data.inStock,
          lowStock: data.data.lowStock,
          loading: false,
        });
      } else {
        setStockInfo({
          available: product.stock,
          inStock: product.stock > 0,
          lowStock: product.stock > 0 && product.stock <= 10,
          loading: false,
        });
      }
    } catch {
      setStockInfo({
        available: product.stock,
        inStock: product.stock > 0,
        lowStock: product.stock > 0 && product.stock <= 10,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleBuyNow = () => {
    clearCart();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });
    router.push('/checkout');
  };

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Product Gallery */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {!stockInfo.loading && stockInfo.lowStock && (
                  <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    Only {stockInfo.available} left!
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 justify-center">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 bg-white rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-white/80">({reviews.length} reviews)</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {product.name}
              </h1>

              <p className="text-lg md:text-xl text-white/90 mb-6">
                {product.shortDescription}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center lg:justify-start gap-3">
                  <span className="text-4xl md:text-5xl font-bold">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-lg text-white/70 line-through">
                    {formatCurrency(699)}
                  </span>
                  <span className="bg-green-500 text-white text-sm font-bold px-2 py-1 rounded">
                    29% OFF
                  </span>
                </div>
                <p className="text-green-300 font-semibold mt-2">
                  FREE Shipping across India
                </p>
              </div>

              {/* Quick Details */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                <div className="bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white/70 text-sm">Players</span>
                  <p className="font-bold">{product.details.players}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white/70 text-sm">Duration</span>
                  <p className="font-bold">{product.details.playtime}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white/70 text-sm">Age</span>
                  <p className="font-bold">{product.details.age}</p>
                </div>
              </div>

              {/* Quantity & Buy */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-bold text-lg"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xl font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stockInfo.available, quantity + 1))}
                    className="w-10 h-10 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-bold text-lg"
                    disabled={quantity >= stockInfo.available}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={!stockInfo.inStock || stockInfo.loading}
                  className="flex-1 sm:flex-initial bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                >
                  {stockInfo.loading ? 'Loading...' : !stockInfo.inStock ? 'Out of Stock' : `Buy Now - ${formatCurrency(product.price * quantity)}`}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center lg:justify-start gap-6 mt-6 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fast Delivery
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Easy Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why You Will Love Bale
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Perfect for Groups</h3>
              <p className="text-gray-600">
                Designed for 3-8 players, making it ideal for family gatherings, parties, or game nights with friends.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick & Engaging</h3>
              <p className="text-gray-600">
                Games last 15-25 minutes, perfect for multiple rounds. Easy to learn but with deep strategy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Endless Fun</h3>
              <p className="text-gray-600">
                Trading, negotiation, and special cards ensure no two games are ever the same.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is in the Box */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What is in the Box?</h2>
              <ul className="space-y-4">
                {product.details.components.map((component, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-lg">{component}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden">
              <Image
                src={product.images[1] || product.images[0]}
                alt="Box contents"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex items-center justify-center gap-3">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-gray-600">based on {reviews.length} reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} />
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-600 text-sm mb-4">{review.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{review.name}</span>
                  <span>{new Date(review.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Play?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of happy customers. Order now and start playing!
          </p>
          <button
            onClick={handleBuyNow}
            disabled={!stockInfo.inStock}
            className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-10 py-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 shadow-lg inline-flex items-center gap-2"
          >
            Buy Now - {formatCurrency(product.price)}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <p className="mt-4 text-white/80">FREE shipping across India</p>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <p className="font-semibold text-gray-900">Secure Checkout</p>
              <p className="text-sm text-gray-600">PhonePe Payment Gateway</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🚚</div>
              <p className="font-semibold text-gray-900">Free Shipping</p>
              <p className="text-sm text-gray-600">All India Delivery</p>
            </div>
            <div>
              <div className="text-3xl mb-2">↩️</div>
              <p className="font-semibold text-gray-900">Easy Returns</p>
              <p className="text-sm text-gray-600">7-Day Return Policy</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🇮🇳</div>
              <p className="font-semibold text-gray-900">Made in India</p>
              <p className="text-sm text-gray-600">Premium Quality</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
