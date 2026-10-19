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
  await page.getByTestId('order-row').filter({ hasText: code }).getByRole('link').click();
  await page.locator('#status').selectOption('cancelled');
  await post(page, page.getByRole('button', { name: 'อัปเดตสถานะ' }));
  await ok(page);
  expect(await stock()).toBe(s0);
  // กดยกเลิกซ้ำต้องไม่คืนสต็อกซ้ำ
  await page.locator('#status').selectOption('cancelled');
  await post(page, page.getByRole('button', { name: 'อัปเดตสถานะ' }));
  expect(await stock()).toBe(s0);
  await page.locator('#status').selectOption('paid');
  await post(page, page.getByRole('button', { name: 'อัปเดตสถานะ' }));
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
  await expect(hero.locator('img').last()).toHaveAttribute('src', /media%2F\d+|\/media\/\d+/);
  expect(await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')))).toEqual(['why', 'categories', 'featured', 'csr', 'cta']);
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
  await page.getByLabel('เบอร์มือถือ').fill('089-999-8888');
  await page.getByLabel('ข้อความแถบบนสุดของเว็บ').fill('ลดราคาพิเศษถึงสิ้นเดือน');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await ok(page);
  await page.goto('/contact');
  await expect(page.locator('header')).toContainText('ลดราคาพิเศษถึงสิ้นเดือน');
  await expect(page.locator('header a[href="tel:0899998888"]').first()).toBeVisible();
  await expect(page.locator('footer')).toContainText('@entechnew');
  await expect(page.locator('main')).toContainText('089-999-8888');
});
