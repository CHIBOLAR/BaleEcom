import { supabase } from './supabase';

const WAREIQ_BASE_URL = 'https://wms.wareiq.com/V2';
const WAREIQ_API_KEY = process.env.WAREIQ_API_KEY!;

// Inventory types
export interface InventoryItem {
  id?: string;
  sku: string;
  product_name: string;
  quantity: number;
  reserved: number;
  available: number;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockResult {
  sku: string;
  quantity: number;
  reserved: number;
  available: number;
  inStock: boolean;
  lowStock: boolean;
}

// WareIQ inventory response type
interface WareIQInventoryItem {
  sku: string;
  name?: string;
  product_name?: string;
  quantity?: number;
  available_quantity?: number;
  warehouse_quantity?: number;
  reserved_quantity?: number;
}

interface WareIQInventoryResponse {
  status: string;
  data?: WareIQInventoryItem[];
  items?: WareIQInventoryItem[];
  inventory?: WareIQInventoryItem[];
  error?: string;
}

/**
 * Get current stock level for a SKU
 */
export async function getStock(sku: string): Promise<StockResult | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('sku', sku)
    .single();

  if (error) {
    console.error('Error fetching stock:', error);
    return null;
  }

  const available = Math.max(0, data.quantity - data.reserved);

  return {
    sku: data.sku,
    quantity: data.quantity,
    reserved: data.reserved,
    available,
    inStock: available > 0,
    lowStock: available > 0 && available <= 10,
  };
}

/**
 * Get stock for all products
 */
export async function getAllStock(): Promise<StockResult[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('sku');

  if (error) {
    console.error('Error fetching all stock:', error);
    return [];
  }

  return data.map((item) => {
    const available = Math.max(0, item.quantity - item.reserved);
    return {
      sku: item.sku,
      quantity: item.quantity,
      reserved: item.reserved,
      available,
      inStock: available > 0,
      lowStock: available > 0 && available <= 10,
    };
  });
}

/**
 * Reserve stock when an order is placed
 * Increases reserved count (stock still in warehouse but allocated to order)
 */
export async function reserveStock(sku: string, qty: number): Promise<boolean> {
  // First check if enough stock is available
  const stock = await getStock(sku);
  if (!stock || stock.available < qty) {
    console.error(`Insufficient stock for ${sku}. Available: ${stock?.available || 0}, Requested: ${qty}`);
    return false;
  }

  const { error } = await supabase
    .from('inventory')
    .update({
      reserved: stock.reserved + qty,
      updated_at: new Date().toISOString(),
    })
    .eq('sku', sku);

  if (error) {
    console.error('Error reserving stock:', error);
    return false;
  }

  console.log(`Reserved ${qty} units of ${sku}. Reserved: ${stock.reserved} -> ${stock.reserved + qty}`);
  return true;
}

/**
 * Release reserved stock when an order is cancelled (before shipment)
 * Decreases reserved count
 */
export async function releaseStock(sku: string, qty: number): Promise<boolean> {
  const stock = await getStock(sku);
  if (!stock) {
    console.error(`Stock not found for ${sku}`);
    return false;
  }

  const newReserved = Math.max(0, stock.reserved - qty);

  const { error } = await supabase
    .from('inventory')
    .update({
      reserved: newReserved,
      updated_at: new Date().toISOString(),
    })
    .eq('sku', sku);

  if (error) {
    console.error('Error releasing stock:', error);
    return false;
  }

  console.log(`Released ${qty} units of ${sku}. Reserved: ${stock.reserved} -> ${newReserved}`);
  return true;
}

/**
 * Deduct stock when order is shipped
 * Decreases both quantity and reserved count
 */
export async function deductStock(sku: string, qty: number): Promise<boolean> {
  const stock = await getStock(sku);
  if (!stock) {
    console.error(`Stock not found for ${sku}`);
    return false;
  }

  const newQuantity = Math.max(0, stock.quantity - qty);
  const newReserved = Math.max(0, stock.reserved - qty);

  const { error } = await supabase
    .from('inventory')
    .update({
      quantity: newQuantity,
      reserved: newReserved,
      updated_at: new Date().toISOString(),
    })
    .eq('sku', sku);

  if (error) {
    console.error('Error deducting stock:', error);
    return false;
  }

  console.log(`Deducted ${qty} units of ${sku}. Quantity: ${stock.quantity} -> ${newQuantity}`);
  return true;
}

/**
 * Restock items when RTO/return is received
 * Increases quantity
 */
export async function restockItem(sku: string, qty: number): Promise<boolean> {
  const stock = await getStock(sku);
  if (!stock) {
    console.error(`Stock not found for ${sku}`);
    return false;
  }

  const { error } = await supabase
    .from('inventory')
    .update({
      quantity: stock.quantity + qty,
      updated_at: new Date().toISOString(),
    })
    .eq('sku', sku);

  if (error) {
    console.error('Error restocking:', error);
    return false;
  }

  console.log(`Restocked ${qty} units of ${sku}. Quantity: ${stock.quantity} -> ${stock.quantity + qty}`);
  return true;
}

/**
 * Sync inventory from WareIQ API
 * Overwrites local stock with WareIQ warehouse values
 */
export async function syncFromWareIQ(): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Fetch inventory from WareIQ
    const response = await fetch(`${WAREIQ_BASE_URL}/inventory/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WAREIQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WareIQ API error: ${response.status} - ${errorText}`);
    }

    const data: WareIQInventoryResponse = await response.json();

    // Handle different response formats from WareIQ
    const items = data.data || data.items || data.inventory || [];

    if (!items.length) {
      console.log('No inventory items received from WareIQ');
      return { success: true, synced: 0, errors: [] };
    }

    // Process each inventory item
    for (const item of items) {
      try {
        const sku = item.sku;
        const quantity = item.quantity ?? item.available_quantity ?? item.warehouse_quantity ?? 0;
        const productName = item.name || item.product_name || sku;

        // Upsert inventory record
        const { error } = await supabase
          .from('inventory')
          .upsert({
            sku,
            product_name: productName,
            quantity,
            reserved: 0, // WareIQ sync resets reserved (physical stock is source of truth)
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'sku',
          });

        if (error) {
          errors.push(`Failed to sync ${sku}: ${error.message}`);
        } else {
          synced++;
        }
      } catch (err: any) {
        errors.push(`Error processing ${item.sku}: ${err.message}`);
      }
    }

    console.log(`WareIQ sync complete: ${synced} items synced, ${errors.length} errors`);
    return { success: errors.length === 0, synced, errors };
  } catch (error: any) {
    console.error('WareIQ sync failed:', error.message);
    return { success: false, synced: 0, errors: [error.message] };
  }
}

/**
 * Initialize inventory for a product (used when adding new products)
 */
export async function initializeInventory(
  sku: string,
  productName: string,
  quantity: number = 0
): Promise<boolean> {
  const { error } = await supabase
    .from('inventory')
    .upsert({
      sku,
      product_name: productName,
      quantity,
      reserved: 0,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'sku',
    });

  if (error) {
    console.error('Error initializing inventory:', error);
    return false;
  }

  return true;
}

/**
 * Check stock availability for multiple items (for cart validation)
 */
export async function checkStockAvailability(
  items: Array<{ sku: string; quantity: number }>
): Promise<{
  available: boolean;
  unavailableItems: Array<{ sku: string; requested: number; available: number }>;
}> {
  const unavailableItems: Array<{ sku: string; requested: number; available: number }> = [];

  for (const item of items) {
    const stock = await getStock(item.sku);
    if (!stock || stock.available < item.quantity) {
      unavailableItems.push({
        sku: item.sku,
        requested: item.quantity,
        available: stock?.available || 0,
      });
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

/**
 * Get stock status label for display
 */
export function getStockStatusLabel(stock: StockResult): {
  label: string;
  color: 'green' | 'orange' | 'red';
} {
  if (!stock.inStock) {
    return { label: 'Out of Stock', color: 'red' };
  }
  if (stock.lowStock) {
    return { label: `Only ${stock.available} left!`, color: 'orange' };
  }
  return { label: 'In Stock', color: 'green' };
}
