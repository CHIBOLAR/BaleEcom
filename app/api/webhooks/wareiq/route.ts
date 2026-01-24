import { NextRequest, NextResponse } from 'next/server';
import { supabase, getOrderByOrderId } from '@/lib/supabase';
import {
  sendShippingConfirmationEmail,
  sendOutForDeliveryEmail,
  sendDeliveryConfirmationEmail,
  sendNDREmail,
} from '@/lib/email';
import { getStatusLabel, isDelivered, isRTO, isNDR } from '@/lib/wareiq-extended';

const WAREIQ_WEBHOOK_SECRET = process.env.WAREIQ_WEBHOOK_SECRET;

// WareIQ webhook payload structure
interface WareIQWebhookPayload {
  event_type: string;
  order_id: string;
  unique_id: number;
  awb_number?: string;
  courier?: string;
  status: string;
  status_code: string;
  location?: string;
  description?: string;
  timestamp: string;
  estimated_delivery?: string;
  ndr_reason?: string;
  ndr_count?: number;
}

// Verify webhook signature (if WareIQ provides one)
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  if (!WAREIQ_WEBHOOK_SECRET) {
    // If no secret configured, accept all webhooks (not recommended for production)
    console.warn('WAREIQ_WEBHOOK_SECRET not configured - accepting webhook without verification');
    return true;
  }

  const signature = request.headers.get('x-wareiq-signature');
  if (!signature) {
    return false;
  }

  // WareIQ typically uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', WAREIQ_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

// Map WareIQ status to our shipping status
function mapToShippingStatus(statusCode: string): string {
  const statusMap: Record<string, string> = {
    'CREATED': 'processing',
    'CONFIRMED': 'processing',
    'PICKED_UP': 'shipped',
    'IN_TRANSIT': 'in_transit',
    'REACHED_DESTINATION_HUB': 'in_transit',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'RTO_INITIATED': 'rto_initiated',
    'RTO_IN_TRANSIT': 'rto_initiated',
    'RTO_DELIVERED': 'rto_delivered',
    'CANCELLED': 'cancelled',
  };
  return statusMap[statusCode] || 'processing';
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, bodyText)) {
      console.error('WareIQ webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: WareIQWebhookPayload = JSON.parse(bodyText);

    console.log('WareIQ webhook received:', JSON.stringify(payload, null, 2));

    const {
      order_id,
      unique_id,
      awb_number,
      courier,
      status,
      status_code,
      location,
      description,
      timestamp,
      estimated_delivery,
      ndr_reason,
      ndr_count,
    } = payload;

    // Get order from our database
    const order = await getOrderByOrderId(order_id);
    if (!order) {
      console.error('Order not found for webhook:', order_id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Log shipment event
    try {
      await supabase.from('shipment_events').insert({
        order_id,
        status: getStatusLabel(status_code),
        location,
        description,
        event_time: timestamp,
        raw_data: payload,
      });
    } catch (err) {
      console.error('Failed to log shipment event:', err);
    }

    // Update order with latest status
    const shippingStatus = mapToShippingStatus(status_code);
    const updateData: any = {
      shipping_status: shippingStatus,
      updated_at: new Date().toISOString(),
    };

    // Update AWB and courier if provided
    if (awb_number && !order.awb_number) {
      updateData.awb_number = awb_number;
    }
    if (courier) {
      updateData.courier_name = courier;
    }
    if (estimated_delivery) {
      updateData.estimated_delivery = estimated_delivery;
    }
    if (ndr_count) {
      updateData.ndr_count = ndr_count;
    }
    if (isRTO(status_code)) {
      updateData.is_rto = true;
    }
    if (isDelivered(status_code)) {
      updateData.actual_delivery = timestamp;
    }

    try {
      await supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', order_id);

      console.log('Order updated:', order_id, shippingStatus);
    } catch (err) {
      console.error('Failed to update order:', err);
    }

    // Send notifications based on status
    try {
      // Refresh order data after update
      const updatedOrder = await getOrderByOrderId(order_id);
      if (!updatedOrder) {
        throw new Error('Failed to refresh order data');
      }

      switch (status_code) {
        case 'PICKED_UP':
        case 'IN_TRANSIT':
          // Only send shipping confirmation once when first shipped
          if (awb_number && order.shipping_status === 'processing') {
            const estimatedDate = estimated_delivery ? new Date(estimated_delivery) : undefined;
            await sendShippingConfirmationEmail(
              updatedOrder,
              awb_number,
              courier || 'Courier Partner',
              estimatedDate
            );
          }
          break;

        case 'OUT_FOR_DELIVERY':
          await sendOutForDeliveryEmail(updatedOrder);
          break;

        case 'DELIVERED':
          await sendDeliveryConfirmationEmail(updatedOrder);
          break;

        case 'NDR':
        case 'UNDELIVERED':
          if (ndr_reason) {
            // Calculate next attempt date (usually next day)
            const reattemptDate = new Date();
            reattemptDate.setDate(reattemptDate.getDate() + 1);
            await sendNDREmail(updatedOrder, ndr_reason, reattemptDate);
          }
          break;

        case 'RTO_INITIATED':
          // Handle RTO - create return record
          try {
            await supabase.from('returns').insert({
              order_id,
              type: 'rto',
              reason: ndr_reason || 'Delivery failed after multiple attempts',
              status: 'initiated',
              refund_status: 'pending',
              refund_amount: Number(order.total),
            });
          } catch (err) {
            console.error('Failed to create RTO return record:', err);
          }
          break;
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WareIQ webhook error:', error.message || error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification/health check)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'WareIQ webhook endpoint is active',
  });
}
