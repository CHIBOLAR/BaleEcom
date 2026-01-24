import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderId, supabase } from '@/lib/supabase';
import { getOrderTracking, getStatusLabel } from '@/lib/wareiq-extended';

// GET /api/orders/[id] - Get order details and tracking info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order from database
    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get tracking events from our database
    const { data: trackingEvents } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_time', { ascending: false });

    // Try to get live tracking from WareIQ if order has AWB
    let liveTracking = null;
    if (order.awb_number) {
      try {
        liveTracking = await getOrderTracking(orderId);
      } catch (err) {
        console.error('Failed to get live tracking:', err);
      }
    }

    // Format response
    const response = {
      order: {
        id: order.order_id,
        status: order.shipping_status,
        statusLabel: getStatusLabel(order.shipping_status?.toUpperCase() || 'CREATED'),
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method || 'prepaid',
        total: order.total,
        items: order.items,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
        },
        shippingAddress: order.shipping_address,
        awbNumber: order.awb_number,
        courierName: order.courier_name,
        estimatedDelivery: order.estimated_delivery,
        actualDelivery: order.actual_delivery,
        isRTO: order.is_rto,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
      tracking: {
        events: trackingEvents || [],
        liveTracking: liveTracking ? {
          currentStatus: liveTracking.current_status,
          estimatedDelivery: liveTracking.estimated_delivery,
          courier: liveTracking.courier,
          events: liveTracking.events,
        } : null,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching order:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
