import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import AuthModal from './components/auth/AuthModal';
import ProductDetailModal from './components/product/ProductDetailModal';

// Customer Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import DiscountsPage from './pages/DiscountsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import { FAQPage, DeliveryInfoPage, TermsPage, PrivacyPage } from './pages/ContentPages';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSettings from './pages/admin/AdminSettings';

function MainApp() {
  const { user, isAdmin, openAuthModal } = useAuth();

  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Admin subpage state
  const [adminTab, setAdminTab] = useState('dashboard');

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/products/')) {
        const slug = path.replace('/products/', '');
        if (slug) {
          setCurrentPage('product');
          setPageParams({ slug });
          return;
        }
      }
      if (path.startsWith('/orders/')) {
        const orderNumber = path.replace('/orders/', '');
        if (orderNumber) {
          setCurrentPage('track-order');
          setPageParams({ orderNumber });
          return;
        }
      }
      if (path === '/catalog') {
        setCurrentPage('catalog');
        return;
      }
      if (path === '/discounts') {
        setCurrentPage('discounts');
        return;
      }
      if (path === '/checkout') {
        setCurrentPage('checkout');
        return;
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (page, params = {}) => {
    // If admin page requested
    if (page.startsWith('admin-')) {
      if (!isAdmin) {
        openAuthModal('login');
        return;
      }
      const sub = page.replace('admin-', '');
      setAdminTab(sub || 'dashboard');
      setCurrentPage('admin');
      window.scrollTo(0, 0);
      return;
    }

    if (page === 'product' && params.slug) {
      try { window.history.pushState(null, '', `/products/${params.slug}`); } catch (e) {}
    } else if (page === 'home') {
      try { window.history.pushState(null, '', '/'); } catch (e) {}
    } else if (page === 'catalog') {
      try { window.history.pushState(null, '', '/catalog'); } catch (e) {}
    } else if (page === 'discounts') {
      try { window.history.pushState(null, '', '/discounts'); } catch (e) {}
    } else if (page === 'checkout') {
      try { window.history.pushState(null, '', '/checkout'); } catch (e) {}
    } else if (page === 'track' || page === 'track-order') {
      if (params.orderNumber) {
        try { window.history.pushState(null, '', `/orders/${params.orderNumber}`); } catch (e) {}
      }
    }

    setCurrentPage(page === 'track' ? 'track-order' : page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  // If in Admin Panel
  if (currentPage === 'admin') {
    if (!isAdmin) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <h2>Admin huquqi talab etiladi</h2>
          <p style={{ margin: '1rem 0' }}>Ushbu bo‘limga kirish uchun administrator hisobingizga kiring.</p>
          <button onClick={() => openAuthModal('login')} className="btn btn-primary">
            Kirish
          </button>
        </div>
      );
    }

    return (
      <AdminLayout
        activePage={adminTab}
        setActivePage={setAdminTab}
        onNavigateToStore={() => setCurrentPage('home')}
      >
        {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={setAdminTab} />}
        {adminTab === 'products' && <AdminProducts />}
        {adminTab === 'orders' && <AdminOrders />}
        {adminTab === 'categories' && <AdminCategories />}
        {adminTab === 'inventory' && <AdminInventory />}
        {adminTab === 'discounts' && <AdminDiscounts />}
        {adminTab === 'delivery' && <AdminDelivery />}
        {adminTab === 'reviews' && <AdminReviews />}
        {adminTab === 'customers' && <AdminCustomers />}
        {adminTab === 'banners' && <AdminSettings />}
        {adminTab === 'audit-logs' && <AdminAuditLogs />}
        {adminTab === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      <main style={{ flex: 1 }}>
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'catalog' && (
          <CatalogPage
            initialParams={pageParams}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'discounts' && (
          <DiscountsPage
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'product' && (
          <ProductDetailPage
            slug={pageParams.slug || selectedProduct?.slug || selectedProduct?.id}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'track-order' && (
          <OrderTrackingPage
            orderNumber={pageParams.orderNumber}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'profile' && (
          <CustomerProfilePage
            initialTab="profile"
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'my-orders' && (
          <CustomerProfilePage
            initialTab="orders"
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'wishlist' && (
          <CustomerProfilePage
            initialTab="wishlist"
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentPage === 'faq' && <FAQPage />}
        {currentPage === 'delivery-info' && <DeliveryInfoPage />}
        {currentPage === 'terms' && <TermsPage />}
        {currentPage === 'privacy' && <PrivacyPage />}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          productData={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainApp />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}
