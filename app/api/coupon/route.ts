import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupon';

/**
 * POST /api/coupon - Validate a coupon code
 *
 * Body: { code: string, orderTotal: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    if (!orderTotal || orderTotal <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid order total' },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, orderTotal);

    return NextResponse.json({
      valid: result.valid,
      discount: result.discount,
      error: result.error,
      coupon: result.coupon
        ? {
            code: result.coupon.code,
            discount_type: result.coupon.discount_type,
            discount_value: result.coupon.discount_value,
            influencer_name: result.coupon.influencer_name,
          }
        : undefined,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error.message);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
