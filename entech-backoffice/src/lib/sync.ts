/** เชื่อมเว็บไซต์ผ่าน Stock API v1 (หลังบ้านเป็น master ของ SKU/ราคา/สต็อก · เว็บสร้างออเดอร์)
 *  ลำดับทุกรอบ: ดึงออเดอร์ → ส่งสถานะ/เลขพัสดุกลับ → ส่งสต็อก (ต้องส่งสต็อกหลังตัดยอดออเดอร์เว็บแล้วเสมอ) */
import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { getSetting, logEvent, restock, setSetting } from '@/lib/backoffice';
import { nowSec } from '@/lib/util';
import { ensureFactory } from '@/lib/factory';

type WebOrder = {
  code: string; status: typeof s.orders.$inferSelect.status; createdAt: string;
  customer: { name: string; phone: string; email: string };
  shipping: { label: string; address: string; province: string; postcode: string; carrier: string; trackingNo: string; trackingUrl: string };
  taxInvoice: { name: string; taxId: string; branch?: string; address: string } | null;
  amounts: { subtotal: number; discount: number; shippingFee: number; vat: number; total: number };
  note: string;
  items: { sku: string; productName: string; variantName: string; unitPrice: number; qty: number }[];
};
type WebItem = { sku: string; variantName: string; price: number; bulkPrice: number; bulkMinQty: number; stock: number; weightKg: number; productCode: string; productName: string; category: string };

const SYS = 'ระบบ (เว็บไซต์)';
// ออเดอร์ที่เว็บดำเนินการไปแล้วก่อนเข้าหลังบ้าน เริ่มที่ขั้นที่ตรงกัน
const WEB_STAGE = { pending_payment: 'received', paid: 'received', preparing: 'packing', shipping: 'billing', completed: 'done', cancelled: 'cancelled' } as const;

export function webConfigured() { return Boolean(process.env.WEB_API_URL && process.env.WEB_API_KEY); }

async function api<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  if (!webConfigured()) throw new Error('ยังไม่ได้ตั้งค่า WEB_API_URL / WEB_API_KEY');
  const res = await fetch(process.env.WEB_API_URL!.replace(/\/$/, '') + path, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${process.env.WEB_API_KEY}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status >= 400 && res.status !== 207) {
    // แปลงคำตอบของเว็บเป็นข้อความที่พนักงานอ่านได้ (ไม่โชว์ JSON ดิบ)
    const b = body as { data?: { sku?: string; message?: string }[]; error?: string; message?: string };
    const perSku = Array.isArray(b.data) ? b.data.filter((x) => x.message).slice(0, 5).map((x) => `${x.sku}: ${x.message}`).join(' · ') : '';
    const why = perSku || b.error || b.message || '';
    throw new Error(res.status === 401 ? 'เว็บไม่ยอมรับคีย์ (WEB_API_KEY ไม่ตรงกับ STOCK_API_KEY ของเว็บ)' : `เว็บไม่รับข้อมูล (รหัส ${res.status})${why ? ` — ${String(why).slice(0, 300)}` : ''}`);
  }
  return { status: res.status, body: body as T };
}

/** ครั้งแรก: นำเข้า SKU จากเว็บ (SKU ที่มีอยู่แล้วไม่ทับ เพราะหลังบ้านเป็น master) */
export async function importItems() {
  const { body } = await api<{ data: WebItem[] }>('/items');
  let added = 0;
  for (const w of body.data) {
    const r = await db.insert(s.items).values({
      sku: w.sku, productCode: w.productCode, productName: w.productName, variantName: w.variantName, category: w.category,
      price: w.price, bulkPrice: w.bulkPrice, bulkMinQty: w.bulkMinQty, stock: w.stock, weightKg: w.weightKg,
    }).onConflictDoNothing().returning({ id: s.items.id });
    added += r.length;
  }
  await ensureFactory();
  return { total: body.data.length, added };
}

async function upsertOrder(w: WebOrder) {
  const [cur] = await db.select().from(s.orders).where(eq(s.orders.code, w.code));
  if (!cur) {
    const skus = await db.select({ id: s.items.id, sku: s.items.sku }).from(s.items).where(inArray(s.items.sku, w.items.map((i) => i.sku)));
    const idOf = new Map(skus.map((x) => [x.sku, x.id]));
    const at = Math.floor(new Date(w.createdAt).getTime() / 1000) || nowSec();
    const live = w.status !== 'cancelled';
    await db.transaction(async (tx) => {
      const [o] = await tx.insert(s.orders).values({
        code: w.code, channel: 'web', status: w.status, stage: WEB_STAGE[w.status], stageAt: nowSec(),
        name: w.customer.name, phone: w.customer.phone, email: w.customer.email,
        address: w.shipping.address, province: w.shipping.province, postcode: w.shipping.postcode, shippingLabel: w.shipping.label,
        carrier: w.shipping.carrier, trackingNo: w.shipping.trackingNo, trackingUrl: w.shipping.trackingUrl,
        taxName: w.taxInvoice?.name ?? '', taxId: w.taxInvoice?.taxId ?? '', taxAddress: w.taxInvoice ? [w.taxInvoice.address, w.taxInvoice.branch].filter(Boolean).join(' · ') : '',
        note: w.note, ...w.amounts, createdAt: at, paidAt: ['pending_payment', 'cancelled'].includes(w.status) ? 0 : nowSec(),
      }).returning();
      for (const i of w.items) {
        const itemId = idOf.get(i.sku) ?? null;
        await tx.insert(s.orderItems).values({ orderId: o.id, itemId, sku: i.sku, productName: i.productName, variantName: i.variantName, unitPrice: i.unitPrice, qty: i.qty });
        // เว็บตัดสต็อกของตัวเองแล้ว หลังบ้านตัดตาม แล้วส่งยอดจริงกลับในขั้นสุดท้ายของรอบ
        if (itemId && live) await tx.update(s.items).set({ stock: sqlMinus(i.qty), pushPending: true }).where(eq(s.items.id, itemId));
        if (itemId && live) await tx.insert(s.stockMoves).values({ kind: 'item', itemId, qty: -i.qty, reason: 'ขายผ่านเว็บไซต์', ref: w.code, by: SYS, at: nowSec() });
      }
      const unknown = w.items.filter((i) => !idOf.has(i.sku)).map((i) => i.sku);
      await logEvent(o.id, 'received', `รับออเดอร์จากเว็บไซต์${unknown.length ? ` · SKU ที่ยังไม่มีในหลังบ้าน: ${unknown.join(', ')}` : ''}`, SYS, tx);
    });
    return 'new';
  }
  if (cur.statusPending || cur.status === w.status) return 'same'; // หลังบ้านเป็นผู้ส่งสถานะล่าสุด
  // รับการเปลี่ยนแปลงจากหลังบ้านเว็บเฉพาะ: ยืนยันชำระเงิน และยกเลิก
  if (w.status === 'cancelled' && cur.stage !== 'cancelled') {
    await db.transaction(async (tx) => {
      await restock(cur.id, cur.code, SYS, tx);
      await tx.update(s.orders).set({ status: 'cancelled', stage: 'cancelled', stageAt: nowSec() }).where(eq(s.orders.id, cur.id));
      await logEvent(cur.id, 'cancelled', 'ยกเลิกจากหลังบ้านเว็บไซต์', SYS, tx);
    });
    return 'updated';
  }
  if (w.status === 'paid' && cur.status === 'pending_payment') {
    await db.update(s.orders).set({ status: 'paid', paidAt: nowSec() }).where(eq(s.orders.id, cur.id));
    await logEvent(cur.id, 'note', 'เว็บไซต์ยืนยันรับชำระเงินแล้ว', SYS);
    return 'updated';
  }
  return 'same';
}

const sqlMinus = (q: number) => sql`${s.items.stock} - ${q}`;

export async function pullOrders() {
  let cursor = await getSetting('orders_cursor');
  const n = { new: 0, updated: 0 };
  for (let page = 0; page < 50; page++) {
    const q = cursor ? `cursor=${encodeURIComponent(cursor)}` : 'updatedSince=2000-01-01T00:00:00Z';
    const { body } = await api<{ data: WebOrder[]; nextCursor: string | null; lastCursor?: string | null }>(`/orders?limit=100&${q}`);
    for (const w of body.data) {
      const r = await upsertOrder(w);
      if (r !== 'same') n[r]++;
    }
    // จุดล่าสุดที่ตัดยอดเข้าสต็อกหลังบ้านแล้ว — ส่งเป็น asOf ตอน pushItems ให้เว็บหักออเดอร์ที่เกิดหลังจากนี้
    if (body.lastCursor) await setSetting('orders_seen', body.lastCursor);
    if (!body.nextCursor) break;
    cursor = body.nextCursor;
    await setSetting('orders_cursor', cursor);
  }
  return n;
}

export async function pushOrderStatus() {
  const rows = await db.select().from(s.orders).where(and(eq(s.orders.channel, 'web'), eq(s.orders.statusPending, true)));
  let ok = 0;
  const errors: string[] = [];
  for (const o of rows) {
    try {
      await api(`/orders/${encodeURIComponent(o.code)}`, { method: 'PATCH', body: JSON.stringify({ status: o.status, carrier: o.carrier, trackingNo: o.trackingNo, trackingUrl: o.trackingUrl }) });
      await db.update(s.orders).set({ statusPending: false }).where(eq(s.orders.id, o.id));
      ok++;
    } catch (e) { errors.push(`${o.code}: ${(e as Error).message}`); }
  }
  return { ok, errors };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export async function pushItems() {
  const rows = await db.select().from(s.items).where(eq(s.items.pushPending, true));
  const asOf = (await getSetting('orders_seen')) || undefined;
  const errors: string[] = [];
  let ok = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { body } = await api<{ data: { sku: string; result: string; message?: string }[] }>('/items', {
      method: 'PUT',
      body: JSON.stringify({ items: chunk.map((x) => ({
        sku: x.sku, stock: Math.max(0, x.stock), price: x.price, bulkPrice: x.bulkPrice, bulkMinQty: x.bulkMinQty, weightKg: x.weightKg,
        ...(x.variantName && { variantName: x.variantName }),
        ...(SLUG.test(x.productCode) && { product: { code: x.productCode, ...(x.productName.length >= 2 && { name: x.productName }), ...(x.category && { category: x.category }) } }),
      })), ...(asOf && { asOf }) }),
    });
    const done = new Set(body.data.filter((r) => r.result !== 'error').map((r) => r.sku));
    for (const r of body.data) if (r.result === 'error') errors.push(`${r.sku}: ${r.message}`);
    // ล้างธง pushPending เฉพาะแถวที่ค่ายังตรงกับที่ส่งไป — ถ้าระหว่างส่งมีการแก้สต็อก/ราคา ธงจะค้างไว้ส่งรอบหน้า
    for (const x of chunk) {
      if (!done.has(x.sku)) continue;
      await db.update(s.items).set({ pushPending: false }).where(and(
        eq(s.items.id, x.id), eq(s.items.stock, x.stock), eq(s.items.price, x.price), eq(s.items.bulkPrice, x.bulkPrice),
        eq(s.items.bulkMinQty, x.bulkMinQty), eq(s.items.weightKg, x.weightKg), eq(s.items.productName, x.productName),
        eq(s.items.variantName, x.variantName), eq(s.items.productCode, x.productCode), eq(s.items.category, x.category),
      ));
    }
    ok += done.size;
  }
  return { ok, errors };
}

/** หนึ่งรอบซิงค์ · เก็บผลไว้แสดงในหน้า "เชื่อมเว็บไซต์" */
export async function runSync() {
  const started = Date.now();
  try {
    if (!(await getSetting('items_imported'))) { await importItems(); await setSetting('items_imported', '1'); }
    const orders = await pullOrders();
    const status = await pushOrderStatus();
    const items = await pushItems();
    const errors = [...status.errors, ...items.errors];
    const msg = `ออเดอร์ใหม่ ${orders.new} · อัปเดต ${orders.updated} · ส่งสถานะ ${status.ok} · ส่งสต็อก ${items.ok}${errors.length ? ` · ผิดพลาด ${errors.length}` : ''}`;
    await setSetting('sync_last', JSON.stringify({ at: nowSec(), ok: !errors.length, msg, errors: errors.slice(0, 20), ms: Date.now() - started }));
    return { ok: !errors.length, msg };
  } catch (e) {
    const msg = (e as Error).message;
    await setSetting('sync_last', JSON.stringify({ at: nowSec(), ok: false, msg, errors: [], ms: Date.now() - started }));
    return { ok: false, msg };
  }
}
