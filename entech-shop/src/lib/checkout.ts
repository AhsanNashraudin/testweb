import 'server-only';
import { z } from 'zod';
import { eq, inArray, and, gte, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { isProvince } from './provinces';
import { quoteShipping, type ShippingOption } from './shipping';
import { applyCoupon, subtotalOf, weightOf, unitPriceFor, vatOf, MAX_QTY } from './pricing';
import { loadShippingConfig, getSettings } from './settings';
import { releaseExpiredOrders, MAX_PENDING_PER_CONTACT } from './orders';

export const itemsSchema = z
  .array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(MAX_QTY) }))
  .max(50);

export const previewSchema = z.object({
  items: itemsSchema,
  province: z.string().trim().max(50).default(''),
  couponCode: z.string().trim().toUpperCase().max(30).default(''),
});

const PHONE = z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์').regex(/^0\d{8,9}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)'));

/** ตรวจทุกช่องในรอบเดียว — ลูกค้าเห็นข้อผิดพลาดครบในการกดยืนยันครั้งเดียว */
export const orderSchema = previewSchema.extend({
  name: z.string().trim().min(2, 'กรุณากรอกชื่อ-นามสกุล').max(100),
  phone: PHONE,
  email: z.string().trim().min(1, 'กรุณากรอกอีเมล').email('อีเมลไม่ถูกต้อง').max(120),
  address: z.string().trim().max(300).default(''),
  postcode: z.string().trim().max(5).default(''),
  wantTax: z.boolean().default(false),
  taxName: z.string().trim().max(150).default(''),
  taxId: z.string().trim().max(13).default(''),
  taxBranch: z.string().trim().max(60).default(''),
  taxAddress: z.string().trim().max(300).default(''),
  note: z.string().trim().max(500).default(''),
  shippingOptionId: z.string().default(''),
  paymentMethod: z.enum(['promptpay', 'transfer'], { message: 'กรุณาเลือกวิธีชำระเงิน' }),
}).superRefine((o, ctx) => {
  const add = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (!isProvince(o.province)) add('province', 'กรุณาเลือกจังหวัด');
  if (!o.shippingOptionId) add('shippingOptionId', 'กรุณาเลือกวิธีจัดส่ง');
  else if (o.shippingOptionId !== 'pickup') {
    if (o.address.length < 5) add('address', 'กรุณากรอกที่อยู่จัดส่ง (บ้านเลขที่ ถนน ตำบล อำเภอ)');
    if (!/^\d{5}$/.test(o.postcode)) add('postcode', 'รหัสไปรษณีย์ 5 หลัก');
  }
  if (o.wantTax) {
    if (o.taxName.length < 2) add('taxName', 'กรุณากรอกชื่อบริษัท/ผู้เสียภาษี');
    if (!/^\d{13}$/.test(o.taxId)) add('taxId', 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
    if (o.taxAddress.length < 5) add('taxAddress', 'กรุณากรอกที่อยู่สำหรับออกใบกำกับภาษี');
  }
});

export type PreviewInput = z.input<typeof previewSchema>;
export interface PreviewLine {
  variantId: number; productId: number; slug: string; productName: string; variantName: string; sku: string;
  image: string; unitPrice: number; listPrice: number; qty: number; stock: number; weightKg: number; error?: string;
  bulkPrice: number; bulkMinQty: number;
}
export interface Preview {
  lines: PreviewLine[]; subtotal: number; discount: number; couponError?: string; weightKg: number;
  shippingOptions: ShippingOption[]; provinceError?: string; hasErrors: boolean; transferEnabled: boolean; pricesIncludeVat: boolean;
}

/** รวมรายการ variant ซ้ำ และจำกัดจำนวนสูงสุด */
export function mergeItems(items: { variantId: number; qty: number }[]) {
  const m = new Map<number, number>();
  for (const i of items) m.set(i.variantId, Math.min(MAX_QTY, (m.get(i.variantId) ?? 0) + i.qty));
  return [...m].map(([variantId, qty]) => ({ variantId, qty }));
}

/** คำนวณตะกร้าใหม่ทั้งหมดจากราคาใน DB — ไม่เชื่อราคาจากฝั่งลูกค้า */
export async function buildPreview(raw: PreviewInput): Promise<Preview> {
  await releaseExpiredOrders();
  const input = previewSchema.parse(raw);
  const items = mergeItems(input.items);
  const ids = items.map((i) => i.variantId);
  const rows = ids.length
    ? await db
        .select({ v: s.variants, p: s.products })
        .from(s.variants)
        .innerJoin(s.products, eq(s.products.id, s.variants.productId))
        .where(and(inArray(s.variants.id, ids), eq(s.products.isActive, true)))
    : [];
  const byId = new Map(rows.map((r) => [r.v.id, r]));
  const lines: PreviewLine[] = [];
  for (const it of items) {
    const r = byId.get(it.variantId);
    if (!r) continue; // สินค้าถูกลบ/ปิดขาย → ตัดออกจากตะกร้า
    lines.push({
      variantId: r.v.id, productId: r.p.id, slug: r.p.slug, productName: r.p.name, variantName: r.v.name, sku: r.v.sku,
      image: r.p.image, unitPrice: unitPriceFor(r.v, it.qty), listPrice: r.v.price, qty: it.qty, stock: r.v.stock, weightKg: r.v.weightKg,
      bulkPrice: r.v.bulkPrice, bulkMinQty: r.v.bulkMinQty,
      error: r.v.price <= 0 ? 'สินค้านี้สอบถามราคากับฝ่ายขาย' : r.v.stock <= 0 ? 'สินค้าหมด' : r.v.stock < it.qty ? `เหลือเพียง ${r.v.stock} ชิ้น` : undefined,
    });
  }
  const subtotal = subtotalOf(lines);
  let discount = 0, couponError: string | undefined;
  if (input.couponCode) {
    const [c] = await db.select().from(s.coupons).where(eq(s.coupons.code, input.couponCode));
    ({ discount, error: couponError } = applyCoupon(c, subtotal));
  }
  const weightKg = Math.round(weightOf(lines) * 100) / 100;
  let shippingOptions: ShippingOption[] = [], provinceError: string | undefined;
  const cfg = await loadShippingConfig();
  if (input.province) {
    if (!isProvince(input.province)) provinceError = 'จังหวัดไม่ถูกต้อง';
    else {
      shippingOptions = quoteShipping({ province: input.province, subtotal: subtotal - discount, weightKg, ...cfg });
      if (!shippingOptions.length) provinceError = 'ยังไม่เปิดจัดส่งจังหวัดนี้ กรุณาติดต่อขอใบเสนอราคา';
    }
  }
  return {
    lines, subtotal, discount, couponError, weightKg, shippingOptions, provinceError,
    hasErrors: lines.some((l) => l.error) || !!couponError,
    transferEnabled: !!cfg.settings.bank_account,
    pricesIncludeVat: cfg.settings.prices_include_vat === '1',
  };
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function orderCode() {
  const d = new Date(Date.now() + 7 * 3600e3).toISOString(); // เวลาไทย
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  return `ET${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}-${rnd}`;
}

export const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

export class CheckoutError extends Error {
  constructor(public fields: Record<string, string>) { super(Object.values(fields)[0]); }
}

export async function createOrder(raw: unknown) {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    throw new CheckoutError(fields);
  }
  const o = parsed.data;
  if (o.paymentMethod === 'transfer') {
    const st = await getSettings();
    if (!st.bank_account) throw new CheckoutError({ paymentMethod: 'ขณะนี้ยังไม่เปิดรับชำระแบบโอนผ่านบัญชี กรุณาเลือก PromptPay' });
  }
  // จำกัดออเดอร์ค้างชำระต่อผู้ติดต่อ กันการกักสต็อกด้วยออเดอร์ปลอมจำนวนมาก
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(s.orders)
    .where(and(eq(s.orders.status, 'pending_payment'), sql`(${s.orders.phone} = ${o.phone} or lower(${s.orders.email}) = lower(${o.email}))`));
  if (Number(n) >= MAX_PENDING_PER_CONTACT) throw new CheckoutError({ items: `มีคำสั่งซื้อรอชำระอยู่แล้ว ${n} รายการ กรุณาชำระหรือติดต่อร้านก่อนสั่งเพิ่ม` });
  const pv = await buildPreview(o);
  if (!pv.lines.length) throw new CheckoutError({ items: 'ตะกร้าว่าง' });
  if (pv.hasErrors) throw new CheckoutError({ items: pv.couponError ?? pv.lines.find((l) => l.error)!.error! });
  const ship = pv.shippingOptions.find((x) => x.id === o.shippingOptionId);
  if (!ship) throw new CheckoutError({ shippingOptionId: pv.provinceError ?? 'วิธีจัดส่งไม่ถูกต้อง กรุณาเลือกใหม่' });
  const tax = o.wantTax ? { taxName: o.taxName, taxId: o.taxId, taxBranch: o.taxBranch || 'สำนักงานใหญ่', taxAddress: o.taxAddress } : { taxName: '', taxId: '', taxBranch: '', taxAddress: '' };
  const isPickup = ship.id === 'pickup';

  const beforeVat = pv.subtotal - pv.discount + ship.fee;
  const vat = vatOf(beforeVat, pv.pricesIncludeVat);
  const total = beforeVat + vat;
  return db.transaction(async (tx) => {
    for (const l of pv.lines) {
      const r = await tx
        .update(s.variants)
        .set({ stock: sql`${s.variants.stock} - ${l.qty}` })
        .where(and(eq(s.variants.id, l.variantId), gte(s.variants.stock, l.qty)))
        .returning({ id: s.variants.id });
      if (!r.length) throw new CheckoutError({ items: `${l.productName} (${l.variantName}) สต็อกไม่พอ` });
    }
    const [order] = await tx
      .insert(s.orders)
      .values({
        code: orderCode(), accessKey: randomKey(), name: o.name, phone: o.phone, email: o.email, address: isPickup ? '' : o.address, province: o.province,
        postcode: isPickup ? '' : o.postcode, ...tax, note: o.note, shippingOption: ship.id,
        shippingLabel: ship.label, paymentMethod: o.paymentMethod, couponCode: pv.discount ? o.couponCode : '',
        subtotal: pv.subtotal, discount: pv.discount, shippingFee: ship.fee, vat, total, weightKg: pv.weightKg,
      })
      .returning();
    await tx.insert(s.orderItems).values(
      pv.lines.map((l) => ({ orderId: order.id, variantId: l.variantId, productName: l.productName, variantName: l.variantName, sku: l.sku, unitPrice: l.unitPrice, qty: l.qty })),
    );
    return order;
  });
}
