'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { calculateShipping } from '@/lib/shipping';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Components
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import AddressStep from '@/components/checkout/AddressStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import ReviewStep from '@/components/checkout/ReviewStep';
import OrderSummary from '@/components/checkout/OrderSummary';

// Stock availability response type
interface StockCheckResult {
  available: boolean;
  unavailableItems: Array<{ sku: string; requested: number; available: number }>;
}

// Coupon validation result
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

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  apartment: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Force dynamic rendering since we use cart store with localStorage
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { items, total, clearCart } = useCartStore();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Payment & processing state
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult['coupon'] | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const methods = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Check stock availability for all cart items
  const checkStockAvailability = useCallback(async (): Promise<boolean> => {
    setIsCheckingStock(true);
    setStockError(null);

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            sku: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result: StockCheckResult & { success: boolean } = await response.json();

      if (!result.success) {
        setStockError('Unable to verify stock availability. Please try again.');
        return false;
      }

      if (!result.available && result.unavailableItems.length > 0) {
        const itemMessages = result.unavailableItems.map((item) => {
          if (item.available === 0) {
            return `"${item.sku}" is out of stock`;
          }
          return `"${item.sku}" only has ${item.available} available (you requested ${item.requested})`;
        });
        setStockError(`Stock issue: ${itemMessages.join(', ')}. Please update your cart.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Stock check failed:', error);
      setStockError('Unable to verify stock. Please try again.');
      return false;
    } finally {
      setIsCheckingStock(false);
    }
  }, [items]);

  useEffect(() => {
    setIsMounted(true);

    // Check for pre-applied coupon from shop page
    const savedCoupon = sessionStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const { coupon, discount } = JSON.parse(savedCoupon);
        setAppliedCoupon(coupon);
        setCouponDiscount(discount);
        setCouponCode(coupon.code);
        sessionStorage.removeItem('appliedCoupon');
      } catch {
        // Invalid coupon data, ignore
      }
    }
  }, []);

  useEffect(() => {
    // Redirect if cart is empty (only on client side)
    if (isMounted && items.length === 0) {
      router.push('/cart');
    }
  }, [isMounted, items.length, router]);

  // Check stock when page loads
  useEffect(() => {
    if (isMounted && items.length > 0) {
      checkStockAvailability();
    }
  }, [isMounted, items.length, checkStockAvailability]);

  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  const subtotal = total();
  const shipping = calculateShipping(subtotal - couponDiscount);
  const grandTotal = subtotal - couponDiscount + shipping;

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

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
    } catch (error) {
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

  // Handle step navigation
  const handleStepClick = (step: 1 | 2 | 3) => {
    // Only allow going back to completed steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Handle form submission
  const handlePlaceOrder = async () => {
    const data = methods.getValues();
    setIsProcessing(true);
    setStockError(null);

    try {
      // Re-check stock availability before processing payment
      const stockAvailable = await checkStockAvailability();
      if (!stockAvailable) {
        setIsProcessing(false);
        return;
      }

      // Generate order ID
      const orderId = `BALE${Date.now()}`;

      // Build full address
      const fullAddress = [data.address, data.apartment].filter(Boolean).join(', ');

      // Create payment request
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: grandTotal,
          orderId,
          customerId: data.email,
          customerPhone: data.phone,
          customerName: data.name,
          shippingAddress: {
            address: fullAddress,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          },
          items,
          paymentMethod,
          // Coupon data for attribution
          couponCode: appliedCoupon?.code || null,
          couponDiscount: couponDiscount,
          influencer: appliedCoupon?.influencer_name || null,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success) {
        if (paymentData.paymentMethod === 'cod') {
          // COD order - redirect to success page
          clearCart();
          router.push(paymentData.redirectUrl);
        } else if (paymentData.data?.instrumentResponse?.redirectInfo?.url) {
          // Prepaid order - redirect to PhonePe payment page
          window.location.href = paymentData.data.instrumentResponse.redirectInfo.url;
        } else {
          alert('Payment initialization failed. Please try again.');
          setIsProcessing(false);
        }
      } else {
        alert(paymentData.error || 'Payment initialization failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/cart" className="text-gray-500 hover:text-primary">
          Cart
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Checkout</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Step Indicator */}
      <CheckoutSteps currentStep={currentStep} onStepClick={handleStepClick} />

      <FormProvider {...methods}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <AddressStep onNext={() => setCurrentStep(2)} />
            )}

            {currentStep === 2 && (
              <PaymentStep
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && (
              <ReviewStep
                paymentMethod={paymentMethod}
                onEditAddress={() => setCurrentStep(1)}
                onEditPayment={() => setCurrentStep(2)}
                onSubmit={handlePlaceOrder}
                isProcessing={isProcessing}
                isCheckingStock={isCheckingStock}
                stockError={stockError}
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
                appliedCoupon={appliedCoupon ?? null}
                couponDiscount={couponDiscount}
                couponLoading={couponLoading}
                couponError={couponError}
                subtotal={subtotal}
                shipping={shipping}
                grandTotal={grandTotal}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              couponDiscount={couponDiscount}
              shipping={shipping}
              grandTotal={grandTotal}
            />
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
