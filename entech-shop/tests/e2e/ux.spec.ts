import { test, expect } from '@playwright/test';
import { CUSTOMER } from './helpers';

/** ทดสอบซ้ำจุดที่พบในการตรวจ UX/A11y (รายการ H/M/L ในรายงาน) */

test('H5: เมนูหลักเดสก์ท็อปอยู่ในจอครบ + dropdown สินค้า + active state', async ({ page }) => {
  for (const w of [1024, 1280, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('/about');
    const nav = page.getByRole('navigation', { name: 'เมนูหลัก' });
    for (const name of ['บริการออกแบบระบบ', 'เกี่ยวกับเรา', 'ติดต่อเรา', 'ขอใบเสนอราคา']) {
      const box = await nav.getByRole('link', { name }).boundingBox();
      expect(box && box.x + box.width <= w, `${name} @${w}`).toBeTruthy();
    }
    await expect(nav.getByRole('link', { name: 'เกี่ยวกับเรา' })).toHaveAttribute('aria-current', 'page');
  }
  const nav = page.getByRole('navigation', { name: 'เมนูหลัก' });
  await nav.getByText('สินค้า', { exact: false }).first().click();
  await nav.getByRole('link', { name: 'ถังบำบัดน้ำเสีย' }).click();
  await expect(page).toHaveURL(/\/products\/septic-tanks/);
  await page.keyboard.press('Escape');
});

test('H3: ค่าส่งไม่ค้างจากจังหวัดก่อนหน้าเมื่อคำนวณล้มเหลว + ลองใหม่ได้', async ({ page }) => {
  await page.goto('/product/grand-stone');
  await page.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click();
  await page.goto('/checkout');
  await page.locator('#province').selectOption('กรุงเทพมหานคร');
  await expect(page.getByTestId('ship-fee').first()).toHaveText('฿2,500');
  let fail = true;
  await page.route('**/api/checkout/preview', (r) => (fail ? r.fulfill({ status: 500, body: '{}' }) : r.continue()));
  await page.locator('#province').selectOption('ภูเก็ต');
  await expect(page.getByRole('alert').filter({ hasText: 'ลองใหม่' })).toBeVisible();
  await expect(page.getByTestId('ship-fee')).toHaveCount(0); // ไม่โชว์ ฿2,500 ของกรุงเทพฯ ค้างไว้
  await expect(page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' })).toBeDisabled();
  fail = false;
  await page.getByRole('button', { name: 'ลองใหม่' }).first().click();
  await expect(page.getByTestId('ship-fee').first()).toHaveText('฿5,000'); // โซนสำรอง (ขนส่งเอกชน)
  await expect(page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' })).toBeEnabled();
});

test('M1/M2: กดยืนยันครั้งเดียวเห็น error ครบ, focus ไปช่องแรก, ใบกำกับภาษีบังคับกรอก', async ({ page }) => {
  await page.goto('/product/grand-stone');
  await page.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click();
  await page.goto('/checkout');
  await page.locator('#province').selectOption('นนทบุรี');
  await expect(page.getByTestId('ship-fee').first()).toBeVisible();
  await page.getByLabel('ต้องการใบกำกับภาษีเต็มรูป').check();
  await page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' }).click();
  for (const f of ['name', 'phone', 'email', 'address', 'postcode', 'taxName', 'taxId', 'taxAddress']) await expect(page.getByTestId(`err-${f}`), f).toBeVisible();
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('form-error')).toContainText('8 ช่อง');
  await page.locator('#name').fill(CUSTOMER.name);
  await expect(page.getByTestId('err-name')).toHaveCount(0); // error หายทันทีที่แก้
});

test('M7: skip link, focus ring มองเห็นได้บนปุ่มทึบ', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'ข้ามไปที่เนื้อหา' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const btn = page.getByRole('link', { name: 'เลือกซื้อสินค้า' }).first();
  await btn.focus();
  await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineColor)).toMatch(/solid rgb\(0, 129, 200\)/);
});

test('H7/L1: contrast ปุ่มและข้อความหลักผ่าน 4.5:1', async ({ page }) => {
  await page.goto('/product/grand-stone');
  const ratio = (fg: string, bg: string) => {
    const L = (c: string) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map((x) => +x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [a, b] = [L(fg), L(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05);
  };
  const pairs = await page.evaluate(() => {
    const bgOf = (el: Element | null): string => { while (el) { const c = getComputedStyle(el).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; el = el.parentElement; } return 'rgb(255, 255, 255)'; };
    return [...document.querySelectorAll('a.btn-line, a.btn-primary, button.btn-primary, .text-muted, .line-through, .text-cyan-700, .text-sale')]
      .filter((e) => (e as HTMLElement).offsetParent && e.textContent?.trim()).map((e) => ({ t: e.textContent!.trim().slice(0, 20), fg: getComputedStyle(e).color, bg: bgOf(e) }));
  });
  expect(pairs.length).toBeGreaterThan(5);
  for (const p of pairs) expect(ratio(p.fg, p.bg), `${p.t} ${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(4.5);
});

test('L4: ปุ่มจำนวนปิดเมื่อถึงขีดจำกัด และแจ้งเมื่อพิมพ์เกินสต็อก', async ({ page }) => {
  await page.goto('/product/grand-stone');
  await page.getByRole('button', { name: /CW-4000 G/ }).click(); // สต็อก 4 (fixture)
  await expect(page.getByRole('button', { name: 'ลดจำนวน' })).toBeDisabled();
  await page.getByLabel('จำนวน', { exact: true }).fill('500');
  await expect(page.getByLabel('จำนวน', { exact: true })).toHaveValue('4');
  await expect(page.locator('#qty-note')).toContainText('สูงสุด 4');
  await expect(page.getByRole('button', { name: 'เพิ่มจำนวน' })).toBeDisabled();
});

test('M9/L6: 404 มีเมนู/ค้นหา, ผลค้นหาว่างมีทางไปต่อ', async ({ page }) => {
  const r = await page.goto('/ไม่มีหน้านี้');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ไม่พบหน้าที่คุณต้องการ');
  await expect(page.getByRole('search').first()).toBeVisible();
  await expect(page).toHaveTitle(/ไม่พบหน้า/);
  await page.goto('/products?q=zzzz');
  await expect(page.getByRole('link', { name: 'ล้างคำค้นหา' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ขอใบเสนอราคา' }).last()).toBeVisible();
});

test('D#8: ขอใบเสนอราคาจากหน้าสินค้า ส่งชื่อสินค้าไปด้วย + error ช่องโทรชัดเจน', async ({ page }) => {
  await page.goto('/product/polytec-septic-tank');
  await page.getByRole('link', { name: 'ขอใบเสนอราคาสินค้านี้' }).click();
  await expect(page.locator('#q-detail')).toHaveValue(/สนใจสินค้า: ถังบำบัด/);
  await page.getByRole('button', { name: 'ส่งข้อมูล' }).click();
  await expect(page.getByText('กรุณากรอกเบอร์โทรศัพท์')).toBeVisible();
  await expect(page.locator('#q-name')).toBeFocused();
});
