'use client';

import React from 'react';

interface SuccessPageProps {
  orderId: string;
  onBackToShop: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ orderId, onBackToShop }) => {
  return (
    <div className="view active" id="view-success">
      <section className="page-section">
        <div className="wrap" style={{ maxWidth: '560px', textAlign: 'center', paddingTop: '30px' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ margin: '0 auto 26px' }}>
            <circle cx="45" cy="45" r="42" fill="#8A9A5B" opacity="0.15" />
            <circle cx="45" cy="45" r="32" fill="#8A9A5B" />
            <path d="M30 46l10 10 20-20" stroke="#FBF4EC" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 style={{ fontSize: '2rem', marginBottom: '14px' }}>Your order is on its way to being made!</h2>
          <p style={{ color: 'var(--cocoa)', fontSize: '1.02rem', lineHeight: '1.6', marginBottom: '8px' }}>
            Order <strong id="orderIdDisplay">#{orderId}</strong> has been placed. We'll start hooking your pieces by hand and email you once it ships.
          </p>
          <button className="btn-primary" style={{ marginTop: '24px' }} onClick={onBackToShop}>
            Back to Shop
          </button>
        </div>
      </section>
    </div>
  );
};
