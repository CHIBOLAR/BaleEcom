const WAREIQ_BASE_URL = 'https://track.wareiq.com';
const WAREIQ_API_KEY = process.env.WAREIQ_API_KEY!;

// =============================================
// Types
// =============================================

export interface WareIQTrackingEvent {
  status: string;
  status_code: string;
  location?: string;
  description?: string;
  timestamp: string;
}

export interface WareIQTrackingResponse {
  status: 'success' | 'error';
  awb_number?: string;
  courier?: string;
  current_status?: string;
  current_status_code?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  events?: WareIQTrackingEvent[];
  error?: string;
}

export interface WareIQOrderDetails {
  unique_id: number;
  order_id: string;
  awb_number?: string;
  shipping_provider?: string;
  status: string;
  status_code: string;
  estimated_delivery?: string;
  delivered_at?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  total: number;
  weight?: number;
  tracking_events?: WareIQTrackingEvent[];
}

export interface WareIQCancelResponse {
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

export interface WareIQReturnPayload {
  order_id: string;
  reason: string;
  comments?: string;
}

export interface WareIQReturnResponse {
  status: 'success' | 'error';
  reverse_order_id?: string;
  reverse_awb?: string;
  pickup_date?: string;
  error?: string;
}

export interface WareIQCourier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  supported_modes: string[];
}

export interface WareIQNDRItem {
  order_id: string;
  awb_number: string;
  ndr_reason: string;
  ndr_count: number;
  last_attempt_date: string;
  next_attempt_date?: string;
  status: string;
}

export interface WareIQInventoryItem {
  sku: string;
  product_name: string;
  quantity: number;
  reserved: number;
  available: number;
  warehouse: string;
}

// =============================================
// Helper Functions
// =============================================

async function wareiqRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: any
): Promise<T> {
  const response = await fetch(`${WAREIQ_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': WAREIQ_API_KEY,
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`WareIQ API error [${endpoint}]:`, data);
    throw new Error(data.error || data.msg || 'WareIQ API request failed');
  }

  return data;
}

// =============================================
// Order Management APIs
// =============================================

/**
 * Get order details from WareIQ
 */
export async function getWareIQOrder(uniqueId: number): Promise<WareIQOrderDetails> {
  return wareiqRequest<WareIQOrderDetails>(`/orders/v2/${uniqueId}`);
}

/**
 * Get order by order ID (merchant order ID)
 */
export async function getWareIQOrderByOrderId(orderId: string): Promise<WareIQOrderDetails | null> {
  try {
    const response = await wareiqRequest<{ orders: WareIQOrderDetails[] }>(
      `/orders/v2?order_id=${encodeURIComponent(orderId)}`
    );
    return response.orders?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Cancel an order in WareIQ (only before shipment)
 */
export async function cancelWareIQOrder(
  uniqueId: number,
  reason?: string
): Promise<WareIQCancelResponse> {
  return wareiqRequest<WareIQCancelResponse>('/orders/v2/cancel', 'POST', {
    unique_id: uniqueId,
    reason: reason || 'Customer requested cancellation',
  });
}

/**
 * Update order details in WareIQ (address corrections)
 */
export async function updateWareIQOrder(
  uniqueId: number,
  updates: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    customer_phone?: string;
  }
): Promise<{ status: string; message?: string }> {
  return wareiqRequest('/orders/v2/update', 'PATCH', {
    unique_id: uniqueId,
    ...updates,
  });
}

// =============================================
// Tracking APIs
// =============================================

/**
 * Get tracking details by AWB number
 */
export async function getTrackingByAWB(awbNumber: string): Promise<WareIQTrackingResponse> {
  return wareiqRequest<WareIQTrackingResponse>(`/tracking/${awbNumber}`);
}

/**
 * ❌ DEPRECATED
 * DO NOT USE — WareIQ tracking must be AWB-only
 */
/*
export async function getOrderTracking(orderId: string) {
  try {
    const order = await getWareIQOrderByOrderId(orderId);
    if (!order?.awb_number) {
      return null;
    }
    return getTrackingByAWB(order.awb_number);
  } catch {
    return null;
  }
}
*/


// =============================================
// Shipping Label APIs
// =============================================

/**
 * Get shipping label URL for an order
 */
export async function getShippingLabel(uniqueId: number): Promise<{ label_url: string }> {
  return wareiqRequest(`/orders/v2/label/${uniqueId}`);
}

// =============================================
// Returns & RTO APIs
// =============================================

/**
 * Create a reverse (return) shipment
 */
export async function createReturnShipment(
  payload: WareIQReturnPayload
): Promise<WareIQReturnResponse> {
  return wareiqRequest<WareIQReturnResponse>('/orders/v2/reverse/create', 'POST', payload);
}

/**
 * Mark order for RTO (Return to Origin)
 */
export async function initiateRTO(
  uniqueId: number,
  reason?: string
): Promise<{ status: string; message?: string }> {
  return wareiqRequest('/orders/v2/actions/rto', 'POST', {
    unique_id: uniqueId,
    reason: reason || 'Delivery failed - RTO initiated',
  });
}

// =============================================
// NDR (Non-Delivery Report) APIs
// =============================================

/**
 * Get all NDR orders
 */
export async function getNDROrders(): Promise<{ ndr_orders: WareIQNDRItem[] }> {
  return wareiqRequest('/orders/v2/ndr');
}

/**
 * Request reattempt for NDR order
 */
export async function requestNDRReattempt(
  uniqueId: number,
  updates?: {
    address1?: string;
    customer_phone?: string;
    preferred_date?: string;
    comments?: string;
  }
): Promise<{ status: string; message?: string }> {
  return wareiqRequest('/orders/v2/ndr/reattempt', 'POST', {
    unique_id: uniqueId,
    ...updates,
  });
}

// =============================================
// Courier APIs
// =============================================

/**
 * Get list of available couriers
 */
export async function getCouriers(): Promise<{ couriers: WareIQCourier[] }> {
  return wareiqRequest('/couriers/list');
}

// =============================================
// Manifest APIs
// =============================================

/**
 * Create pickup manifest for pending shipments
 */
export async function createManifest(
  orderIds: number[]
): Promise<{ status: string; manifest_id?: string }> {
  return wareiqRequest('/manifest/create', 'POST', {
    order_ids: orderIds,
  });
}

// =============================================
// Inventory APIs
// =============================================

/**
 * Get inventory for all SKUs
 */
export async function getInventory(): Promise<{ inventory: WareIQInventoryItem[] }> {
  return wareiqRequest('/inventory/list');
}

/**
 * Get inventory for a specific SKU
 */
export async function getInventoryBySKU(sku: string): Promise<WareIQInventoryItem | null> {
  try {
    const response = await wareiqRequest<{ inventory: WareIQInventoryItem[] }>(
      `/inventory?sku=${encodeURIComponent(sku)}`
    );
    return response.inventory?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Update inventory quantity
 */
export async function updateInventory(
  sku: string,
  quantity: number,
  operation: 'add' | 'remove' | 'set'
): Promise<{ status: string; new_quantity?: number }> {
  return wareiqRequest('/inventory/update', 'POST', {
    sku,
    quantity,
    operation,
  });
}

// =============================================
// Status Mapping
// =============================================

export const STATUS_MAPPING: Record<string, string> = {
  'CREATED': 'Order Created',
  'CONFIRMED': 'Order Confirmed',
  'PICKED_UP': 'Picked Up',
  'IN_TRANSIT': 'In Transit',
  'REACHED_DESTINATION_HUB': 'Reached Destination',
  'OUT_FOR_DELIVERY': 'Out for Delivery',
  'DELIVERED': 'Delivered',
  'CANCELLED': 'Cancelled',
  'RTO_INITIATED': 'Return Initiated',
  'RTO_IN_TRANSIT': 'Return in Transit',
  'RTO_DELIVERED': 'Returned to Seller',
  'NDR': 'Delivery Failed',
  'UNDELIVERED': 'Delivery Unsuccessful',
};

export function getStatusLabel(statusCode: string): string {
  return STATUS_MAPPING[statusCode] || statusCode;
}

export function isDelivered(statusCode: string): boolean {
  return statusCode === 'DELIVERED';
}

export function isInTransit(statusCode: string): boolean {
  return ['PICKED_UP', 'IN_TRANSIT', 'REACHED_DESTINATION_HUB', 'OUT_FOR_DELIVERY'].includes(statusCode);
}

export function isRTO(statusCode: string): boolean {
  return ['RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED'].includes(statusCode);
}

export function isNDR(statusCode: string): boolean {
  return ['NDR', 'UNDELIVERED'].includes(statusCode);
}
