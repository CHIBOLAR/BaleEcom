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

interface CouponResult {
  valid: boolean;
  discount: number;
  error?: string;
  coupon?: {
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    influencer_name?: string;
  };
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult['coupon'] | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { addItem, clearCart } = useCartStore();

  // Calculate discount percentage
  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

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

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    const subtotal = product.price * quantity;

    try {
      const response = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: subtotal,
        }),
      });

      const result: CouponResult = await response.json();

      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        setCouponError(null);
      } else {
        setCouponError(result.error || 'Invalid coupon code');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError(null);
  };

  const handleBuyNow = () => {
    clearCart();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });

    // Store coupon info in sessionStorage for checkout
    if (appliedCoupon) {
      sessionStorage.setItem('appliedCoupon', JSON.stringify({
        coupon: appliedCoupon,
        discount: couponDiscount,
      }));
    } else {
      sessionStorage.removeItem('appliedCoupon');
    }

    router.push('/checkout');
  };

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const subtotal = product.price * quantity;
  const finalPrice = subtotal - couponDiscount;

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-8 md:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full box-border">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Product Gallery */}
            <div className="w-full max-w-md mx-auto lg:max-w-none">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl mb-4 w-full">
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
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg overflow-hidden border-2 transition-all ${
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
            <div className="text-center lg:text-left w-full">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-white/80">({reviews.length} reviews)</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 break-words">
                {product.name}
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 break-words">
                {product.shortDescription}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex flex-wrap items-baseline justify-center lg:justify-start gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-base sm:text-lg text-white/70 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="bg-green-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded">
                    {discountPercent}% OFF
                  </span>
                </div>
                <p className="text-green-300 font-semibold mt-2 text-sm sm:text-base">
                  FREE Shipping across India
                </p>
              </div>

              {/* Quick Details */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 w-full">
                <div className="bg-white/10 rounded-lg px-2 py-2 sm:px-4 text-center">
                  <span className="text-white/70 text-xs sm:text-sm">Players</span>
                  <p className="font-bold text-sm sm:text-base">{product.details.players}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-2 py-2 sm:px-4 text-center">
                  <span className="text-white/70 text-xs sm:text-sm">Duration</span>
                  <p className="font-bold text-sm sm:text-base">{product.details.playtime}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-2 py-2 sm:px-4 text-center">
                  <span className="text-white/70 text-xs sm:text-sm">Age</span>
                  <p className="font-bold text-sm sm:text-base">{product.details.age}</p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-4">
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                  <button
                    onClick={() => {
                      setQuantity(Math.max(1, quantity - 1));
                      if (appliedCoupon) removeCoupon();
                    }}
                    className="w-10 h-10 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-bold text-lg"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xl font-bold">{quantity}</span>
                  <button
                    onClick={() => {
                      setQuantity(Math.min(stockInfo.available, quantity + 1));
                      if (appliedCoupon) removeCoupon();
                    }}
                    className="w-10 h-10 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-bold text-lg"
                    disabled={quantity >= stockInfo.available}
                  >
                    +
                  </button>
                </div>
                <span className="text-white/80 text-sm sm:text-base">
                  {quantity > 1 && `Subtotal: ${formatCurrency(subtotal)}`}
                </span>
              </div>

              {/* Coupon Section */}
              <div className="bg-white/10 rounded-lg p-4 mb-6 w-full max-w-md mx-auto lg:mx-0">
                <p className="text-sm text-white/80 mb-2">Have a coupon code?</p>
                {appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-green-500/20 border border-green-400/50 rounded-lg p-3">
                    <div>
                      <span className="font-bold text-green-300">{appliedCoupon.code}</span>
                      <span className="text-sm text-green-200 ml-2">
                        (-{formatCurrency(couponDiscount)})
                      </span>
                      {appliedCoupon.influencer_name && (
                        <p className="text-xs text-green-200 mt-1">
                          Code from {appliedCoupon.influencer_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-300 hover:text-red-200 text-sm font-medium whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:border-white text-white placeholder-white/50 text-base min-w-0"
                      placeholder="Enter code"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="px-6 py-3 bg-white text-primary rounded-lg text-base font-bold hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-300 text-sm mt-2">{couponError}</p>
                )}
              </div>

              {/* Final Price & Buy Button */}
              {couponDiscount > 0 && (
                <div className="text-center lg:text-left mb-4">
                  <span className="text-white/70">Your price: </span>
                  <span className="text-2xl font-bold text-green-300">{formatCurrency(finalPrice)}</span>
                  <span className="text-sm text-green-300 ml-2">(You save {formatCurrency(couponDiscount)}!)</span>
                </div>
              )}

              <button
                onClick={handleBuyNow}
                disabled={!stockInfo.inStock || stockInfo.loading}
                className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 font-bold text-base sm:text-lg px-6 sm:px-8 py-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {stockInfo.loading ? 'Loading...' : !stockInfo.inStock ? 'Out of Stock' : `Buy Now - ${formatCurrency(finalPrice)}`}
              </button>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 mt-6 text-xs sm:text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fast Delivery
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Easy Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - White */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Why You Will Love Bale
          </h2>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Perfect for Groups</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Designed for 3-8 players, making it ideal for family gatherings, parties, or game nights with friends.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Quick & Engaging</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Games last 15-25 minutes, perfect for multiple rounds. Easy to learn but with deep strategy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Endless Fun</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Trading, negotiation, and special cards ensure no two games are ever the same.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is in the Box - Blue */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">What is in the Box?</h2>
              <ul className="space-y-3 sm:space-y-4">
                {product.details.components.map((component, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/90 text-base sm:text-lg">{component}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-video bg-white/10 rounded-2xl overflow-hidden">
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

      {/* Reviews Summary - White */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-gray-600 text-sm sm:text-base">based on {reviews.length} reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} />
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Verified
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{review.title}</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-3">{review.content}</p>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>{review.name}</span>
                  <span>{new Date(review.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition-colors"
            >
              See All Reviews
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section - Blue */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary-dark to-primary text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-white/80 text-sm sm:text-base">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Ready to Play?
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 text-white/90">
            Join thousands of happy customers. Order now and start playing!
          </p>
          <button
            onClick={handleBuyNow}
            disabled={!stockInfo.inStock}
            className="bg-white text-primary hover:bg-gray-100 font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 shadow-lg inline-flex items-center gap-2"
          >
            Buy Now - {formatCurrency(product.price)}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <p className="mt-4 text-white/80 text-sm sm:text-base">FREE shipping across India</p>
        </div>
      </section>

      {/* Trust Footer - White */}
      <section className="py-10 sm:py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl mb-2">🔒</div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Secure Checkout</p>
              <p className="text-xs sm:text-sm text-gray-600">PhonePe Payment Gateway</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl mb-2">🚚</div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Free Shipping</p>
              <p className="text-xs sm:text-sm text-gray-600">All India Delivery</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl mb-2">↩️</div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Easy Returns</p>
              <p className="text-xs sm:text-sm text-gray-600">7-Day Return Policy</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl mb-2">🇮🇳</div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Made in India</p>
              <p className="text-xs sm:text-sm text-gray-600">Premium Quality</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
