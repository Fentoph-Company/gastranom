import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getWishlist();
      if (data.success && data.wishlist) {
        setWishlist(data.wishlist);
      }
    } catch (err) {
      console.warn('Failed to load wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      openAuthModal('login');
      showToast('Sevimlilarga qo‘shish uchun tizimga kiring.', 'info');
      return false;
    }

    try {
      const res = await api.toggleWishlist(productId);
      if (res.success) {
        showToast(res.message);
        await fetchWishlist();
        return res.isWishlisted;
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
      return false;
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        count: wishlist.length,
        toggleWishlist,
        isWishlisted,
        refreshWishlist: fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
