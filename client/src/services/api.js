// Client API service with JWT authentication, guest session support & Multi-Backend URL failover

// 1. Resolve and manage candidate backend URLs
const DEFAULT_BACKEND_URLS = [
  'https://gastranom.onrender.com',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

export function getCandidateBackendUrls() {
  const customSaved = (() => {
    try {
      const item = localStorage.getItem('gastranom_custom_backend_urls');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  })();

  const envList = import.meta.env.VITE_API_URLS
    ? import.meta.env.VITE_API_URLS.split(',').map((u) => u.trim()).filter(Boolean)
    : [];

  const singleEnv = import.meta.env.VITE_API_URL ? [import.meta.env.VITE_API_URL.trim()] : [];

  const combined = Array.from(new Set([...customSaved, ...envList, ...singleEnv, ...DEFAULT_BACKEND_URLS]))
    .map((url) => url.replace(/\/$/, ''))
    .filter(Boolean);

  return combined;
}

// 2. Active backend URL state with localStorage persistence
let activeBackendUrl = (() => {
  const saved = localStorage.getItem('gastranom_active_backend_url');
  const candidates = getCandidateBackendUrls();
  if (saved && (candidates.includes(saved) || saved.startsWith('http'))) {
    return saved.replace(/\/$/, '');
  }
  return candidates[0] || 'https://gastranom.onrender.com';
})();

export function getActiveBackendUrl() {
  return activeBackendUrl;
}

export function setActiveBackendUrl(url) {
  if (!url) return;
  activeBackendUrl = url.replace(/\/$/, '');
  localStorage.setItem('gastranom_active_backend_url', activeBackendUrl);
  window.dispatchEvent(new CustomEvent('gastranom_backend_changed', { detail: { activeBackendUrl } }));
}

export function getCustomBackendUrls() {
  try {
    return JSON.parse(localStorage.getItem('gastranom_custom_backend_urls') || '[]');
  } catch {
    return [];
  }
}

export function addCustomBackendUrl(url, setAsActive = false) {
  if (!url) return;
  let cleanUrl = url.trim().replace(/\/$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  try {
    const list = JSON.parse(localStorage.getItem('gastranom_custom_backend_urls') || '[]');
    if (!list.includes(cleanUrl)) {
      list.push(cleanUrl);
      localStorage.setItem('gastranom_custom_backend_urls', JSON.stringify(list));
    }
  } catch (e) {
    localStorage.setItem('gastranom_custom_backend_urls', JSON.stringify([cleanUrl]));
  }
  if (setAsActive) {
    setActiveBackendUrl(cleanUrl);
  }
}

export function removeCustomBackendUrl(url) {
  if (!url) return;
  const cleanUrl = url.replace(/\/$/, '');
  try {
    let list = JSON.parse(localStorage.getItem('gastranom_custom_backend_urls') || '[]');
    list = list.filter((u) => u !== cleanUrl);
    localStorage.setItem('gastranom_custom_backend_urls', JSON.stringify(list));
    if (activeBackendUrl === cleanUrl) {
      setActiveBackendUrl(getCandidateBackendUrls()[0]);
    }
  } catch (e) {}
}

export function resetBackendsToDefault() {
  localStorage.removeItem('gastranom_custom_backend_urls');
  localStorage.removeItem('gastranom_active_backend_url');
  setActiveBackendUrl('https://gastranom.onrender.com');
}

export async function pingBackend(url, timeoutMs = 4000) {
  const cleanUrl = url.replace(/\/$/, '');
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    const duration = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, duration, data, url: cleanUrl };
    }
    return { ok: false, status: res.status, duration, url: cleanUrl };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.message, url: cleanUrl };
  }
}

export const API_BASE_URL = activeBackendUrl;

// Ensure guest sessionId in localStorage
let sessionId = localStorage.getItem('gastranom_session_id');
if (!sessionId) {
  sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  localStorage.setItem('gastranom_session_id', sessionId);
}

export function getSessionId() {
  return sessionId;
}

export function getFullUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getActiveBackendUrl()}${cleanEndpoint}`;
}

async function executeSingleFetch(fullUrl, options = {}) {
  const token = localStorage.getItem('gastranom_token');

  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const res = await fetch(fullUrl, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function request(endpoint, options = {}) {
  // If already an absolute URL, call directly
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return executeSingleFetch(endpoint, options);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const candidates = getCandidateBackendUrls();

  // Try current active URL first, followed by remaining candidates
  const prioritizedUrls = [
    activeBackendUrl,
    ...candidates.filter((u) => u !== activeBackendUrl)
  ];

  let lastError = null;

  for (let i = 0; i < prioritizedUrls.length; i++) {
    const baseUrl = prioritizedUrls[i];
    const fullUrl = `${baseUrl}${cleanEndpoint}`;

    try {
      const data = await executeSingleFetch(fullUrl, options);
      // Auto-failover promotion: if fallback succeeded, set it as current active backend
      if (baseUrl !== activeBackendUrl) {
        console.info(`[Multi-Backend Failover] Switched active backend from ${activeBackendUrl} to ${baseUrl}`);
        setActiveBackendUrl(baseUrl);
      }
      return data;
    } catch (err) {
      lastError = err;
      // If error is an intentional HTTP response from backend (400, 401, 403, 404, 422, etc.)
      // do NOT failover to another backend! The server was reachable and responded.
      if (err.status && err.status < 500) {
        throw err;
      }
      // For network connection drops (e.g. Failed to fetch, 502/503/504), continue to next candidate
      console.warn(`[Multi-Backend] Server ${baseUrl} failed for ${cleanEndpoint}:`, err.message);
    }
  }

  throw lastError || new Error('Barcha ulangan backend serverlar bilan aloqa uzilgan.');
}

// API methods
export const api = {
  // Auth
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  sendOtp: (phone) => request('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (payload) => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/api/auth/me'),
  updateProfile: (body) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/api/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
  getAddresses: () => request('/api/auth/addresses'),
  addAddress: (body) => request('/api/auth/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id, body) => request(`/api/auth/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress: (id) => request(`/api/auth/addresses/${id}`, { method: 'DELETE' }),

  // Products & Catalog
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/products?${q}`);
  },
  getProductSuggestions: (q) => request(`/api/products/search/suggestions?q=${encodeURIComponent(q)}`),
  getProduct: (slugOrId) => request(`/api/products/${slugOrId}`),

  // Categories
  getCategories: () => request('/api/categories'),
  getCategory: (slug) => request(`/api/categories/${slug}`),

  // Cart
  getCart: () => request('/api/cart'),
  addToCart: (productId, variantId = null, quantity = 1) =>
    request('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId, variantId, quantity }) }),
  updateCartItem: (cartItemId, quantity) =>
    request('/api/cart/update', { method: 'PUT', body: JSON.stringify({ cartItemId, quantity }) }),
  removeCartItem: (id) => request(`/api/cart/remove/${id}`, { method: 'DELETE' }),
  clearCart: () => request('/api/cart/clear', { method: 'POST' }),
  mergeCart: () => request('/api/cart/merge', { method: 'POST', body: JSON.stringify({ sessionId }) }),

  // Checkout
  validateCoupon: (code, subtotal) =>
    request('/api/checkout/validate-coupon', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  calculateCheckout: (payload) =>
    request('/api/checkout/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  placeOrder: (payload) =>
    request('/api/checkout/place-order', { method: 'POST', body: JSON.stringify({ ...payload, sessionId }) }),

  // Orders
  getMyOrders: () => request('/api/orders/my-orders'),
  trackOrder: (orderNumber) => request(`/api/orders/track/${orderNumber}`),
  getOrder: (id) => request(`/api/orders/${id}`),

  // Discounts
  getActiveDiscounts: () => request('/api/discounts/active'),

  // Reviews
  getProductReviews: (productId) => request(`/api/reviews/product/${productId}`),
  submitReview: (payload) => request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  // Wishlist
  getWishlist: () => request('/api/wishlist'),
  toggleWishlist: (productId) => request('/api/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) }),

  // Delivery
  getDeliveryZones: () => request('/api/delivery/zones'),

  // Notifications
  getNotifications: () => request('/api/notifications'),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/api/notifications/read-all', { method: 'PUT' }),

  // Content & Settings
  getBanners: () => request('/api/content/banners'),
  getSettings: () => request('/api/content/settings'),

  // ADMIN ENDPOINTS
  admin: {
    getDashboard: () => request('/api/admin/dashboard'),
    getOrders: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/orders/admin/list?${q}`);
    },
    updateOrderStatus: (id, status) =>
      request(`/api/orders/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    updateOrderPayment: (id, payment_status) =>
      request(`/api/orders/admin/${id}/payment`, { method: 'PUT', body: JSON.stringify({ payment_status }) }),
    updateOrderNotes: (id, notes) =>
      request(`/api/orders/admin/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),

    // Products
    createProduct: (body) => request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
    updateProduct: (id, body) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
    bulkProducts: (action, ids, data) =>
      request('/api/products/bulk', { method: 'POST', body: JSON.stringify({ action, ids, data }) }),

    // Categories
    createCategory: (body) => request('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
    updateCategory: (id, body) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

    // Inventory
    getInventory: (lowStockOnly = false) => request(`/api/admin/inventory?lowStockOnly=${lowStockOnly}`),
    adjustInventory: (body) => request('/api/admin/inventory/adjust', { method: 'PUT', body: JSON.stringify(body) }),

    // Discounts & Coupons
    getAllDiscounts: () => request('/api/discounts/admin/all'),
    createDiscount: (body) => request('/api/discounts/admin/create', { method: 'POST', body: JSON.stringify(body) }),
    updateDiscount: (id, body) => request(`/api/discounts/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteDiscount: (id) => request(`/api/discounts/admin/${id}`, { method: 'DELETE' }),

    getAllCoupons: () => request('/api/discounts/admin/coupons/all'),
    createCoupon: (body) => request('/api/discounts/admin/coupons/create', { method: 'POST', body: JSON.stringify(body) }),
    updateCoupon: (id, body) => request(`/api/discounts/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCoupon: (id) => request(`/api/discounts/admin/coupons/${id}`, { method: 'DELETE' }),

    // Delivery Zones
    getAllDeliveryZones: () => request('/api/delivery/admin/all'),
    createDeliveryZone: (body) => request('/api/delivery/admin/create', { method: 'POST', body: JSON.stringify(body) }),
    updateDeliveryZone: (id, body) => request(`/api/delivery/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteDeliveryZone: (id) => request(`/api/delivery/admin/${id}`, { method: 'DELETE' }),

    // Reviews moderation
    getAllReviews: () => request('/api/reviews/admin/all'),
    updateReviewStatus: (id, status) => request(`/api/reviews/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    deleteReview: (id) => request(`/api/reviews/admin/${id}`, { method: 'DELETE' }),

    // Customers
    getCustomers: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/admin/customers?${q}`);
    },
    updateCustomerStatus: (id, status) =>
      request(`/api/admin/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    // Content & Settings
    getAllBanners: () => request('/api/content/banners/all'),
    createBanner: (body) => request('/api/content/banners', { method: 'POST', body: JSON.stringify(body) }),
    updateBanner: (id, body) => request(`/api/content/banners/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteBanner: (id) => request(`/api/content/banners/${id}`, { method: 'DELETE' }),
    updateSettings: (body) => request('/api/content/settings', { method: 'PUT', body: JSON.stringify(body) }),
    testTelegram: (body = {}) => request('/api/content/test-telegram', { method: 'POST', body: JSON.stringify(body) }),

    // Audit logs
    getAuditLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/admin/audit-logs?${q}`);
    }
  },

  // Multi-backend URL Management
  backends: {
    getActive: () => getActiveBackendUrl(),
    setActive: (url) => setActiveBackendUrl(url),
    getCandidates: () => getCandidateBackendUrls(),
    getCustom: () => getCustomBackendUrls(),
    addCustom: (url, setAsActive) => addCustomBackendUrl(url, setAsActive),
    removeCustom: (url) => removeCustomBackendUrl(url),
    resetToDefault: () => resetBackendsToDefault(),
    ping: (url, timeout) => pingBackend(url, timeout),
    pingAll: async (timeout) => {
      const candidates = getCandidateBackendUrls();
      return Promise.all(candidates.map((u) => pingBackend(u, timeout)));
    }
  }
};
