-- Add WareIQ shipping integration fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wareiq_unique_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wareiq_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;

-- Index for WareIQ lookups
CREATE INDEX IF NOT EXISTS idx_orders_wareiq_unique_id ON orders(wareiq_unique_id);
