import { NextRequest, NextResponse } from 'next/server';
import { getPhonePeClient, SITE_URL, initiateRefund } from '@/lib/phonepe';
import { updateOrderPaymentStatus, getOrderByOrderId, updateOrderWareIQDetails, updateOrderRefundStatus } from '@/lib/supabase';
import { createWareIQOrder, requestPickup } from '@/lib/wareiq';
import { sendOrderConfirmationEmail, sendRefundProcessedEmail } from '@/lib/email';
import { releaseStock } from '@/lib/inventory';

// Helper function to send order confirmation email
async function sendConfirmationEmail(orderId: string) {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('[EMAIL] Order not found for email:', orderId);
      return { success: false, error: 'Order not found' };
    }

    const result = await sendOrderConfirmationEmail(order);
    if (result.success) {
      console.log('[EMAIL] Order confirmation email sent:', orderId);
    } else {
      console.error('[EMAIL] Failed to send confirmation email:', result.error);
    }
    return result;
  } catch (error: any) {
    console.error('[EMAIL] Exception sending confirmation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to release reserved stock on payment failure
async function releaseOrderStock(orderId: string) {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('[STOCK] Order not found for stock release:', orderId);
      return false;
    }

    const items = order.items as Array<{
      id?: string;
      name: string;
      quantity: number;
    }>;

    let allReleased = true;
    for (const item of items) {
      const sku = item.id || item.name.toLowerCase().replace(/\s+/g, '-');
      const released = await releaseStock(sku, item.quantity);
      if (released) {
        console.log(`[STOCK] Released ${item.quantity} units of ${sku} for order ${orderId}`);
      } else {
        console.error(`[STOCK] Failed to release stock for ${sku}`);
        allReleased = false;
      }
    }
    return allReleased;
  } catch (error: any) {
    console.error('[STOCK] Exception releasing order stock:', error.message);
    return false;
  }
}

// Helper function to initiate refund when order processing fails
async function initiateOrderRefund(orderId: string, reason: string) {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('[REFUND] Order not found:', orderId);
      return { success: false, error: 'Order not found' };
    }

    // Only refund if payment was completed
    if (order.payment_status !== 'completed') {
      console.log('[REFUND] Skipping refund - payment not completed:', orderId);
      return { success: false, error: 'Payment not completed' };
    }

    // Only refund prepaid orders (COD doesn't need refund)
    if (order.payment_method === 'cod') {
      console.log('[REFUND] Skipping refund - COD order:', orderId);
      return { success: false, error: 'COD order' };
    }

    const refundAmount = Number(order.total);
    console.log('[REFUND] Initiating refund for order:', orderId, 'Amount:', refundAmount);

    const refundResult = await initiateRefund(orderId, refundAmount);

    if (refundResult.success) {
      // Update order with refund details
      await updateOrderRefundStatus(orderId, {
        refund_id: refundResult.refundId,
        refund_status: 'pending',
        refund_amount: refundAmount,
        refund_reason: reason,
      });

      // Send refund email
      try {
        await sendRefundProcessedEmail(order, refundAmount);
      } catch (emailErr: any) {
        console.error('[REFUND] Failed to send refund email:', emailErr.message);
      }

      console.log('[REFUND] Refund initiated successfully:', refundResult.refundId);
    } else {
      console.error('[REFUND] Refund failed:', refundResult.error);
      // Mark refund as failed so we can retry manually
      await updateOrderRefundStatus(orderId, {
        refund_status: 'failed',
        refund_amount: refundAmount,
        refund_reason: `${reason} - Refund failed: ${refundResult.error}`,
      });
    }

    return refundResult;
  } catch (error: any) {
    console.error('[REFUND] Exception initiating refund:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to create WareIQ order after successful payment
async function createWareIQShipment(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('[WAREIQ] Order not found for shipment:', orderId);
      return { success: false, error: 'Order not found' };
    }

    // Skip if already created in WareIQ
    if (order.wareiq_unique_id) {
      console.log('[WAREIQ] Order already exists in WareIQ:', orderId);
      return { success: true };
    }

    const shippingAddress = order.shipping_address as {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };

    const items = order.items as Array<{
      id?: string;
      name: string;
      price: number;
      quantity: number;
    }>;

    // Use payment_method from order, default to 'prepaid' for completed payments
    const paymentMethod = order.payment_method || 'prepaid';

    console.log('[WAREIQ] Creating order:', orderId);

    // WareIQ API expects total EXCLUDING shipping charges
    const subtotal = Number(order.subtotal) || (Number(order.total) - (Number(order.shipping_cost) || 0));

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
      total: subtotal, // Total EXCLUDING shipping (as per WareIQ API docs)
      shipping_charges: Number(order.shipping_cost) || 0,
      payment_method: paymentMethod as 'prepaid' | 'cod',
      products: items.map((item) => ({
        sku: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
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
      console.log('[WAREIQ] Order created successfully:', wareiqResponse.unique_id);

      // Request pickup after order creation
      const pickupResult = await requestPickup([orderId]);
      if (!pickupResult.success) {
        console.error('[WAREIQ] Pickup request failed:', pickupResult.error);
        // Don't fail the order - pickup can be retried manually
      } else {
        console.log('[WAREIQ] Pickup requested for order:', orderId);
      }

      return { success: true };
    } else {
      const errorMsg = wareiqResponse.error || wareiqResponse.msg || 'Unknown WareIQ error';
      console.error('[WAREIQ] Order creation failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    console.error('[WAREIQ] Exception creating order:', error.message);
    return { success: false, error: error.message };
  }
}

// Process completed payment - create shipment, send email, etc.
async function processCompletedPayment(orderId: string) {
  console.log('[PROCESS] Processing completed payment for order:', orderId);

  // Step 1: Create WareIQ shipment
  const shipmentResult = await createWareIQShipment(orderId);

  if (!shipmentResult.success) {
    console.error('[PROCESS] WareIQ shipment creation failed for order:', orderId);

    // Release stock since we can't ship
    await releaseOrderStock(orderId);

    // Initiate refund since order can't be fulfilled
    await initiateOrderRefund(orderId, `Shipment creation failed: ${shipmentResult.error}`);

    // Update order status to indicate failure
    try {
      await updateOrderWareIQDetails(orderId, {
        shipping_status: 'cancelled',
      });
    } catch (e) {
      console.error('[PROCESS] Failed to update shipping status:', e);
    }

    return { success: false, error: shipmentResult.error };
  }

  // Step 2: Send confirmation email
  await sendConfirmationEmail(orderId);

  console.log('[PROCESS] Order processing completed successfully:', orderId);
  return { success: true };
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
        console.error('[WEBHOOK] Auth failed: Invalid credentials');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      console.log('[WEBHOOK] Received:', JSON.stringify(body, null, 2));

      // PhonePe v2 webhook payload format
      const { type, payload } = body;

      if (payload) {
        const { merchantOrderId, state, amount, transactionId } = payload;

        console.log('[WEBHOOK] Payment details:', {
          type,
          merchantOrderId,
          state,
          amount: amount ? amount / 100 : null,
          transactionId,
          timestamp: new Date().toISOString(),
        });

        // CRITICAL: Update order status in database FIRST
        if (merchantOrderId) {
          const paymentStatus = state === 'COMPLETED' ? 'completed' : state === 'FAILED' ? 'failed' : 'pending';

          try {
            await updateOrderPaymentStatus(merchantOrderId, paymentStatus, transactionId);
            console.log('[WEBHOOK] Payment status updated:', merchantOrderId, paymentStatus);
          } catch (dbError: any) {
            console.error('[WEBHOOK] CRITICAL: Failed to update payment status:', dbError.message);
            // Return 500 so PhonePe will retry the webhook
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          // Process based on payment state
          if (state === 'COMPLETED') {
            // Process the completed payment (create shipment, send email)
            await processCompletedPayment(merchantOrderId);
          } else if (state === 'FAILED') {
            // Release reserved stock on payment failure
            await releaseOrderStock(merchantOrderId);
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

    console.log('[CALLBACK] Form POST received:', { orderId, transactionId });

    if (!orderId) {
      return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
    }

    // Verify order status using SDK
    const client = getPhonePeClient();
    const statusResponse = await client.getOrderStatus(orderId);

    console.log('[CALLBACK] Order status from PhonePe:', JSON.stringify(statusResponse, null, 2));

    // CRITICAL: Update order status in database FIRST
    const paymentStatus = statusResponse.state === 'COMPLETED' ? 'completed' : statusResponse.state === 'FAILED' ? 'failed' : 'pending';

    try {
      await updateOrderPaymentStatus(orderId, paymentStatus, transactionId || undefined);
      console.log('[CALLBACK] Payment status updated:', orderId, paymentStatus);
    } catch (dbError: any) {
      console.error('[CALLBACK] Failed to update payment status:', dbError.message);
      // Continue to redirect even if DB update fails - webhook will retry
    }

    // Process based on payment state
    if (statusResponse.state === 'COMPLETED') {
      await processCompletedPayment(orderId);
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${orderId}&transactionId=${transactionId || ''}`
      );
    } else if (statusResponse.state === 'FAILED') {
      await releaseOrderStock(orderId);
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
    console.error('[CALLBACK] Error:', error.message || error);
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

  console.log('[CALLBACK] GET received:', { orderId, transactionId });

  if (!orderId) {
    return NextResponse.redirect(`${SITE_URL}/checkout?error=invalid_callback`);
  }

  try {
    // Verify order status using SDK
    const client = getPhonePeClient();
    const statusResponse = await client.getOrderStatus(orderId);

    console.log('[CALLBACK] Order status (GET):', JSON.stringify(statusResponse, null, 2));

    // CRITICAL: Update order status in database FIRST
    const paymentStatus = statusResponse.state === 'COMPLETED' ? 'completed' : statusResponse.state === 'FAILED' ? 'failed' : 'pending';

    try {
      await updateOrderPaymentStatus(orderId, paymentStatus, transactionId || undefined);
      console.log('[CALLBACK] Payment status updated:', orderId, paymentStatus);
    } catch (dbError: any) {
      console.error('[CALLBACK] Failed to update payment status:', dbError.message);
    }

    // Process based on payment state
    if (statusResponse.state === 'COMPLETED') {
      await processCompletedPayment(orderId);
      return NextResponse.redirect(
        `${SITE_URL}/success?orderId=${orderId}&transactionId=${transactionId || ''}`
      );
    } else if (statusResponse.state === 'FAILED') {
      await releaseOrderStock(orderId);
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_failed&orderId=${orderId}`
      );
    } else {
      return NextResponse.redirect(
        `${SITE_URL}/checkout?error=payment_pending&orderId=${orderId}`
      );
    }
  } catch (error: any) {
    console.error('[CALLBACK] Error:', error.message || error);
    return NextResponse.redirect(`${SITE_URL}/checkout?error=callback_failed`);
  }
}
