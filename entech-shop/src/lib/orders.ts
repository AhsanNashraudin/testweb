/** เปลี่ยนสถานะ/เลขพัสดุของคำสั่งซื้อ — ใช้ร่วมกันระหว่างหลังบ้านและ API ระบบสต็อก (กฎคืน/ตัดสต็อกที่เดียว) */
import 'server-only';
import { eq } from 'drizzle-orm';
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
