// Shipping configuration
export const SHIPPING_RATE = 0; // FREE shipping on all orders!
export const FREE_SHIPPING_THRESHOLD = 0; // Free shipping on all orders

export function calculateShipping(subtotal: number): number {
  return 0; // Always free shipping
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
