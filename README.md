# 🛒 Gastronom — Khiva, Uzbekistan

**"Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha."**

A complete, production-ready fullstack online grocery store and administrative platform built specifically for customers in **Khiva, Khorezm, Uzbekistan**.

---

## 🏢 Business Information

* **Business Name**: Gastronom
* **Location**: Khiva, Khorezm, Uzbekistan
* **Physical Store Address**: Mustaqillik Street 17, Khiva (*Mustaqillik ko‘chasi, 17, Xiva*)
* **Business Type**: Grocery / Supermarket
* **Working Hours**: **24/7 (Kechayu-kunduz)**
* **Phone**: +998 (91) 420-17-17 / +998 (62) 375-17-17
* **Primary Language**: Uzbek (O‘zbekcha), with seamless Russian (Русский) and English support

---

## 🌟 Key Features

### 🛍️ Customer Experience
- **Hero & Branding**: Communicates *"Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha."* with 24/7 delivery assurance in Khiva.
- **15 Category Taxonomy**:
  1. Non va non mahsulotlari
  2. Sut mahsulotlari
  3. Go‘sht mahsulotlari
  4. Kolbasa va yarim tayyor mahsulotlar
  5. Ichimliklar
  6. Shirinliklar
  7. Meva va sabzavotlar
  8. Oziq-ovqat
  9. Gigiyena
  10. Maishiy kimyo
  11. Bolalar mahsulotlari
  12. Konservalar
  13. Choy va qahva
  14. Muzlatilgan mahsulotlar
  15. Boshqa
- **Search System**: Fast search in Uzbek, Russian, English; partial matches; product names, brand names, SKU, and barcode. Suggestions autocomplete dropdown (e.g. typing `"cola"` immediately yields *Coca-Cola 1.5L*, *Coca-Cola 1L*, *Pepsi Cola 1.5L*, *Cola 2L*).
- **Product Details & SEO Pages**: Dedicated SEO URLs (`/products/:slug`), breadcrumbs, multi-image gallery, dynamic variant switcher (weight, volume, pack), specifications table, verified customer reviews, and JSON-LD structured data (`@type: Product`, `@type: Organization`).
- **Product Units & Pricing**: Supports `dona`, `kg`, `g`, `litr`, `ml`, `qadoq`, `blok`. Displays clear discount formatting: ~~Old price~~ **New price** **-% discount**. Shows *"Kam qoldi"* when stock drops to or below threshold.
- **Customer Authentication**: Phone number + OTP verification flow (`/api/auth/send-otp` & `/api/auth/verify-otp`) alongside email/password and demo quick-login.
- **Shopping Cart**: Real-time stock validation, persistent items, slide-over drawer, quantity steppers, and free delivery progress meter.
- **Khiva Delivery Zones**:
  - **0–2 km** (Xiva markazi / Ichan Qal'a): 10,000 UZS (20–30 mins)
  - **2–5 km** (Xiva shahri hududi): 15,000 UZS (30–45 mins)
  - **5–10 km** (Xiva shahar atrofi): 20,000 UZS (45–60 mins)
  - **Store Pickup (Mustaqillik 17)**: 0 UZS / Free (Available 24/7)
- **Payment Architecture**:
  - Cash on delivery (Naqd pul bilan)
  - Card on delivery (Karta orqali kuryerga)
  - Online payment (Payme / Click) with real backend status check (clearly communicates when provider is in configuration mode)
- **Order Tracking Pipeline**: Interactive 6-step visual stepper:
  ```
  Buyurtma #GS-10482
  ✓ Qabul qilindi
  ✓ Tasdiqlandi
  ● Tayyorlanmoqda
  ○ Yetkazilmoqda
  ○ Yetkazildi
  ```

---

### 🛡️ Administrative Control Panel

- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Full unrestricted control
  - **Manager**: Products, orders, discounts, customers
  - **Operator**: Orders and customers
  - **Warehouse**: Inventory, stock control, and catalog
  - **Delivery**: Assigned delivery orders
- **Admin Dashboard**: Real-time KPIs (Today's orders, revenue, pending orders, products count, low stock alert counter, active discounts, top products, recent orders feed).
- **Product Catalog Management**: Full CRUD, image gallery, variants, barcode, SKU, units, min/max order quantity, flags (Bestseller, New, Featured), and **Bulk Operations** (select multiple items → change category, change status, adjust price %, adjust stock, delete).
- **Category & Brand Management**: Add, edit, reorder, and toggle active status.
- **Inventory Engine**: Atomic stock reduction on placement, atomic restoration on cancellation.
- **Discount Engine**: Time-scheduled percentage and fixed discounts, category-wide campaigns, and promotional coupon codes with usage limits, date ranges, and per-user limits.
- **Telegram Notification Integration**: Dispatches formatted Telegram messages to admin channel/bot on order placement:
  ```
  🛒 Yangi buyurtma

  Order:
  #GS-10482

  Customer:
  Ali Valiyev

  Phone:
  +998 XX XXX XX XX

  Products:
  * Coca-Cola 1L × 2
  * Non × 3

  Total:
  87,000 UZS

  Delivery:
  15,000 UZS

  Grand Total:
  102,000 UZS

  Address:
  Khiva, ...
  ```
- **Security Audit Logs**: Tracks every admin action (admin name, entity, action, old value, new value, timestamp).
- **Central Store Settings**: Khiva address, phone numbers, 24/7 working hours, delivery zone tariffs, Telegram bot configuration, and payment gateway toggles.

---

## 🔐 Credentials & Quick Demo Access

| Role | Email / Phone | Password / Code |
|---|---|---|
| **Super Admin** | `admin@gastranom.uz` | `adminpassword123` |
| **Manager** | `manager@gastranom.uz` | `staffpassword123` |
| **Operator** | `operator@gastranom.uz` | `staffpassword123` |
| **Warehouse** | `warehouse@gastranom.uz` | `staffpassword123` |
| **Delivery Courier** | `kuryer@gastranom.uz` | `staffpassword123` |
| **Customer (Email)** | `jasur@example.uz` | `customerpassword123` |
| **Customer (Phone/OTP)** | Any Uzbek phone (e.g. `+998901234567`) | Instant code generated & auto-filled |

---

## 🚀 Getting Started

### 1. Requirements
- Node.js v18+ (tested on Node v24)
- npm v9+

### 2. Quick Launch
Run both the Backend REST API and Frontend Vite client concurrently:
```bash
npm start
```

- **Customer Storefront**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Robots.txt**: [http://localhost:5000/robots.txt](http://localhost:5000/robots.txt)
- **Sitemap.xml**: [http://localhost:5000/sitemap.xml](http://localhost:5000/sitemap.xml)

### 3. Re-seed Database
To reset the SQLite database with fresh commercial Khiva products, categories, active promotions, and sample order `#GS-10482`:
```bash
npm run seed
```

### 4. Run Automated E2E Test Suite
To execute the end-to-end integration test suite:
```bash
node test-e2e.js
```
*(Runs 22 comprehensive integration tests validating stock deductions, OTP verification, cart calculations, search suggestions, order creation, admin CRUD, and audit logs).*

---

## 🏛️ System Architecture

```
Gastranom/
├── server/                       # Backend REST API (Node.js + Express + SQLite)
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js     # SQLite connection with WAL mode & foreign keys
│   │   │   ├── schema.js         # Relational schema (tables, foreign keys, indexes, otps)
│   │   │   └── seed.js           # Khiva commercial seed data (15 categories, products, zones)
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification & RBAC authorization
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # Registration, login, phone+OTP verification
│   │   │   ├── productRoutes.js  # Catalog search, filters, autocomplete, bulk ops, CRUD
│   │   │   ├── categoryRoutes.js # 15 categories management
│   │   │   ├── cartRoutes.js     # Guest & persistent user cart with stock checks
│   │   │   ├── checkoutRoutes.js # Server-side price calculation, GS- order placement
│   │   │   ├── orderRoutes.js    # Customer orders, public tracking, admin status updates
│   │   │   ├── discountRoutes.js # Scheduled promotions & coupon engine
│   │   │   ├── reviewRoutes.js   # Product reviews & rating submission
│   │   │   ├── wishlistRoutes.js # Favorites management
│   │   │   ├── deliveryRoutes.js # Khiva delivery zones & fees
│   │   │   ├── notificationRoutes.js # In-app notifications
│   │   │   ├── adminRoutes.js    # Dashboard KPIs & audit logs
│   │   │   └── contentRoutes.js  # Settings & banners CMS
│   │   ├── services/
│   │   │   ├── discountEngine.js # Real-time scheduled discount evaluation
│   │   │   ├── inventoryEngine.js# Atomic stock deduction & restoration
│   │   │   ├── deliveryEngine.js # Khiva delivery fee calculation
│   │   │   ├── telegramService.js# Telegram order notification formatter & dispatcher
│   │   │   └── auditLogger.js    # Administrative audit logging
│   │   └── server.js             # Express application & global error handler
│   └── package.json
│
├── client/                       # Frontend SPA (React + Vite + Vanilla CSS)
│   ├── public/
│   │   ├── robots.txt            # Search engine crawling rules
│   │   └── sitemap.xml           # XML Sitemap
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # AuthModal with Phone+OTP & quick demo logins
│   │   │   ├── cart/             # CartDrawer with shipping progress meter
│   │   │   ├── layout/           # Header with autocomplete search & Footer
│   │   │   └── product/          # ProductCard & ProductDetailModal
│   │   ├── context/              # Auth, Cart, Wishlist, Toast, Language
│   │   ├── i18n/
│   │   │   └── translations.js   # Uzbek (primary), Russian, English
│   │   ├── pages/
│   │   │   ├── admin/            # AdminLayout, Dashboard, Products, Orders, Inventory,
│   │   │   │                     # Discounts, Delivery, Reviews, Customers, AuditLogs, Settings
│   │   │   ├── CatalogPage.jsx   # Multi-filter product catalog
│   │   │   ├── CheckoutPage.jsx  # 1-page checkout with Khiva zones, pickup & coupons
│   │   │   ├── ContentPages.jsx  # FAQ, Delivery Info, Terms, Privacy Policy
│   │   │   ├── CustomerProfilePage.jsx # Profile, Saved Addresses & Order History
│   │   │   ├── DiscountsPage.jsx # "Chegirmalar" active promotional campaigns
│   │   │   ├── HomePage.jsx      # Dynamic banner carousel, deals & categories
│   │   │   ├── OrderTrackingPage.jsx # Visual pipeline timeline stepper
│   │   │   └── ProductDetailPage.jsx # Full SEO product page with JSON-LD structured data
│   │   ├── services/
│   │   │   └── api.js            # Unified API client with session management
│   │   ├── App.jsx               # Application routing & layout
│   │   └── index.css             # Supermarket design system & responsive styles
│   └── package.json
│
├── test-e2e.js                   # Automated end-to-end integration test suite
├── run-all.js                    # Concurrent runner
└── package.json                  # Root runner scripts
```
#   g a s t r a n o m  
 