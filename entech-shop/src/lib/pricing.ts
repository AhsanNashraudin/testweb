export interface Coupon {
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  minSubtotal: number;
  isActive: boolean;
}

export interface PricedLine {
  variantId: number;
  qty: number;
  unitPrice: number;
  weightKg: number;
}

export const MAX_QTY = 99;

export function subtotalOf(lines: PricedLine[]) {
  return lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
}

export function weightOf(lines: PricedLine[]) {
  return lines.reduce((s, l) => s + l.weightKg * l.qty, 0);
}

/** คืนส่วนลด (บาท) หรือ error ภาษาไทย ถ้าโค้ดใช้ไม่ได้ */
export function applyCoupon(coupon: Coupon | null | undefined, subtotal: number): { discount: number; error?: string } {
  if (!coupon || !coupon.isActive) return { discount: 0, error: 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ' };
  if (subtotal < coupon.minSubtotal)
    return { discount: 0, error: `ใช้ได้เมื่อซื้อครบ ฿${coupon.minSubtotal.toLocaleString('th-TH')}` };
  const raw = coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  return { discount: Math.min(Math.max(0, raw), subtotal) };
}

export const VAT_RATE = 0.07;

/** ราคาต่อหน่วยตามจำนวน: ถึงขั้นราคาส่ง (เช่น 5 ใบขึ้นไป) ใช้ราคาส่ง */
export function unitPriceFor(v: { price: number; bulkPrice: number; bulkMinQty: number }, qty: number) {
  return v.bulkPrice > 0 && v.bulkMinQty > 0 && qty >= v.bulkMinQty ? v.bulkPrice : v.price;
}

/** VAT ที่ต้องบวกเพิ่ม (เมื่อราคาสินค้ายังไม่รวม VAT) — ปัดเป็นบาท */
export function vatOf(amount: number, pricesIncludeVat: boolean) {
  return pricesIncludeVat ? 0 : Math.round(amount * VAT_RATE);
}

/** ราคาก่อนลด (mock up) = ราคาขาย + markup% · 0 = ไม่แสดง */
export function compareAt(price: number, markupPct: number) {
  return price > 0 && markupPct > 0 ? Math.round((price * (100 + markupPct)) / 100) : 0;
}
