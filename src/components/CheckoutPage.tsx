'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product, ShippingDetails } from '@/types';

interface CheckoutPageProps {
  products: Product[];
  onSuccess: (orderId: string) => void;
  onBackToShop: () => void;
  showToast: (msg: string, type: 'cart' | 'heart' | 'error') => void;
}

const SHIPPING_FLAT = 79;

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  products,
  onSuccess,
  onBackToShop,
  showToast,
}) => {
  const { cart, clearCart } = useCart();
  const entries = Object.entries(cart);

  // Form states
  const [fname, setFname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');

  // Field errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = entries.reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  const total = entries.length ? subtotal + SHIPPING_FLAT : 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {};

    if (fname.trim().length <= 1) newErrors.fname = true;
    if (!/^[6-9]\d{9}$/.test(phone.trim())) newErrors.phone = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = true;
    if (address.trim().length <= 4) newErrors.address = true;
    if (city.trim().length <= 1) newErrors.city = true;
    if (!/^\d{6}$/.test(pincode.trim())) newErrors.pincode = true;
    if (state.trim().length <= 1) newErrors.state = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entries.length === 0) return;

    if (!validateForm()) {
      showToast('Please check the highlighted fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingDetails: ShippingDetails = {
        fname,
        phone,
        email,
        address,
        city,
        pincode,
        state,
      };

      // 1. Create order on the backend
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, shippingDetails }),
      });

      const checkoutData = await res.json();

      if (!res.ok || checkoutData.error) {
        showToast(checkoutData.error || 'Checkout initialization failed', 'error');
        setIsSubmitting(false);
        return;
      }

      const { orderId, razorpayOrderId, isMockPayment, keyId } = checkoutData;

      // 2. Load and open Razorpay
      const RazorpayClass = (window as any).Razorpay;

      if (!RazorpayClass) {
        showToast('Razorpay SDK failed to load. Please refresh the page.', 'error');
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: keyId,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'Croviaa.co',
        description: 'Handmade crochet order',
        order_id: isMockPayment ? undefined : razorpayOrderId, // don't send mock order IDs to real razorpay widget
        handler: async function (response: any) {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                razorpay_order_id: isMockPayment ? razorpayOrderId : response.razorpay_order_id,
                razorpay_payment_id: isMockPayment ? `pay_mock_${Date.now()}` : response.razorpay_payment_id,
                razorpay_signature: isMockPayment ? `sig_mock_${Date.now()}` : response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              clearCart();
              onSuccess(orderId);
            } else {
              showToast(verifyData.error || 'Payment signature verification failed', 'error');
            }
          } catch (err) {
            console.error(err);
            showToast('Failed to verify payment with server', 'error');
          }
        },
        prefill: {
          name: fname,
          email,
          contact: phone,
        },
        theme: {
          color: '#C16E4A',
        },
        modal: {
          ondismiss: function () {
            showToast('Payment cancelled', 'error');
          },
        },
      };

      // 3. Open widget or auto-complete if running in mock checkout
      if (isMockPayment) {
        // Direct checkout success for mock checkout without real payment widget
        // To give a cool experience, we can open a custom confirm dialog, or just call the handler directly.
        // Let's call the handler directly to demonstrate the verify-payment flow works correctly!
        showToast('Mock Payment Mode: Simulating Payment...', 'cart');
        setTimeout(() => {
          options.handler({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: `sig_mock_${Date.now()}`,
          });
        }, 1500);
      } else {
        const rzp = new RazorpayClass(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Checkout handler error:', error);
      showToast('Internal server checkout error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view active" id="view-checkout">
      <section className="page-section">
        <div className="wrap">
          <div className="page-head">
            <span className="section-label">Almost There</span>
            <h2>Checkout</h2>
            <p>Pop in your details and we'll get your cozy pieces on their way.</p>
          </div>
          <div className="checkout-grid">
            <div className="checkout-form">
              <h3>Shipping Details</h3>
              <form id="checkoutForm" onSubmit={handlePayment} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fname">Full name</label>
                    <input
                      type="text"
                      id="fname"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      className={errors.fname ? 'error-field' : ''}
                      required
                    />
                    <span className={`field-error ${errors.fname ? 'show' : ''}`}>Please enter your name</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={errors.phone ? 'error-field' : ''}
                      required
                    />
                    <span className={`field-error ${errors.phone ? 'show' : ''}`}>Please enter a valid 10-digit phone number</span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'error-field' : ''}
                    required
                  />
                  <span className={`field-error ${errors.email ? 'show' : ''}`}>Please enter a valid email</span>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    placeholder="House no, street, area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={errors.address ? 'error-field' : ''}
                    required
                  />
                  <span className={`field-error ${errors.address ? 'show' : ''}`}>Please enter your address</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={errors.city ? 'error-field' : ''}
                      required
                    />
                    <span className={`field-error ${errors.city ? 'show' : ''}`}>Please enter your city</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode">Pincode</label>
                    <input
                      type="text"
                      id="pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className={errors.pincode ? 'error-field' : ''}
                      required
                    />
                    <span className={`field-error ${errors.pincode ? 'show' : ''}`}>Please enter a valid 6-digit pincode</span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={errors.state ? 'error-field' : ''}
                    required
                  />
                  <span className={`field-error ${errors.state ? 'show' : ''}`}>Please enter your state</span>
                </div>
              </form>
            </div>
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div id="summaryItems">
                {entries.map(([id, qty]) => {
                  const product = products.find((p) => p.id === id);
                  if (!product) return null;
                  return (
                    <div className="summary-item" key={id}>
                      <span className="sname">
                        {product.name} <span className="sqty">×{qty}</span>
                      </span>
                      <span>₹{product.price * qty}</span>
                    </div>
                  );
                })}
              </div>
              <div className="summary-totals">
                <div className="srow">
                  <span>Subtotal</span>
                  <span id="sumSubtotal">₹{subtotal}</span>
                </div>
                <div className="srow">
                  <span>Shipping</span>
                  <span id="sumShipping">₹{entries.length ? SHIPPING_FLAT : 0}</span>
                </div>
                <div className="srow grand">
                  <span>Total</span>
                  <span className="amt" id="sumTotal">
                    ₹{total}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary pay-btn"
                id="payBtn"
                disabled={entries.length === 0 || isSubmitting}
                onClick={handlePayment}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                {isSubmitting ? 'Processing...' : 'Pay Now'}
              </button>
              <div className="secure-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Secured checkout via Razorpay
              </div>
              <div className="test-mode-note">
                🧪 <strong>Test mode:</strong> this checkout is running on Razorpay's test environment so you can try the full flow. No real payment is processed.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
