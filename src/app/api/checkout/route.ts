import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Fallback products definition in case database fetch fails or tables are empty
const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Starfish Keychain', price: 399 },

  { id: 'p2', name: 'Little Bear Friend', price: 899 },
  { id: 'p3', name: 'Sunbeam Bucket Hat', price: 749 },
  { id: 'p4', name: 'Wavy Scarf', price: 999 },
  { id: 'p5', name: 'Mini Pouch Duo', price: 549 },
  { id: 'p6', name: 'Tiny Fox Keychain', price: 399 },
];

const SHIPPING_FLAT = 79;

export async function POST(req: NextRequest) {
  try {
    const { cart, shippingDetails } = await req.json();

    if (!cart || Object.keys(cart).length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shippingDetails) {
      return NextResponse.json({ error: 'Shipping details are missing' }, { status: 400 });
    }

    // 1. Fetch products from Supabase to verify pricing
    let dbProducts = [];
    try {
      const { data, error } = await supabaseAdmin.from('products').select('id, name, price');
      if (!error && data && data.length > 0) {
        dbProducts = data;
      } else {
        dbProducts = FALLBACK_PRODUCTS;
      }
    } catch (e) {
      console.warn('Could not fetch products from database. Using fallback products.', e);
      dbProducts = FALLBACK_PRODUCTS;
    }

    // 2. Calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const [id, qty] of Object.entries(cart)) {
      const product = dbProducts.find((p) => p.id === id);
      if (!product) {
        return NextResponse.json({ error: `Product ${id} not found` }, { status: 400 });
      }
      const itemPrice = Number(product.price);
      subtotal += itemPrice * (qty as number);
      orderItems.push({
        id,
        name: product.name,
        price: itemPrice,
        qty,
      });
    }

    const totalAmount = subtotal + SHIPPING_FLAT;

    // 3. Setup Razorpay
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = '';
    let isMockPayment = false;

    if (keyId && keySecret && keyId !== 'rzp_test_your_key_id') {
      // Real Razorpay order creation
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const rzpOrder = await razorpay.orders.create({
          amount: totalAmount * 100, // in paise
          currency: 'INR',
          receipt: `rcpt_${Math.floor(100000 + Math.random() * 900000)}`,
        });

        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.error('Razorpay order creation failed:', err);
        return NextResponse.json({ error: 'Failed to create payment order with Razorpay' }, { status: 500 });
      }
    } else {
      // Mock payment mode for demonstration
      console.warn('Razorpay credentials missing. Running in mock checkout mode.');
      razorpayOrderId = `order_mock_${Math.floor(100000 + Math.random() * 900000)}`;
      isMockPayment = true;
    }

    // Generate custom order code (e.g. CRV-123456)
    const orderCode = `CRV-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Save pending order in Supabase
    try {
      const { error: dbError } = await supabaseAdmin.from('orders').insert({
        id: orderCode,
        customer_name: shippingDetails.fname,
        customer_email: shippingDetails.email,
        customer_phone: shippingDetails.phone,
        address: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pincode: shippingDetails.pincode,
        total_amount: totalAmount,
        payment_status: 'pending',
        razorpay_order_id: razorpayOrderId,
        items: orderItems,
      });

      if (dbError) {
        console.error('Failed to log pending order in Supabase:', dbError);
        // We will log the error but still proceed so the frontend doesn't crash if database connectivity is offline
      }
    } catch (e) {
      console.error('Failed to communicate with Supabase:', e);
    }

    return NextResponse.json({
      orderId: orderCode,
      razorpayOrderId,
      amount: totalAmount,
      isMockPayment,
      keyId: isMockPayment ? 'rzp_test_1DP5mmOlF5G5ag' : keyId,
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
