'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { ICONS } from '@/components/Icons';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  products: Product[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout, products }) => {
  const { cart, changeQty, removeFromCart } = useCart();
  const entries = Object.entries(cart);

  const subtotal = entries.reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  return (
    <>
      <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`drawer ${isOpen ? 'open' : ''}`} id="cartDrawer">
        <div className="drawer-head">
          <h3>Your Cart</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Close cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer-body" id="drawerBody">
          {entries.length === 0 ? (
            <div className="drawer-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" style={{ stroke: 'var(--sand)', marginBottom: '16px' }}>
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="19" cy="21" r="1.4" />
                <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
              </svg>
              <p>Your cart is feeling a little empty.</p>
              <button
                className="btn-outline"
                onClick={() => {
                  onClose();
                  const shop = document.getElementById('shop-section');
                  if (shop) shop.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse the Shop
              </button>
            </div>
          ) : (
            entries.map(([id, qty]) => {
              const product = products.find((p) => p.id === id);
              if (!product) return null;

              return (
                <div className="cart-item" key={id}>
                  <div className="cart-item-art" style={{ background: product.gradient }}>
                    <div className="cart-icon-wrapper" style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ICONS[product.icon] || null}
                    </div>
                  </div>
                  <div className="cart-item-info">
                    <span className="cat-tiny">{product.category}</span>
                    <h4>{product.name}</h4>
                    <div className="cart-item-bottom">
                      <div className="qty-control">
                        <button onClick={() => changeQty(id, -1)} aria-label="Decrease quantity">−</button>
                        <span>{qty}</span>
                        <button onClick={() => changeQty(id, 1)} aria-label="Increase quantity">+</button>
                      </div>
                      <span className="cart-item-price">₹{product.price * qty}</span>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {entries.length > 0 && (
          <div className="drawer-footer" id="drawerFooter">
            <div className="subtotal-row">
              <span>Subtotal</span>
              <span className="amt" id="drawerSubtotal">
                ₹{subtotal}
              </span>
            </div>
            <button className="btn-primary" onClick={onCheckout} style={{ width: '100%', justifyContent: 'center' }}>
              Proceed to Checkout
            </button>
            <p className="ship-note">Shipping & taxes calculated at checkout</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .cart-icon-wrapper svg {
          width: 38px !important;
          height: 38px !important;
        }
      `}</style>
    </>
  );
};
