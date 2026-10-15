import type { APIRequestContext } from '@playwright/test';

export const CUSTOMER = { name: 'สมชาย ทดสอบ', phone: '081-234-5678', email: 'somchai@example.com', address: '99/1 ม.2 ถ.พระราม 2', postcode: '10150' };

/** หา variantId จาก SKU ผ่านหน้าสินค้า (ใช้ API preview ไม่ได้เพราะต้องมี id) — เก็บ map ไว้จาก seed */
export const SKU: Record<string, number> = {};

export async function loadSkus(request: APIRequestContext) {
  if (Object.keys(SKU).length) return SKU;
  // ไล่ยิง preview ทีละ 50 id (ขีดจำกัดของ API) เพื่อสร้าง map sku → id
  for (let start = 1; start <= 300; start += 50) {
    const r = await request.post('/api/checkout/preview', { data: { items: Array.from({ length: 50 }, (_, i) => ({ variantId: start + i, qty: 1 })) } });
    const { lines } = await r.json();
    if (!lines.length) break;
    for (const l of lines) SKU[l.sku] = l.variantId;
  }
  return SKU;
}

export const order = (items: { variantId: number; qty: number }[], extra: Record<string, unknown> = {}) => ({
  items, province: 'กรุงเทพมหานคร', couponCode: '', ...CUSTOMER, shippingOptionId: '', paymentMethod: 'promptpay', ...extra,
});
