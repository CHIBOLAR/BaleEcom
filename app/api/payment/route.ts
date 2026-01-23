import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutPayRequest } from 'pg-sdk-node';
import { getPhonePeClient, SITE_URL } from '@/lib/phonepe';
import { createOrder } from '@/lib/supabase';
import { calculateShipping } from '@/lib/shipping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderId,
      customerId,
      customerPhone,
      customerName,
      shippingAddress,
      items,
    } = body;

    // Validate required fields
    if (!amount || !orderId || !customerId || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getPhonePeClient();

    // Build payment request using v2 SDK
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderId)
      .amount(Math.round(amount * 100)) // Convert to paise
      .redirectUrl(`${SITE_URL}/api/payment/callback`)
      .build();

    // Calculate order totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const shippingCost = calculateShipping(subtotal);
    const total = subtotal + shippingCost;

    // Save order to Supabase
    try {
      await createOrder({
        order_id: orderId,
        customer_name: customerName,
        customer_email: customerId,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        items,
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_status: 'pending',
        shipping_status: 'pending',
      });
      console.log('Order saved to database:', orderId);
    } catch (dbError: any) {
      console.error('Failed to save order to database:', dbError.message);
      // Continue with payment even if DB save fails
    }

    // Initiate payment
    const response = await client.pay(payRequest);

    console.log('Payment initiated:', {
      orderId,
      amount,
      checkoutPageUrl: response.redirectUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        instrumentResponse: {
          redirectInfo: {
            url: response.redirectUrl,
          },
        },
      },
      orderId,
    });
  } catch (error: any) {
    console.error('PhonePe payment error:', error.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Payment initialization failed',
      },
      { status: 500 }
    );
  }
}
