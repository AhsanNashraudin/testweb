import { expect, test, type Page } from '@playwright/test';

/** วงจรเต็มของหลังบ้าน (แอปแยกจากเว็บ): ใบเสนอราคา → อนุมัติส่วนลด → ผลิตส่วนที่ขาด → ทดสอบรั่วซึม → ออกบิล → รับเงิน → จบงาน
 *  ใช้ ND-550 G (สต็อกตั้งต้น 100) สั่ง 102 ใบ → ต้องผลิตเพิ่ม 2 ใบ · ไม่แตะ SKU ที่เทสหน้าร้านใช้ */

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('อีเมล').fill('admin@entech.local');
  await page.getByLabel('รหัสผ่าน').fill('Entech@2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL((u) => u.pathname === '/');
}
const ok = (page: Page, text: string | RegExp) => expect(page.getByTestId('flash-ok').filter({ hasText: text })).toBeVisible();

test('ออเดอร์จากใบเสนอราคาเดินครบทุกขั้นตอน', async ({ page }) => {
  test.setTimeout(180_000);
  page.on('dialog', (d) => d.accept());
  await login(page);

  // เซลล์สร้างใบเสนอราคา → เพิ่มสินค้า ส่วนลดเกินสิทธิ์ แล้วเปิดออเดอร์
  await page.goto('/quotes?new=1');
  await page.getByLabel('ชื่อผู้ติดต่อ *').fill('คุณวิภา');
  await page.getByLabel('บริษัท / หน่วยงาน').fill('บจก.ทดสอบหลังบ้าน');
  await page.getByLabel('เรื่อง').fill('ถังน้ำ 550 ลิตร 102 ใบ');
  await page.getByRole('button', { name: /สร้าง แล้วใส่รายการ/ }).click();
  await page.waitForURL(/\/quotes\/\d+$/);
  await page.getByLabel('เพิ่มสินค้า').fill('ND-550 G');
  await page.getByLabel('จำนวน', { exact: true }).fill('102');
  await page.getByRole('button', { name: '+ เพิ่ม' }).click();
  await expect(page.getByText('ขาด 2 · ต้องผลิต')).toBeVisible();
  await page.getByLabel('ส่วนลด (%)').fill('8');
  await page.getByRole('button', { name: /บันทึกข้อมูลลูกค้า/ }).click();
  await expect(page.getByText('ส่วนลดเกินสิทธิ์')).toBeVisible();
  await page.getByRole('button', { name: 'ลูกค้ายืนยัน · เปิดออเดอร์' }).click();
  await page.getByRole('link', { name: /ไปที่ออเดอร์/ }).click(); // ฟอร์มถูกแทนด้วยลิงก์ไปออเดอร์
  await page.waitForURL(/\/orders\/\d+$/);

  // ค้างที่อนุมัติ → หัวหน้าอนุมัติ → เข้าผลิต (ใบสั่งผลิตถูกเปิดอัตโนมัติ รอวัตถุดิบเพราะคลังวัตถุดิบยังว่าง)
  const orderUrl = page.url();
  const code = (await page.locator('h1').textContent())!.match(/SO-\S+/)![0];
  await expect(page.locator('[aria-current=step]')).toContainText('อนุมัติ');
  await page.getByRole('button', { name: 'อนุมัติ และส่งต่อ' }).click();
  await ok(page, 'ผลิต');
  await expect(page.getByText('รอวัตถุดิบ')).toBeVisible();

  // รับวัตถุดิบเข้าคลัง
  await page.goto('/inventory?tab=material');
  for (const [name, qty] of [['ผงพลาสติก LLDPE', '500'], ['สีผสม (Masterbatch) ฟ้า', '20'], ['ฝาถังพร้อมขอบ', '10'], ['ชุดข้อต่อ/ลูกลอย', '10']]) {
    await page.locator('#item').selectOption({ label: name });
    await page.locator('#delta').fill(qty);
    await page.locator('#reason').fill('รับจากผู้ขาย');
    await page.getByRole('region', { name: 'รับเข้า / ปรับยอด' }).getByRole('button', { name: 'บันทึก', exact: true }).click();
    await ok(page, 'ปรับยอดแล้ว');
  }

  // โรงงาน: เริ่มผลิต → บันทึกผลจากมือถือ → ผ่านทดสอบ รับเข้าคลัง
  await page.goto('/production');
  const card = page.getByTestId('mo-card').filter({ hasText: code });
  await card.getByRole('button', { name: /เริ่มผลิต/ }).click();
  await expect(card.getByRole('link', { name: 'บันทึกผลผลิต' })).toBeVisible();
  await card.getByRole('link', { name: 'บันทึกผลผลิต' }).click();
  await page.getByRole('button', { name: 'เพิ่มผ่านทดสอบรั่วซึม (ใบ)' }).click();
  await page.getByRole('button', { name: 'บันทึก 2 ใบ' }).click();
  await expect(page.getByTestId('mo-finished')).toContainText('ผลิตครบ 2 ใบ');
  await page.goto('/production');
  await card.getByRole('button', { name: /ผ่านทดสอบ/ }).click();
  await expect(card.getByRole('button')).toHaveCount(0); // ย้ายไปช่อง "เข้าคลังแล้ว"

  // แพ็ค/ส่ง → ออกใบกำกับ → ออกบิล → รับเงิน → จบงาน
  await page.goto(orderUrl);
  await page.getByRole('button', { name: /ส่งต่อ: แพ็ค\/ส่ง/ }).click();
  await ok(page, 'แพ็ค/ส่ง');
  await page.getByRole('button', { name: 'ออกใบกำกับภาษี' }).click();
  await expect(page.getByRole('link', { name: /^INV-/ })).toBeVisible(); // ฟอร์มถูกแทนด้วยเอกสารที่ออกแล้ว
  await page.getByRole('button', { name: /ส่งต่อ: ออกบิล/ }).click();
  await ok(page, 'ออกบิล');
  await page.getByRole('button', { name: /ส่งต่อ: รับเงิน/ }).click();
  await ok(page, 'รับเงิน');
  await page.getByRole('button', { name: 'บันทึกรับเงิน' }).click();
  await expect(page.getByText(/^RC-/)).toBeVisible();
  await page.getByRole('button', { name: /ส่งต่อ: จบงาน/ }).click();
  await expect(page.getByRole('button', { name: 'ยกเลิกออเดอร์' })).toHaveCount(0); // ปิดงานแล้ว ปุ่มหายไป
  await expect(page.getByRole('heading', { level: 1 })).toContainText('สำเร็จ');
  await expect(page.locator('h1')).toContainText(code);

  // บัญชี: ส่งออก CSV มีใบกำกับของออเดอร์นี้
  const now = new Date(Date.now() + 7 * 3600e3);
  const csv = await (await page.request.get(`/accounting/export?month=${now.toISOString().slice(0, 7)}`)).text();
  expect(csv).toContain(code);
});
