-- =====================================================
-- Bale Out Shop - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ORDERS TABLE
-- Stores all customer orders with payment and shipping info
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,

  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Shipping Address (stored as JSONB)
  shipping_address JSONB NOT NULL,

  -- Order Items (stored as JSONB array)
  items JSONB NOT NULL,

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Payment Info
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('prepaid', 'cod')),
  transaction_id TEXT,
  cod_amount DECIMAL(10,2),

  -- Coupon & Attribution
  coupon_code TEXT,
  coupon_discount DECIMAL(10,2) DEFAULT 0,
  influencer TEXT,

  -- Shipping Status
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN (
    'pending', 'processing', 'shipped', 'in_transit',
    'out_for_delivery', 'delivered', 'rto_initiated',
    'rto_delivered', 'cancelled'
  )),
  tracking_number TEXT,

  -- WareIQ Integration
  wareiq_unique_id INTEGER,
  wareiq_order_id TEXT,
  awb_number TEXT,
  shipping_provider TEXT,
  courier_name TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  ndr_count INTEGER DEFAULT 0,
  is_rto BOOLEAN DEFAULT FALSE,
  weight DECIMAL(10,3),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_influencer ON orders(influencer);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- 2. COUPONS TABLE
-- Stores coupon codes for discounts and influencer attribution
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,

  -- Discount Configuration
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2),
  max_discount DECIMAL(10,2), -- Cap for percentage discounts

  -- Influencer Attribution
  influencer_name TEXT,
  influencer_email TEXT,
  influencer_commission DECIMAL(5,2), -- Commission percentage for influencer

  -- Usage Limits
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,

  -- Validity Period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_influencer_name ON coupons(influencer_name);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- =====================================================
-- 3. INVENTORY TABLE
-- Tracks product stock levels
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);

-- =====================================================
-- 4. CONTACT SUBMISSIONS TABLE
-- Stores contact form submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RETURN REQUESTS TABLE
-- Stores customer return/refund requests
-- =====================================================
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(order_id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);

-- =====================================================
-- 6. INFLUENCER STATS VIEW
-- Aggregated view of influencer performance
-- =====================================================
CREATE OR REPLACE VIEW influencer_stats AS
SELECT
  o.influencer,
  c.influencer_name,
  c.influencer_email,
  c.influencer_commission,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.payment_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN o.payment_status = 'completed' THEN o.total ELSE 0 END) as total_revenue,
  SUM(CASE WHEN o.payment_status = 'completed' THEN o.coupon_discount ELSE 0 END) as total_discounts,
  SUM(CASE WHEN o.payment_status = 'completed' THEN (o.total * COALESCE(c.influencer_commission, 0) / 100) ELSE 0 END) as total_commission
FROM orders o
LEFT JOIN coupons c ON o.coupon_code = c.code
WHERE o.influencer IS NOT NULL
GROUP BY o.influencer, c.influencer_name, c.influencer_email, c.influencer_commission;

-- =====================================================
-- 7. RPC FUNCTIONS
-- =====================================================

-- Function to increment coupon usage count atomically
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory atomically
CREATE OR REPLACE FUNCTION reserve_inventory(p_sku TEXT, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available INTEGER;
BEGIN
  SELECT (quantity - reserved) INTO available
  FROM inventory
  WHERE sku = p_sku
  FOR UPDATE;

  IF available IS NULL OR available < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE inventory
  SET
    reserved = reserved + p_quantity,
    updated_at = NOW()
  WHERE sku = p_sku;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved inventory
CREATE OR REPLACE FUNCTION release_inventory(p_sku TEXT, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET
    reserved = GREATEST(0, reserved - p_quantity),
    updated_at = NOW()
  WHERE sku = p_sku;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm inventory (deduct from quantity after successful order)
CREATE OR REPLACE FUNCTION confirm_inventory(p_sku TEXT, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET
    quantity = GREATEST(0, quantity - p_quantity),
    reserved = GREATEST(0, reserved - p_quantity),
    updated_at = NOW()
  WHERE sku = p_sku;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to orders table
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply trigger to coupons table
DROP TRIGGER IF EXISTS coupons_updated_at ON coupons;
CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply trigger to inventory table
DROP TRIGGER IF EXISTS inventory_updated_at ON inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- Enable for production security
-- =====================================================

-- Enable RLS on tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on coupons" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on inventory" ON inventory
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on contact_submissions" ON contact_submissions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on return_requests" ON return_requests
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 10. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample coupon codes for influencers
INSERT INTO coupons (code, discount_type, discount_value, max_discount, influencer_name, influencer_email, influencer_commission, is_active)
VALUES
  ('LAUNCH10', 'percentage', 10, 50, NULL, NULL, NULL, TRUE),
  ('FLAT50', 'flat', 50, NULL, NULL, NULL, NULL, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert initial inventory for Bale game
INSERT INTO inventory (sku, product_name, quantity, reserved, low_stock_threshold)
VALUES ('bale-001', 'Bale - Trading Card Game', 250, 0, 10)
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- NOTES:
--
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Add influencer coupons via Supabase dashboard:
--    INSERT INTO coupons (code, discount_type, discount_value, max_discount, influencer_name, influencer_email, influencer_commission)
--    VALUES ('INFLUENCER10', 'percentage', 10, 50, 'Influencer Name', 'email@example.com', 5);
--
-- 3. The influencer_stats view shows all influencer performance metrics
-- =====================================================
