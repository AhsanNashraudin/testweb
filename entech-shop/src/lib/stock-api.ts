/** API สำหรับระบบสต็อก/ERP ภายนอก (เอกสาร: docs/STOCK-API.md)
 *  ยืนยันตัวตนด้วย  Authorization: Bearer <STOCK_API_KEY>  — ไม่ได้ตั้งค่า = ปิด API ทั้งชุด */
import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { OrderError } from '@/lib/orders';
import type { schema as s } from '@/db';

export const stockApiEnabled = () => (process.env.STOCK_API_KEY ?? '').trim().length >= 32;

const digest = (v: string) => createHash('sha256').update(v).digest();

/** คืน Response เมื่อไม่ผ่าน (ให้ route return ทันที) · null = ผ่าน */
export function checkKey(req: Request): NextResponse | null {
  const key = (process.env.STOCK_API_KEY ?? '').trim();
  if (key.length < 32) return NextResponse.json({ error: 'stock_api_disabled' }, { status: 503 });
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!got || !timingSafeEqual(digest(got), digest(key))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
  }
  return null;
}

export function fail(e: unknown) {
  if (e instanceof ZodError) return NextResponse.json({ error: 'invalid_request', issues: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }, { status: 400 });
  if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.code });
  console.error(e);
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
}

type Order = typeof s.orders.$inferSelect;
type Item = typeof s.orderItems.$inferSelect;
const iso = (sec: number) => new Date(sec * 1000).toISOString();
export const changedAt = (o: Order) => Math.max(o.updatedAt, Math.floor(o.createdAt.getTime() / 1000));

/** รูปแบบคำสั่งซื้อที่ส่งให้ระบบภายนอก (จำนวนเงินเป็นบาท จำนวนเต็ม) — ไม่ส่ง accessKey */
export function orderJson(o: Order, items: Item[]) {
  return {
    code: o.code, status: o.status,
    createdAt: o.createdAt.toISOString(), updatedAt: iso(changedAt(o)),
    customer: { name: o.name, phone: o.phone, email: o.email },
    shipping: {
      method: o.shippingOption === 'pickup' ? 'pickup' : 'delivery', label: o.shippingLabel,
      address: o.address, province: o.province, postcode: o.postcode, weightKg: o.weightKg,
      carrier: o.carrier, trackingNo: o.trackingNo, trackingUrl: o.trackingUrl,
    },
    taxInvoice: o.taxId ? { name: o.taxName, taxId: o.taxId, branch: o.taxBranch || 'สำนักงานใหญ่', address: o.taxAddress } : null,
    payment: { method: o.paymentMethod, couponCode: o.couponCode },
    amounts: { subtotal: o.subtotal, discount: o.discount, shippingFee: o.shippingFee, vat: o.vat, total: o.total },
    note: o.note,
    items: items.map((i) => ({ sku: i.sku, productName: i.productName, variantName: i.variantName, unitPrice: i.unitPrice, qty: i.qty, lineTotal: i.unitPrice * i.qty })),
  };
}
