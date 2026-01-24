import { NextRequest, NextResponse } from 'next/server';
import { supabase, getOrderByOrderId } from '@/lib/supabase';
import { getTrackingByAWB, getStatusLabel } from '@/lib/wareiq-extended';
import { listWareIQOrders } from '@/lib/wareiq';

// GET /api/orders/[id] - Get order details and tracking info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch order from DB
    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 2️⃣ Backfill AWB from WareIQ if missing
    if (!order.awb_number) {
      try {
        const wareiqResponse = await listWareIQOrders({
          search: {
            order_details: order.order_id,
            exact_search: true,
          },
          page: 1,
          per_page: 1,
        });

        const wiqOrder = wareiqResponse?.data?.[0];

        if (wiqOrder?.awb_number) {
          // Persist to DB
          await supabase
            .from('orders')
            .update({
              awb_number: wiqOrder.awb_number,
              courier_name: wiqOrder.courier,
              shipping_status: wiqOrder.status,
            })
            .eq('order_id', order.order_id);

          // Update in-memory object
          order.awb_number = wiqOrder.awb_number;
          order.courier_name = wiqOrder.courier;
          order.shipping_status = wiqOrder.status;
        }
      } catch (err) {
        console.error('WareIQ AWB backfill failed:', err);
      }
    }

    // 3️⃣ Fetch local tracking events
    const { data: trackingEvents } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_time', { ascending: false });

    // 4️⃣ Fetch live tracking ONLY if AWB exists
    let liveTracking = null;
    if (order.awb_number) {
      try {
        liveTracking = await getTrackingByAWB(order.awb_number);
      } catch (err) {
        console.error('Failed to get live tracking:', err);
      }
    }

    // 5️⃣ Respond
    return NextResponse.json({
      order: {
        id: order.order_id,
        status: order.shipping_status,
        statusLabel: getStatusLabel(
          order.shipping_status?.toUpperCase() || 'CREATED'
        ),
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
        liveTracking,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
