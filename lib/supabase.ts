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
