import { supabase } from './supabase';

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value?: number;
  max_discount?: number; // Cap for percentage discounts
  influencer_name?: string;
  usage_limit?: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  error?: string;
}

/**
 * Validate and apply a coupon code
 */
export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<CouponValidationResult> {
  if (!code || code.trim() === '') {
    return { valid: false, discount: 0, error: 'Please enter a coupon code' };
  }

  const normalizedCode = code.trim().toUpperCase();

  // Fetch coupon from database
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { valid: false, discount: 0, error: 'Invalid coupon code' };
  }

  // Check validity period
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, discount: 0, error: 'Coupon is not yet active' };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, discount: 0, error: 'Coupon has expired' };
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
  }

  // Check minimum order value
  if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order value is ₹${coupon.min_order_value}`,
    };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (orderTotal * coupon.discount_value) / 100;
    // Apply max discount cap if set
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    // Flat discount
    discount = coupon.discount_value;
  }

  // Discount cannot exceed order total
  discount = Math.min(discount, orderTotal);

  return {
    valid: true,
    coupon,
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Increment coupon usage count after successful order
 */
export async function incrementCouponUsage(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();

  const { error } = await supabase.rpc('increment_coupon_usage', {
    coupon_code: normalizedCode,
  });

  if (error) {
    // Fallback: manual increment
    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('code', normalizedCode)
      .single();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ usage_count: (coupon.usage_count || 0) + 1 })
        .eq('code', normalizedCode);
    }
  }

  return true;
}

/**
 * Get coupon by code (for order attribution)
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalizedCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Format discount display
 */
export function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`;
  }
  return `₹${coupon.discount_value} off`;
}
