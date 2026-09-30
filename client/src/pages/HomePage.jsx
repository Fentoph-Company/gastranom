import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Flame,
  Percent,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function HomePage({ onNavigate, onSelectProduct }) {
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [bannersRes, catsRes, featuredRes, discountRes, popularRes, activeDiscRes] = await Promise.all([
          api.getBanners(),
          api.getCategories(),
          api.getProducts({ featured: '1', limit: 8 }),
          api.getProducts({ on_sale: '1', limit: 8 }),
          api.getProducts({ popular: '1', limit: 8 }),
          api.getActiveDiscounts()
        ]);

        if (bannersRes.success) setBanners(bannersRes.banners || []);
        if (catsRes.success) setCategories(catsRes.categories || []);
        if (featuredRes.success) setFeaturedProducts(featuredRes.products || []);
        if (discountRes.success) setDiscountProducts(discountRes.products || []);
        if (popularRes.success) setPopularProducts(popularRes.products || []);
        if (activeDiscRes.success) setActiveDiscounts(activeDiscRes.discounts || []);
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Banner autoplay
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '2rem' }}>
      {/* 1. Hero Promotional Banner Carousel */}
      {banners.length > 0 && (
        <section className="container" style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              minHeight: '380px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {banners.map((b, idx) => (
              <div
                key={b.id}
                style={{
                  display: idx === currentBannerIdx ? 'block' : 'none',
                  position: 'relative',
                  minHeight: '380px',
                  backgroundColor: '#0f172a'
                }}
              >
                <img
                  src={b.image_url}
                  alt={b.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.55
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(15, 23, 42, 0.4) 65%, transparent 100%)'
                  }}
                />

                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '3.5rem 3rem',
                    maxWidth: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    color: '#ffffff'
                  }}
                >
                  {b.badge_text && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        alignSelf: 'flex-start',
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.85rem'
                      }}
                    >
                      <Sparkles size={13} /> {b.badge_text}
                    </span>
                  )}

                  <h2 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>
                    {b.title}
                  </h2>

                  {b.subtitle && (
                    <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.5' }}>
                      {b.subtitle}
                    </p>
                  )}

                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => onNavigate('catalog')}
                      className="btn btn-primary btn-lg"
                      style={{ borderRadius: '14px', boxShadow: '0 8px 20px rgba(5, 150, 105, 0.4)' }}
                    >
                      <span>Xaridni boshlash</span>
                      <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={() => onNavigate('discounts')}
                      className="btn btn-secondary btn-lg"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', backdropFilter: 'blur(8px)', borderRadius: '14px' }}
                    >
                      Chegirmalar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Carousel navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setCurrentBannerIdx((prev) => (prev + 1) % banners.length)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5
                  }}
                >
                  <ChevronRight size={22} />
                </button>

                {/* Dots indicator */}
                <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 5 }}>
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBannerIdx(i)}
                      style={{
                        width: i === currentBannerIdx ? '28px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: i === currentBannerIdx ? '#10b981' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.3s'
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 2. Store Advantages Bar */}
      <section className="container">
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 2rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>24/7 Tezkor yetkazish</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Xiva va Xorazm bo‘ylab kechayu-kunduz kuryer</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>100% Halol va Tabiiy</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sertifikatlangan toza oziq-ovqat</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Qaynoq chegirmalar</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Har kuni yangi aksiyalar</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Sifat kafolati</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tekshirib olish imkoni</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tanlov imkoniyati
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Ommabop Kategoriyalar</h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Barchasi</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('catalog', { category: cat.slug })}
              className="card"
              style={{
                cursor: 'pointer',
                padding: '1.25rem 1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>
                  {cat.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {cat.products_count || 0} xil mahsulot
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Scheduled Flash Deals Section */}
      {discountProducts.length > 0 && (
        <section className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1.5px solid #fed7aa',
              borderRadius: '20px',
              padding: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#9a3412' }}>Qaynoq Chegirmalar</h2>
                  <p style={{ fontSize: '0.85rem', color: '#c2410c' }}>Maxsus muddatli aksiyadagi mahsulotlar</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('discounts')}
                className="btn btn-secondary"
                style={{ backgroundColor: '#ffffff', color: '#ea580c', fontWeight: '700' }}
              >
                <span>Barcha aksiyalar</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="product-grid">
              {discountProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Featured Products Row */}
      {featuredProducts.length > 0 && (
        <section className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Gastranom Tavsiyasi
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Tanlangan Mahsulotlar</h2>
            </div>
            <button
              onClick={() => onNavigate('catalog', { featured: '1' })}
              style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Barchasini ko‘rish</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="product-grid">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} onSelect={onSelectProduct} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Popular Products Row */}
      {popularProducts.length > 0 && (
        <section className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Xaridorlar sevimlisi
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Eng Ko‘p Sotilganlar</h2>
            </div>
            <button
              onClick={() => onNavigate('catalog', { sort: 'popular' })}
              style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Barchasini ko‘rish</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="product-grid">
            {popularProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} onSelect={onSelectProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
