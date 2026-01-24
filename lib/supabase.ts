import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key (for API routes)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for orders
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id?: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method?: 'prepaid' | 'cod';
  transaction_id?: string;
  shipping_status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto_initiated' | 'rto_delivered' | 'cancelled';
  tracking_number?: string;
  wareiq_unique_id?: number;
  wareiq_order_id?: string;
  awb_number?: string;
  shipping_provider?: string;
  courier_name?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  ndr_count?: number;
  is_rto?: boolean;
  weight?: number;
  cod_amount?: number;
  // Coupon & Attribution fields
  coupon_code?: string;
  coupon_discount?: number;
  influencer?: string;
  // Refund fields
  refund_id?: string;
  refund_status?: 'pending' | 'completed' | 'failed';
  refund_amount?: number;
  refund_reason?: string;
  created_at?: string;
  updated_at?: string;
}

// Order operations
export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }

  return data;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: Order['payment_status'],
  transactionId?: string
) {
  const updateData: Partial<Order> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (transactionId) {
    updateData.transaction_id = transactionId;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }

  return data;
}

export async function getOrderByOrderId(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data;
}

export async function updateOrderWareIQDetails(
  orderId: string,
  wareiqDetails: {
    wareiq_unique_id?: number;
    wareiq_order_id?: string;
    awb_number?: string;
    shipping_provider?: string;
    shipping_status?: Order['shipping_status'];
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      ...wareiqDetails,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating WareIQ details:', error);
    throw error;
  }

  return data;
}

// Get orders by influencer/coupon code
export async function getOrdersByInfluencer(influencer: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('influencer', influencer)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching influencer orders:', error);
    throw error;
  }

  return data;
}

// Get orders by coupon code
export async function getOrdersByCoupon(couponCode: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('coupon_code', couponCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupon orders:', error);
    throw error;
  }

  return data;
}

// Get influencer statistics
export interface InfluencerStats {
  influencer: string;
  influencer_name: string | null;
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
  total_discounts: number;
}

export async function getInfluencerStats(): Promise<InfluencerStats[]> {
  const { data, error } = await supabase
    .from('influencer_stats')
    .select('*');

  if (error) {
    console.error('Error fetching influencer stats:', error);
    // Fallback: calculate manually if view doesn't exist
    const { data: orders } = await supabase
      .from('orders')
      .select('influencer, coupon_code, coupon_discount, total, payment_status')
      .not('influencer', 'is', null);

    if (!orders) return [];

    const statsMap = new Map<string, InfluencerStats>();

    for (const order of orders) {
      const key = order.influencer;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          influencer: key,
          influencer_name: null,
          total_orders: 0,
          completed_orders: 0,
          total_revenue: 0,
          total_discounts: 0,
        });
      }

      const stats = statsMap.get(key)!;
      stats.total_orders++;
      if (order.payment_status === 'completed') {
        stats.completed_orders++;
        stats.total_revenue += Number(order.total) || 0;
        stats.total_discounts += Number(order.coupon_discount) || 0;
      }
    }

    return Array.from(statsMap.values());
  }

  return data || [];
}

// Update order with refund details
export async function updateOrderRefundStatus(
  orderId: string,
  refundDetails: {
    refund_id?: string;
    refund_status?: 'pending' | 'completed' | 'failed';
    refund_amount?: number;
    refund_reason?: string;
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      ...refundDetails,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order refund status:', error);
    throw error;
  }

  return data;
}

// Get order analytics summary
export async function getOrderAnalytics() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, payment_status, payment_method, coupon_code, coupon_discount, influencer, created_at');

  if (error) {
    console.error('Error fetching order analytics:', error);
    throw error;
  }

  const analytics = {
    total_orders: orders.length,
    completed_orders: 0,
    pending_orders: 0,
    failed_orders: 0,
    total_revenue: 0,
    total_discounts: 0,
    prepaid_orders: 0,
    cod_orders: 0,
    coupon_orders: 0,
    influencer_orders: 0,
  };

  for (const order of orders) {
    if (order.payment_status === 'completed') {
      analytics.completed_orders++;
      analytics.total_revenue += Number(order.total) || 0;
    } else if (order.payment_status === 'pending') {
      analytics.pending_orders++;
    } else {
      analytics.failed_orders++;
    }

    analytics.total_discounts += Number(order.coupon_discount) || 0;

    if (order.payment_method === 'prepaid') analytics.prepaid_orders++;
    if (order.payment_method === 'cod') analytics.cod_orders++;
    if (order.coupon_code) analytics.coupon_orders++;
    if (order.influencer) analytics.influencer_orders++;
  }

  return analytics;
}
