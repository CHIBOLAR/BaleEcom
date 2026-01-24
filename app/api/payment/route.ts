import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutPayRequest } from 'pg-sdk-node';
import { getPhonePeClient, SITE_URL } from '@/lib/phonepe';
import { createOrder, getOrderByOrderId, updateOrderWareIQDetails } from '@/lib/supabase';
import { calculateShipping } from '@/lib/shipping';
import { createWareIQOrder } from '@/lib/wareiq';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { reserveStock, checkStockAvailability, releaseStock } from '@/lib/inventory';

// Helper function to create WareIQ order for COD
async function createCODShipment(orderId: string) {
  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error('Order not found for COD shipment:', orderId);
      return;
    }

    const shippingAddress = order.shipping_address as {
      address: string;
      city: string;
      state: string;
      pincode: string;
    };

    const items = order.items as Array<{
      name: string;
      price: number;
      quantity: number;
    }>;

    const wareiqResponse = await createWareIQOrder({
      order_id: orderId,
      full_name: order.customer_name,
      address1: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      country: 'India',
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total: Number(order.total),
      shipping_charges: Number(order.shipping_cost) || 0,
      payment_method: 'cod',
      products: items.map((item) => ({
        sku: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        price: item.price,
        amount: item.price * item.quantity,
        quantity: item.quantity,
      })),
    });

    if (wareiqResponse.status === 'success' && wareiqResponse.unique_id) {
      await updateOrderWareIQDetails(orderId, {
        wareiq_unique_id: wareiqResponse.unique_id,
        wareiq_order_id: wareiqResponse.order_id,
        shipping_status: 'processing',
      });
      console.log('WareIQ COD order created successfully:', wareiqResponse.unique_id);
    }
  } catch (error: any) {
    console.error('Failed to create WareIQ COD order:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderId,
      customerId,
      customerPhone,
      customerName,
      shippingAddress,
      items,
      paymentMethod = 'prepaid', // Default to prepaid, can be 'cod'
    } = body;

    // Validate required fields
    if (!amount || !orderId || !customerId || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate order totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const shippingCost = calculateShipping(subtotal);
    const total = subtotal + shippingCost;

    // Convert items to SKU format for inventory check
    const skuItems = items.map((item: { id?: string; name: string; quantity: number }) => ({
      sku: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
      quantity: item.quantity,
    }));

    // Check stock availability before processing
    const stockCheck = await checkStockAvailability(skuItems);
    if (!stockCheck.available) {
      const unavailableList = stockCheck.unavailableItems
        .map((item) => `${item.sku}: ${item.available} available, ${item.requested} requested`)
        .join(', ');
      return NextResponse.json(
        { success: false, error: `Insufficient stock: ${unavailableList}` },
        { status: 400 }
      );
    }

    // Reserve stock for all items
    const reservedItems: Array<{ sku: string; quantity: number }> = [];
    try {
      for (const item of skuItems) {
        const reserved = await reserveStock(item.sku, item.quantity);
        if (!reserved) {
          // Rollback any already reserved items
          for (const reservedItem of reservedItems) {
            await releaseStock(reservedItem.sku, reservedItem.quantity);
          }
          return NextResponse.json(
            { success: false, error: `Failed to reserve stock for ${item.sku}` },
            { status: 400 }
          );
        }
        reservedItems.push(item);
      }
      console.log('Stock reserved for order:', orderId, reservedItems);
    } catch (stockError: any) {
      // Rollback on error
      for (const reservedItem of reservedItems) {
        await releaseStock(reservedItem.sku, reservedItem.quantity);
      }
      console.error('Stock reservation error:', stockError.message);
      return NextResponse.json(
        { success: false, error: 'Failed to reserve stock' },
        { status: 500 }
      );
    }

    // Handle COD orders differently
    if (paymentMethod === 'cod') {
      // Save order to Supabase with COD status
      try {
        await createOrder({
          order_id: orderId,
          customer_name: customerName,
          customer_email: customerId,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          items,
          subtotal,
          shipping_cost: shippingCost,
          total,
          payment_status: 'pending', // COD payment is pending until delivery
          payment_method: 'cod',
          shipping_status: 'pending',
          cod_amount: total,
        } as any);
        console.log('COD order saved to database:', orderId);
      } catch (dbError: any) {
        console.error('Failed to save COD order to database:', dbError.message);
        return NextResponse.json(
          { success: false, error: 'Failed to create order' },
          { status: 500 }
        );
      }

      // Create WareIQ shipment for COD order
      await createCODShipment(orderId);

      // Send order confirmation email
      try {
        const order = await getOrderByOrderId(orderId);
        if (order) {
          await sendOrderConfirmationEmail(order);
        }
      } catch (emailError: any) {
        console.error('Failed to send COD confirmation email:', emailError.message);
      }

      // Return success with redirect to success page
      return NextResponse.json({
        success: true,
        paymentMethod: 'cod',
        orderId,
        redirectUrl: `${SITE_URL}/success?orderId=${orderId}&paymentMethod=cod`,
      });
    }

    // Handle prepaid orders with PhonePe
    const client = getPhonePeClient();

    // Build payment request using v2 SDK
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderId)
      .amount(Math.round(amount * 100)) // Convert to paise
      .redirectUrl(`${SITE_URL}/api/payment/callback`)
      .build();

    // Save order to Supabase
    try {
      await createOrder({
        order_id: orderId,
        customer_name: customerName,
        customer_email: customerId,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        items,
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_status: 'pending',
        payment_method: 'prepaid',
        shipping_status: 'pending',
      } as any);
      console.log('Order saved to database:', orderId);
    } catch (dbError: any) {
      console.error('Failed to save order to database:', dbError.message);
      // Continue with payment even if DB save fails
    }

    // Initiate payment
    const response = await client.pay(payRequest);

    console.log('Payment initiated:', {
      orderId,
      amount,
      checkoutPageUrl: response.redirectUrl,
    });

    return NextResponse.json({
      success: true,
      paymentMethod: 'prepaid',
      data: {
        instrumentResponse: {
          redirectInfo: {
            url: response.redirectUrl,
          },
        },
      },
      orderId,
    });
  } catch (error: any) {
    console.error('PhonePe payment error:', error.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Payment initialization failed',
      },
      { status: 500 }
    );
  }
}
