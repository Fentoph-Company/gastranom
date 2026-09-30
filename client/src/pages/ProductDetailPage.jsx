import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Plus,
  Minus,
  Clock,
  Send,
  User,
  ChevronRight,
  Share2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductDetailPage({ slug, onNavigate }) {
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review submission state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');

    api.getProduct(slug)
      .then((res) => {
        if (res.success && res.product) {
          const prod = res.product;
          setProduct(prod);
          if (prod.images?.length > 0) {
            setSelectedImage(prod.images[0].image_url);
          } else {
            setSelectedImage(prod.primary_image);
          }
          if (prod.variants?.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          // Dynamic SEO meta tags & Title
          document.title = `${prod.name} | Gastronom — Xiva`;

          // Inject or update JSON-LD Structured Data
          const structuredData = {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: prod.name,
            image: prod.primary_image,
            description: prod.description || prod.short_description,
            sku: prod.sku,
            brand: {
              '@type': 'Brand',
              name: prod.brand_name || 'Gastronom'
            },
            offers: {
              '@type': 'Offer',
              url: `https://gastronom.uz/products/${prod.slug}`,
              priceCurrency: 'UZS',
              price: prod.effective_price || prod.price,
              availability: prod.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition'
            }
          };

          let scriptEl = document.getElementById('product-jsonld');
          if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.id = 'product-jsonld';
            scriptEl.type = 'application/ld+json';
            document.head.appendChild(scriptEl);
          }
          scriptEl.text = JSON.stringify(structuredData);

          // Fetch reviews
          api.getProductReviews(prod.id)
            .then((rRes) => {
              if (rRes.success) {
                setReviews(rRes.reviews || []);
                setReviewStats(rRes.stats || null);
              }
            })
            .catch(() => {});
        } else {
          setError('Mahsulot topilmadi.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Mahsulotni yuklab bo‘lmadi.');
      })
      .finally(() => setLoading(false));

    return () => {
      document.title = 'Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha.';
      const s = document.getElementById('product-jsonld');
      if (s) s.remove();
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Mahsulot ma’lumotlari yuklanmoqda...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h2>Kechirasiz, mahsulot topilmadi</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button onClick={() => onNavigate('catalog')} className="btn btn-primary">
          Katalogga qaytish
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : (product.effective_price || product.price);
  const originalPrice = product.original_display_price || currentPrice;
  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= (product.low_stock_threshold || 5);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    const success = await addToCart(product.id, selectedVariant?.id || null, quantity);
    if (success) {
      showToast(`${product.name} savatga qo‘shildi!`);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, selectedVariant?.id || null, quantity);
    onNavigate('checkout');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!comment.trim()) {
      showToast('Fikr matnini kiriting.', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitReview({
        productId: product.id,
        rating,
        comment: comment.trim()
      });

      if (res.success) {
        showToast('Fikringiz uchun rahmat! Sharh qabul qilindi.');
        setComment('');
        const updated = await api.getProductReviews(product.id);
        if (updated.success) {
          setReviews(updated.reviews || []);
          setReviewStats(updated.stats || null);
        }
      }
    } catch (err) {
      showToast(err.message || 'Sharh yuborib bo‘lmadi.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1.25rem 4rem' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('home')} style={{ color: 'var(--text-muted)' }}>Bosh sahifa</button>
        <ChevronRight size={14} />
        <button onClick={() => onNavigate('catalog')} style={{ color: 'var(--text-muted)' }}>Katalog</button>
        {product.category_name && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => onNavigate('catalog', { category: product.category_slug })} style={{ color: 'var(--text-muted)' }}>
              {product.category_name}
            </button>
          </>
        )}
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '2.5rem', marginBottom: '3.5rem' }}>
        {/* Gallery */}
        <div>
          <div
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              aspectRatio: '1',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem'
            }}
          >
            <img
              src={selectedImage || product.primary_image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
            />
            {hasDiscount && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                }}
              >
                -{discountPercent}%
              </div>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Heart size={20} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : 'var(--text-muted)'} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: selectedImage === img.image_url ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    padding: '4px',
                    backgroundColor: '#fff',
                    flexShrink: 0
                  }}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Buying */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            {product.brand_name && (
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {product.brand_name}
              </span>
            )}
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: '1.3', marginTop: '0.25rem', color: 'var(--text-main)' }}>
              {product.name}
            </h1>
          </div>

          {/* Rating & SKU bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700' }}>
              <Star size={15} fill="#f59e0b" color="#f59e0b" />
              <span>{product.average_rating ? Number(product.average_rating).toFixed(1) : '5.0'}</span>
              <span style={{ color: '#92400e', fontWeight: '500' }}>({product.reviews_count || reviews.length} ta sharh)</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>SKU: <b>{product.sku}</b></span>
            {product.barcode && <span style={{ color: 'var(--text-muted)' }}>Shtrix-kod: <b>{product.barcode}</b></span>}
          </div>

          {/* Price display according to prompt: Old price -> New price -> % discount */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-main)' }}>
                {currentPrice.toLocaleString()} so‘m
              </span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {originalPrice.toLocaleString()} so‘m
                  </span>
                  <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '800', fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    -{discountPercent}%
                  </span>
                </>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                / 1 {product.unit || 'dona'}
              </span>
            </div>

            {/* Stock status indicator */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              {isOutOfStock ? (
                <span style={{ color: '#dc2626', fontWeight: '700' }}>✕ Hozirda omborda tugagan</span>
              ) : isLowStock ? (
                <span style={{ color: '#ea580c', fontWeight: '700', backgroundColor: '#ffedd5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  ● Kam qoldi ({currentStock} {product.unit || 'dona'} qoldi)
                </span>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: '700' }}>
                  ✓ Omborda mavjud ({currentStock} {product.unit || 'dona'})
                </span>
              )}
            </div>
          </div>

          {/* Variants switcher if available */}
          {product.variants?.length > 0 && (
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                Variantni tanlang:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`badge ${selectedVariant?.id === v.id ? 'badge-primary' : 'badge-neutral'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    {v.title} — {v.price.toLocaleString()} so‘m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity stepper & Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-subtle)' }}
              >
                <Minus size={16} />
              </button>
              <span style={{ width: '50px', textAlign: 'center', fontWeight: '700', fontSize: '1rem' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock || 50, q + 1))}
                style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-subtle)' }}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="btn btn-primary btn-lg"
              style={{ flex: 1, borderRadius: '14px', minWidth: '180px' }}
            >
              <ShoppingCart size={18} />
              <span>{isOutOfStock ? 'Tugagan' : 'Savatga qo‘shish'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="btn btn-secondary btn-lg"
              style={{ borderRadius: '14px' }}
            >
              <Zap size={18} />
              <span>Hozir xarid</span>
            </button>
          </div>

          {/* Delivery & Assurance Perks */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Truck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <b>Xiva bo‘ylab tezkor yetkazish</b>
                <div style={{ color: 'var(--text-muted)' }}>20-30 daqiqada uyingizgacha</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Clock size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <b>24/7 Kechayu-kunduz</b>
                <div style={{ color: 'var(--text-muted)' }}>Istalgan vaqtda do‘konimiz ochiq</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications Tabs */}
      <div className="card" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1rem' }}>Tavsif va xususiyatlar</h3>
        <p style={{ lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          {product.description || 'Ushbu mahsulot uchun qo‘shimcha tavsif kiritilmagan.'}
        </p>

        {product.specifications && (
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>Texnik ma’lumotlar:</h4>
            <div style={{ maxWidth: '600px', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              {(() => {
                try {
                  const specs = typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications;
                  if (Array.isArray(specs)) {
                    return specs.map((sp, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', backgroundColor: idx % 2 === 0 ? 'var(--bg-subtle)' : '#fff', borderBottom: idx < specs.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{sp.key}</span>
                        <span style={{ fontWeight: '600' }}>{sp.value}</span>
                      </div>
                    ));
                  }
                } catch (e) {}
                return null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Verified Reviews Section */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1.5rem' }}>
          Xaridorlar fikrlari ({reviews.length})
        </h3>

        {/* Submit review */}
        <form onSubmit={handleSubmitReview} style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '14px', marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>O‘z fikringizni qoldiring</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ padding: '4px', cursor: 'pointer' }}
              >
                <Star size={22} fill={star <= rating ? '#f59e0b' : 'none'} color={star <= rating ? '#f59e0b' : '#cbd5e1'} />
              </button>
            ))}
          </div>
          <textarea
            required
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Mahsulot sifati va xarid tajribangiz haqida yozing..."
            className="form-control"
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
          <button type="submit" disabled={submittingReview} className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
            <Send size={15} />
            <span>{submittingReview ? 'Yuborilmoqda...' : 'Sharhni yuborish'}</span>
          </button>
        </form>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ushbu mahsulotga hali sharhlar qoldirilmagan. Birinchi bo‘lib o‘z fikringizni bildiring!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{rev.user_name || 'Xaridor'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.created_at?.slice(0, 10)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= rev.rating ? '#f59e0b' : 'none'} color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0.25rem 0' }}>
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
