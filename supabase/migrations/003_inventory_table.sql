-- Migration: Create inventory table for stock management
-- This table syncs with WareIQ warehouse inventory

-- Inventory table for tracking stock levels
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL,
  reserved INTEGER DEFAULT 0 NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure reserved doesn't exceed quantity
  CONSTRAINT inventory_reserved_check CHECK (reserved >= 0),
  CONSTRAINT inventory_quantity_check CHECK (quantity >= 0)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_last_synced ON inventory(last_synced_at);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial inventory for the Bale card game
-- SKU matches the product.id from lib/product.ts
INSERT INTO inventory (sku, product_name, quantity, reserved)
VALUES ('bale-001', 'Bale - Trading Card Game', 250, 0)
ON CONFLICT (sku) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  updated_at = NOW();

-- Comment explaining the table
COMMENT ON TABLE inventory IS 'Tracks product inventory levels, synced with WareIQ warehouse. Quantity is total stock, reserved is stock allocated to pending orders.';
COMMENT ON COLUMN inventory.quantity IS 'Total physical stock in warehouse (from WareIQ sync)';
COMMENT ON COLUMN inventory.reserved IS 'Stock reserved for pending orders (not yet shipped)';
COMMENT ON COLUMN inventory.last_synced_at IS 'Timestamp of last sync from WareIQ API';
