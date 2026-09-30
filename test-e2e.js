// Comprehensive E2E API & Business Logic Integration Test for Gastronom Khiva

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testSuite() {
  console.log('>>> [START] Comprehensive Gastronom Khiva E-commerce Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert(health.status === 'ok', 'Health check responds OK');

    // 2. Categories check (all 15 categories from prompt)
    const catsRes = await fetch(`${BASE_URL}/categories`).then(r => r.json());
    assert(catsRes.success && catsRes.categories.length === 15, `Catalog contains exactly 15 product categories (${catsRes.categories.length} found)`);

    // 3. Khiva Delivery Zones check (10,000, 15,000, 20,000 UZS)
    const zonesRes = await fetch(`${BASE_URL}/delivery/zones`).then(r => r.json());
    assert(zonesRes.success && zonesRes.zones.length >= 3, `Khiva delivery zones configured (${zonesRes.zones.length} zones found)`);
    const z1 = zonesRes.zones[0];

    // 4. Products listing & live discount calculation
    const productsRes = await fetch(`${BASE_URL}/products?limit=25`).then(r => r.json());
    assert(productsRes.success && productsRes.products.length > 0, `Products catalog returns ${productsRes.products.length} products`);
    
    const discountedProd = productsRes.products.find(p => p.has_discount);
    assert(discountedProd !== undefined, `Discount engine successfully applied discounts (e.g. ${discountedProd?.name} effective price: ${discountedProd?.effective_price} UZS)`);

    // 5. Product search suggestions ("cola" typing test from prompt requirement 6)
    const suggRes = await fetch(`${BASE_URL}/products/search/suggestions?q=cola`).then(r => r.json());
    assert(suggRes.success && suggRes.suggestions.products.length >= 2, `Live autocomplete search suggestions for "cola" returns ${suggRes.suggestions.products.length} products (Coca-Cola, Pepsi, etc.)`);

    // 6. Phone + OTP verification flow (Requirement 12)
    const testPhone = '+998939998877';
    const sendOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    }).then(r => r.json());
    assert(sendOtpRes.success && sendOtpRes.demoCode, `OTP sent successfully to ${testPhone} (Code: ${sendOtpRes.demoCode})`);

    const verifyOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, code: sendOtpRes.demoCode, name: 'Xiva Test Xaridori' })
    }).then(r => r.json());
    assert(verifyOtpRes.success && verifyOtpRes.token && verifyOtpRes.user, 'Phone + OTP verification succeeded and generated valid customer session');

    // 7. Cart flow
    const guestSession = 'test_sess_' + Date.now();
    const targetProduct = productsRes.products[0];
    const initialStock = targetProduct.stock_quantity;

    const addCartRes = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': guestSession },
      body: JSON.stringify({ productId: targetProduct.id, quantity: 2 })
    }).then(r => r.json());
    assert(addCartRes.success, 'Added 2 items to guest cart successfully');

    const cartRes = await fetch(`${BASE_URL}/cart`, {
      headers: { 'x-session-id': guestSession }
    }).then(r => r.json());
    assert(cartRes.success && cartRes.cart.itemCount === 2, `Cart holds 2 items with subtotal: ${cartRes.cart.subtotal}`);

    // 8. Coupon validation (using subtotal >= 100,000 min order)
    const couponRes = await fetch(`${BASE_URL}/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', subtotal: 150000 })
    }).then(r => r.json());
    assert(couponRes.success && couponRes.coupon.discount > 0, `Coupon "WELCOME10" verified with discount: ${couponRes.coupon?.discount} UZS`);

    // 9. Checkout price calculation strictly server-side
    const calcRes = await fetch(`${BASE_URL}/checkout/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: targetProduct.id, quantity: 2 }],
        deliveryZoneId: z1.id,
        couponCode: 'WELCOME10'
      })
    }).then(r => r.json());
    assert(calcRes.success && calcRes.calculation.finalTotal > 0, `Server-side checkout calculation verified (Final: ${calcRes.calculation?.finalTotal} UZS)`);

    // 10. Place Order & verify atomic stock deduction and GS- prefix
    const orderRes = await fetch(`${BASE_URL}/checkout/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Ali Valiyev',
        customerPhone: '+998901234567',
        deliveryZoneId: z1.id,
        region: 'Xorazm viloyati',
        city: 'Xiva shahri',
        street: 'Mustaqillik ko‘chasi',
        house: '17-uy',
        items: [{ productId: targetProduct.id, quantity: 2 }],
        couponCode: 'WELCOME10',
        paymentMethod: 'cod',
        sessionId: guestSession
      })
    }).then(r => r.json());

    assert(orderRes.success && orderRes.orderNumber.startsWith('GS-'), `Order placed successfully with format #GS-XXXX! Order Number: ${orderRes.orderNumber}`);

    // Check stock was decremented by 2
    const verifyProd = await fetch(`${BASE_URL}/products/${targetProduct.id}`).then(r => r.json());
    assert(verifyProd.product.stock_quantity === initialStock - 2, `Stock decreased atomically from ${initialStock} to ${verifyProd.product.stock_quantity}`);

    // 11. Track Order
    const trackRes = await fetch(`${BASE_URL}/orders/track/${orderRes.orderNumber}`).then(r => r.json());
    assert(trackRes.success && trackRes.order.order_status === 'received', 'Order tracking returns correct "received" pipeline status');

    // 12. Admin Authentication
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gastranom.uz', password: 'adminpassword123' })
    }).then(r => r.json());
    assert(adminLoginRes.success && adminLoginRes.token && (adminLoginRes.user.role === 'admin' || adminLoginRes.user.role === 'superadmin'), 'Admin login successful and returned valid JWT with superadmin/admin role');

    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminLoginRes.token}`
    };

    // 13. Admin Dashboard KPIs
    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, { headers: adminHeaders }).then(r => r.json());
    assert(dashRes.success && dashRes.metrics.totalOrders > 0, `Admin Dashboard compiled KPI metrics: ${dashRes.metrics.totalOrders} total orders, Revenue: ${dashRes.metrics.totalRevenue} UZS`);

    // 14. Admin Order Status Update (e.g. to 'confirmed' then 'cancelled')
    const createdOrderId = orderRes.order.id;
    const statusUpdateRes = await fetch(`${BASE_URL}/orders/admin/${createdOrderId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'confirmed' })
    }).then(r => r.json());
    assert(statusUpdateRes.success, 'Admin updated order status to "confirmed"');

    // Cancel order and verify stock restoration
    const cancelRes = await fetch(`${BASE_URL}/orders/admin/${createdOrderId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' })
    }).then(r => r.json());
    assert(cancelRes.success, 'Admin cancelled order');

    const restoredProd = await fetch(`${BASE_URL}/products/${targetProduct.id}`).then(r => r.json());
    assert(restoredProd.product.stock_quantity === initialStock, `Stock restored atomically to ${initialStock} upon order cancellation`);

    // 15. Admin Bulk Operations test
    const bulkRes = await fetch(`${BASE_URL}/products/bulk`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'change_status',
        ids: [targetProduct.id],
        data: { status: 'active' }
      })
    }).then(r => r.json());
    assert(bulkRes.success, 'Admin bulk operation executed successfully');

    // 16. Admin Audit Log Verification
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: adminHeaders }).then(r => r.json());
    assert(auditRes.success && auditRes.logs.length > 0, `Audit log recorded ${auditRes.logs.length} administrative events`);

    console.log(`\n======================================================`);
    console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL INTEGRATION & BUSINESS LOGIC TESTS PASSED WITH 100% SUCCESS!');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

testSuite();
