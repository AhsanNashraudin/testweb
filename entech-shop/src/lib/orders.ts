/** เปลี่ยนสถานะ/เลขพัสดุของคำสั่งซื้อ — ใช้ร่วมกันระหว่างหลังบ้านและ API ระบบสต็อก (กฎคืน/ตัดสต็อกที่เดียว) */
import 'server-only';
import { and, eq, lt } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { STATUS_TH } from '@/lib/status';

export type OrderStatus = (typeof s.orders.$inferSelect)['status'];
export type OrderPatch = { status?: string; carrier?: string; trackingNo?: string; trackingUrl?: string };
export class OrderError extends Error { constructor(msg: string, public code = 400) { super(msg); } }

export const nowSec = () => Math.floor(Date.now() / 1000);

export async function updateOrder(id: number, p: OrderPatch) {
  if (p.status !== undefined && !Object.hasOwn(STATUS_TH, p.status)) throw new OrderError('สถานะไม่ถูกต้อง');
  if (p.trackingUrl && !/^https:\/\//.test(p.trackingUrl)) throw new OrderError('trackingUrl ต้องขึ้นต้นด้วย https://');
  return db.transaction(async (tx) => {
    // อ่านสถานะเดิมภายใน transaction เดียวกัน กันกดซ้ำแล้วคืนสต็อกสองรอบ
    const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, id));
    if (!o) throw new OrderError('ไม่พบคำสั่งซื้อ', 404);
    const status = (p.status ?? o.status) as OrderStatus;
    // ยกเลิกคำสั่งซื้อ → คืนสต็อก (ทำครั้งเดียว), กลับมาใช้งาน → ตัดสต็อกอีกครั้ง
    if ((status === 'cancelled') !== (o.status === 'cancelled')) {
      const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, id));
      for (const it of items) {
        const [v] = await tx.select().from(s.variants).where(eq(s.variants.id, it.variantId));
        if (!v) continue;
        const stock = status === 'cancelled' ? v.stock + it.qty : v.stock - it.qty;
        if (stock < 0) throw new OrderError(`สต็อก ${it.sku} ไม่พอสำหรับเปิดคำสั่งซื้อนี้อีกครั้ง`, 409);
        await tx.update(s.variants).set({ stock }).where(eq(s.variants.id, v.id));
      }
    }
    const clip = (v: string | undefined, cur: string, max: number) => (v === undefined ? cur : v.trim().slice(0, max));
    const [r] = await tx.update(s.orders).set({
      status,
      carrier: clip(p.carrier, o.carrier, 80), trackingNo: clip(p.trackingNo, o.trackingNo, 80), trackingUrl: clip(p.trackingUrl, o.trackingUrl, 500),
      updatedAt: nowSec(),
    }).where(eq(s.orders.id, id)).returning();
    return r;
  });
}

/** คำสั่งซื้อที่ยังไม่ชำระจะจองสต็อกไว้ไม่เกิน RESERVE_HOURS ชม. แล้วยกเลิกอัตโนมัติ (คืนสต็อก)
 *  กันคนสร้างออเดอร์ปลอมกักสต็อกจนลูกค้าจริงซื้อไม่ได้ · ปรับได้ด้วย env ORDER_RESERVE_HOURS */
export const RESERVE_HOURS = Math.max(1, Number(process.env.ORDER_RESERVE_HOURS) || 48);
export const MAX_PENDING_PER_CONTACT = Math.max(1, Number(process.env.ORDER_MAX_PENDING) || 3);
let lastSweep = 0;
export async function releaseExpiredOrders(force = false) {
  if (!force && Date.now() - lastSweep < 60_000) return 0; // อย่างมากนาทีละครั้งต่อ instance
  lastSweep = Date.now();
  const cutoff = new Date(Date.now() - RESERVE_HOURS * 3600e3);
  const expired = await db.select({ id: s.orders.id }).from(s.orders)
    .where(and(eq(s.orders.status, 'pending_payment'), lt(s.orders.createdAt, cutoff))).limit(100);
  for (const o of expired) await updateOrder(o.id, { status: 'cancelled' }).catch((e) => console.error('expire order', o.id, e));
  return expired.length;
}
