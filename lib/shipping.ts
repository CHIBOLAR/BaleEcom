// Shipping configuration
export const SHIPPING_RATE = 50; // ₹50 flat rate India-wide
export const FREE_SHIPPING_THRESHOLD = 1000; // Free shipping on orders over ₹1000

export function calculateShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0; // Free shipping
  }
  return SHIPPING_RATE;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
