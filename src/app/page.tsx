'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product, Review } from '@/types';

import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutPage } from '@/components/CheckoutPage';
import { SuccessPage } from '@/components/SuccessPage';

const FALLBACK_REVIEWS: Review[] = [];

const FALLBACK_PRODUCTS: Product[] = [
  { id: 'p1', category: 'amigurumi', name: 'Starfish Keychain', description: 'A chunky hand-crocheted starfish with googly eyes — clip it to your bag or keys for a daily dose of cozy.', price: 99, tag: null, gradient: 'linear-gradient(135deg,#2C2C2C,#1a1a1a)', icon: 'starfish', image: '/images/starfish-keychain.jpg' },
  { id: 'p2', category: 'amigurumi', name: 'Hidden Love Pot', description: 'A pair of hand-crocheted tulip pots in blush pink & cream — a sweet, silent way to say “you matter.”', price: 349, tag: null, gradient: 'linear-gradient(135deg,#f9c6d0,#a8d5a2)', icon: 'bear', image: '/images/hidden-love-pot.jpg', imagePosition: 'center 85%' },
  { id: 'p3', category: 'amigurumi', name: 'Turtle Keychain', description: 'Adorable hand-crocheted turtle buddies to clip onto your backpack, keys, or purse.', price: 199, tag: null, gradient: 'linear-gradient(135deg,#93C5FD,#3B82F6)', icon: 'turtle', image: '/images/turtle-keychain.jpg' },
  { id: 'p4', category: 'florals', name: 'Tulip Bouquet', description: 'A gorgeous hand-crocheted tulip bouquet in pink, cream & red — wrapped in kraft paper with a satin ribbon.', price: 599, tag: null, gradient: 'linear-gradient(135deg,#f9c6d0,#e85d75)', icon: 'tulip', image: '/images/tulip-bouquet.jpg' },
  { id: 'p5', category: 'florals', name: 'Double Lily Pot', description: 'Two vibrant red crocheted lilies with golden stamens, potted in a cozy jute planter.', price: 349, tag: null, gradient: 'linear-gradient(135deg,#e63946,#f4a261)', icon: 'lily', image: '/images/double-lily-pot.jpg' },
  { id: 'p6', category: 'florals', name: 'Sunflower Pot', description: 'A cheerful hand-crocheted sunflower in a rustic jute pot — bring sunshine to any desk or shelf.', price: 249, tag: null, gradient: 'linear-gradient(135deg,#f4d35e,#8A9A5B)', icon: 'sunflower', image: '/images/sunflower-pot.jpg' },
  { id: 'p7', category: 'florals', name: 'Dual Shade Lily Pot', description: 'A delicate pink-and-red crocheted lily with golden stamens, nestled in a jute pot.', price: 299, tag: null, gradient: 'linear-gradient(135deg,#f9c6d0,#c1476b)', icon: 'lily', image: '/images/dual-shade-lily-pot.jpg' },
  { id: 'p8', category: 'florals', name: 'Rose Pot', description: 'A soft pink crocheted rose in a cozy jute pot — a timeless gift that never wilts.', price: 249, tag: null, gradient: 'linear-gradient(135deg,#f4a0b5,#8fbc8f)', icon: 'rose', image: '/images/rose-pot.jpg' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'florals', label: 'Florals' },
  { key: 'amigurumi', label: 'Amigurumi' },
];

export default function Home() {
  const { cart, addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistCount } = useWishlist();

  // App views: 'home' | 'wishlist' | 'checkout' | 'success'
  const [view, setView] = useState<'home' | 'wishlist' | 'checkout' | 'success'>('home');
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [revName, setRevName] = useState('');
  const [revLoc, setRevLoc] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);

  const handleOpenProductModal = (p: Product) => {
    setSelectedProduct(p);
    setModalQty(1);
  };

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

  // Fetch reviews from database
  useEffect(() => {
    async function getReviews() {
      try {
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setReviews(data);
        }
      } catch (err) {
        console.warn('Failed to load reviews from database, using fallback values.', err);
      }
    }
    getReviews();
  }, []);

  // Escape key listener to close details modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
      }
    };
    if (selectedProduct) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProduct]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revLoc.trim() || !revText.trim()) {
      showToast('Please fill out all review fields.', 'error');
      return;
    }
    setSubmittingReview(true);
    const newReview = {
      name: revName,
      location: revLoc,
      rating: revRating,
      text: revText,
    };
    try {
      const { data, error } = await supabase.from('reviews').insert([newReview]).select();
      if (!error && data && data[0]) {
        setReviews(prev => [data[0], ...prev]);
        showToast('Review submitted! Thank you.', 'cart');
        setRevName('');
        setRevLoc('');
        setRevRating(5);
        setRevText('');
      } else {
        console.warn('Supabase insert failed, adding locally.');
        const mockNew = {
          ...newReview,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        setReviews(prev => [mockNew, ...prev]);
        showToast('Review added! Thank you.', 'cart');
        setRevName('');
        setRevLoc('');
        setRevRating(5);
        setRevText('');
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong. Review added locally.', 'cart');
      const mockNew = {
        ...newReview,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      setReviews(prev => [mockNew, ...prev]);
      setRevName('');
      setRevLoc('');
      setRevRating(5);
      setRevText('');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderRatingHearts = (rating: number) => {
    return (
      <div className="stars" style={{ display: 'flex', gap: '3px', color: 'var(--terracotta)', marginBottom: '14px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="var(--terracotta)"
            strokeWidth="2"
            fill={star <= rating ? 'var(--terracotta)' : 'none'}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ))}
      </div>
    );
  };

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
            <img src="/images/logo.jpg" alt="Croviaa.co Logo" className="logo-img" />
            <span className="txt">Croviaa.co</span>
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
                <p className="lede">Croviaa.co is a tiny crochet studio making cozy bags, wearables, and amigurumi friends — each piece hand-hooked, one at a time, just for you.</p>
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

                <figure className="polaroid p1">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/starfish-keychain.jpg" alt="Starfish Keychain" className="polaroid-img" />
                  </div>
                  <figcaption>starfish keychain</figcaption>
                </figure>
                <figure className="polaroid p2">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/hidden-love-pot.jpg" alt="Hidden Love Pot" className="polaroid-img" />
                  </div>
                  <figcaption>hidden love pot</figcaption>
                </figure>
                <figure className="polaroid p3">
                  <div className="swatch" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/images/turtle-keychain.jpg" alt="Turtle Keychain" className="polaroid-img" />
                  </div>
                  <figcaption>turtle keychain</figcaption>
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
                <img
                  src="/images/logo.jpg"
                  alt="Croviaa.co Logo"
                  style={{
                    width: '65%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 16px 40px rgba(61, 43, 31, 0.15)',
                    border: '4px solid rgba(193, 110, 74, 0.2)',
                  }}
                />
              </div>
              <div>
                <span className="section-label">The Maker's Note</span>
                <h2>Every stitch has a story — and a little bit of patience.</h2>
                <p>Croviaa.co started the way most cozy things do: with one hook, one ball of yarn, and way too much YouTube tutorial watching at 1am. What began as a quiet hobby turned into a tiny home studio making bags, wearables, and squishy little amigurumi friends for anyone who loves things made slowly and on purpose.</p>
                <p>Nothing here is mass-produced. Every order is counted, looped, and tied off by hand — which means small wait times, but a piece that's really, truly yours.</p>
                <p className="about-sign">— with love, Croviaa.co</p>
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
                      <div className="card-art" style={{ overflow: 'hidden' }} onClick={() => handleOpenProductModal(p)}>
                        <button
                          className={`wishlist-toggle ${wished ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(p.id);
                          }}
                          aria-label="Save to wishlist"
                        >
                          <svg viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="card-product-img"
                          style={{ objectPosition: p.imagePosition || 'center' }}
                        />
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
              
              {reviews.length > 0 ? (
                <div className="reviews-grid-wrapper">
                  <div className="quote-grid">
                    {reviews.slice(0, 3).map((rev, index) => (
                      <div className="quote-card" key={rev.id || index}>
                        {renderRatingHearts(rev.rating)}
                        <p className="quote">“{rev.text}”</p>
                        <div className="quote-who">
                          <div className="quote-avatar">{rev.name.charAt(0)}</div>
                          <div>
                            <div className="name">{rev.name}</div>
                            <div className="loc">{rev.location}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--cocoa)', fontSize: '1.05rem', margin: '20px 0 40px', fontStyle: 'italic' }}>
                  No reviews yet. Be the first to leave one below!
                </p>
              )}

              {/* Horizontal scroll for reviews beyond the first 3 */}
              {reviews.length > 3 && (
                <div className="reviews-scroll-container">
                  <div className="reviews-scroll-track">
                    {reviews.slice(3).map((rev, idx) => (
                      <div className="quote-card" key={`scroll-${rev.id || idx}-${idx}`}>
                        {renderRatingHearts(rev.rating)}
                        <p className="quote">“{rev.text}”</p>
                        <div className="quote-who">
                          <div className="quote-avatar">{rev.name.charAt(0)}</div>
                          <div>
                            <div className="name">{rev.name}</div>
                            <div className="loc">{rev.location}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Entry Form */}
              <div className="review-form-card">
                <h3>Leave a review</h3>
                <p className="subtitle">Share your cozy experience with our handmade pieces.</p>
                <form onSubmit={handleSubmitReview}>
                  <div className="form-grid">
                    <div className="form-group-review">
                      <label htmlFor="rev-name">Your Name</label>
                      <input
                        id="rev-name"
                        type="text"
                        placeholder="e.g. Priya M."
                        value={revName}
                        onChange={(e) => setRevName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group-review">
                      <label htmlFor="rev-loc">Your Location</label>
                      <input
                        id="rev-loc"
                        type="text"
                        placeholder="e.g. Jaipur"
                        value={revLoc}
                        onChange={(e) => setRevLoc(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group-review">
                    <label>Rating</label>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`rating-heart-btn ${star <= revRating ? 'active' : ''}`}
                          onClick={() => setRevRating(star)}
                          aria-label={`Rate ${star} hearts`}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group-review">
                    <label htmlFor="rev-text">Review Message</label>
                    <textarea
                      id="rev-text"
                      rows={4}
                      placeholder="Tell us what you think of your crochet goodies..."
                      value={revText}
                      onChange={(e) => setRevText(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
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
                        <div className="card-art" style={{ overflow: 'hidden' }} onClick={() => handleOpenProductModal(p)}>
                          <button
                            className="wishlist-toggle active"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(p.id);
                            }}
                            aria-label="Remove from wishlist"
                          >
                            <svg viewBox="0 0 24 24" strokeWidth="2">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                          </button>
                          <img
                            src={p.image}
                            alt={p.name}
                            className="card-product-img"
                            style={{ objectPosition: p.imagePosition || 'center' }}
                          />
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
                  <img src="/images/logo.jpg" alt="Croviaa.co Logo" className="logo-img" />
                  Croviaa.co
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
              <span>© 2026 Croviaa.co. All pieces handmade with love.</span>
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

      {/* ============ PRODUCT DETAIL MODAL ============ */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="modal-grid">
              <div className="modal-image-sec">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div className="modal-details-sec">
                <span className="cat">{selectedProduct.category}</span>
                <h2>{selectedProduct.name}</h2>
                <div className="modal-price">₹{selectedProduct.price}</div>
                <p className="desc">{selectedProduct.description}</p>
                
                <div className="modal-features">
                  <div className="feat-item">
                    <span>🧶</span>
                    <span>100% Hand-Crocheted &amp; Unique</span>
                  </div>
                  <div className="feat-item">
                    <span>❤️</span>
                    <span>Made With Love &amp; Care</span>
                  </div>
                  <div className="feat-item">
                    <span>✨</span>
                    <span>Premium Cotton &amp; Acrylic Yarn</span>
                  </div>
                </div>

                <div className="modal-actions-row">
                  <div className="qty-picker">
                    <button onClick={() => setModalQty(Math.max(1, modalQty - 1))}>−</button>
                    <span>{modalQty}</span>
                    <button onClick={() => setModalQty(modalQty + 1)}>+</button>
                  </div>
                  <button className="modal-add-btn" onClick={() => {
                    for (let i = 0; i < modalQty; i++) {
                      addToCart(selectedProduct.id);
                    }
                    showToast(`Added ${modalQty} item(s) to cart`, 'cart');
                    setSelectedProduct(null);
                  }}>
                    Add to Cart · ₹{selectedProduct.price * modalQty}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
