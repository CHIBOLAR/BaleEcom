// Google Analytics 4 and Facebook Pixel event tracking helpers

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

// GA4 Event Types
interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Track page view (automatically handled by GA4, but useful for SPAs)
 */
export function trackPageView(url: string, title?: string) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url,
      page_title: title,
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

/**
 * Track product view (ViewContent event)
 */
export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'INR',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
        },
      ],
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'INR',
    });
  }
}

/**
 * Track add to cart event
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'INR',
      contents: [{ id: product.id, quantity: product.quantity }],
    });
  }
}

/**
 * Track remove from cart event
 */
export function trackRemoveFromCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'remove_from_cart', {
      currency: 'INR',
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  }
}

/**
 * Track checkout initiation
 */
export function trackInitiateCheckout(cart: {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  coupon?: string;
}) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: cart.total,
      coupon: cart.coupon,
      items: cart.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: cart.items.map((item) => item.id),
      content_type: 'product',
      value: cart.total,
      currency: 'INR',
      num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    });
  }
}

/**
 * Track successful purchase
 */
export function trackPurchase(order: {
  orderId: string;
  total: number;
  subtotal: number;
  shipping: number;
  coupon?: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.orderId,
      currency: 'INR',
      value: order.total,
      shipping: order.shipping,
      coupon: order.coupon,
      items: order.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: order.items.map((item) => item.id),
      content_type: 'product',
      value: order.total,
      currency: 'INR',
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      contents: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    });
  }
}

/**
 * Track coupon applied
 */
export function trackCouponApplied(coupon: {
  code: string;
  discount: number;
  influencer?: string;
}) {
  if (!isBrowser) return;

  // GA4 custom event
  if (window.gtag) {
    window.gtag('event', 'coupon_applied', {
      coupon_code: coupon.code,
      discount_value: coupon.discount,
      influencer: coupon.influencer,
    });
  }
}

/**
 * Track contact form submission
 */
export function trackContactFormSubmit() {
  if (!isBrowser) return;

  // GA4
  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'contact',
      event_label: 'contact_form',
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'Lead');
  }
}
