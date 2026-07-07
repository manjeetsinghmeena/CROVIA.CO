import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing internal order ID' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    let verified = false;

    // 1. Check if it's a mock checkout
    const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');

    if (isMock) {
      console.log(`Mock payment verified for order: ${orderId}`);
      verified = true;
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing Razorpay parameters' }, { status: 400 });
      }

      if (!secret) {
        console.error('Razorpay secret key is missing in environment variables.');
        return NextResponse.json({ error: 'Razorpay secret key is not configured' }, { status: 500 });
      }

      // 2. Perform HMAC signature verification
      try {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');

        if (expectedSignature === razorpay_signature) {
          verified = true;
          console.log(`Signature verified successfully for order: ${orderId}`);
        } else {
          console.error(`Signature verification failed for order: ${orderId}`);
        }
      } catch (err) {
        console.error('Signature calculation failed:', err);
      }
    }

    if (!verified) {
      // Set status to failed in database
      try {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId);
      } catch (e) {
        console.error('Could not update order status to failed:', e);
      }
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 3. Update order in database to 'paid'
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: razorpay_payment_id || `pay_mock_${Date.now()}`,
          razorpay_signature: razorpay_signature || `sig_mock_${Date.now()}`,
        })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Failed to update order status in Supabase:', error);
      } else {
        console.log(`Order status updated successfully in Supabase for order: ${orderId}`, data);
      }
    } catch (e) {
      console.error('Failed to update database:', e);
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Verify payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
