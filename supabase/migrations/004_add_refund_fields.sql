-- Migration: Add Refund Fields to Orders Table
-- These fields track refund status for failed/cancelled orders

-- Add refund columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IS NULL OR refund_status IN ('pending', 'completed', 'failed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add index for refund status queries
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status) WHERE refund_status IS NOT NULL;

-- Add last_synced_at column to inventory if it doesn't exist (used for WareIQ sync)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
