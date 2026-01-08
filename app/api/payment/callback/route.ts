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
    const { merchantTransactionId, transactionId, providerReferenceId } = body;

    if (!merchantTransactionId) {
      return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
    }

    // Verify payment status by calling PhonePe status API
    const statusUrl = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
    const signatureString = statusUrl + PHONEPE_SALT_KEY;
    const sha256Hash = crypto.createHash('sha256').update(signatureString).digest('hex');
    const signature = sha256Hash + '###' + PHONEPE_SALT_INDEX;

    const statusResponse = await axios.get(`${PHONEPE_BASE_URL}${statusUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': signature,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
      },
    });

    const paymentStatus = statusResponse.data;

    if (paymentStatus.success && paymentStatus.code === 'PAYMENT_SUCCESS') {
      // Payment successful
      console.log('Payment successful:', {
        orderId: merchantTransactionId,
        transactionId,
        providerReferenceId,
        amount: paymentStatus.data.amount / 100, // Convert from paise to rupees
        timestamp: new Date().toISOString(),
      });

      // TODO: Store order in database
      // TODO: Send confirmation email

      // Redirect to success page
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${merchantTransactionId}&transactionId=${transactionId}`
      );
    } else {
      // Payment failed or pending
      console.error('Payment failed:', paymentStatus);
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_failed&orderId=${merchantTransactionId}`
      );
    }
  } catch (error: any) {
    console.error('Payment callback error:', error.response?.data || error.message);
    return NextResponse.redirect(`${SITE_URL}/checkout?error=callback_failed`);
  }
}

// Handle GET requests (for redirect mode)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantTransactionId = searchParams.get('merchantTransactionId');
  const transactionId = searchParams.get('transactionId');
  const providerReferenceId = searchParams.get('providerReferenceId');

  if (!merchantTransactionId) {
    return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
  }

  try {
    // Verify payment status
    const statusUrl = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
    const signatureString = statusUrl + PHONEPE_SALT_KEY;
    const sha256Hash = crypto.createHash('sha256').update(signatureString).digest('hex');
    const signature = sha256Hash + '###' + PHONEPE_SALT_INDEX;

    const statusResponse = await axios.get(`${PHONEPE_BASE_URL}${statusUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': signature,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
      },
    });

    const paymentStatus = statusResponse.data;

    if (paymentStatus.success && paymentStatus.code === 'PAYMENT_SUCCESS') {
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${merchantTransactionId}&transactionId=${transactionId}`
      );
    } else {
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_failed&orderId=${merchantTransactionId}`
      );
    }
  } catch (error: any) {
    console.error('Payment callback error:', error.response?.data || error.message);
    return NextResponse.redirect(`${SITE_URL}/checkout?error=callback_failed`);
  }
}
