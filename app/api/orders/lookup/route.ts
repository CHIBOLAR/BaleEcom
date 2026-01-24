import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createWareIQOrder } from '@/lib/wareiq';

export async function POST(req: NextRequest) {
  try {
    /**
     * 1️⃣ Fetch orders that have NOT been pushed to WareIQ
     * (wareiq_unique_id / unique_id is NULL)
     */
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('unique_id', null)
      .limit(10);

    if (error) {
      console.error('DB fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No pending orders to push',
      });
    }

    const results: any[] = [];

    /**
     * 2️⃣ Push each order to WareIQ
     */
    for (const order of orders) {
      try {
        const payload = {
          order_id: order.order_id,
          full_name: order.customer_name,
          address1: order.shipping_address.address1,
          address2: order.shipping_address.address2 || '',
          city: order.shipping_address.city,
          pincode: order.shipping_address.pincode,
          state: order.shipping_address.state,
          country: 'India',
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          payment_method: order.payment_method,
          total: order.total,
          products: order.items.map((item: any) => ({
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            amount: item.price * item.quantity,
          })),
        };

        const wiqResponse = await createWareIQOrder(payload);

        if (wiqResponse.status === 'success' && wiqResponse.unique_id) {
          // 3️⃣ Persist WareIQ identifiers
          await supabase
            .from('orders')
            .update({
              unique_id: wiqResponse.unique_id,
              wareiq_order_id: wiqResponse.order_id,
            })
            .eq('order_id', order.order_id);

          results.push({
            order_id: order.order_id,
            status: 'pushed',
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
    console.error('Lookup route error:', err);
    return NextResponse.json(
      { error: 'Lookup failed' },
      { status: 500 }
    );
  }
}
