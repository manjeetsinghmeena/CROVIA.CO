'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Cart = Record<string, number>;

interface CartContextType {
  cart: Cart;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  changeQty: (id: string, amount: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('croviaa_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('croviaa_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const changeQty = (id: string, amount: number) => {
    setCart((prev) => {
      const qty = prev[id] || 0;
      const newQty = qty + amount;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return {
        ...prev,
        [id]: newQty,
      };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, changeQty, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
