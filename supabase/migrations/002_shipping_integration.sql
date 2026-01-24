-- Migration: Shipping Integration Schema Updates
-- Add new columns to orders table and create supporting tables

-- =============================================
-- Orders Table Updates
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'prepaid' CHECK (payment_method IN ('prepaid', 'cod'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ndr_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rto BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_amount DECIMAL(10,2);

-- Update shipping_status check constraint to include more statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_shipping_status_check
  CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'rto_initiated', 'rto_delivered', 'cancelled'));

-- =============================================
-- Shipment Events Table (Tracking History)
-- =============================================
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  event_time TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_order_id ON shipment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_event_time ON shipment_events(event_time DESC);

-- =============================================
-- Inventory Table
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  warehouse TEXT,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);

-- Trigger to auto-update updated_at for inventory
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Returns Table
-- =============================================
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('customer_return', 'rto')) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'pickup_scheduled', 'picked_up', 'in_transit', 'received', 'refund_initiated', 'refund_completed', 'cancelled')),
  refund_status TEXT DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  refund_amount DECIMAL(10,2),
  reverse_awb TEXT,
  pickup_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- Trigger to auto-update updated_at for returns
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Shipping Charges Table (Billing/Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS shipping_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
  awb_number TEXT,
  courier TEXT,
  weight_charged DECIMAL(5,2),
  base_charge DECIMAL(10,2),
  cod_charge DECIMAL(10,2) DEFAULT 0,
  rto_charge DECIMAL(10,2) DEFAULT 0,
  total_charge DECIMAL(10,2),
  invoice_id TEXT,
  reconciled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_charges_order_id ON shipping_charges(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_charges_reconciled ON shipping_charges(reconciled);

-- =============================================
-- Notifications Table (Communication Log)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'whatsapp', 'sms')) NOT NULL,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- =============================================
-- Insert initial inventory for Bale Card Game
-- =============================================
INSERT INTO inventory (sku, product_name, quantity, warehouse, low_stock_threshold)
VALUES ('bale-trading-card-game', 'Bale - Trading Card Game', 250, 'WareIQ', 20)
ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  updated_at = NOW();
