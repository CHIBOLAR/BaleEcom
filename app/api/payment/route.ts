import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY!;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_BASE_URL =
  process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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

    // Create payment payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${SITE_URL}/api/payment/callback`,
      redirectMode: 'POST',
      callbackUrl: `${SITE_URL}/api/payment/callback`,
      mobileNumber: customerPhone.replace(/\D/g, ''), // Remove non-digits
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Convert payload to base64
    const jsonPayload = JSON.stringify(payload);
    const base64Payload = Buffer.from(jsonPayload).toString('base64');

    // Generate signature
    const signatureString = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
    const sha256Hash = crypto.createHash('sha256').update(signatureString).digest('hex');
    const signature = sha256Hash + '###' + PHONEPE_SALT_INDEX;

    // Make API request to PhonePe
    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/v1/pay`,
      {
        request: base64Payload,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': signature,
        },
      }
    );

    // Store order details (you can implement database storage here)
    console.log('Order created:', {
      orderId,
      amount,
      customerName,
      customerPhone,
      customerId,
      shippingAddress,
      items,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: response.data.data,
      orderId,
    });
  } catch (error: any) {
    console.error('PhonePe payment error:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || 'Payment initialization failed',
      },
      { status: 500 }
    );
  }
}
