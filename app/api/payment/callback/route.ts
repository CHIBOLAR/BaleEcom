import { NextRequest, NextResponse } from 'next/server';
import { getPhonePeClient, SITE_URL } from '@/lib/phonepe';
import { updateOrderPaymentStatus, getOrderByOrderId, updateOrderWareIQDetails } from '@/lib/supabase';
import { createWareIQOrder } from '@/lib/wareiq';

// Helper function to create WareIQ order after successful payment
async function createWareIQShipment(orderId: string) {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('Order not found for WareIQ shipment:', orderId);
      return;
    }

    // Skip if already created in WareIQ
    if (order.wareiq_unique_id) {
      console.log('WareIQ order already exists:', orderId);
      return;
    }

    const shippingAddress = order.shipping_address as {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };

    const items = order.items as Array<{
      name: string;
      price: number;
      quantity: number;
    }>;

    const wareiqResponse = await createWareIQOrder({
      order_id: orderId,
      full_name: order.customer_name,
      address1: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      country: 'India',
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total: Number(order.total),
      shipping_charges: Number(order.shipping_cost) || 0,
      payment_method: 'prepaid',
      products: items.map((item) => ({
        sku: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        price: item.price,
        amount: item.price * item.quantity,
        quantity: item.quantity,
      })),
    });

    if (wareiqResponse.status === 'success' && wareiqResponse.unique_id) {
      await updateOrderWareIQDetails(orderId, {
        wareiq_unique_id: wareiqResponse.unique_id,
        wareiq_order_id: wareiqResponse.order_id,
        shipping_status: 'processing',
      });
      console.log('WareIQ order created successfully:', wareiqResponse.unique_id);
    }
  } catch (error: any) {
    console.error('Failed to create WareIQ order:', error.message);
    // Don't throw - we don't want to fail the payment callback
  }
}

const WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD;

// Verify Basic Auth for webhook requests
function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  return username === WEBHOOK_USERNAME && password === WEBHOOK_PASSWORD;
}

// Handle webhook POST requests from PhonePe
export async function POST(request: NextRequest) {
  try {
    // Check if this is a webhook callback (has Authorization header)
    const hasAuthHeader = request.headers.get('authorization');

    if (hasAuthHeader) {
      // This is a webhook callback - verify Basic Auth
      if (!verifyBasicAuth(request)) {
        console.error('Webhook auth failed: Invalid credentials');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));

      // PhonePe v2 webhook payload format
      const { type, payload } = body;

      if (payload) {
        const { merchantOrderId, state, amount, transactionId } = payload;

        console.log('Payment webhook:', {
          type,
          merchantOrderId,
          state,
          amount: amount ? amount / 100 : null,
          transactionId,
          timestamp: new Date().toISOString(),
        });

        // Update order status in database
        if (merchantOrderId) {
          try {
            const paymentStatus = state === 'COMPLETED' ? 'completed' : state === 'FAILED' ? 'failed' : 'pending';
            await updateOrderPaymentStatus(merchantOrderId, paymentStatus, transactionId);
            console.log('Order status updated in database:', merchantOrderId, paymentStatus);

            // Create WareIQ shipment if payment completed
            if (state === 'COMPLETED') {
              await createWareIQShipment(merchantOrderId);
            }
          } catch (dbError: any) {
            console.error('Failed to update order in database:', dbError.message);
          }
        }

        // Return 200 to acknowledge webhook receipt
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: true });
    }

    // This is a redirect callback (form POST from PhonePe checkout page)
    const formData = await request.formData();
    const checkoutOrderId = formData.get('checkoutOrderId') as string;
    const merchantOrderId = formData.get('merchantOrderId') as string;
    const transactionId = formData.get('transactionId') as string;

    const orderId = merchantOrderId || checkoutOrderId;

    if (!orderId) {
      return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
    }

    // Verify order status using SDK
    const client = getPhonePeClient();
    const statusResponse = await client.getOrderStatus(orderId);

    console.log('Order status response:', JSON.stringify(statusResponse, null, 2));

    // Update order status in database
    try {
      const paymentStatus = statusResponse.state === 'COMPLETED' ? 'completed' : statusResponse.state === 'FAILED' ? 'failed' : 'pending';
      await updateOrderPaymentStatus(orderId, paymentStatus, transactionId || undefined);
      console.log('Order status updated in database:', orderId, paymentStatus);

      // Create WareIQ shipment if payment completed
      if (statusResponse.state === 'COMPLETED') {
        await createWareIQShipment(orderId);
      }
    } catch (dbError: any) {
      console.error('Failed to update order in database:', dbError.message);
    }

    if (statusResponse.state === 'COMPLETED') {
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${orderId}&transactionId=${transactionId || ''}`
      );
    } else if (statusResponse.state === 'FAILED') {
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_failed&orderId=${orderId}`
      );
    } else {
      // Payment pending or other state
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_pending&orderId=${orderId}`
      );
    }
  } catch (error: any) {
    console.error('Payment callback error:', error.message || error);
    return NextResponse.redirect(`${SITE_URL}/checkout?error=callback_failed`);
  }
}

// Handle GET requests (for browser redirect)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkoutOrderId = searchParams.get('checkoutOrderId');
  const merchantOrderId = searchParams.get('merchantOrderId');
  const transactionId = searchParams.get('transactionId');

  const orderId = merchantOrderId || checkoutOrderId;

  if (!orderId) {
    return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
  }

  try {
    // Verify order status using SDK
    const client = getPhonePeClient();
    const statusResponse = await client.getOrderStatus(orderId);

    console.log('Order status (GET):', JSON.stringify(statusResponse, null, 2));

    // Update order status in database
    try {
      const paymentStatus = statusResponse.state === 'COMPLETED' ? 'completed' : statusResponse.state === 'FAILED' ? 'failed' : 'pending';
      await updateOrderPaymentStatus(orderId, paymentStatus, transactionId || undefined);
      console.log('Order status updated in database:', orderId, paymentStatus);

      // Create WareIQ shipment if payment completed
      if (statusResponse.state === 'COMPLETED') {
        await createWareIQShipment(orderId);
      }
    } catch (dbError: any) {
      console.error('Failed to update order in database:', dbError.message);
    }

    if (statusResponse.state === 'COMPLETED') {
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${orderId}&transactionId=${transactionId || ''}`
      );
    } else if (statusResponse.state === 'FAILED') {
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_failed&orderId=${orderId}`
      );
    } else {
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_pending&orderId=${orderId}`
      );
    }
  } catch (error: any) {
    console.error('Payment callback error:', error.message || error);
    return NextResponse.redirect(`${SITE_URL}/checkout?error=callback_failed`);
  }
}
