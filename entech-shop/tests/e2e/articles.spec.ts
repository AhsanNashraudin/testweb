import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.locator('[name=email]').fill('admin@entech.local');
  await page.locator('[name=password]').fill('Entech@2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test('บทความ: มีบทความตั้งต้น · หลังบ้านสร้างฉบับร่าง (ซ่อน) และฉบับเผยแพร่ (แสดง)', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.getByRole('heading', { level: 1, name: 'บทความ' })).toBeVisible();
  const before = await page.getByTestId('article-card').count();
  expect(before).toBeGreaterThanOrEqual(2); // บทความความรู้ตั้งต้น 2 เรื่อง (กิจกรรม CSR แยกไปหน้า /csr)

  await login(page);
  await page.goto('/admin/articles/new');
  await page.locator('#title').fill('ฉบับร่างที่ยังไม่เผยแพร่');
  await page.locator('#slug').fill('draft-hidden');
  await page.locator('#body').fill('ข้อความที่ไม่ควรเห็นหน้าเว็บ');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.getByTestId('flash-ok')).toBeVisible();

  await page.goto('/admin/articles/new');
  await page.locator('#title').fill('วิธีเลือกถังเก็บน้ำให้เหมาะกับบ้าน');
  await page.locator('#slug').fill('how-to-choose-tank');
  await page.locator('#excerpt').fill('ดูขนาดและวัสดุก่อนซื้อ');
  await page.locator('#body').fill('ย่อหน้าแรก ว่าด้วยการเลือกขนาด\n\nย่อหน้าที่สอง ว่าด้วยวัสดุ PE และ FRP');
  await page.locator('input[name=published]').check();
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.getByTestId('flash-ok')).toBeVisible();

  // slug ซ้ำ → แจ้งเตือน ไม่บันทึกทับ
  await page.goto('/admin/articles/new');
  await page.locator('#title').fill('ซ้ำ');
  await page.locator('#slug').fill('how-to-choose-tank');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.getByTestId('flash-err')).toContainText('slug นี้ถูกใช้แล้ว');

  // หน้าเว็บ: ฉบับเผยแพร่แสดง ฉบับร่างไม่แสดง
  await page.goto('/articles');
  await expect(page.getByTestId('article-card')).toHaveCount(before + 1);
  await expect(page.getByTestId('article-card').first()).toContainText('วิธีเลือกถังเก็บน้ำ'); // ล่าสุดอยู่บนสุด
  await page.goto('/articles/how-to-choose-tank');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('วิธีเลือกถังเก็บน้ำให้เหมาะกับบ้าน');
  await expect(page.getByTestId('article-body').locator('p')).toHaveCount(2);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/articles\/how-to-choose-tank/);
  const draft = await page.goto('/articles/draft-hidden');
  expect(draft?.status()).toBe(404);
});

test('หน้าข้อมูล: เกี่ยวกับเรา, FAQ, เงื่อนไข, นโยบายความเป็นส่วนตัว และลิงก์ท้ายเว็บ', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('body')).toContainText('พ.ศ. 2537');
  await expect(page.locator('body')).toContainText('นิคมอุตสาหกรรมสินสาคร');
  await page.goto('/faq');
  expect(await page.getByTestId('faq-item').count()).toBeGreaterThanOrEqual(10);
  await expect(page.locator('body')).toContainText('฿2,500'); // ค่าส่งดึงจากโซนจริง
  const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ''));
  expect(ld.some((t) => JSON.parse(t)['@type'] === 'FAQPage')).toBe(true);
  await page.goto('/terms');
  await expect(page.locator('body')).toContainText('ยังไม่รวมภาษีมูลค่าเพิ่ม');
  await page.goto('/privacy');
  await expect(page.locator('body')).toContainText('พ.ศ. 2562');
  for (const [name, url] of [['นโยบายความเป็นส่วนตัว', /\/privacy$/], ['เงื่อนไขการสั่งซื้อ', /\/terms$/], ['คำถามที่พบบ่อย', /\/faq$/]] as const) {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
});

test('บทความ/CSR แยกหน้า · คู่มือขนาดถังเป็นตาราง · กระถางใหม่เป็นสอบถามราคา', async ({ page }) => {
  await page.goto('/csr');
  expect(await page.getByTestId('article-card').count()).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('article-card').first()).toContainText('กิจกรรม CSR');
  await page.goto('/articles');
  await expect(page.locator('main')).not.toContainText('มอบถังเก็บน้ำให้โรงเรียนบ้านซับเดื่อ');
  await page.goto('/articles/water-tank-size-guide');
  const table = page.getByTestId('article-table');
  await expect(table.locator('thead')).toContainText('ขนาดถัง');
  await expect(table.locator('tbody tr')).toHaveCount(7);
  await expect(page.locator('article img').first()).toBeVisible(); // รูปปกจากลูกค้า
  await page.goto('/products/planters');
  await expect(page.getByText('กระถางไฟเบอร์กลาสทรงชาม (อ่างบัว)')).toBeVisible();
  await page.goto('/');
  await expect(page.locator('[data-section=csr]')).toBeVisible();
  await expect(page.locator('[data-section=articles]')).toBeVisible();
});
