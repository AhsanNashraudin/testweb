import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER } from './helpers';

const fill = async (page: Page, extra = true) => {
  await page.locator('#name').fill(CUSTOMER.name);
  await page.locator('#phone').fill(CUSTOMER.phone);
  await page.locator('#email').fill(CUSTOMER.email);
  if (extra) { await page.locator('#address').fill(CUSTOMER.address); await page.locator('#postcode').fill(CUSTOMER.postcode); }
};

test('ลูกค้า: หน้าแรก → สินค้า → ตะกร้า → ค่าส่งอัตโนมัติ → สั่งซื้อ → QR', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('400') && errors.push(m.text()));

  await page.goto('/');
  await expect(page).toHaveTitle(/ENTECH/);
  await page.getByTestId('product-card').filter({ hasText: 'GRAND STONE' }).first().click();
  await expect(page).toHaveURL(/\/product\/grand-stone$/);
  await expect(page.getByTestId('price')).toContainText('3,200'); // CW-700 G
  await expect(page.locator('body')).toContainText('ราคายังไม่รวม VAT 7%');
  await page.getByRole('button', { name: /CW-2000 G/ }).click();
  await expect(page.getByTestId('price')).toContainText('5,700');
  await expect(page.getByTestId('bulk')).toContainText('5 ชิ้นขึ้นไป เหลือชิ้นละ ฿5,400');
  await page.getByRole('button', { name: 'เพิ่มจำนวน' }).click();
  await page.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click();
  await expect(page.getByTestId('cart-count').first()).toHaveText('2');

  // ตะกร้าคงอยู่หลังรีเฟรช + แนะนำราคาส่ง
  await page.goto('/cart');
  await page.reload();
  await expect(page.getByTestId('cart-line')).toHaveCount(1);
  await expect(page.getByTestId('qty')).toHaveText('2');
  await expect(page.getByTestId('bulk-hint')).toContainText('เพิ่มอีก 3 ชิ้น');
  await page.getByRole('link', { name: 'ดำเนินการชำระเงิน' }).click();

  // 2 × 5,700 = 11,400 · ค่าส่งตามจังหวัด · บวก VAT 7% (Price List ระบุราคาไม่รวม VAT)
  const total = page.getByTestId('total');
  const fee = page.getByTestId('ship-fee').first();
  const cases: [string, string, string][] = [
    ['นนทบุรี', '฿2,500', '฿14,873'],   // 13,900 + 973
    ['สมุทรสาคร', '฿2,500', '฿14,873'],
    ['เชียงใหม่', '฿5,000', '฿17,548'], // 16,400 + 1,148
  ];
  for (const [prov, f, t] of cases) {
    await page.locator('#province').selectOption(prov);
    await expect(fee, prov).toHaveText(f);
    await expect(page.locator('input[name=ship]').first(), prov).toBeChecked();
    await expect(total, prov).toContainText(t);
  }

  // เลือกรับเองที่โรงงาน → ค่าส่ง 0 และช่องที่อยู่หายไป
  await page.getByTestId('ship-option').filter({ hasText: 'รับ' }).click();
  await expect(total).toContainText('฿12,198'); // 11,400 + 798
  await expect(page.locator('#address')).toHaveCount(0);
  await page.locator('#province').selectOption('ลำปาง');
  await expect(total).toContainText('฿12,198');

  // คูปองผิด → แจ้ง และกดยืนยันไม่ได้ ; คูปองถูก → ลด 500
  await page.getByLabel('โค้ดส่วนลด').fill('WRONG');
  await page.getByRole('button', { name: 'ใช้', exact: true }).click();
  await expect(page.getByTestId('coupon-error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' })).toBeDisabled();
  await page.getByLabel('โค้ดส่วนลด').fill('entech500');
  await page.getByRole('button', { name: 'ใช้', exact: true }).click();
  await expect(total).toContainText('฿11,663'); // 10,900 + 763

  // ส่งฟอร์มไม่ครบ → แสดง error ที่ช่อง
  await page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' }).click();
  await expect(page.getByTestId('err-name')).toBeVisible();
  await fill(page, false);
  await page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' }).click();

  await expect(page).toHaveURL(/\/order\/ET\d{6}-\w{5}\?k=/);
  await expect(page.getByRole('heading', { name: 'ขอบคุณสำหรับคำสั่งซื้อ!' })).toBeVisible();
  await expect(page.getByAltText('PromptPay QR')).toBeVisible();
  await expect(page.getByTestId('order-vat')).toHaveText('฿763');
  await expect(page.locator('body')).toContainText('฿11,663');
  await expect(page.getByTestId('cart-count')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('ประตู 20 รุ่น + วงกบ: ราคาตาม Price List, ราคาก่อนลด +20%, ตัวเลือกสั่งทำ', async ({ page }) => {
  await page.goto('/products/fiberglass-doors');
  expect(await page.getByTestId('product-card').count()).toBe(21);
  const card = page.getByTestId('product-card').filter({ hasText: 'EDM-13' });
  await expect(card).toContainText('฿3,200');
  await expect(card).toContainText('฿3,840');
  await expect(card).toContainText('-17%');
  await card.click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('รุ่น EDM-13');
  const img = page.getByRole('img', { name: /EDM-13/ }).first();
  await expect(img).toBeVisible();
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  await expect(page.getByTestId('save')).toContainText('ประหยัด ฿640');
  for (const [size, price] of [['80', '3,350'], ['90', '3,500'], ['100', '3,800']]) {
    await page.getByRole('button', { name: `${size} x 200 ซม.` }).click();
    await expect(page.getByTestId('price')).toContainText(price);
  }
  await expect(page.getByTestId('specs')).toContainText('เจาะบานเกล็ด พื้นที่ไม่เกิน 25%');
  await expect(page.locator('body')).toContainText('มอก. 1568-2542');
  await page.goto('/product/fiberglass-door-frame');
  await expect(page.getByTestId('price-table')).toContainText('฿2,300');
});

test('สินค้าสอบถามราคา: ไม่มีปุ่มสั่งซื้อ มีปุ่ม LINE + ขอใบเสนอราคา และตารางสเปก', async ({ page }) => {
  await page.goto('/product/amazon-timber');
  await expect(page.getByTestId('price')).toHaveText('สอบถามราคา');
  await expect(page.getByRole('button', { name: 'เพิ่มลงตะกร้า' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'สอบถามราคาทาง LINE' })).toHaveAttribute('href', /line\.me/);
  await expect(page.getByTestId('specs')).toContainText('AZ-1100');
  await page.locator('a[href*="services?product="]', { hasText: 'ขอใบเสนอราคา' }).first().click();
  await expect(page.locator('#q-detail')).toHaveValue(/AMAZON TIMBER/);
});

test('สินค้าหมด: ปุ่มซื้อถูกปิด · ทุกสินค้ามีปุ่มติดต่อฝ่ายขาย LINE OA', async ({ page }) => {
  await page.goto('/product/grease-trap-in-ground');
  await expect(page.getByRole('link', { name: /ติดต่อฝ่ายขายทาง LINE OA/ })).toBeVisible();
  await page.getByRole('button', { name: /PT-140 KU/ }).click();
  await expect(page.getByRole('button', { name: 'เพิ่มลงตะกร้า' })).toBeDisabled();
});

test('ค้นหา / หมวดหมู่ / 404', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('ค้นหาสินค้า').first().fill('ประตู');
  await page.getByLabel('ค้นหาสินค้า').first().press('Enter');
  await expect(page).toHaveURL(/q=/);
  expect(await page.getByTestId('product-card').count()).toBeGreaterThanOrEqual(21); // ประตู 20 รุ่น + วงกบ
  await page.goto('/products/septic-tanks');
  expect(await page.getByTestId('product-card').count()).toBeGreaterThan(0);
  const r = await page.goto('/product/not-exist');
  expect(r?.status()).toBe(404);
});

test('ขอใบเสนอราคา', async ({ page }) => {
  await page.goto('/contact');
  await page.locator('input[name=name]').fill('คุณวิชัย');
  await page.locator('input[name=phone]').fill('0891234567');
  await page.locator('[name=topic]').first().fill('บ่อดักไขมัน').catch(async () => page.locator('select[name=topic]').selectOption({ index: 1 }));
  await page.getByRole('button', { name: /ส่ง/ }).click();
  await expect(page.locator('body')).toContainText(/ขอบคุณ|ได้รับ/);
});

test('หน้าแรก: รูปปก + การ์ด ISO 9001 (กดแล้ว popup UKAS) + มอก. เท่านั้น · หัวเว็บ 3 เบอร์ เรียง 063 → 02 → 093', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('hero-image').locator('img')).toHaveAttribute('src', /hero-scene/);
  await expect(page.locator('header').first()).toContainText('063-206-1000, 02-813-0971-4, 093-636-3978');
  const certs = page.getByTestId('hero-certs');
  await expect(certs).toContainText('ISO 9001');
  await expect(certs.locator('img[src*="cert-iso9001"]')).toBeVisible();
  const dlg = page.getByTestId('cert-dialog');
  await expect(dlg).toBeHidden();
  await certs.getByTestId('cert-open').click(); // กดการ์ด ISO → popup รูป UKAS
  await expect(dlg.locator('img[src*="cert-ukas"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(certs).toContainText('มาตรฐาน มอก.');
  await expect(certs.locator('li')).toHaveCount(2);
});

test('เมนูสินค้า: รายชื่อหมวดแนวตั้ง ชี้แล้วแสดงรูปรวมสินค้าของหมวด · หน้าแรกมีโลโก้มาตรฐาน', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('hero-certs')).toContainText('ISO 9001');
  await page.locator('nav[aria-label="เมนูหลัก"] summary').click();
  const menu = page.getByTestId('product-menu');
  await menu.getByRole('link', { name: 'ประตูไฟเบอร์กลาส' }).hover();
  await expect(menu.locator('img[src*="cat-fiberglass-doors"]').last()).toBeVisible();
  await menu.getByRole('link', { name: 'ถังดักไขมัน' }).hover();
  await expect(menu.getByText('ถังดักไขมันชนิดใต้ซิงค์').first()).toBeVisible();
});

test('เมนูสินค้าเปิดเมื่อเอาเมาส์ชี้ และปิดเมื่อเลื่อนออก', async ({ page }) => {
  await page.goto('/about');
  const menu = page.getByTestId('product-menu');
  await expect(menu).toBeHidden();
  await page.locator('nav[aria-label="เมนูหลัก"] summary').hover();
  await expect(menu).toBeVisible();
  await expect(menu.getByTestId('menu-preview')).toHaveCount(0); // ยังไม่ชี้ชื่อ = ยังไม่มีรูป
  await expect(menu.locator('img')).toHaveCount(0);
  await menu.getByRole('link', { name: 'กระถางต้นไม้ไฟเบอร์กลาส' }).hover();
  await expect(menu.locator('img[src*="cat-planters"]').last()).toBeVisible();
  await page.mouse.move(5, 700);
  await expect(menu).toBeHidden();
});

test('หน้าแรก: ส่วนจุดเด่นบริการ (H2 + 6 ไอคอน) อยู่ก่อนหมวดสินค้า · ทำไมต้อง ENTECH มีตัวเลขเด่น', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')));
  expect(order.indexOf('features')).toBeLessThan(order.indexOf('categories'));
  const feat = page.locator('[data-section=features]');
  await expect(feat.getByRole('heading', { level: 2 })).toContainText('ถังเก็บน้ำ');
  await expect(feat.getByRole('heading', { level: 3 })).toHaveCount(6);
  await expect(page.locator('[data-section=why] dl')).toContainText('30+');
});

test('ถังไฟเบอร์กลาส: เหลือเฉพาะถังบำบัดน้ำเสีย (ถังเก็บน้ำ/ถังดักไขมันไฟเบอร์กลาสเอาออกตามที่ลูกค้าขอ)', async ({ page }) => {
  await page.goto('/products/fiberglass-water-tanks');
  await expect(page.getByText('ถังบำบัดน้ำเสียไฟเบอร์กลาส (สั่งผลิตตามขนาด)').first()).toBeVisible();
  await expect(page.getByText('ถังเก็บน้ำไฟเบอร์กลาส (สั่งผลิตตามขนาด)')).toHaveCount(0);
  await expect(page.getByText('ถังดักไขมันไฟเบอร์กลาส (สั่งผลิตตามขนาด)')).toHaveCount(0);
  expect((await page.goto('/product/fiberglass-grease-trap'))?.status()).toBe(404);
});
