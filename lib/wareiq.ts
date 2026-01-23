const WAREIQ_BASE_URL = 'https://wms.wareiq.com/V2';
const WAREIQ_API_KEY = process.env.WAREIQ_API_KEY!;

export interface WareIQProduct {
  sku: string;
  name: string;
  price: number;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  amount: number;
  quantity: number;
}

export interface WareIQOrderPayload {
  order_id: string;
  full_name: string;
  address1: string;
  address2?: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  customer_phone: string;
  customer_email: string;
  total: number;
  shipping_charges?: number;
  payment_method: 'prepaid' | 'cod' | 'pickup';
  products: WareIQProduct[];
  order_date?: string;
}

export interface WareIQOrderResponse {
  status: 'success' | 'error';
  msg?: string;
  order_id?: string;
  unique_id?: number;
  client_prefix?: string;
  error?: string;
}

function formatPhoneNumber(phone: string): string {
  // Pad zero at the start of 10 digits as per WareIQ requirement
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '0' + cleaned;
  }
  return cleaned;
}

function formatOrderDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function createWareIQOrder(payload: WareIQOrderPayload): Promise<WareIQOrderResponse> {
  const formattedPayload = {
    ...payload,
    customer_phone: formatPhoneNumber(payload.customer_phone),
    order_date: payload.order_date || formatOrderDate(),
    shipping_charges: payload.shipping_charges || 0,
  };

  console.log('Creating WareIQ order:', formattedPayload.order_id);

  const response = await fetch(`${WAREIQ_BASE_URL}/orders/v2/forward/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAREIQ_API_KEY}`,
    },
    body: JSON.stringify(formattedPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('WareIQ API error:', data);
    throw new Error(data.error || data.msg || 'Failed to create WareIQ order');
  }

  console.log('WareIQ order created:', data);
  return data;
}

export async function assignShippingProvider(
  uniqueId: number,
  shippingProvider?: string,
  awb?: string
): Promise<{ status: string; message?: string }> {
  const response = await fetch(`${WAREIQ_BASE_URL}/orders/v2/actions/shipping_provider`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAREIQ_API_KEY}`,
    },
    body: JSON.stringify({
      unique_id: uniqueId,
      shipping_provider: shippingProvider || 'WIQ',
      awb: awb,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('WareIQ shipping provider error:', data);
    throw new Error(data.error || 'Failed to assign shipping provider');
  }

  return data;
}
