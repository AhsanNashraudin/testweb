import { test, expect, type Page } from '@playwright/test';

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('มือถือ: ไม่มี scroll แนวนอน (รวมตะกร้าที่มีสินค้า) และซื้อสินค้าได้', async ({ page }) => {
  await page.goto('/product/grand-stone');
  await page.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click();
  for (const p of ['/', '/products', '/product/grand-stone', '/product/amazon-timber', '/cart', '/checkout', '/contact', '/services', '/about', '/order/lookup', '/nope']) {
    await page.goto(p);
    await page.waitForLoadState('networkidle');
    expect(await overflow(page), p).toBeLessThanOrEqual(1);
  }
  // H2: ปุ่มลบและราคาอยู่ในจอ และกดได้ขนาด ≥ 44px
  await page.goto('/cart');
  const del = page.getByRole('button', { name: /ออกจากตะกร้า/ });
  const box = (await del.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await page.goto('/checkout');
  await page.locator('#province').selectOption('กรุงเทพมหานคร');
  await expect(page.getByTestId('ship-fee').first()).toHaveText('฿2,500');
  await expect(page.getByRole('button', { name: 'สั่งซื้อเลย' })).toBeInViewport(); // แถบยอดรวมติดล่าง
});

test('มือถือ: เมนู, ค้นหาเต็มความกว้าง, ปุ่มโทร/LINE', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'ค้นหาสินค้า' }).locator('visible=true');
  expect((await search.boundingBox())!.width).toBeGreaterThan(200);
  expect(await search.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16); // iOS ไม่ซูม
  await expect(page.getByRole('link', { name: 'โทรหาเรา' })).toHaveAttribute('href', 'tel:0632061000');
  await page.getByLabel('เปิดเมนู').click();
  await page.getByRole('navigation', { name: 'เมนูมือถือ' }).getByRole('link', { name: 'ติดต่อเรา' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('navigation', { name: 'เมนูมือถือ' })).toBeHidden(); // ปิดเองหลังเปลี่ยนหน้า
});

test('มือถือ: หลังบ้านใช้งานได้ ไม่ล้นจอ', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('[name=email]').fill('admin@entech.local');
  await page.locator('[name=password]').fill('Entech@2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const p of ['/admin', '/admin/orders', '/admin/products', '/admin/products/1', '/admin/shipping', '/admin/quotes', '/admin/articles', '/admin/home', '/admin/site', '/admin/categories']) {
    await page.goto(p);
    expect(await overflow(page), p).toBeLessThanOrEqual(1);
  }
  await page.getByText(/☰/).click();
  await page.getByRole('link', { name: 'คำสั่งซื้อ' }).click();
  await expect(page).toHaveURL(/\/admin\/orders/);
});
