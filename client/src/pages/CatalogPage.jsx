import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function CatalogPage({ initialParams = {}, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category || '');
  const [search, setSearch] = useState(initialParams.search || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(initialParams.on_sale === '1');
  const [sort, setSort] = useState(initialParams.sort || 'recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync when initialParams change (e.g. from header search or category click)
  useEffect(() => {
    if (initialParams.category !== undefined) setSelectedCategory(initialParams.category);
    if (initialParams.search !== undefined) setSearch(initialParams.search);
    if (initialParams.sort !== undefined) setSort(initialParams.sort);
    if (initialParams.on_sale !== undefined) setOnSaleOnly(initialParams.on_sale === '1');
    setCurrentPage(1);
  }, [initialParams]);

  // Load categories
  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success) setCategories(res.categories || []);
    }).catch(() => {});
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 12,
          sort
        };

        if (selectedCategory) params.category = selectedCategory;
        if (search.trim()) params.search = search.trim();
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (inStockOnly) params.in_stock = '1';
        if (onSaleOnly) params.on_sale = '1';

        const res = await api.getProducts(params);
        if (res.success) {
          setProducts(res.products || []);
          setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Error fetching catalog products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, search, minPrice, maxPrice, inStockOnly, onSaleOnly, sort, currentPage]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSort('recommended');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || search || minPrice || maxPrice || inStockOnly || onSaleOnly;

  return (
    <div className="container" style={{ padding: '1.5rem 1.25rem' }}>
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Mahsulotlar Katalogi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {pagination.total} ta mahsulot topildi
            {search && <span> ("{search}" bo‘yicha)</span>}
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="btn btn-outline"
            style={{ display: 'flex', smDisplay: 'none', gap: '0.4rem', borderRadius: '10px' }}
          >
            <Filter size={16} /> Filtrlar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'none', mdDisplay: 'inline' }}>Saralash:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <option value="recommended">Tavsiya etilgan</option>
              <option value="newest">Yangi qo‘shilgan</option>
              <option value="price_asc">Narx: arzonroq</option>
              <option value="price_desc">Narx: qimmatroq</option>
              <option value="popular">Eng ko‘p sotilgan</option>
              <option value="discount">Katta chegirma</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Sidebar Filters */}
        <aside
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            position: 'sticky',
            top: '88px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SlidersHorizontal size={18} color="var(--primary)" /> Filtrlar
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: '600' }}
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              Kategoriya
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '200px', overflowY: 'auto' }}>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                style={{
                  textAlign: 'left',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: !selectedCategory ? '700' : '400',
                  color: !selectedCategory ? 'var(--primary)' : 'var(--text-main)',
                  backgroundColor: !selectedCategory ? 'var(--primary-light)' : 'transparent'
                }}
              >
                Barcha kategoriyalar
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.slug);
                    setCurrentPage(1);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: selectedCategory === c.slug ? '700' : '400',
                    color: selectedCategory === c.slug ? 'var(--primary)' : 'var(--text-main)',
                    backgroundColor: selectedCategory === c.slug ? 'var(--primary-light)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{c.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.products_count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              Narx oralig‘i (so‘m)
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Dan"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input
                type="number"
                placeholder="Gacha"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Checkbox Filters */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span>Faqat sotuvda mavjudlari</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => {
                  setOnSaleOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span style={{ color: '#ea580c', fontWeight: '600' }}>🔥 Chegirmadagi mahsulotlar</span>
            </label>
          </div>
        </aside>

        {/* Right Products Container */}
        <div>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Mahsulotlar yuklanmoqda...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Search size={28} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Mahsulot topilmadi</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Tanlangan filtrlar yoki qidiruv so‘rovi bo‘yicha hech qanday mahsulot mavjud emas.
              </p>
              <button onClick={resetFilters} className="btn btn-primary">
                Barcha filtrlarni tozalash
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="btn btn-secondary btn-icon"
                    style={{ opacity: currentPage <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? 'btn btn-primary btn-icon' : 'btn btn-secondary btn-icon'}
                      style={{ fontWeight: '700', fontSize: '0.875rem' }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    className="btn btn-secondary btn-icon"
                    style={{ opacity: currentPage >= pagination.totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
