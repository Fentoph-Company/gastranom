import React, { useState, useEffect } from 'react';
import {
  X,
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
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductDetailModal({ productData, onClose, onNavigate }) {
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productData) return;
    setLoading(true);

    const identifier = productData.slug || productData.id;
    api.getProduct(identifier)
      .then((res) => {
        if (res.success && res.product) {
          setProduct(res.product);
          if (res.product.images?.length > 0) {
            setSelectedImage(res.product.images[0].image_url);
          } else {
            setSelectedImage(res.product.primary_image);
          }
          if (res.product.variants?.length > 0) {
            setSelectedVariant(res.product.variants[0]);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Fetch reviews
    const prodId = productData.id;
    if (prodId) {
      api.getProductReviews(prodId)
        .then((res) => {
          if (res.success) {
            setReviews(res.reviews || []);
            setReviewStats(res.stats || null);
          }
        })
        .catch(() => {});
    }
  }, [productData]);

  if (!productData) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : (product?.effective_price || productData.effective_price || productData.price);
  const originalPrice = product?.original_display_price || productData.original_display_price || currentPrice;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : (product?.stock_quantity ?? productData.stock_quantity);
  const isOutOfStock = currentStock <= 0;
  const wishlisted = product ? isWishlisted(product.id) : isWishlisted(productData.id);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    const success = await addToCart(product.id, selectedVariant?.id || null, quantity);
    if (success) {
      // Keep modal open or option to view cart
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, selectedVariant?.id || null, quantity);
    onClose();
    onNavigate('checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!comment.trim()) {
      showToast('Iltimos, sharh matnini kiriting.', 'warning');
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
        showToast('Sharhingiz muvaffaqiyatli qabul qilindi!');
        setComment('');
        // Refresh reviews
        const revRes = await api.getProductReviews(product.id);
        if (revRes.success) {
          setReviews(revRes.reviews || []);
          setReviewStats(revRes.stats || null);
        }
      }
    } catch (err) {
      showToast(err.message || 'Sharh qoldirishda xatolik yuz berdi.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', padding: 0 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Yuklanmoqda...
          </div>
        ) : product ? (
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {/* Left Column: Gallery */}
              <div>
                <div
                  style={{
                    width: '100%',
                    paddingTop: '85%',
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-subtle)',
                    marginBottom: '1rem'
                  }}
                >
                  <img
                    src={selectedImage || product.primary_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
                    alt={product.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {product.has_discount && (
                    <span
                      className="badge"
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}
                    >
                      -{product.discount_percent}% CHEGIRMA
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images?.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {product.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img.image_url)}
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: selectedImage === img.image_url ? '2.5px solid var(--primary)' : '1px solid var(--border-color)',
                          flexShrink: 0,
                          padding: 0
                        }}
                      >
                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Info & Purchase options */}
              <div>
                {/* Brand & Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {product.brand_name && (
                    <span className="badge badge-neutral" style={{ fontWeight: '700' }}>
                      {product.brand_name}
                    </span>
                  )}
                  <span>Kategoriya: <b>{product.category_name}</b></span>
                  <span>SKU: {selectedVariant?.sku || product.sku}</span>
                </div>

                {/* Title */}
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                  {product.name}
                </h1>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= Math.round(product.average_rating || 5) ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    {product.average_rating ? Number(product.average_rating).toFixed(1) : '5.0'}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    ({product.reviews_count || reviews.length} ta sharh)
                  </span>
                </div>

                {/* Price Display */}
                <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                      {currentPrice.toLocaleString()} so‘m
                    </span>
                    {product.has_discount && (
                      <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {originalPrice.toLocaleString()} so‘m
                      </span>
                    )}
                  </div>

                  {product.active_promotion && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontSize: '0.8rem', fontWeight: '600' }}>
                      <Clock size={14} />
                      <span>{product.active_promotion.title} muddati: {new Date(product.active_promotion.endDate).toLocaleDateString()} gacha</span>
                    </div>
                  )}
                </div>

                {/* Variant Selector if present */}
                {product.variants?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Variant / Hajmi:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: '8px',
                            border: selectedVariant?.id === v.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: selectedVariant?.id === v.id ? 'var(--primary-light)' : '#ffffff',
                            color: selectedVariant?.id === v.id ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}
                        >
                          {v.title} — {v.price.toLocaleString()} so‘m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock status */}
                <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {isOutOfStock ? (
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>● Hozirda omborda qolmagan</span>
                  ) : currentStock <= 5 ? (
                    <span style={{ color: '#d97706', fontWeight: '700' }}>● Shoshiling! Omborda atigi {currentStock} dona qoldi</span>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: '700' }}>● Sotuvda mavjud ({currentStock} dona)</span>
                  )}
                </div>

                {/* Quantity and Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {/* Quantity Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ width: '38px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <Minus size={15} />
                    </button>
                    <span style={{ width: '44px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      disabled={quantity >= currentStock}
                      style={{ width: '38px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: '160px', padding: '0.75rem', borderRadius: '10px' }}
                  >
                    <ShoppingCart size={18} />
                    <span>Savatga qo‘shish</span>
                  </button>

                  {/* Buy Now */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="btn btn-secondary"
                    style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontWeight: '700', padding: '0.75rem 1.25rem', borderRadius: '10px' }}
                  >
                    <Zap size={18} />
                    <span>Bir bosishda xarid</span>
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="btn btn-outline btn-icon"
                    style={{ width: '42px', height: '42px', borderRadius: '10px' }}
                  >
                    <Heart size={18} color={wishlisted ? '#ef4444' : 'currentColor'} fill={wishlisted ? '#ef4444' : 'none'} />
                  </button>
                </div>

                {/* Delivery Assurance */}
                <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Truck size={16} color="var(--primary)" />
                    <span>Yetkazib berish: <b>Xiva va Xorazm bo‘ylab 30 daqiqadan 2 soatgacha</b></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={16} color="var(--primary)" />
                    <span>Sifat kafolati: <b>100% yangi va sertifikatlangan mahsulot</b></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <RotateCcw size={16} color="var(--primary)" />
                    <span>Kuryer huzurida tekshirib olish imkoniyati</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Specifications Tabs */}
            <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>Mahsulot haqida ma’lumot</h3>
              <p style={{ color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                {product.description || product.short_description || 'Tavsif mavjud emas.'}
              </p>

              {/* Specifications Table */}
              {product.specifications?.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>Xususiyatlari</h4>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                    {product.specifications.map((spec, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          padding: '0.65rem 1rem',
                          backgroundColor: i % 2 === 0 ? 'var(--bg-subtle)' : '#ffffff',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span style={{ width: '40%', color: 'var(--text-muted)', fontWeight: '500' }}>{spec.key}</span>
                        <span style={{ width: '60%', fontWeight: '600' }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Reviews Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Xaridorlar sharhlari ({reviews.length})</h3>
                </div>

                {/* Write Review Form */}
                <form onSubmit={handleReviewSubmit} style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.6rem' }}>Sharh qoldirish</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Baholang:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setRating(s)}
                          style={{ padding: '2px', cursor: 'pointer' }}
                        >
                          <Star size={20} fill={s <= rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={user ? "Mahsulot haqida fikringizni yozing..." : "Sharh qoldirish uchun avval tizimga kiring..."}
                      className="form-control"
                      disabled={!user}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview || !user}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={14} />
                    <span>{submittingReview ? 'Yuborilmoqda...' : 'Sharhni yuborish'}</span>
                  </button>
                </form>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bu mahsulotga birinchi bo‘lib sharh qoldiring!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map((rev) => (
                      <div key={rev.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                              <User size={16} />
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{rev.user_name || 'Mijoz'}</span>
                            {rev.is_verified_purchase === 1 && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                <CheckCircle size={10} /> Tasdiqlangan xarid
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: '0.4rem' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} fill={s <= rev.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                          ))}
                        </div>

                        <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
