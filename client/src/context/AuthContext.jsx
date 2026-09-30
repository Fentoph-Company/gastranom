import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gastranom_token'));
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' or 'register'
  const { showToast } = useToast();

  const fetchMe = useCallback(async () => {
    const currentToken = localStorage.getItem('gastranom_token');
    if (!currentToken) {
      setUser(null);
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setAddresses(data.addresses || []);
      } else {
        localStorage.removeItem('gastranom_token');
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      localStorage.removeItem('gastranom_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      if (data.success && data.token) {
        localStorage.setItem('gastranom_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Xush kelibsiz, ${data.user.name}!`);
        setIsAuthModalOpen(false);

        // Merge guest cart if any
        try {
          await api.mergeCart();
        } catch (e) {
          // silent ignore
        }

        await fetchMe();
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Kirishda xatolik yuz berdi.', 'error');
      return false;
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const data = await api.register({ name, email, password, phone });
      if (data.success && data.token) {
        localStorage.setItem('gastranom_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Ro‘yxatdan o‘tish muvaffaqiyatli! Xush kelibsiz, ${data.user.name}`);
        setIsAuthModalOpen(false);

        try {
          await api.mergeCart();
        } catch (e) {}

        await fetchMe();
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.', 'error');
      return false;
    }
  };

  const loginWithOtp = async (phone, code, name) => {
    try {
      const data = await api.verifyOtp({ phone, code, name });
      if (data.success && data.token) {
        localStorage.setItem('gastranom_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Xush kelibsiz, ${data.user.name}!`);
        setIsAuthModalOpen(false);

        try {
          await api.mergeCart();
        } catch (e) {}

        await fetchMe();
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Kodni tekshirishda xatolik yuz berdi.', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('gastranom_token');
    setToken(null);
    setUser(null);
    setAddresses([]);
    showToast('Tizimdan muvaffaqiyatli chiqdingiz.', 'info');
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'manager' || user.role === 'operator' || user.role === 'warehouse');
  const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        addresses,
        loading,
        isAdmin,
        isSuperAdmin,
        login,
        register,
        loginWithOtp,
        logout,
        refreshMe: fetchMe,
        fetchMe,
        isAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
