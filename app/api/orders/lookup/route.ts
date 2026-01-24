import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWareIQOrder } from '@/lib/wareiq';

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Fetch orders that have NOT been pushed to WareIQ yet
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('wareiq_unique_id', null)
      .limit(5);

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No pending orders to push to WareIQ',
      });
    }

    const results: any[] = [];

    // 2️⃣ Push each order to WareIQ
    for (const order of orders) {
      try {
        // 🔹 Parse shipping address (stored as string in your DB)
        const shippingAddress =
          typeof order.shipping_address === 'string'
            ? JSON.parse(order.shipping_address)
            : order.shipping_address;

        const payload = {
          order_id: order.order_id,
          full_name: order.customer_name,
          address1: shippingAddress.address,
          address2: '',
          city: shippingAddress.city,
          pincode: shippingAddress.pincode,
          state: shippingAddress.state,
          country: 'India',
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          payment_method: order.payment_method,
          total: Number(order.total),
          products: order.items.map((item: any) => ({
            sku: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            amount: item.price * item.quantity,
          })),
        };

        // 🔹 Push to WareIQ
        const wiqResponse = await createWareIQOrder(payload);

        if (wiqResponse.status === 'success' && wiqResponse.unique_id) {
          // 3️⃣ Save WareIQ identifiers back to DB
          await supabase
            .from('orders')
            .update({
              wareiq_unique_id: wiqResponse.unique_id,
              wareiq_order_id: wiqResponse.order_id,
            })
            .eq('order_id', order.order_id);

          results.push({
            order_id: order.order_id,
            status: 'pushed_to_wareiq',
          });
        } else {
          results.push({
            order_id: order.order_id,
            status: 'failed',
            reason: wiqResponse.error || wiqResponse.msg,
          });
        }
      } catch (err: any) {
        console.error('WareIQ push failed:', err);
        results.push({
          order_id: order.order_id,
          status: 'failed',
          reason: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    console.error('Lookup route fatal error:', err);
    return NextResponse.json(
      { error: 'Lookup route failed' },
      { status: 500 }
    );
  }
}
