import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutPayRequest } from 'pg-sdk-node';
import { getPhonePeClient, SITE_URL } from '@/lib/phonepe';

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

    // Initiate payment
    const response = await client.pay(payRequest);

    // Log order details
    console.log('Order created:', {
      orderId,
      amount,
      customerName,
      customerPhone,
      customerId,
      shippingAddress,
      items,
      checkoutPageUrl: response.redirectUrl,
      timestamp: new Date().toISOString(),
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
