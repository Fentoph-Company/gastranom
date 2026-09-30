import React, { useState, useEffect } from 'react';
import { Flame, Clock, Percent, Calendar, Tag, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function DiscountsPage({ onSelectProduct, onNavigate }) {
  const [promotions, setPromotions] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscounts() {
      try {
        setLoading(true);
        const [promoRes, prodsRes] = await Promise.all([
          api.getActiveDiscounts(),
          api.getProducts({ on_sale: '1', limit: 20 })
        ]);

        if (promoRes.success) setPromotions(promoRes.discounts || []);
        if (prodsRes.success) setDiscountProducts(prodsRes.products || []);
      } catch (err) {
        console.error('Error loading discounts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDiscounts();
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fff7ed', color: '#ea580c', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          <Flame size={16} /> Maxsus Chegirmalar va Aksiya Kampaniyalari
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.75rem' }}>
          Qaynoq Chegirmalar Markazi
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
          Har kuni saralangan mahsulotlarga rejalashtirilgan eng yaxshi takliflar. Muddat tugashidan avval ulgurib qoling!
        </p>
      </div>

      {/* Active Promotion Campaigns Banners */}
      {promotions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          {promotions.map((promo) => {
            const endDate = new Date(promo.end_date);
            const now = new Date();
            const diffDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

            return (
              <div
                key={promo.id}
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#ffffff',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '220px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: '#ea580c',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        padding: '0.35rem 0.75rem'
                      }}
                    >
                      {promo.type === 'percentage' ? `-${promo.value}% CHEGIRMA` : `-${Number(promo.value).toLocaleString()} UZS`}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', color: '#fed7aa' }}>
                      <Clock size={13} />
                      <span>{diffDays} kun qoldi</span>
                    </div>
                  </div>

                  <h3 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {promo.title}
                  </h3>

                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {promo.category_name && <span>Kategoriya: <b>{promo.category_name}</b> </span>}
                    {promo.brand_name && <span>Brend: <b>{promo.brand_name}</b> </span>}
                    {promo.product_name && <span>Mahsulot: <b>{promo.product_name}</b> </span>}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Muddati: {new Date(promo.end_date).toLocaleDateString()} gacha
                  </div>

                  <button
                    onClick={() => {
                      if (promo.category_name) {
                        onNavigate('catalog', { category: promo.category_id });
                      } else {
                        onNavigate('catalog', { on_sale: '1' });
                      }
                    }}
                    style={{
                      color: '#38bdf8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Mahsulotlarni ko‘rish</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discounted Products Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Chegirmadagi barcha mahsulotlar</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Hozirda sotuvdagi {discountProducts.length} ta chegirmali mahsulot
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chegirmalar yuklanmoqda...
          </div>
        ) : discountProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            Hozircha faol chegirmali mahsulotlar mavjud emas.
          </div>
        ) : (
          <div className="product-grid">
            {discountProducts.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
