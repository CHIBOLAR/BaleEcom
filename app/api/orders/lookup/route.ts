import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/rate-limit';

/**
 * POST /api/orders/lookup - Find orders by email and phone
 *
 * Body: { email: string, phone: string }
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request.headers);
  const rateLimitResult = checkRateLimit(`order-lookup:${clientIp}`, RATE_LIMITS.orderLookup);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const body = await request.json();
    const { email, phone } = body;

    // Validate required fields
    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email and phone number are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, dashes, and country code prefix)
    const normalizedPhone = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '');

    // Query orders by email and phone
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id, customer_name, total, payment_status, shipping_status, created_at')
      .eq('customer_email', email.toLowerCase().trim())
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.+91${normalizedPhone}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Order lookup error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to look up orders' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        {
          success: true,
          orders: [],
          message: 'No orders found with this email and phone combination',
        },
        { headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Return sanitized order data
    const sanitizedOrders = orders.map((order) => ({
      orderId: order.order_id,
      customerName: order.customer_name,
      total: order.total,
      paymentStatus: order.payment_status,
      shippingStatus: order.shipping_status,
      createdAt: order.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        orders: sanitizedOrders,
      },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error: any) {
    console.error('Order lookup error:', error.message);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
