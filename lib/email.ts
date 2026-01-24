import { Resend } from 'resend';
import { supabase, Order, OrderItem, ShippingAddress } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Playable Games <orders@playablegames.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://playablegames.in';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Log notification to database
async function logNotification(
  orderId: string,
  channel: 'email' | 'whatsapp' | 'sms',
  type: string,
  recipient: string,
  subject: string,
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
) {
  try {
    await supabase.from('notifications').insert({
      order_id: orderId,
      channel,
      type,
      recipient,
      subject,
      status,
      message_id: messageId,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      error,
    });
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate order items HTML
function generateItemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${item.name}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>
      `
    )
    .join('');
}

// Base email template
function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Playable Games</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
              <!-- Header -->
              <tr>
                <td style="background-color: #FF6B35; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Playable Games</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="background-color: white; padding: 32px; border-radius: 0 0 8px 8px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                    Questions? <a href="${SITE_URL}/contact" style="color: #FF6B35;">Contact us</a>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Playable Games | Mumbai, India
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Order Confirmation Email
export async function sendOrderConfirmationEmail(order: Order): Promise<EmailResult> {
  const items = order.items as OrderItem[];
  const address = order.shipping_address as ShippingAddress;

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Order Confirmed!</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      Thank you for your order! We've received your order and will start processing it right away.
    </p>

    <!-- Order ID -->
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
      <p style="margin: 4px 0 0; color: #111827; font-size: 18px; font-weight: bold; font-family: monospace;">${order.order_id}</p>
    </div>

    <!-- Order Items -->
    <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px;">Order Summary</h3>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280;">Item</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; color: #6b7280;">Qty</th>
          <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${generateItemsHtml(items)}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Subtotal</td>
          <td style="padding: 4px 0; text-align: right; color: #111827;">${formatCurrency(Number(order.subtotal))}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
          <td style="padding: 4px 0; text-align: right; color: #22c55e;">${Number(order.shipping_cost) > 0 ? formatCurrency(Number(order.shipping_cost)) : 'FREE'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; font-size: 18px; font-weight: bold; color: #111827;">Total</td>
          <td style="padding: 8px 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #FF6B35;">${formatCurrency(Number(order.total))}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Method -->
    <div style="background-color: ${order.payment_status === 'completed' ? '#dcfce7' : '#fef3c7'}; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${order.payment_status === 'completed' ? '#166534' : '#92400e'};">
        <strong>Payment:</strong> ${order.payment_status === 'completed' ? 'Paid via PhonePe' : 'Cash on Delivery - ' + formatCurrency(Number(order.total))}
      </p>
    </div>

    <!-- Shipping Address -->
    <h3 style="margin: 0 0 12px; color: #111827; font-size: 18px;">Shipping Address</h3>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #111827; font-weight: 500;">${order.customer_name}</p>
      <p style="margin: 4px 0 0; color: #4b5563; line-height: 1.5;">
        ${address.address}<br>
        ${address.city}, ${address.state} - ${address.pincode}<br>
        Phone: ${order.customer_phone}
      </p>
    </div>

    <!-- Track Order Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${SITE_URL}/track?order=${order.order_id}" style="display: inline-block; background-color: #FF6B35; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Track Your Order
      </a>
    </div>

    <!-- What's Next -->
    <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
      <h4 style="margin: 0 0 12px; color: #111827; font-size: 16px;">What's Next?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
        <li>Your order will be packed within 24 hours</li>
        <li>You'll receive a shipping confirmation with tracking details</li>
        <li>Estimated delivery: 3-5 business days</li>
      </ul>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Order Confirmed - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      console.error('Failed to send order confirmation email:', error);
      await logNotification(order.order_id, 'email', 'order_confirmation', order.customer_email, `Order Confirmed - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    console.log('Order confirmation email sent:', data?.id);
    await logNotification(order.order_id, 'email', 'order_confirmation', order.customer_email, `Order Confirmed - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('Failed to send order confirmation email:', err);
    await logNotification(order.order_id, 'email', 'order_confirmation', order.customer_email, `Order Confirmed - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// Shipping Confirmation Email
export async function sendShippingConfirmationEmail(
  order: Order,
  awbNumber: string,
  courierName: string,
  estimatedDelivery?: Date
): Promise<EmailResult> {
  const address = order.shipping_address as ShippingAddress;
  const trackingUrl = `${SITE_URL}/track?order=${order.order_id}`;

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Your Order is on the Way!</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      Great news! Your order has been shipped and is on its way to you.
    </p>

    <!-- Tracking Info -->
    <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">Tracking Number (AWB)</p>
      <p style="margin: 0 0 16px; color: #1e3a8a; font-size: 20px; font-weight: bold; font-family: monospace;">${awbNumber}</p>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">Courier: <strong>${courierName}</strong></p>
    </div>

    <!-- Order Details -->
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Order ID</p>
      <p style="margin: 0; color: #111827; font-size: 16px; font-weight: bold; font-family: monospace;">${order.order_id}</p>
    </div>

    ${estimatedDelivery ? `
    <!-- Estimated Delivery -->
    <div style="background-color: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; color: #166534; font-size: 14px;">Estimated Delivery</p>
      <p style="margin: 0; color: #15803d; font-size: 18px; font-weight: bold;">${formatDate(estimatedDelivery)}</p>
    </div>
    ` : ''}

    <!-- Delivery Address -->
    <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Delivering to</h3>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #111827; font-weight: 500;">${order.customer_name}</p>
      <p style="margin: 4px 0 0; color: #4b5563; line-height: 1.5;">
        ${address.address}<br>
        ${address.city}, ${address.state} - ${address.pincode}
      </p>
    </div>

    <!-- Track Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${trackingUrl}" style="display: inline-block; background-color: #FF6B35; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Track Your Shipment
      </a>
    </div>

    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
      Keep your phone handy - the courier will contact you before delivery.
    </p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Shipped! Tracking: ${awbNumber} - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      console.error('Failed to send shipping confirmation email:', error);
      await logNotification(order.order_id, 'email', 'shipping_confirmation', order.customer_email, `Shipped! Tracking: ${awbNumber}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    console.log('Shipping confirmation email sent:', data?.id);
    await logNotification(order.order_id, 'email', 'shipping_confirmation', order.customer_email, `Shipped! Tracking: ${awbNumber}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('Failed to send shipping confirmation email:', err);
    await logNotification(order.order_id, 'email', 'shipping_confirmation', order.customer_email, `Shipped! Tracking: ${awbNumber}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// Out for Delivery Email
export async function sendOutForDeliveryEmail(order: Order): Promise<EmailResult> {
  const address = order.shipping_address as ShippingAddress;

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Out for Delivery!</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      Exciting news! Your order is out for delivery and will reach you today.
    </p>

    <!-- Order Info -->
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px; color: #92400e; font-size: 24px;">Arriving Today</p>
      <p style="margin: 0; color: #78350f; font-size: 14px;">Order ID: <strong>${order.order_id}</strong></p>
    </div>

    <!-- Delivery Address -->
    <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Delivering to</h3>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #111827; font-weight: 500;">${order.customer_name}</p>
      <p style="margin: 4px 0 0; color: #4b5563; line-height: 1.5;">
        ${address.address}<br>
        ${address.city}, ${address.state} - ${address.pincode}
      </p>
    </div>

    ${order.payment_status !== 'completed' ? `
    <!-- COD Reminder -->
    <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">
        <strong>Payment on Delivery:</strong> Please keep ${formatCurrency(Number(order.total))} ready.
      </p>
    </div>
    ` : ''}

    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
      The delivery executive will contact you before arriving. Please keep your phone reachable.
    </p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Out for Delivery - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      await logNotification(order.order_id, 'email', 'out_for_delivery', order.customer_email, `Out for Delivery - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await logNotification(order.order_id, 'email', 'out_for_delivery', order.customer_email, `Out for Delivery - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    await logNotification(order.order_id, 'email', 'out_for_delivery', order.customer_email, `Out for Delivery - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// Delivery Confirmation Email
export async function sendDeliveryConfirmationEmail(order: Order): Promise<EmailResult> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Order Delivered!</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      Your order has been delivered successfully. We hope you enjoy your Bale Trading Card Game!
    </p>

    <!-- Success Badge -->
    <div style="background-color: #dcfce7; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <div style="width: 48px; height: 48px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 24px;">&#10003;</span>
      </div>
      <p style="margin: 0; color: #166534; font-size: 18px; font-weight: bold;">Delivered</p>
      <p style="margin: 4px 0 0; color: #15803d; font-size: 14px;">Order ID: ${order.order_id}</p>
    </div>

    <!-- Game Instructions -->
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Ready to Play?</h3>
      <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px; line-height: 1.5;">
        Check out our FAQ page for game rules and tips to get started!
      </p>
      <a href="${SITE_URL}/faq" style="display: inline-block; color: #FF6B35; text-decoration: none; font-weight: 500;">
        View Game Rules &rarr;
      </a>
    </div>

    <!-- Thank You -->
    <p style="margin: 0; color: #4b5563; font-size: 14px; text-align: center; line-height: 1.6;">
      Thank you for shopping with Playable Games!<br>
      We'd love to hear your feedback.
    </p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Delivered! - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      await logNotification(order.order_id, 'email', 'delivery_confirmation', order.customer_email, `Delivered! - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await logNotification(order.order_id, 'email', 'delivery_confirmation', order.customer_email, `Delivered! - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    await logNotification(order.order_id, 'email', 'delivery_confirmation', order.customer_email, `Delivered! - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// NDR (Non-Delivery Report) Email
export async function sendNDREmail(order: Order, reason: string, reattemptDate?: Date): Promise<EmailResult> {
  const address = order.shipping_address as ShippingAddress;

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Delivery Attempted</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      We attempted to deliver your order but couldn't complete the delivery.
    </p>

    <!-- Reason -->
    <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; color: #92400e; font-size: 14px;">Reason</p>
      <p style="margin: 0; color: #78350f; font-size: 16px; font-weight: 500;">${reason}</p>
    </div>

    <!-- Order Info -->
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Order ID: <strong>${order.order_id}</strong></p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Delivery Address: ${address.address}, ${address.city} - ${address.pincode}
      </p>
    </div>

    ${reattemptDate ? `
    <!-- Reattempt Info -->
    <div style="background-color: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; color: #1e40af; font-size: 14px;">Next Delivery Attempt</p>
      <p style="margin: 0; color: #1e3a8a; font-size: 18px; font-weight: bold;">${formatDate(reattemptDate)}</p>
    </div>
    ` : ''}

    <!-- Contact Info -->
    <p style="margin: 0; color: #4b5563; font-size: 14px; text-align: center; line-height: 1.6;">
      If you need to update your address or phone number,<br>
      please <a href="${SITE_URL}/contact" style="color: #FF6B35;">contact us</a> immediately.
    </p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Delivery Attempted - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      await logNotification(order.order_id, 'email', 'ndr', order.customer_email, `Delivery Attempted - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await logNotification(order.order_id, 'email', 'ndr', order.customer_email, `Delivery Attempted - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    await logNotification(order.order_id, 'email', 'ndr', order.customer_email, `Delivery Attempted - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// Return Initiated Email
export async function sendReturnInitiatedEmail(
  order: Order,
  reverseAwb: string,
  pickupDate?: Date
): Promise<EmailResult> {
  const address = order.shipping_address as ShippingAddress;

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Return Request Received</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      We've received your return request and are processing it.
    </p>

    <!-- Return AWB -->
    <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">Return Tracking Number</p>
      <p style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: bold; font-family: monospace;">${reverseAwb}</p>
    </div>

    ${pickupDate ? `
    <!-- Pickup Date -->
    <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; color: #92400e; font-size: 14px;">Scheduled Pickup</p>
      <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: bold;">${formatDate(pickupDate)}</p>
    </div>
    ` : ''}

    <!-- Order Info -->
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Order ID: <strong>${order.order_id}</strong></p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Pickup from: ${address.address}, ${address.city} - ${address.pincode}
      </p>
    </div>

    <!-- Instructions -->
    <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Pickup Instructions</h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
        <li>Keep the product in its original packaging</li>
        <li>Include all accessories and documents</li>
        <li>The pickup executive will contact you</li>
        <li>Refund will be processed within 5-7 business days after we receive the item</li>
      </ul>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Return Initiated - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      await logNotification(order.order_id, 'email', 'return_initiated', order.customer_email, `Return Initiated - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await logNotification(order.order_id, 'email', 'return_initiated', order.customer_email, `Return Initiated - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    await logNotification(order.order_id, 'email', 'return_initiated', order.customer_email, `Return Initiated - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}

// Refund Processed Email
export async function sendRefundProcessedEmail(order: Order, refundAmount: number): Promise<EmailResult> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">Refund Processed</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
      Your refund has been processed successfully.
    </p>

    <!-- Refund Amount -->
    <div style="background-color: #dcfce7; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px; color: #166534; font-size: 14px;">Refund Amount</p>
      <p style="margin: 0; color: #15803d; font-size: 32px; font-weight: bold;">${formatCurrency(refundAmount)}</p>
    </div>

    <!-- Order Info -->
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID: <strong>${order.order_id}</strong></p>
    </div>

    <!-- Timeline -->
    <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 12px; color: #111827; font-size: 16px;">When will I receive my refund?</h4>
      <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
        The refund will be credited to your original payment method within 5-7 business days.
        If you paid via UPI, it may reflect sooner.
      </p>
    </div>

    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
      Thank you for shopping with Playable Games.
    </p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Refund Processed - ${formatCurrency(refundAmount)} - ${order.order_id}`,
      html: baseTemplate(content),
    });

    if (error) {
      await logNotification(order.order_id, 'email', 'refund_processed', order.customer_email, `Refund Processed - ${order.order_id}`, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    await logNotification(order.order_id, 'email', 'refund_processed', order.customer_email, `Refund Processed - ${order.order_id}`, 'sent', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    await logNotification(order.order_id, 'email', 'refund_processed', order.customer_email, `Refund Processed - ${order.order_id}`, 'failed', undefined, err.message);
    return { success: false, error: err.message };
  }
}
