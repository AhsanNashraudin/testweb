import { test, expect, type APIRequestContext } from '@playwright/test';
import { loadSkus, order } from './helpers';

// คีย์เดียวกับ playwright.config.ts
const auth = { Authorization: 'Bearer test-stock-key-0123456789abcdef0123456789' };

test.describe('API ระบบสต็อก (/api/v1)', () => {
  let S: Record<string, number>;
  test.beforeAll(async ({ request }) => { S = await loadSkus(request); });

  const item = async (request: APIRequestContext, sku: string) =>
    (await (await request.get('/api/v1/items', { headers: auth })).json()).data.find((x: { sku: string }) => x.sku === sku);

  test('ไม่มีคีย์ / คีย์ผิด → 401', async ({ request }) => {
    expect((await request.get('/api/v1/orders')).status()).toBe(401);
    expect((await request.get('/api/v1/items', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(401);
    expect((await request.put('/api/v1/items', { data: { items: [{ sku: 'CW-1000', stock: 1 }] } })).status()).toBe(401);
  });

  test('ดึงคำสั่งซื้อใหม่ → อัปเดตสถานะ + เลขพัสดุ → ลูกค้าเห็นในหน้าคำสั่งซื้อ', async ({ request }) => {
    const since = new Date(Date.now() - 5000).toISOString();
    const r = await request.post('/api/orders', { data: order([{ variantId: S['PT-15 KG'], qty: 2 }], { shippingOptionId: 'pickup' }) });
    expect(r.status()).toBe(201);
    const { code, key } = await r.json();

    const list = await (await request.get(`/api/v1/orders?updatedSince=${encodeURIComponent(since)}`, { headers: auth })).json();
    const o = list.data.find((x: { code: string }) => x.code === code);
    expect(o).toMatchObject({ status: 'pending_payment', amounts: { subtotal: 2400 }, items: [{ sku: 'PT-15 KG', qty: 2, lineTotal: 2400 }] });
    expect(JSON.stringify(o)).not.toContain(key); // ไม่ส่ง accessKey ออกไป

    const p = await request.patch(`/api/v1/orders/${code}`, { headers: auth, data: { status: 'shipping', carrier: 'Kerry Express', trackingNo: 'KEX123456789', trackingUrl: 'https://th.kerryexpress.com/th/track/?track=KEX123456789' } });
    expect(p.status()).toBe(200);
    expect((await p.json()).data.shipping).toMatchObject({ carrier: 'Kerry Express', trackingNo: 'KEX123456789' });

    const html = await (await request.get(`/order/${code}?k=${key}`)).text();
    expect(html).toContain('KEX123456789');
    expect(html).toContain('กำลังจัดส่ง');

    // ข้อมูลผิด → 400 · ไม่พบ → 404
    expect((await request.patch(`/api/v1/orders/${code}`, { headers: auth, data: { status: 'lost' } })).status()).toBe(400);
    expect((await request.patch(`/api/v1/orders/${code}`, { headers: auth, data: { trackingUrl: 'javascript:alert(1)' } })).status()).toBe(400);
    expect((await request.get('/api/v1/orders/ET000000-XXXXX', { headers: auth })).status()).toBe(404);
  });

  test('ยกเลิกผ่าน API → คืนสต็อก', async ({ request }) => {
    const before = (await item(request, 'PT-15 KU')).stock;
    const { code } = await (await request.post('/api/orders', { data: order([{ variantId: S['PT-15 KU'], qty: 1 }], { shippingOptionId: 'pickup' }) })).json();
    expect((await item(request, 'PT-15 KU')).stock).toBe(before - 1);
    await request.patch(`/api/v1/orders/${code}`, { headers: auth, data: { status: 'cancelled' } });
    expect((await item(request, 'PT-15 KU')).stock).toBe(before);
  });

  test('แบ่งหน้าด้วย cursor ไม่ซ้ำไม่ตกหล่น', async ({ request }) => {
    const all = (await (await request.get('/api/v1/orders?limit=100', { headers: auth })).json()).data.map((o: { code: string }) => o.code);
    const seen: string[] = [];
    let cursor = '';
    for (let i = 0; i < 50; i++) {
      const j = await (await request.get(`/api/v1/orders?limit=1${cursor ? `&cursor=${cursor}` : ''}`, { headers: auth })).json();
      seen.push(...j.data.map((o: { code: string }) => o.code));
      if (!j.nextCursor) break;
      cursor = j.nextCursor;
    }
    expect(seen).toEqual(all);
  });

  test('ระบบสต็อกเป็น master: อัปเดตราคา/สต็อก และสร้าง SKU ใหม่ (ซ่อนจนแอดมินเปิดขาย)', async ({ request }) => {
    const orig = await item(request, 'CW-1000');
    const r = await request.put('/api/v1/items', { headers: auth, data: { items: [
      { sku: 'CW-1000', stock: 37, price: 2700 },
      { sku: 'NEW-API-1', variantName: '500 ลิตร', price: 1990, stock: 5, weightKg: 12, product: { code: 'api-test-tank', name: 'ถังทดสอบจาก API', category: 'water-tanks' } },
      { sku: 'NEW-API-2', variantName: '700 ลิตร', price: 2490, stock: 3, product: { code: 'api-test-tank' } },
      { sku: 'NEW-API-3', variantName: 'x', price: 1 }, // SKU ใหม่ไม่มี product → error เฉพาะรายการนี้
    ] } });
    expect(r.status()).toBe(207);
    expect((await r.json()).data.map((x: { result: string }) => x.result)).toEqual(['updated', 'created', 'created', 'error']);
    expect(await item(request, 'CW-1000')).toMatchObject({ stock: 37, price: 2700 });
    expect(await item(request, 'NEW-API-2')).toMatchObject({ productCode: 'api-test-tank', active: false, stock: 3 });
    expect((await request.get('/product/api-test-tank')).status()).toBe(404); // ยังไม่เปิดขาย
    // ราคาใหม่มีผลกับการคำนวณราคาหน้าร้านทันที
    const pv = await (await request.post('/api/checkout/preview', { data: { items: [{ variantId: S['CW-1000'], qty: 1 }] } })).json();
    expect(pv.subtotal).toBe(2700);
    // คืนค่าเดิมให้เทสต์อื่น
    await request.put('/api/v1/items', { headers: auth, data: { items: [{ sku: 'CW-1000', price: orig.price, stock: orig.stock }] } });
    expect((await request.put('/api/v1/items', { headers: auth, data: { items: [{ sku: 'X', stock: -1 }] } })).status()).toBe(400);
  });
  test('asOf: ส่งสต็อกจากระบบสต็อกไม่เขียนทับยอดที่เพิ่งขายหลังรอบดึงล่าสุด', async ({ request }) => {
    const orig = await item(request, 'PT-15 KG');
    const page = await (await request.get('/api/v1/orders?updatedSince=2000-01-01T00:00:00Z&limit=100', { headers: auth })).json();
    let last = page; while (last.nextCursor) last = await (await request.get(`/api/v1/orders?limit=100&cursor=${last.nextCursor}`, { headers: auth })).json();
    const asOf = last.lastCursor as string;
    expect(asOf).toMatch(/^\d+_\d+$/);
    // ลูกค้าซื้อ 3 ชิ้นหลังจากระบบสต็อกดึงไปแล้ว — ระบบสต็อกยังไม่เห็น จึงส่งยอด 50 มา
    expect((await request.post('/api/orders', { data: order([{ variantId: S['PT-15 KG'], qty: 3 }], { shippingOptionId: 'pickup', phone: '0899990001' }) })).status()).toBe(201);
    expect((await request.put('/api/v1/items', { headers: auth, data: { asOf, items: [{ sku: 'PT-15 KG', stock: 50 }] } })).status()).toBe(200);
    expect((await item(request, 'PT-15 KG')).stock).toBe(47);
    expect((await request.put('/api/v1/items', { headers: auth, data: { asOf: 'x', items: [{ sku: 'PT-15 KG', stock: 1 }] } })).status()).toBe(400);
    await request.put('/api/v1/items', { headers: auth, data: { items: [{ sku: 'PT-15 KG', stock: orig.stock }] } });
  });
});
