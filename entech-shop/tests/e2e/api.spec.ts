import { test, expect } from '@playwright/test';
import { loadSkus, order } from './helpers';

test.describe('API: ราคา ค่าส่ง และความปลอดภัยของการสั่งซื้อ', () => {
  let S: Record<string, number>;
  test.beforeAll(async ({ request }) => { S = await loadSkus(request); expect(Object.keys(S).length).toBeGreaterThanOrEqual(30); });

  const preview = (request: import('@playwright/test').APIRequestContext, data: object) => request.post('/api/checkout/preview', { data });

  test('ค่าส่งตามจังหวัด (Delivery Fee: กระบะ 2,500 / ขนส่งเอกชน 5,000) + รับเองที่โรงงาน', async ({ request }) => {
    const items = [{ variantId: S['CW-1000'], qty: 2 }];
    const fee = async (province: string) => (await (await preview(request, { items, province })).json()).shippingOptions;
    for (const p of ['สมุทรสาคร', 'กรุงเทพมหานคร', 'นนทบุรี', 'สมุทรปราการ']) expect((await fee(p))[0], p).toMatchObject({ id: expect.stringMatching(/^zone:/), fee: 2500 });
    for (const p of ['เชียงใหม่', 'ชลบุรี', 'ภูเก็ต']) expect((await fee(p))[0].fee, p).toBe(5000); // โซนสำรอง
    expect((await fee('ภูเก็ต')).map((o: { id: string }) => o.id)).toContain('pickup');
  });

  test('จังหวัดไม่ถูกต้อง → ไม่มีตัวเลือกจัดส่ง', async ({ request }) => {
    const j = await (await preview(request, { items: [{ variantId: S['PT-15 KG'], qty: 1 }], province: 'แอตแลนติส' })).json();
    expect(j.provinceError).toBeTruthy();
    expect(j.shippingOptions).toEqual([]);
  });

  test('ราคามาจาก DB เท่านั้น (ส่ง unitPrice ปลอมมาก็ไม่มีผล)', async ({ request }) => {
    const j = await (await preview(request, { items: [{ variantId: S['PT-15 KG'], qty: 2, unitPrice: 1 }] })).json();
    expect(j.subtotal).toBe(2400);
  });

  test('ราคาส่ง 5 ใบขึ้นไป ตาม Price List', async ({ request }) => {
    const sub = async (sku: string, qty: number) => (await (await preview(request, { items: [{ variantId: S[sku], qty }] })).json());
    expect((await sub('CW-1000', 4)).subtotal).toBe(4 * 2600);
    const five = await sub('CW-1000', 5);
    expect(five.subtotal).toBe(5 * 2400);
    expect(five.lines[0]).toMatchObject({ unitPrice: 2400, listPrice: 2600, bulkMinQty: 5 });
    expect((await sub('PT-1000 T', 5)).subtotal).toBe(5 * 2650);
    expect((await sub('PT-15 KU', 6)).subtotal).toBe(6 * 1100);
  });

  test('รวมรายการซ้ำ และปฏิเสธจำนวนผิดรูปแบบ', async ({ request }) => {
    const j = await (await preview(request, { items: [{ variantId: S['PT-15 KG'], qty: 2 }, { variantId: S['PT-15 KG'], qty: 3 }] })).json();
    expect(j.lines).toHaveLength(1);
    expect(j.lines[0].qty).toBe(5);
    expect(j.lines[0].unitPrice).toBe(1100); // รวมแล้วครบ 5 → ได้ราคาส่ง
    for (const qty of [0, -1, 1.5, 100, '2']) expect((await preview(request, { items: [{ variantId: S['PT-15 KG'], qty }] })).status()).toBe(400);
    expect((await request.post('/api/checkout/preview', { data: 'not json', headers: { 'content-type': 'application/json' } })).status()).toBe(400);
  });

  test('สินค้าหมด และสินค้า "สอบถามราคา" สั่งซื้อไม่ได้', async ({ request }) => {
    const j = await (await preview(request, { items: [{ variantId: S['PT-140 KU'], qty: 1 }] })).json();
    expect(j.lines[0].error).toBe('สินค้าหมด');
    expect(j.hasErrors).toBe(true);
    expect((await request.post('/api/orders', { data: order([{ variantId: S['PT-140 KU'], qty: 1 }], { shippingOptionId: 'pickup' }) })).status()).toBe(400);
    const q = await (await preview(request, { items: [{ variantId: S['AZ-550'], qty: 1 }] })).json();
    expect(q.lines[0].error).toContain('สอบถามราคา');
    expect((await request.post('/api/orders', { data: order([{ variantId: S['AZ-550'], qty: 1 }], { shippingOptionId: 'pickup' }) })).status()).toBe(400);
  });

  test('คูปอง: ยอดไม่ถึงขั้นต่ำ / ใช้ได้ / ไม่มีอยู่', async ({ request }) => {
    const small = await (await preview(request, { items: [{ variantId: S['PT-15 KG'], qty: 1 }], couponCode: 'entech500' })).json();
    expect(small.couponError).toMatch('5,000');
    const ok = await (await preview(request, { items: [{ variantId: S['CW-3000'], qty: 1 }], couponCode: ' entech500 ' })).json();
    expect(ok.discount).toBe(500);
    const bad = await (await preview(request, { items: [{ variantId: S['CW-3000'], qty: 1 }], couponCode: 'NOPE' })).json();
    expect(bad.couponError).toBeTruthy();
  });

  test('สร้างคำสั่งซื้อ: server คำนวณค่าส่ง + VAT ใหม่ ตัดสต็อก และหน้าคำสั่งซื้อต้องมี key', async ({ request }) => {
    const items = [{ variantId: S['PT-1000 T'], qty: 1 }]; // ฿2,850
    const pv = await (await preview(request, { items, province: 'ชลบุรี' })).json();
    expect(pv.pricesIncludeVat).toBe(false);
    const before = pv.lines[0].stock;
    const r = await request.post('/api/orders', { data: order(items, { province: 'ชลบุรี', shippingOptionId: pv.shippingOptions[0].id, shippingFee: 0, total: 1, vat: 0 }) });
    expect(r.status()).toBe(201);
    const { code, key } = await r.json();
    expect(code).toMatch(/^ET\d{6}-[A-Z2-9]{5}$/);
    const page = await request.get(`/order/${code}?k=${key}`);
    expect(page.status()).toBe(200);
    const html = await page.text();
    expect(html).toContain('฿550'); // VAT 7% ของ (2,850 + 5,000) = 549.5 → 550
    expect(html).toContain('฿8,400'); // 2,850 + 5,000 + 550
    expect((await request.get(`/order/${code}`)).status()).toBe(404);
    expect((await request.get(`/order/${code}?k=wrong`)).status()).toBe(404);
    const after = (await (await preview(request, { items })).json()).lines[0].stock;
    expect(after).toBe(before - 1);
  });

  test('ตรวจข้อมูลลูกค้า: เบอร์/อีเมล/ที่อยู่/รหัสไปรษณีย์/เลขภาษี', async ({ request }) => {
    const items = [{ variantId: S['PT-15 KG'], qty: 1 }];
    const zone = (await (await preview(request, { items, province: 'กรุงเทพมหานคร' })).json()).shippingOptions[0].id;
    const cases: [Record<string, unknown>, string][] = [
      [{ phone: '12345' }, 'phone'], [{ email: 'x@' }, 'email'], [{ name: 'a' }, 'name'],
      [{ shippingOptionId: zone, address: '' }, 'address'], [{ shippingOptionId: zone, postcode: '1015' }, 'postcode'],
      [{ shippingOptionId: zone, wantTax: true, taxName: 'บจก. ทดสอบ', taxAddress: '1/1 ถ.ทดสอบ', taxId: '123' }, 'taxId'], [{ shippingOptionId: zone, wantTax: true, taxId: '1234567890123' }, 'taxAddress'], [{ shippingOptionId: zone, paymentMethod: 'transfer' }, 'paymentMethod'], [{ shippingOptionId: 'zone:999' }, 'shippingOptionId'],
      [{ shippingOptionId: zone, paymentMethod: 'cash' }, 'paymentMethod'],
    ];
    for (const [extra, field] of cases) {
      const r = await request.post('/api/orders', { data: order(items, { shippingOptionId: zone, ...extra }) });
      expect(r.status(), JSON.stringify(extra)).toBe(400);
      expect(Object.keys((await r.json()).fields)).toContain(field);
    }
  });

  test('ฟอร์มว่าง → ได้ error ครบทุกช่องในครั้งเดียว', async ({ request }) => {
    const r = await request.post('/api/orders', { data: { items: [{ variantId: S['PT-15 KG'], qty: 1 }], name: '', phone: '', email: '', province: '', paymentMethod: 'promptpay' } });
    expect(r.status()).toBe(400);
    const { fields } = await r.json();
    for (const k of ['name', 'phone', 'email', 'province', 'shippingOptionId']) expect(Object.keys(fields)).toContain(k);
    const r2 = await request.post('/api/orders', { data: order([{ variantId: S['PT-15 KG'], qty: 1 }], { name: '', shippingOptionId: 'zone:2', address: '', postcode: '' }) });
    expect(Object.keys((await r2.json()).fields)).toEqual(expect.arrayContaining(['name', 'address', 'postcode']));
  });

  test('ค้นหา "ถังเก็บน้ำ 2000 ลิตร" เจอสินค้า (ไม่สนจุลภาคในชื่อตัวเลือก)', async ({ request }) => {
    const html = await (await request.get('/products?q=' + encodeURIComponent('ถังเก็บน้ำ 2000 ลิตร'))).text();
    expect(html).toContain('GRAND STONE'); // ตัวเลือก "2,000 ลิตร (CW-2000 G)"
    expect(html).toContain('noindex');
  });

  test('ตรวจสอบคำสั่งซื้อด้วยเลข + เบอร์โทร', async ({ request }) => {
    const r = await request.post('/api/orders', { data: order([{ variantId: S['PT-20 KG'], qty: 1 }], { shippingOptionId: 'pickup' }) });
    const { code, key } = await r.json();
    const ok = await request.get(`/order/lookup?code=${code.toLowerCase()}&phone=081-234-5678`, { maxRedirects: 0 });
    expect(ok.status()).toBe(307);
    expect(ok.headers().location).toContain(`/order/${code}?k=${key}`);
    const bad = await request.get(`/order/lookup?code=${code}&phone=0899999999`, { maxRedirects: 0 });
    expect(bad.status()).toBe(200);
    expect(await bad.text()).toContain('ไม่พบคำสั่งซื้อ');
  });

  test('รับเองที่โรงงาน: ไม่ต้องกรอกที่อยู่ และค่าส่ง 0', async ({ request }) => {
    const r = await request.post('/api/orders', { data: order([{ variantId: S['PT-20 KG'], qty: 1 }], { province: 'เชียงราย', shippingOptionId: 'pickup', address: '', postcode: '' }) });
    expect(r.status()).toBe(201);
  });

  test('สั่งพร้อมกันหลายคน: ไม่ขายเกินสต็อก (race condition)', async ({ request }) => {
    const items = [{ variantId: S['CW-5000 G'], qty: 1 }]; // สต็อก 4 (fixture)
    const stock = (await (await preview(request, { items })).json()).lines[0].stock;
    const res = await Promise.all(Array.from({ length: stock + 4 }, () => request.post('/api/orders', { data: order(items, { shippingOptionId: 'pickup' }) })));
    expect(res.filter((r) => r.status() === 201)).toHaveLength(stock);
    expect(res.filter((r) => r.status() === 409 || r.status() === 400)).toHaveLength(4);
    expect((await (await preview(request, { items })).json()).lines[0].stock).toBe(0);
  });

  test('ตะกร้าว่าง / สินค้าไม่มีอยู่ → 400', async ({ request }) => {
    expect((await request.post('/api/orders', { data: order([], { shippingOptionId: 'pickup' }) })).status()).toBe(400);
    expect((await request.post('/api/orders', { data: order([{ variantId: 99999, qty: 1 }], { shippingOptionId: 'pickup' }) })).status()).toBe(400);
  });

  test('ใบเสนอราคา: validate + honeypot กันบอท', async ({ request }) => {
    expect((await request.post('/api/quotes', { data: { name: 'ก', phone: '1', topic: '' } })).status()).toBe(400);
    expect((await request.post('/api/quotes', { data: { name: 'บอท', phone: '0812345678', topic: 'x', website: 'spam' } })).status()).toBe(400);
    expect((await request.post('/api/quotes', { data: { name: 'บจก. ฟู้ดโปร', phone: '083-111-2222', topic: 'ระบบบำบัดน้ำเสีย', detail: 'น้ำเสีย 50 ลบ.ม./วัน' } })).status()).toBe(201);
  });

  test('หลังบ้านต้องล็อกอิน และ cookie ปลอมใช้ไม่ได้', async ({ request }) => {
    for (const p of ['/admin', '/admin/orders', '/admin/shipping']) {
      const r = await request.get(p, { maxRedirects: 0 });
      expect(r.status()).toBe(307);
      expect(r.headers().location).toContain('/admin/login');
    }
    const forged = await request.get('/admin', { maxRedirects: 0, headers: { cookie: 'entech_admin=eyJpZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.AAAA' } });
    expect(forged.status()).toBe(307);
  });

  test('SEO: redirect URL เดิม 301/308, sitemap, robots, JSON-LD', async ({ request }) => {
    const r = await request.get('/16546770/ถังเก็บน้ำ-grand-stone', { maxRedirects: 0 });
    expect([301, 308]).toContain(r.status());
    expect(r.headers().location).toBe('/product/grand-stone');
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('/product/amazon-timber');
    expect(sm).toContain('/products/septic-tanks');
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin');
    const html = await (await request.get('/product/amazon-timber')).text();
    expect(html).toContain('"@type":"Product"');
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:3100\/product\/amazon-timber"/);
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toMatch(/og:site_name" content="ENTECH Products"/);
    const home = await (await request.get('/')).text();
    expect(home).toMatch(/<link rel="canonical" href="http:\/\/localhost:3100"/);
    expect(home).toContain('og:image');
    for (const p of ['/favicon.ico', '/icon.png', '/apple-icon.png', '/og.jpg']) expect((await request.get(p)).status(), p).toBe(200);
    for (const [from, to] of [['/index.php', '/'], ['/99999999/old-page', '/products']]) {
      const x = await request.get(from, { maxRedirects: 0 });
      expect(x.headers().location, from).toBe(to);
    }
    const nf = await request.get('/product/nope');
    expect(nf.status()).toBe(404);
    expect(await nf.text()).toContain('ไม่พบหน้าที่คุณต้องการ');
  });
});
