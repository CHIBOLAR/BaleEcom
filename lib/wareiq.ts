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
  // Validate API key is configured
  if (!WAREIQ_API_KEY) {
    console.error('[WAREIQ] API key not configured');
    return {
      status: 'error',
      error: 'WAREIQ_API_KEY not configured',
    };
  }

  const formattedPayload = {
    ...payload,
    customer_phone: formatPhoneNumber(payload.customer_phone),
    order_date: payload.order_date || formatOrderDate(),
    shipping_charges: payload.shipping_charges || 0,
  };

  console.log('[WAREIQ] Creating order:', {
    order_id: formattedPayload.order_id,
    city: formattedPayload.city,
    pincode: formattedPayload.pincode,
    payment_method: formattedPayload.payment_method,
    products: formattedPayload.products.map(p => ({ sku: p.sku, qty: p.quantity })),
  });

  try {
    const response = await fetch(`${WAREIQ_BASE_URL}/orders/v2/forward/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
      },
      body: JSON.stringify(formattedPayload),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[WAREIQ] Invalid JSON response:', responseText.substring(0, 500));
      return {
        status: 'error',
        error: `Invalid response from WareIQ: ${responseText.substring(0, 200)}`,
      };
    }

    console.log('[WAREIQ] Response:', {
      status: response.status,
      ok: response.ok,
      data: data,
    });

    if (!response.ok) {
      console.error('[WAREIQ] API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      return {
        status: 'error',
        error: data.error || data.msg || data.message || `HTTP ${response.status}: ${response.statusText}`,
        msg: data.msg,
      };
    }

    // Successful response
    return {
      status: data.status || 'success',
      order_id: data.order_id,
      unique_id: data.unique_id,
      client_prefix: data.client_prefix,
      msg: data.msg,
    };
  } catch (error: any) {
    console.error('[WAREIQ] Network/fetch error:', error.message);
    return {
      status: 'error',
      error: `Network error: ${error.message}`,
    };
  }
}

/**
 * Request pickup for orders - This MUST be called after creating an order
 * to schedule courier pickup from warehouse
 */
export async function requestPickup(orderIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!WAREIQ_API_KEY) {
    console.error('[WAREIQ] API key not configured');
    return { success: false, error: 'WAREIQ_API_KEY not configured' };
  }

  if (!orderIds.length) {
    return { success: false, error: 'No order IDs provided' };
  }

  console.log('[WAREIQ] Requesting pickup for orders:', orderIds);

  try {
    const response = await fetch(`${WAREIQ_BASE_URL}/orders/v2/actions/manifests/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
      },
      body: JSON.stringify({ order_ids: orderIds }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[WAREIQ] Invalid JSON response for pickup:', responseText.substring(0, 500));
      return { success: false, error: `Invalid response: ${responseText.substring(0, 200)}` };
    }

    console.log('[WAREIQ] Pickup response:', {
      status: response.status,
      ok: response.ok,
      data: data,
    });

    if (!response.ok || data.status !== 'success') {
      console.error('[WAREIQ] Pickup request failed:', data);
      return {
        success: false,
        error: data.error || data.msg || data.message || `HTTP ${response.status}`,
      };
    }

    console.log('[WAREIQ] Pickup requested successfully for:', orderIds);
    return { success: true };
  } catch (error: any) {
    console.error('[WAREIQ] Pickup request error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Force ship orders with a specific courier
 * Note: order_ids here are WareIQ unique_ids (integers), NOT merchant order_ids
 * This is an async API - it queues the request for processing
 */
export async function forceShipWithCourier(
  wareiqUniqueIds: number[],
  courier: string
): Promise<{
  success: boolean;
  msg?: string;
  error?: string;
}> {
  if (!WAREIQ_API_KEY) {
    console.error('[WAREIQ] API key not configured');
    return { success: false, error: 'WAREIQ_API_KEY not configured' };
  }

  if (!wareiqUniqueIds.length) {
    return { success: false, error: 'No order IDs provided' };
  }

  if (!courier) {
    return { success: false, error: 'Courier name is required' };
  }

  console.log('[WAREIQ] Force shipping orders with courier:', { wareiqUniqueIds, courier });

  try {
    const response = await fetch(`${WAREIQ_BASE_URL}/celery/shipping/v1/force_run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
      },
      body: JSON.stringify({
        order_ids: wareiqUniqueIds,
        courier: courier,
      }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[WAREIQ] Invalid JSON response for force ship:', responseText.substring(0, 500));
      return { success: false, error: `Invalid response: ${responseText.substring(0, 200)}` };
    }

    console.log('[WAREIQ] Force ship response:', {
      status: response.status,
      data: data,
    });

    // API returns 202 Accepted for async processing
    if (response.status === 202 || data.success) {
      console.log('[WAREIQ] Force ship request queued successfully');
      return { success: true, msg: data.msg };
    }

    return {
      success: false,
      error: data.error || data.msg || `HTTP ${response.status}`,
    };
  } catch (error: any) {
    console.error('[WAREIQ] Force ship error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger shipping for all pending orders
 * This is a simple GET endpoint that processes all pending orders
 */
export async function triggerShipOrders(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  if (!WAREIQ_API_KEY) {
    console.error('[WAREIQ] API key not configured');
    return { success: false, error: 'WAREIQ_API_KEY not configured' };
  }

  console.log('[WAREIQ] Triggering ship_orders for all pending orders');

  try {
    const response = await fetch(`${WAREIQ_BASE_URL}/orders/v1/ship_orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
      },
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[WAREIQ] Invalid JSON response for ship_orders:', responseText.substring(0, 500));
      return { success: false, error: `Invalid response: ${responseText.substring(0, 200)}` };
    }

    console.log('[WAREIQ] Ship orders response:', {
      status: response.status,
      data: data,
    });

    if (response.ok) {
      console.log('[WAREIQ] Ship orders triggered successfully');
      return { success: true, data: data };
    }

    return {
      success: false,
      error: data.error || data.msg || `HTTP ${response.status}`,
    };
  } catch (error: any) {
    console.error('[WAREIQ] Ship orders error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function assignShippingProvider(
  uniqueId: number,
  shippingProvider?: string,
  awb?: string
): Promise<{ status: string; message?: string }> {
  console.log('[WAREIQ] Assigning shipping provider:', { uniqueId, shippingProvider });

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
    console.error('[WAREIQ] Shipping provider error:', data);
    throw new Error(data.error || 'Failed to assign shipping provider');
  }

  console.log('[WAREIQ] Shipping provider assigned:', data);
  return data;
}
export async function listWareIQOrders(
  payload: any,
  type: 'b2c' | 'return' | 'b2b' | 'international' = 'b2c',
  subset: 'new' | 'ready_to_ship' | 'shipped' | 'ndr' | 'return' | 'all' = 'all'
) {
  const response = await fetch(
    `${WAREIQ_BASE_URL}/orders/v2/orders/${type}/${subset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('[WAREIQ] Orders list error:', data);
    throw new Error(data.error || data.msg || 'Failed to list WareIQ orders');
  }

  return data;
}