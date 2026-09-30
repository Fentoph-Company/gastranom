import React from 'react';
import { Heart, ShoppingCart, Star, Check, AlertCircle, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProductCard({ product, onSelect }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();

  if (!product) return null;

  const wishlisted = isWishlisted(product.id);

  // Check if item is already in cart
  const cartItem = cart.items.find((item) => item.productId === product.id && !item.variantId);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= (product.low_stock_threshold || 5);

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    onSelect(product);
  };

  const unitLabel = product.unit || 'dona';

  return (
    <div
      onClick={handleCardClick}
      className="card"
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Image & Badges */}
      <div style={{ position: 'relative', paddingTop: '80%', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
        <img
          src={product.primary_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
          alt={product.name}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {product.has_discount && (
            <span
              className="badge"
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                fontWeight: '800',
                boxShadow: '0 2px 6px rgba(220,38,38,0.4)'
              }}
            >
              -{product.discount_percent}%
            </span>
          )}
          {isLowStock && (
            <span
              className="badge"
              style={{
                backgroundColor: '#f59e0b',
                color: '#fff',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: '0 2px 6px rgba(245,158,11,0.4)'
              }}
            >
              <AlertTriangle size={11} /> {t('low_stock')}
            </span>
          )}
          {product.is_new === 1 && !product.has_discount && (
            <span className="badge badge-primary">{t('new_badge')}</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.2s'
          }}
        >
          <Heart size={18} color={wishlisted ? '#ef4444' : '#64748b'} fill={wishlisted ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* Body info */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Category & Rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{product.category_name || 'Gastronom'}</span>
            {product.average_rating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontWeight: '700' }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {Number(product.average_rating).toFixed(1)}
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              lineHeight: '1.35',
              height: '2.7em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '0.4rem'
            }}
          >
            {product.name}
          </h3>

          {/* Stock indication */}
          {isLowStock && (
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600', marginBottom: '0.4rem' }}>
              Faqat {product.stock_quantity} {unitLabel} {t('left')}!
            </div>
          )}
          {isOutOfStock && (
            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', marginBottom: '0.4rem' }}>
              {t('out_of_stock')}
            </div>
          )}
        </div>

        {/* Price & Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {(product.effective_price || product.price).toLocaleString()} {t('price_som')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                / {unitLabel}
              </span>
            </div>
            {product.has_discount && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {product.original_display_price.toLocaleString()} {t('price_som')}
              </div>
            )}
          </div>

          {/* Add to Cart or Stepper */}
          {isOutOfStock ? (
            <button disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              {t('out_of_stock')}
            </button>
          ) : inCartQty > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => updateQuantity(cartItem.id, inCartQty - 1)}
                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <Minus size={13} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', padding: '0 6px' }}>{inCartQty}</span>
              <button
                onClick={() => updateQuantity(cartItem.id, inCartQty + 1)}
                disabled={inCartQty >= product.stock_quantity}
                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: inCartQty >= product.stock_quantity ? 0.5 : 1 }}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product.id, null, 1);
              }}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: '8px', padding: '0.45rem 0.75rem' }}
              title="Savatga qo‘shish"
            >
              <ShoppingCart size={15} />
              <span>{t('add_to_cart')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
