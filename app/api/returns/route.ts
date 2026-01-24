import { NextRequest, NextResponse } from 'next/server';
import { supabase, getOrderByOrderId } from '@/lib/supabase';
import { createReturnShipment } from '@/lib/wareiq-extended';
import { sendReturnInitiatedEmail } from '@/lib/email';

// POST /api/returns - Create a return request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, reason, comments } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'Order ID and reason are required' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is delivered (only delivered orders can be returned)
    if (order.shipping_status !== 'delivered') {
      return NextResponse.json(
        { error: 'Only delivered orders can be returned' },
        { status: 400 }
      );
    }

    // Check if return already exists
    const { data: existingReturn } = await supabase
      .from('returns')
      .select('*')
      .eq('order_id', orderId)
      .eq('type', 'customer_return')
      .single();

    if (existingReturn) {
      return NextResponse.json(
        { error: 'Return request already exists for this order', return: existingReturn },
        { status: 400 }
      );
    }

    // Create return shipment in WareIQ
    let reverseAwb: string | undefined;
    let pickupDate: Date | undefined;

    try {
      const wareiqResponse = await createReturnShipment({
        order_id: orderId,
        reason,
        comments,
      });

      if (wareiqResponse.status === 'success') {
        reverseAwb = wareiqResponse.reverse_awb;
        if (wareiqResponse.pickup_date) {
          pickupDate = new Date(wareiqResponse.pickup_date);
        }
      }
    } catch (wareiqError: any) {
      console.error('Failed to create WareIQ return shipment:', wareiqError.message);
      // Continue without WareIQ - we can manually process the return
    }

    // Create return record in database
    const { data: returnRecord, error: returnError } = await supabase
      .from('returns')
      .insert({
        order_id: orderId,
        type: 'customer_return',
        reason,
        status: 'initiated',
        refund_status: 'pending',
        refund_amount: Number(order.total),
        reverse_awb: reverseAwb,
        pickup_date: pickupDate?.toISOString().split('T')[0],
        notes: comments,
      })
      .select()
      .single();

    if (returnError) {
      console.error('Failed to create return record:', returnError);
      return NextResponse.json(
        { error: 'Failed to create return request' },
        { status: 500 }
      );
    }

    // Send return confirmation email
    if (reverseAwb) {
      try {
        await sendReturnInitiatedEmail(order, reverseAwb, pickupDate);
      } catch (emailError: any) {
        console.error('Failed to send return email:', emailError.message);
      }
    }

    return NextResponse.json({
      success: true,
      return: returnRecord,
      message: reverseAwb
        ? 'Return request created. Pickup will be scheduled.'
        : 'Return request created. We will contact you to arrange pickup.',
    });
  } catch (error: any) {
    console.error('Return creation error:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to process return request' },
      { status: 500 }
    );
  }
}

// GET /api/returns?orderId=XXX - Get return status for an order
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data: returnRecord, error } = await supabase
      .from('returns')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !returnRecord) {
      return NextResponse.json(
        { error: 'No return found for this order' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      return: returnRecord,
    });
  } catch (error: any) {
    console.error('Error fetching return:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch return details' },
      { status: 500 }
    );
  }
}
