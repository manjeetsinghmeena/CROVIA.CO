'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/types';

import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutPage } from '@/components/CheckoutPage';
import { SuccessPage } from '@/components/SuccessPage';

const FALLBACK_PRODUCTS: Product[] = [
  { id: 'p1', category: 'amigurumi', name: 'Starfish Keychain', description: 'A chunky hand-crocheted starfish with googly eyes — clip it to your bag or keys for a daily dose of cozy.', price: 399, tag: null, gradient: 'linear-gradient(135deg,#2C2C2C,#1a1a1a)', icon: 'starfish', image: '/images/starfish-keychain.png' },
  { id: 'p2', category: 'amigurumi', name: 'Little Bear Friend', description: 'A squishy 6" bear made to be hugged, gifted, or shelf-displayed.', price: 899, tag: null, gradient: 'linear-gradient(135deg,#8A9A5B,#707D49)', icon: 'bear', image: '/images/bear-friend.png' },
  { id: 'p3', category: 'wearables', name: 'Sunbeam Bucket Hat', description: 'Breathable cotton-blend hat, perfect for golden-hour walks.', price: 749, tag: null, gradient: 'linear-gradient(135deg,#C16E4A,#A8593A)', icon: 'hat', image: '/images/bucket-hat.png' },
  { id: 'p4', category: 'wearables', name: 'Wavy Scarf', description: 'Long, drapey scarf with a soft wave texture stitch.', price: 999, tag: null, gradient: 'linear-gradient(135deg,#E8C4A0,#8A9A5B)', icon: 'scarf', image: '/images/wavy-scarf.png' },
  { id: 'p5', category: 'bags', name: 'Mini Pouch Duo', description: 'Set of two coin pouches — perfect for cards, keys, or lip balm.', price: 549, tag: null, gradient: 'linear-gradient(135deg,#707D49,#3D2B1F)', icon: 'pouch', image: '/images/mini-pouch.png' },
  { id: 'p6', category: 'amigurumi', name: 'Tiny Fox Keychain', description: 'A pocket-sized fox friend to clip onto your bag or keys.', price: 399, tag: null, gradient: 'linear-gradient(135deg,#C16E4A,#E8C4A0)', icon: 'fox', image: '/images/fox-keychain.png' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'bags', label: 'Bags & Totes' },
  { key: 'wearables', label: 'Wearables' },
  { key: 'amigurumi', label: 'Amigurumi' },
];

export default function Home() {
  const { cart, addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistCount } = useWishlist();

  // App views: 'home' | 'wishlist' | 'checkout' | 'success'
  const [view, setView] = useState<'home' | 'wishlist' | 'checkout' | 'success'>('home');
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ msg: string; type: 'cart' | 'heart' | 'error' | null }>({ msg: '', type: null });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch products from database
  useEffect(() => {
    async function getProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          // Cast database numeric type to number
          const parsed: Product[] = data.map((p) => ({
            ...p,
            price: Number(p.price),
          }));
          setProducts(parsed);
        }
      } catch (err) {
        console.warn('Failed to load products from database, using fallback values.', err);
      }
    }
    getProducts();
  }, []);

  const showToast = (msg: string, type: 'cart' | 'heart' | 'error') => {
    setToast({ msg, type });
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  };

  const handleToggleWishlist = (id: string) => {
    const isAdded = toggleWishlist(id);
    showToast(isAdded ? 'Saved to wishlist' : 'Removed from wishlist', 'heart');
  };

  const handleAddToCart = (id: string) => {
    addToCart(id);
    showToast('Added to cart', 'cart');
  };

  const handleViewChange = (newView: 'home' | 'wishlist' | 'checkout' | 'success') => {
    setView(newView);
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  const handleScrollToSection = (sectionId: string) => {
    setView('home');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const filteredProducts = products.filter((p) => activeFilter === 'all' || p.category === activeFilter);
  const wishlistedProducts = products.filter((p) => isInWishlist(p.id));

  // Toast icons
  const toastIcons = {
    cart: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="18" height="18"><circle cx="9" cy="21" r="1.4" /><circle cx="19" cy="21" r="1.4" /><path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" /></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="18" height="18"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
    error: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>,
  };

  return (
    <>
      {/* ============ NAV ============ */}
      <nav>
        <div className="nav-inner">
          <a
            href="#"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              handleViewChange('home');
            }}
          >
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" fill="#C16E4A" />
              <path d="M11 22c0-6 4-10 9-10s9 4 9 10c0 3-2 5-5 5h-8c-3 0-5-2-5-5z" stroke="#FBF4EC" strokeWidth="1.8" fill="none" />
              <path d="M14 20c2-2 4-2 6 0s4 2 6 0" stroke="#FBF4EC" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <path d="M14 24c2-2 4-2 6 0s4 2 6 0" stroke="#FBF4EC" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
            <span className="txt">Croviaa</span>
          </a>
          <div className="nav-links">
            <a
              href="#shop-section"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('shop-section');
              }}
            >
              Shop
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('about');
              }}
            >
              About
            </a>
            <a
              href="#process"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('process');
              }}
            >
              Custom Orders
            </a>
            <a
              href="#reviews"
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('reviews');
              }}
            >
              Reviews
            </a>
          </div>
          <div className="nav-icons">
            <button className="icon-btn" onClick={() => handleViewChange('wishlist')} aria-label="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="21" height="21" stroke="currentColor">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span className={`badge ${wishlistCount === 0 ? 'hide' : ''}`} id="wishlistBadge">
                {wishlistCount}
              </span>
            </button>
            <button className="icon-btn" onClick={() => setIsCartOpen(true)} aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="21" height="21" stroke="currentColor">
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="19" cy="21" r="1.4" />
                <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
              </svg>
              <span className={`badge ${Object.keys(cart).length === 0 ? 'hide' : ''}`} id="cartBadge">
                {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ============ VIEWS CONTAINER ============ */}
      {view === 'home' && (
        <div className="view active" id="view-home">
          {/* ============ HERO ============ */}
          <header className="hero" id="top">
            <div className="wrap hero-grid">
              <div>
                <span className="eyebrow">🧶 Small batch · Made to order</span>
                <h1>
                  Stitched with love,
                  <br />
                  one loop at a <span className="accent">time.</span>
                </h1>
                <p className="lede">Croviaa is a tiny crochet studio making cozy bags, wearables, and amigurumi friends — each piece hand-hooked, one at a time, just for you.</p>
                <div className="hero-actions">
                  <button className="btn-primary" onClick={() => handleScrollToSection('shop-section')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="9" cy="21" r="1.4" />
                      <circle cx="19" cy="21" r="1.4" />
                      <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
                    </svg>
                    Shop the Collection
                  </button>
                  <button className="btn-secondary" onClick={() => handleScrollToSection('shop-section')}>
                    Browse pieces ↓
                  </button>
                </div>
              </div>
              <div className="collage">
                <svg className="stitch-ring" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="42" stroke="#8A9A5B" strokeWidth="3" strokeDasharray="4 7" />
                </svg>
                <figure className="polaroid p1">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/starfish-keychain.png" alt="Starfish Keychain" className="polaroid-img" />
                  </div>
                  <figcaption>starfish keychain</figcaption>
                </figure>
                <figure className="polaroid p2">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/bear-friend.png" alt="Little Bear Friend" className="polaroid-img" />
                  </div>
                  <figcaption>little bear friend</figcaption>
                </figure>
                <figure className="polaroid p3">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/bucket-hat.png" alt="Sunbeam Bucket Hat" className="polaroid-img" />
                  </div>
                  <figcaption>sunbeam bucket hat</figcaption>
                </figure>
              </div>
            </div>
          </header>

          <div className="thread-divider">
            <svg viewBox="0 0 1200 90" preserveAspectRatio="none">
              <path d="M0,45 C150,10 300,80 450,45 C600,10 750,80 900,45 C1050,10 1150,60 1200,40" fill="none" stroke="#D9A876" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
            </svg>
          </div>

          <div className="marquee-band">
            <div className="marquee-track">
              <span>🧶 100% handmade &nbsp;•&nbsp; made-to-order &nbsp;•&nbsp; small batch crochet &nbsp;•&nbsp; every piece is one-of-one &nbsp;•&nbsp; 🧶 100% handmade &nbsp;•&nbsp; made-to-order &nbsp;•&nbsp; small batch crochet &nbsp;•&nbsp; every piece is one-of-one &nbsp;•&nbsp;</span>
            </div>
          </div>

          {/* ============ ABOUT ============ */}
          <section className="about" id="about">
            <div className="wrap about-grid">
              <div className="about-visual">
                <svg width="65%" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="70" fill="#C16E4A" opacity="0.15" />
                  <path d="M60 110c0-25 18-45 40-45s40 20 40 45v35a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8v-35z" fill="#C16E4A" />
                  <path d="M72 108c8-8 16-8 28 0s20 8 28 0" stroke="#FBF4EC" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M72 122c8-8 16-8 28 0s20 8 28 0" stroke="#FBF4EC" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M72 136c8-8 16-8 28 0s20 8 28 0" stroke="#FBF4EC" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="100" cy="60" r="6" fill="#7B4B33" />
                </svg>
              </div>
              <div>
                <span className="section-label">The Maker's Note</span>
                <h2>Every stitch has a story — and a little bit of patience.</h2>
                <p>Croviaa started the way most cozy things do: with one hook, one ball of yarn, and way too much YouTube tutorial watching at 1am. What began as a quiet hobby turned into a tiny home studio making bags, wearables, and squishy little amigurumi friends for anyone who loves things made slowly and on purpose.</p>
                <p>Nothing here is mass-produced. Every order is counted, looped, and tied off by hand — which means small wait times, but a piece that's really, truly yours.</p>
                <p className="about-sign">— with love, the Croviaa hook & hands</p>
              </div>
            </div>
          </section>

          {/* ============ SHOP ============ */}
          <section className="shop" id="shop-section">
            <div className="wrap">
              <div className="shop-head">
                <span className="section-label">The Shop</span>
                <h2>Pick your cozy.</h2>
                <p>A little bit of everything — bags to carry your day, wearables to keep you warm, and tiny creatures to keep you company. New pieces drop in small batches, so once it's gone, it's gone.</p>
              </div>

              {/* Tabs */}
              <div className="tabs" id="tabs">
                {CATEGORIES.map((c) => (
                  <div
                    key={c.key}
                    className={`tab ${c.key === activeFilter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(c.key)}
                  >
                    {c.label}
                  </div>
                ))}
              </div>

              {/* Product Grid */}
              <div className="product-grid" id="productGrid">
                {filteredProducts.map((p) => {
                  const inCart = (cart[p.id] || 0) > 0;
                  const wished = isInWishlist(p.id);

                  return (
                    <div className="card" key={p.id}>
                      <div className="card-art" style={{ overflow: 'hidden' }}>
                        <button
                          className={`wishlist-toggle ${wished ? 'active' : ''}`}
                          onClick={() => handleToggleWishlist(p.id)}
                          aria-label="Save to wishlist"
                        >
                          <svg viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                        <img src={p.image} alt={p.name} className="card-product-img" />
                      </div>
                      <div className="card-body">
                        <span className="cat">{p.category}</span>
                        <h3>{p.name}</h3>
                        <p className="desc">{p.description}</p>
                        <div className="price-row">
                          <span className="price">₹{p.price}</span>
                        </div>
                        <button
                          className={`add-cart-btn ${inCart ? 'added' : ''}`}
                          onClick={() => handleAddToCart(p.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                            <circle cx="9" cy="21" r="1.4" />
                            <circle cx="19" cy="21" r="1.4" />
                            <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
                          </svg>
                          {inCart ? `In Cart (${cart[p.id]})` : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="thread-divider">
            <svg viewBox="0 0 1200 90" preserveAspectRatio="none">
              <path d="M0,50 C150,85 300,15 450,50 C600,85 750,15 900,50 C1050,85 1150,30 1200,50" fill="none" stroke="#8A9A5B" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
            </svg>
          </div>

          {/* ============ PROCESS ============ */}
          <section className="process" id="process">
            <div className="wrap">
              <div className="process-head">
                <span className="section-label">How Ordering Works</span>
                <h2>From cart to your doorstep.</h2>
              </div>
              <div className="process-grid">
                <div className="process-step">
                  <div className="step-icon">
                    <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
                      <circle cx="14" cy="32" r="2.4" fill="#C16E4A" />
                      <circle cx="28" cy="32" r="2.4" fill="#C16E4A" />
                      <path d="M5 7h4l4 20h18" stroke="#C16E4A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 13h20l-2 11H16" stroke="#C16E4A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3>Add to cart</h3>
                  <p>Browse the shop, save favorites to your wishlist, and add what you love to your cart.</p>
                </div>
                <div className="process-step">
                  <div className="step-icon">
                    <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
                      <rect x="6" y="13" width="28" height="20" rx="3" stroke="#C16E4A" strokeWidth="2.2" fill="none" />
                      <path d="M6 18h28" stroke="#C16E4A" strokeWidth="2.2" />
                      <path d="M11 25h8" stroke="#C16E4A" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3>Secure checkout</h3>
                  <p>Pay safely online with UPI, cards, or wallets — fast and encrypted.</p>
                </div>
                <div className="process-step">
                  <div className="step-icon">
                    <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
                      <path d="M8 20a12 12 0 1 1 24 0c0 6-5 10-12 14-7-4-12-8-12-14z" stroke="#C16E4A" strokeWidth="2.2" fill="none" />
                    </svg>
                  </div>
                  <h3>Made & shipped with love</h3>
                  <p>We hook your order by hand, package it cozily, and ship it straight to your door.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ============ TESTIMONIALS ============ */}
          <section className="testimonials" id="reviews">
            <div className="wrap">
              <div className="testimonials-head">
                <span className="section-label">Kind Words</span>
                <h2>Loved by cozy people everywhere.</h2>
              </div>
              <div className="quote-grid">
                <div className="quote-card">
                  <div className="stars">★★★★★</div>
                  <p className="quote">The tote is even softer than it looked in photos. You can tell so much care went into it.</p>
                  <div className="quote-who">
                    <div className="quote-avatar">P</div>
                    <div>
                      <div className="name">Priya M.</div>
                      <div className="loc">Jaipur</div>
                    </div>
                  </div>
                </div>
                <div className="quote-card">
                  <div className="stars">★★★★★</div>
                  <p className="quote">Ordered a custom bear for my niece and the detail on the little paws was adorable.</p>
                  <div className="quote-who">
                    <div className="quote-avatar">A</div>
                    <div>
                      <div className="name">Ananya S.</div>
                      <div className="loc">Delhi</div>
                    </div>
                  </div>
                </div>
                <div className="quote-card">
                  <div className="stars">★★★★★</div>
                  <p className="quote">Checkout was so smooth, and the packaging made it feel like a gift to myself.</p>
                  <div className="quote-who">
                    <div className="quote-avatar">R</div>
                    <div>
                      <div className="name">Riya K.</div>
                      <div className="loc">Mumbai</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============ CTA BAND ============ */}
          <section className="cta-band">
            <div className="wrap">
              <h2>Ready to cozy up?</h2>
              <p>Browse the shop and find (or build) your perfect cart of handmade pieces.</p>
              <button className="btn-light" onClick={() => handleScrollToSection('shop-section')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="9" cy="21" r="1.4" />
                  <circle cx="19" cy="21" r="1.4" />
                  <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
                </svg>
                Start Shopping
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ============ WISHLIST VIEW ============ */}
      {view === 'wishlist' && (
        <div className="view active" id="view-wishlist">
          <section className="page-section">
            <div className="wrap">
              <div className="page-head">
                <span className="section-label">Saved For Later</span>
                <h2>Your Wishlist</h2>
                <p>The pieces you've fallen for. Move them to your cart whenever you're ready.</p>
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="empty-state" id="wishlistEmpty">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="70" height="70" style={{ stroke: 'var(--sand)', marginBottom: '20px' }}>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <p>Nothing saved yet — tap the heart on any piece to keep it here.</p>
                  <button className="btn-outline" onClick={() => handleScrollToSection('shop-section')}>
                    Browse the Shop
                  </button>
                </div>
              ) : (
                <div className="product-grid" id="wishlistGrid">
                  {wishlistedProducts.map((p) => {
                    const inCart = (cart[p.id] || 0) > 0;
                    return (
                      <div className="card" key={p.id}>
                        <div className="card-art" style={{ overflow: 'hidden' }}>
                          <button
                            className="wishlist-toggle active"
                            onClick={() => handleToggleWishlist(p.id)}
                            aria-label="Remove from wishlist"
                          >
                            <svg viewBox="0 0 24 24" strokeWidth="2">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                          </button>
                          <img src={p.image} alt={p.name} className="card-product-img" />
                        </div>
                        <div className="card-body">
                          <span className="cat">{p.category}</span>
                          <h3>{p.name}</h3>
                          <p className="desc">{p.description}</p>
                          <div className="price-row">
                            <span className="price">₹{p.price}</span>
                          </div>
                          <button
                            className={`add-cart-btn ${inCart ? 'added' : ''}`}
                            onClick={() => handleAddToCart(p.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                              <circle cx="9" cy="21" r="1.4" />
                              <circle cx="19" cy="21" r="1.4" />
                              <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
                            </svg>
                            {inCart ? `In Cart (${cart[p.id]})` : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ============ CHECKOUT VIEW ============ */}
      {view === 'checkout' && (
        <CheckoutPage
          products={products}
          onSuccess={(orderId) => {
            setSuccessOrderId(orderId);
            handleViewChange('success');
          }}
          onBackToShop={() => handleViewChange('home')}
          showToast={showToast}
        />
      )}

      {/* ============ SUCCESS VIEW ============ */}
      {view === 'success' && (
        <SuccessPage
          orderId={successOrderId}
          onBackToShop={() => handleViewChange('home')}
        />
      )}

      {/* ============ FOOTER (shown on home only) ============ */}
      {view === 'home' && (
        <footer id="mainFooter">
          <div className="wrap">
            <div className="footer-grid">
              <div>
                <div className="footer-logo">
                  <svg viewBox="0 0 40 40" fill="none" width="30" height="30">
                    <circle cx="20" cy="20" r="19" fill="#C16E4A" />
                    <path d="M11 22c0-6 4-10 9-10s9 4 9 10c0 3-2 5-5 5h-8c-3 0-5-2-5-5z" stroke="#FBF4EC" strokeWidth="1.8" fill="none" />
                  </svg>
                  Croviaa
                </div>
                <p className="blurb">Handmade crochet bags, wearables, and amigurumi — made slowly, with love, one loop at a time.</p>
              </div>
              <div>
                <h4>Explore</h4>
                <ul>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleScrollToSection('shop-section');
                      }}
                    >
                      Shop
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleScrollToSection('about');
                      }}
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <button onClick={() => handleViewChange('wishlist')}>Wishlist</button>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleScrollToSection('reviews');
                      }}
                    >
                      Reviews
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Get in touch</h4>
                <ul>
                  <li>
                    <a href="https://www.instagram.com/croviaa.co" target="_blank" rel="noopener noreferrer">
                      @croviaa.co
                    </a>
                  </li>
                  <li>
                    <a href="#">Made in India</a>
                  </li>
                  <li>
                    <a href="#">Ships nationwide</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 Croviaa. All pieces handmade with love.</span>
              <div className="social-row">
                <a href="https://www.instagram.com/croviaa.co" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FBF4EC" strokeWidth="2" width="17" height="17">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.6" fill="#FBF4EC" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ============ CART DRAWER ============ */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => handleViewChange('checkout')}
        products={products}
      />

      {/* ============ TOAST ============ */}
      <div className={`toast ${toastVisible ? 'show' : ''}`} id="toast">
        {toast.type && toastIcons[toast.type]}
        <span>{toast.msg}</span>
      </div>
    </>
  );
}
