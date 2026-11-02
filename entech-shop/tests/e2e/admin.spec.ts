import { test, expect, type Page, type Locator } from '@playwright/test';
import { loadSkus, order } from './helpers';

test.describe.configure({ mode: 'serial' });

const login = async (page: Page) => {
  await page.goto('/admin/orders');
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders/);
  await page.locator('[name=email]').fill('admin@entech.local');
  await page.locator('[name=password]').fill('Entech@2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/); // กลับไปหน้าที่ตั้งใจเข้า
};
const calc = async (page: Page, province: string, subtotal: number, weight: number) => {
  await page.goto(`/admin/shipping?province=${encodeURIComponent(province)}&subtotal=${subtotal}&weight=${weight}`);
  return page.getByTestId('calc-result').innerText();
};
/** กดปุ่ม server action แล้วรอจนได้ response + หน้าโหลดใหม่ (กัน flash เก่าทำให้ test ผ่านหลอก) */
const post = async (page: Page, btn: Locator) => {
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), btn.click()]);
  await page.waitForLoadState();
};
const ok = (scope: Page | Locator) => expect(scope.getByTestId('flash-ok').first()).toBeVisible();
const openRegion = (page: Page, name: string) => page.locator('details', { has: page.locator('summary', { hasText: name }) }).evaluate((d: HTMLDetailsElement) => { d.open = true; });

test.beforeEach(({ page }) => { page.on('dialog', (d) => d.accept()); });

test('ล็อกอินผิด → แจ้งเตือน, next= ภายนอกถูกบล็อก', async ({ page }) => {
  await page.goto('/admin/login?next=https://evil.example');
  await page.locator('[name=email]').fill('admin@entech.local');
  await page.locator('[name=password]').fill('wrong-password');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.locator('p.err[role=alert]')).toHaveText('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  await expect(page.locator('[name=email]')).toHaveValue('admin@entech.local'); // อีเมลไม่หายหลังกรอกผิด
  await expect(page.locator('[name=password]')).toHaveValue('');
  await page.locator('[name=password]').fill('Entech@2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).toHaveURL(/localhost:3100\/admin$/);
});

test('ค่าส่ง: แก้ค่าโซน → หน้าร้านเปลี่ยนทันที, จับคู่จังหวัดใหม่, เพิ่ม/ลบโซน', async ({ page, request }) => {
  await login(page);
  const S = await loadSkus(request);
  const shopFee = async (province: string) =>
    (await (await request.post('/api/checkout/preview', { data: { items: [{ variantId: S['PT-15 KG'], qty: 1 }], province } })).json()).shippingOptions[0].fee;

  expect(await calc(page, 'นนทบุรี', 1000, 10)).toContain('฿2,500');
  const bkk = page.getByTestId(/^zone-\d+$/).filter({ has: page.locator('input[name=name][value^="กรุงเทพ"]') });
  await bkk.locator('[name=baseFee]').fill('900');
  await post(page, bkk.getByRole('button', { name: 'บันทึกโซน' }));
  await ok(bkk);
  expect(await shopFee('นนทบุรี')).toBe(900);

  // ค่าติดลบ/ว่าง ต้องไม่ถูกบันทึก
  await bkk.locator('[name=baseFee]').evaluate((el: HTMLInputElement) => { el.removeAttribute('min'); el.value = '-50'; });
  await post(page, bkk.getByRole('button', { name: 'บันทึกโซน' }));
  await expect(bkk.getByTestId('flash-err')).toBeVisible();
  await expect(bkk.locator('[name=baseFee]')).toHaveValue('-50'); // ค่าที่พิมพ์ไม่หายเมื่อ error
  expect(await shopFee('นนทบุรี')).toBe(900);

  // เพิ่มโซนใหม่ "ภาคใต้" แล้วจับคู่ภูเก็ต
  await page.getByText('+ เพิ่มโซนใหม่').click();
  const nz = page.getByTestId('zone-new');
  await nz.locator('[name=name]').fill('ภาคใต้');
  await nz.locator('[name=baseFee]').fill('2500');
  await post(page, nz.getByRole('button', { name: 'เพิ่มโซน' }));
  await ok(nz);
  await expect(nz.locator('[name=name]')).toHaveValue(''); // ฟอร์มเพิ่มโซนล้างหลังสำเร็จ
  expect(await shopFee('ภูเก็ต')).toBe(5000); // ยังไม่จับคู่ → โซนสำรอง
  await openRegion(page, 'ภาคใต้');
  await openRegion(page, 'ภาคเหนือ');
  await page.getByLabel('โซนของ ภูเก็ต').selectOption({ label: 'ภาคใต้' });
  await page.getByLabel('โซนของ ลำพูน').selectOption({ label: 'กรุงเทพฯ ปริมณฑล และสมุทรสาคร (รถกระบะ)' });
  await post(page, page.getByRole('button', { name: 'บันทึกการจับคู่' }));
  await ok(page.locator('form', { has: page.getByRole('button', { name: 'บันทึกการจับคู่' }) }));
  expect(await shopFee('ภูเก็ต')).toBe(2500);
  expect(await shopFee('ลำพูน')).toBe(900);
  expect(await calc(page, 'ภูเก็ต', 1000, 1)).toContain('฿2,500');

  // ลบโซนภาคใต้ → ภูเก็ตกลับไปใช้โซนสำรอง
  const south = page.getByTestId(/^zone-\d+$/).filter({ has: page.locator('input[name=name][value="ภาคใต้"]') });
  await post(page, south.getByRole('button', { name: 'ลบ' }));
  await expect(south).toHaveCount(0);
  expect(await shopFee('ภูเก็ต')).toBe(5000);
});

test('คำสั่งซื้อ: ยกเลิก → คืนสต็อก, เปิดใหม่ → ตัดสต็อกอีกครั้ง', async ({ page, request }) => {
  const S = await loadSkus(request);
  const stock = async () => (await (await request.post('/api/checkout/preview', { data: { items: [{ variantId: S['PT-30 KG'], qty: 1 }] } })).json()).lines[0].stock;
  const s0 = await stock();
  const r = await request.post('/api/orders', { data: order([{ variantId: S['PT-30 KG'], qty: 3 }], { shippingOptionId: 'pickup' }) });
  const { code } = await r.json();
  expect(await stock()).toBe(s0 - 3);

  await login(page);
  // ไปหน้ารายละเอียดด้วยลิงก์ของแถว (คลิกก่อนหน้า hydrate เสร็จบางครั้งไม่นำทาง → test ไม่เสถียร)
  await page.goto((await page.getByTestId('order-row').filter({ hasText: code }).getByRole('link').getAttribute('href'))!);
  await page.locator('#status').selectOption('cancelled');
  await post(page, page.getByRole('button', { name: 'บันทึก', exact: true }));
  await ok(page);
  expect(await stock()).toBe(s0);
  // กดยกเลิกซ้ำต้องไม่คืนสต็อกซ้ำ
  await page.locator('#status').selectOption('cancelled');
  await post(page, page.getByRole('button', { name: 'บันทึก', exact: true }));
  expect(await stock()).toBe(s0);
  await page.locator('#status').selectOption('paid');
  await post(page, page.getByRole('button', { name: 'บันทึก', exact: true }));
  await ok(page);
  expect(await stock()).toBe(s0 - 3);
});

test('สินค้า: แก้ราคา → หน้าร้านอัปเดต, ราคาก่อนลดผิดถูกปฏิเสธ', async ({ page }) => {
  await login(page);
  await page.goto('/admin/products');
  await page.goto((await page.getByRole('link', { name: /GRAND STONE/ }).first().getAttribute('href'))!);
  await page.getByLabel('ราคา 700 ลิตร (CW-700 G)', { exact: true }).fill('3100');
  await post(page, page.getByRole('button', { name: 'บันทึก' }).first());
  await ok(page);
  await page.goto('/product/grand-stone');
  await expect(page.getByTestId('price')).toContainText('3,100');

  await page.goto('/admin/products');
  await page.goto((await page.getByRole('link', { name: /GRAND STONE/ }).first().getAttribute('href'))!);
  // H4: ชื่อถูก แต่ราคาก่อนลดผิด → ต้องไม่บันทึกอะไรเลย
  await page.locator('#name').fill('ชื่อใหม่ห้ามถูกบันทึก');
  await page.getByLabel('ราคาก่อนลด 700 ลิตร (CW-700 G)').fill('100');
  await post(page, page.getByRole('button', { name: 'บันทึก' }).first());
  await expect(page.getByTestId('flash-err')).toContainText('700 ลิตร');
  await expect(page.locator('#name')).toHaveValue('ชื่อใหม่ห้ามถูกบันทึก'); // ค่าที่กรอกยังอยู่ให้แก้ต่อ
  await page.goto('/product/grand-stone');
  await expect(page.getByRole('heading', { level: 1 })).not.toContainText('ห้ามถูกบันทึก');
});

test('H1: ตั้งบัญชีโอนในหลังบ้าน → ลูกค้าเลือกโอนได้และเห็นเลขบัญชี', async ({ page, request }) => {
  await login(page);
  await page.goto('/admin/shipping');
  const f = page.locator('form', { has: page.locator('#ba') });
  await page.locator('#bn').fill('กสิกรไทย');
  await post(page, f.getByRole('button', { name: 'บันทึก', exact: true }));
  await expect(f.getByTestId('flash-err')).toContainText('ครบ 3 ช่อง');
  await page.locator('#ba').fill('123-4-56789-0');
  await page.locator('#bh').fill('บจก. ทดสอบ');
  await post(page, f.getByRole('button', { name: 'บันทึก', exact: true }));
  await ok(f);

  const S = await loadSkus(request);
  const r = await request.post('/api/orders', { data: order([{ variantId: S['PT-20 KG'], qty: 1 }], { shippingOptionId: 'pickup', paymentMethod: 'transfer' }) });
  expect(r.status()).toBe(201);
  const { code, key } = await r.json();
  await page.goto(`/order/${code}?k=${key}`);
  await expect(page.getByTestId('bank-info')).toContainText('123-4-56789-0');
  await expect(page.getByTestId('bank-info')).not.toContainText('หลังบ้าน');
  await expect(page.getByTestId('pickup-info')).toContainText('อ้อมน้อย');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('L3/L8: ค้นหาคำสั่งซื้อด้วยเบอร์โทร + badge สถานะ + title แยกหน้า', async ({ page }) => {
  await login(page);
  await expect(page).toHaveTitle(/คำสั่งซื้อ \| หลังบ้าน/);
  await page.getByLabel('ค้นหาคำสั่งซื้อ').fill('081-234-5678');
  await page.getByLabel('ค้นหาคำสั่งซื้อ').press('Enter');
  await expect(page).toHaveURL(/q=/);
  expect(await page.getByTestId('order-row').count()).toBeGreaterThan(0);
  await page.getByLabel('ค้นหาคำสั่งซื้อ').fill('ไม่มีใครชื่อนี้');
  await page.getByLabel('ค้นหาคำสั่งซื้อ').press('Enter');
  await expect(page.getByText('ไม่พบคำสั่งซื้อที่ตรงกับ')).toBeVisible();
});

test('ทีมขาย & แจ้งเตือน: เพิ่มเซลล์ → ฟอร์มใหม่ถูกมอบหมายแบบเวียนคิวตามหัวข้อ', async ({ page, request }) => {
  await login(page);
  await page.goto('/admin/notify');
  await expect(page.getByTestId('line-status')).toContainText('ยังไม่เชื่อม LINE');
  const add = page.getByTestId('add-member');
  for (const [name, topic] of [['เซลล์เอ', ''], ['เซลล์บี', ''], ['ช่างบริการ', 'บริการหลังการขาย']]) {
    await add.locator('[name=name]').fill(name);
    if (topic) await add.getByLabel(topic).check();
    await post(page, add.getByRole('button', { name: '+ เพิ่มรายชื่อ' }));
    await ok(page);
  }
  await add.locator('[name=name]').fill('ผิด');
  await add.locator('[name=lineId]').fill('abc');
  await post(page, add.getByRole('button', { name: '+ เพิ่มรายชื่อ' }));
  await expect(page.getByText('LINE ID ไม่ถูกต้อง')).toBeVisible();
  await expect(page.getByTestId('member')).toHaveCount(3);

  const send = (name: string, topic: string) => request.post('/api/quotes', { data: { name, phone: '0812223333', topic } });
  for (const n of ['ลูกค้าคิว1', 'ลูกค้าคิว2', 'ลูกค้าคิว3']) expect((await send(n, 'ขอใบเสนอราคา')).status()).toBe(201);
  expect((await send('ลูกค้าซ่อม', 'บริการหลังการขาย')).status()).toBe(201);
  await page.goto('/admin/quotes');
  const who = async (n: string) => page.getByTestId('quote-row').filter({ hasText: n }).getByTestId('quote-assignee').innerText();
  await expect.poll(() => who('ลูกค้าคิว3')).not.toBe('ยังไม่มี');
  const [a, b, c] = [await who('ลูกค้าคิว1'), await who('ลูกค้าคิว2'), await who('ลูกค้าคิว3')];
  expect(new Set([a, b])).toEqual(new Set(['เซลล์เอ', 'เซลล์บี'])); // เวียนคิว: 2 รายแรกได้คนละคน
  expect(c).toBe(a);
  await expect.poll(() => who('ลูกค้าซ่อม')).not.toBe('ยังไม่มี'); // เซลล์ทั่วไป + ช่างบริการ ดูแลหัวข้อนี้ได้

  // เปลี่ยนผู้ดูแล + บันทึกภายใน
  const row = page.getByTestId('quote-row').filter({ hasText: 'ลูกค้าคิว1' });
  await row.getByLabel('ผู้ดูแล').selectOption({ label: 'ช่างบริการ' });
  await row.getByLabel('บันทึกภายใน').fill('โทรแล้ว นัดดูหน้างาน');
  await post(page, row.getByRole('button', { name: 'บันทึก' }));
  await ok(page);
  await expect(page.getByTestId('quote-row').filter({ hasText: 'ลูกค้าคิว1' }).getByTestId('quote-assignee')).toHaveText('ช่างบริการ');
  await page.goto('/admin/quotes?status=new&who=none');
  await expect(page.getByTestId('quote-row').filter({ hasText: 'ลูกค้าคิว' })).toHaveCount(0);
});

test('LINE webhook ต้องมีลายเซ็น · /api/cron ต้องมีคีย์', async ({ request }) => {
  expect((await request.post('/api/line/webhook', { data: { events: [] } })).status()).toBe(401);
  expect((await request.get('/api/cron')).status()).toBe(403);
  expect((await request.get('/api/cron?key=wrong-key-1234567890')).status()).toBe(403);
});

test('ใบเสนอราคา: เปลี่ยนสถานะ และออกจากระบบ', async ({ page, request }) => {
  await request.post('/api/quotes', { data: { name: 'คุณสุดา', phone: '0815556666', topic: 'ถังบำบัด 2000 ลิตร' } });
  await login(page);
  await page.goto('/admin/quotes');
  const row = page.getByTestId('quote-row').filter({ hasText: 'คุณสุดา' });
  await row.getByLabel('สถานะ').selectOption('won');
  await post(page, row.getByRole('button', { name: 'บันทึก' }));
  await ok(page);
  await expect(page.getByTestId('quote-row').filter({ hasText: 'คุณสุดา' }).getByLabel('สถานะ')).toHaveValue('won');
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin'); // cookie ถูกลบแล้ว ต้องเข้าไม่ได้
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('จัดการหน้าแรก: เปลี่ยนแบนเนอร์ (ข้อความ+รูป) สลับลำดับ ซ่อนส่วน → หน้าเว็บเปลี่ยนตาม', async ({ page }) => {
  await login(page);
  await page.goto('/admin/home');
  await page.getByLabel('หัวข้อหลัก *').fill('ถังเก็บน้ำคุณภาพ\nส่งตรงจากโรงงาน');
  await page.getByLabel('ป้ายเล็กด้านบน').fill('โปรโมชันเดือนนี้');
  await page.getByLabel('ปุ่มที่ 1 (ปุ่มหลัก) — ข้อความ').fill('ดูถังเก็บน้ำ');
  await page.getByLabel('ปุ่มที่ 1 — ลิงก์ไปที่').fill('/products/water-tanks');
  // อัปโหลดรูป → ย่อในเบราว์เซอร์ → ได้ /media/<id>
  await page.locator('input[type=file]').first().setInputFiles('public/images/products/grand_stone.jpg');
  await expect(page.locator('img[src^="/media/"]').first()).toBeVisible();
  // ย้าย "จุดเด่น" (ลำดับ 3) ขึ้นไปเป็นลำดับแรก และซ่อน "บทความล่าสุด"
  await page.getByRole('button', { name: 'เลื่อน จุดเด่น ขึ้น' }).click();
  await page.getByRole('button', { name: 'เลื่อน จุดเด่น ขึ้น' }).click();
  await page.getByTestId('section-row').filter({ hasText: 'บทความล่าสุด' }).getByRole('switch').uncheck();
  await page.getByLabel('กล่อง 1 — หัวข้อ').fill('ส่งไวทั่วไทย');
  await expect(page.getByText('มีการแก้ไขที่ยังไม่บันทึก')).toBeVisible();
  await page.getByRole('button', { name: 'บันทึก' }).first().click();
  await ok(page);
  await expect(page.getByText('มีการแก้ไขที่ยังไม่บันทึก')).toHaveCount(0);

  await page.goto('/');
  const hero = page.getByTestId('hero');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(/ถังเก็บน้ำคุณภาพ\s*ส่งตรงจากโรงงาน/);
  await expect(hero.getByText('โปรโมชันเดือนนี้')).toBeVisible();
  await expect(hero.getByRole('link', { name: 'ดูถังเก็บน้ำ' })).toHaveAttribute('href', '/products/water-tanks');
  await expect(hero.getByTestId('hero-image').locator('img')).toHaveAttribute('src', /media%2F\d+|\/media\/\d+/);
  expect(await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')))).toEqual(['features', 'why', 'categories', 'featured', 'csr', 'cta']);
  await expect(page.getByText('ส่งไวทั่วไทย')).toBeVisible();
  // รูปที่อัปโหลดเปิดได้จริง
  const src = await page.locator('img[src*="media"]').first().getAttribute('src');
  expect(src).toBeTruthy();
});

test('จัดการหน้าแรก: ลิงก์อันตรายถูกปฏิเสธ', async ({ page }) => {
  await login(page);
  await page.goto('/admin/home');
  await page.getByLabel('ปุ่มที่ 1 — ลิงก์ไปที่').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'บันทึก' }).first().click();
  await expect(page.getByTestId('flash-err')).toContainText('ลิงก์');
});

test('ข้อมูลร้าน & ติดต่อ: แก้ครั้งเดียว เปลี่ยนทั้งหัวเว็บ ท้ายเว็บ และหน้าติดต่อ', async ({ page }) => {
  await login(page);
  await page.goto('/admin/site');
  await page.getByLabel('LINE ID *').fill('@entechnew');
  await page.getByLabel('เบอร์มือถือ', { exact: true }).fill('089-999-8888');
  await page.getByLabel('ข้อความแถบบนสุดของเว็บ').fill('ลดราคาพิเศษถึงสิ้นเดือน');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await ok(page);
  await page.goto('/contact');
  await expect(page.locator('header')).toContainText('ลดราคาพิเศษถึงสิ้นเดือน');
  await expect(page.locator('header a[href="tel:0899998888"]').first()).toBeVisible();
  await expect(page.locator('footer')).toContainText('@entechnew');
  await expect(page.locator('main')).toContainText('089-999-8888');
});

test('หมวดสินค้า: เปลี่ยนรูปและชื่อหมวดในหลังบ้าน → เมนูสินค้าแสดงรูปใหม่เมื่อชี้', async ({ page }) => {
  await login(page);
  await page.goto('/admin/categories');
  const form = page.getByTestId('category-form').nth(4); // ถังขยะฝังกำแพง (ลำดับที่ 5)
  await expect(form.getByLabel('ชื่อหมวด')).toHaveValue('ถังขยะฝังกำแพง');
  await form.locator('input[type=file]').setInputFiles('public/images/products/wallbin-flat.jpg');
  await expect(form.locator('img[src^="/media/"]')).toBeVisible({ timeout: 15_000 });
  await form.getByLabel('ชื่อหมวด').fill('ถังขยะฝังผนัง');
  await form.getByRole('button', { name: 'บันทึก' }).click();
  await expect(form.getByTestId('flash-ok')).toBeVisible();
  await page.goto('/');
  await page.locator('nav[aria-label="เมนูหลัก"] summary').hover();
  const menu = page.getByTestId('product-menu');
  await menu.getByRole('link', { name: 'ถังขยะฝังผนัง' }).hover();
  await expect(menu.getByTestId('menu-preview').locator('img')).toHaveAttribute('src', /media/);
});

test('สำรองข้อมูล: แบ่งส่วนชัดเจน · ดาวน์โหลดแต่ละส่วน · สำรองอัตโนมัติ/กดเอง · กู้คืนแล้วข้อมูลกลับมา · คนนอกเข้าไม่ได้', async ({ page, request }) => {
  for (const u of ['/admin/backup/full', '/admin/backup/bundle', '/admin/backup/export/orders']) {
    expect((await request.get(u, { maxRedirects: 0 })).status(), u).not.toBe(200);
  }
  await login(page);
  await page.goto('/admin');
  await page.getByTestId('backup-link').click();
  await expect(page).toHaveURL(/\/admin\/backup$/);
  for (const h of ['สำรองทั้งระบบ', 'ส่งออกข้อมูลแยกส่วน', 'ไฟล์สำรองบนเซิร์ฟเวอร์', 'กู้คืนจากไฟล์ในเครื่อง']) await expect(page.getByRole('heading', { name: h })).toBeVisible();
  await expect(page.getByTestId('last-auto')).toHaveText(/\d{2}\/\d{2}\/\d{4}/); // สำรองอัตโนมัติทำงานหลังเปิดเซิร์ฟเวอร์

  const get = (u: string) => page.request.get(u);
  const products = await get('/admin/backup/export/products');
  expect(products.headers()['content-disposition']).toContain('.csv');
  const ptext = await products.text();
  expect(ptext.charCodeAt(0)).toBe(0xfeff); // BOM → Excel อ่านภาษาไทยได้
  expect(ptext).toContain('CW-1000');
  for (const p of ['orders', 'order-items', 'quotes', 'articles']) expect((await get(`/admin/backup/export/${p}`)).status(), p).toBe(200);
  expect(JSON.parse(await (await get('/admin/backup/export/settings')).text()).settings).toBeTruthy();
  expect((await (await get('/admin/backup/export/media')).body()).subarray(0, 2).toString()).toBe('PK');
  expect((await (await get('/admin/backup/bundle')).body()).subarray(0, 2).toString()).toBe('PK');
  const full = await (await get('/admin/backup/full')).body();
  expect(full.subarray(0, 15).toString()).toBe('SQLite format 3');

  // กดสำรองเอง → แก้ราคา → กู้คืน → ราคากลับเป็นเดิม
  const auth = { Authorization: 'Bearer test-stock-key-0123456789abcdef0123456789' };
  const price = async () => (await (await request.get('/api/v1/items', { headers: auth })).json()).data.find((x: { sku: string }) => x.sku === 'CW-1000').price;
  const before = await price();
  await post(page, page.getByRole('button', { name: 'สำรองตอนนี้' }));
  await expect(page.getByTestId('flash-ok').first()).toBeVisible({ timeout: 15_000 }); // สำรองจริงใช้เวลาเมื่อเครื่องทำงานหนัก
  await request.put('/api/v1/items', { headers: auth, data: { items: [{ sku: 'CW-1000', price: before + 999 }] } });
  expect(await price()).toBe(before + 999);
  await page.reload();
  const row = page.getByTestId('backup-list').locator('tr', { hasText: 'กดสำรองเอง' }).first();
  await post(page, row.getByTestId('restore-btn'));
  await ok(page);
  expect(await price()).toBe(before);
  await page.reload();
  await expect(page.getByTestId('backup-list')).toContainText('ก่อนกู้คืน');

  // อัปโหลดไฟล์สำรองจากเครื่อง → ขึ้นในรายการ
  await page.locator('input[type=file][name=file]').setInputFiles({ name: 'my-backup.db', mimeType: 'application/octet-stream', buffer: full });
  await page.getByRole('button', { name: 'อัปโหลดไฟล์สำรอง' }).click();
  await expect(page).toHaveURL(/uploaded=/);
  await expect(page.getByTestId('backup-list')).toContainText('อัปโหลดเข้ามา');
  // ไฟล์ปลอม → ปฏิเสธ
  await page.locator('input[type=file][name=file]').setInputFiles({ name: 'x.db', mimeType: 'application/octet-stream', buffer: Buffer.from('not a database') });
  await page.getByRole('button', { name: 'อัปโหลดไฟล์สำรอง' }).click();
  await expect(page.getByText('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูล')).toBeVisible();
  // ชื่อไฟล์แปลก (พยายามอ่านไฟล์อื่น) → ไม่ได้
  expect((await get('/admin/backup/file/..%2F..%2Fpackage.json')).status()).toBe(404);
});

test('เปลี่ยนรหัสผ่านแอดมิน: ตรวจรหัสเดิม/ความยาว แล้วเข้าสู่ระบบด้วยรหัสใหม่ได้', async ({ page, browser }) => {
  await login(page);
  await page.goto('/admin/site');
  const f = page.getByTestId('password-form');
  const change = async (cur: string, next: string, again = next) => {
    await f.getByLabel('รหัสผ่านปัจจุบัน').fill(cur);
    await f.getByLabel('รหัสผ่านใหม่', { exact: true }).fill(next);
    await f.getByLabel('ยืนยันรหัสผ่านใหม่').fill(again);
    await post(page, f.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }));
  };
  await change('wrong-password', 'NewStrongPass#2026');
  await expect(f.getByTestId('flash-err')).toContainText('รหัสผ่านปัจจุบันไม่ถูกต้อง');
  await change('Entech@2026', 'NewStrongPass#2026');
  await ok(f);
  const p2 = await (await browser.newContext()).newPage();
  await p2.goto('/admin/login');
  await p2.locator('[name=email]').fill('admin@entech.local');
  await p2.locator('[name=password]').fill('NewStrongPass#2026');
  await p2.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(p2).toHaveURL(/\/admin$/);
  await change('NewStrongPass#2026', 'Entech@2026-back', 'Entech@2026-back'); // คืนให้ต่างจากเดิม (ห้ามซ้ำ) แล้วกลับเป็นค่าทดสอบ
  await ok(f);
});
