import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Clock,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  MapPin,
  Sparkles,
  Percent,
  Star,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

export default function Header({ onNavigate, currentPage, onOpenCategoryDrawer }) {
  const { lang, setLang, t } = useLanguage();
  const { user, isAdmin, logout, openAuthModal } = useAuth();
  const { itemCount, subtotal, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load categories for navigation bar
  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success) setCategories(res.categories || []);
    }).catch(() => {});
  }, []);

  // Search autocomplete debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ products: [], categories: [] });
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getProductSuggestions(searchQuery);
        if (res.success && res.suggestions) {
          setSuggestions(res.suggestions);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search & user menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      onNavigate('catalog', { search: searchQuery.trim() });
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 900, backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Banner Bar */}
      <div style={{ backgroundColor: '#0f172a', color: '#cbd5e1', fontSize: '0.8rem', padding: '0.4rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <a
              href="https://yandex.uz/maps/?pt=60.355998,41.381527&z=17&l=map"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}
              title="Xaritada ko‘rish: Xiva, Mustaqillik ko‘chasi, 17 (Plus-kod: 99J4+JF)"
            >
              <MapPin size={14} color="#10b981" />
              {t('address_top')}
            </a>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: '600' }}>
              <Clock size={14} color="#10b981" />
              {t('working_hours_badge')}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
              title="94 ta xaridor bahosi asosida"
            >
              <Star size={12} fill="#fbbf24" color="#fbbf24" />
              4.1 (94 baho)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('track')}
              style={{ color: '#cbd5e1', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Package size={14} color="#10b981" />
              {t('track_order')}
            </button>
            <button
              onClick={() => onNavigate('discounts')}
              style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}
            >
              <Percent size={14} />
              {t('discounts')}
            </button>

            {/* Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.35rem', borderRadius: '6px' }}>
              <Globe size={13} color="#94a3b8" style={{ marginRight: '0.2rem' }} />
              {['uz', 'ru', 'en'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    padding: '0.1rem 0.3rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: lang === l ? '700' : '500',
                    color: lang === l ? '#10b981' : '#94a3b8',
                    backgroundColor: lang === l ? 'rgba(16,185,129,0.2)' : 'transparent',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <a href="tel:+998712004545" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f8fafc' }}>
              <Phone size={14} color="#10b981" />
              +998 (71) 200-45-45
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div style={{ padding: '0.85rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          {/* Logo & Category Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => onNavigate('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.4rem',
                fontWeight: '800',
                boxShadow: '0 4px 10px rgba(5,150,105,0.3)'
              }}>
                G
              </div>
              <div>
                <span style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'block' }}>
                  GASTRONOM
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
                  Xiva • 24/7 Supermarket
                </span>
              </div>
            </button>

            {/* Catalog Button */}
            <button
              onClick={() => onNavigate('catalog')}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.1rem', borderRadius: '12px', display: 'none', mdDisplay: 'flex' }}
            >
              <Menu size={18} />
              <span>{t('catalog')}</span>
            </button>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: '580px', position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                placeholder={t('search_placeholder')}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.8rem 0.75rem 1.1rem',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  fontSize: '0.925rem',
                  transition: 'all 0.2s ease'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search size={17} />
              </button>
            </form>

            {/* Live Autocomplete Results */}
            {showSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--border-color)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  maxHeight: '420px',
                  overflowY: 'auto'
                }}
              >
                {/* Categories suggestions */}
                {suggestions.categories?.length > 0 && (
                  <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Kategoriyalar
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {suggestions.categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setShowSuggestions(false);
                            onNavigate('catalog', { category: cat.slug });
                          }}
                          className="badge badge-neutral"
                          style={{ cursor: 'pointer', padding: '0.35rem 0.65rem' }}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products suggestions */}
                {suggestions.products?.length > 0 ? (
                  <div style={{ padding: '0.5rem 0' }}>
                    <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Topilgan mahsulotlar
                    </div>
                    {suggestions.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          onNavigate('product-detail', { slug: prod.slug, id: prod.id });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 1rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                          alt={prod.name}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                              {prod.effective_price.toLocaleString()} so‘m
                            </span>
                            {prod.has_discount && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                {prod.original_display_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <button
                        onClick={handleSearchSubmit}
                        style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem' }}
                      >
                        Barcha natijalarni ko‘rish ({searchQuery}) →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    "{searchQuery}" bo‘yicha mahsulot topilmadi
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons: Wishlist, Cart, Profile, Admin Panel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Admin quick toggle if admin */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="btn btn-secondary"
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '10px'
                }}
              >
                <LayoutDashboard size={16} color="#10b981" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Wishlist Icon */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="btn btn-secondary btn-icon"
              title="Sevimlilar"
              style={{ position: 'relative' }}
            >
              <Heart size={20} color={wishlistCount > 0 ? '#ef4444' : 'currentColor'} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="btn btn-primary"
              style={{
                borderRadius: '12px',
                padding: '0.6rem 1rem',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#f59e0b',
                      color: '#0f172a',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </div>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', display: 'none', smDisplay: 'inline' }}>
                {subtotal > 0 ? `${subtotal.toLocaleString()} so‘m` : 'Savat'}
              </span>
            </button>

            {/* User Account Dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              {user ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '12px', padding: '0.6rem 0.85rem' }}
                >
                  <User size={18} />
                  <span style={{ fontWeight: '600', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="btn btn-outline"
                  style={{ borderRadius: '12px', padding: '0.6rem 0.95rem' }}
                >
                  <User size={18} />
                  <span>Kirish</span>
                </button>
              )}

              {/* User Dropdown Menu */}
              {userMenuOpen && user && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    zIndex: 1000
                  }}
                >
                  <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>

                  <div style={{ padding: '0.35rem 0' }}>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('profile');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.8rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={16} /> Profil va Manzillar
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('my-orders');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.8rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Package size={16} /> Buyurtmalar tarixi
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('admin-dashboard');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          borderRadius: '8px',
                          color: 'var(--primary)',
                          fontWeight: '600'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <LayoutDashboard size={16} /> Admin Boshqaruv
                      </button>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem' }}>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.55rem 0.8rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        borderRadius: '8px',
                        color: 'var(--danger)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={16} /> Chiqish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category quick links bar */}
      <nav style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 1.25rem' }}>
          <button
            onClick={() => onNavigate('catalog')}
            style={{
              fontSize: '0.875rem',
              fontWeight: currentPage === 'catalog' ? '700' : '500',
              color: currentPage === 'catalog' ? 'var(--primary)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Barcha mahsulotlar
          </button>

          <button
            onClick={() => onNavigate('discounts')}
            style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            🔥 Chegirmalar
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate('catalog', { category: c.slug })}
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--text-main)',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
