import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0, totalDiscount: 0 });
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.warn('Failed to load cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      const res = await api.addToCart(productId, variantId, quantity);
      if (res.success) {
        showToast('Savatga qo‘shildi!');
        await fetchCart();
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Savatga qo‘shishda xatolik yuz berdi.', 'error');
      return false;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const res = await api.updateCartItem(cartItemId, quantity);
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      showToast(err.message || 'Miqdorni o‘zgartirib bo‘lmadi.', 'error');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const res = await api.removeCartItem(cartItemId);
      if (res.success) {
        showToast('Mahsulot savatdan o‘chirildi.', 'info');
        await fetchCart();
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      await fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount: cart.itemCount || 0,
        subtotal: cart.subtotal || 0,
        totalDiscount: cart.totalDiscount || 0,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
