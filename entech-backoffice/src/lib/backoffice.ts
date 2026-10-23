/** งานหลังบ้าน: ขั้นตอนออเดอร์ โรงงาน สต็อก บัญชี (กฎล้วนอยู่ใน backoffice-rules.ts) */
import 'server-only';
import { and, desc, eq, inArray, like, notInArray, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { BoError, nowSec } from '@/lib/util';
import { docCode, docHead, lateBy, MAX_SALES_DISCOUNT, nextStage, quoteTotals, shortages, slaHours, splitVat, STAGE_OWNER, STAGE_TH, type Stage } from '@/lib/backoffice-rules';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Status = typeof s.orders.$inferSelect.status;
const OPEN_MO = ['waiting', 'queued', 'in_progress', 'qc'] as const;

const DOC = { INV: [s.invoices, s.invoices.code], RC: [s.invoices, s.invoices.receiptCode], MO: [s.productionOrders, s.productionOrders.code], SO: [s.orders, s.orders.code], QT: [s.quotes, s.quotes.code] } as const;
/** เลขเอกสารถัดไป เช่น INV-6910-0001 */
export async function nextDoc(prefix: keyof typeof DOC) {
  const [table, col] = DOC[prefix];
  // หาเลขล่าสุดเฉพาะของเดือนนี้ เรียงตามความยาวก่อน (กันเลขรูปแบบอื่น เช่น QT-DEMO-… หรือ 4 หลักกับ 5 หลัก)
  const now = new Date();
  const [last] = await db.select({ c: col }).from(table).where(like(col, `${docHead(prefix, now)}%`)).orderBy(desc(sql`length(${col})`), desc(col)).limit(1);
  return docCode(prefix, now, last?.c);
}

export async function getSetting(key: string, fallback = '') {
  const [r] = await db.select().from(s.settings).where(eq(s.settings.key, key));
  return r?.value ?? fallback;
}
export async function setSetting(key: string, value: string) {
  await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
}

/** stage = ขั้นที่เข้าสู่ (การเปลี่ยนขั้น) · 'note' = บันทึกทั่วไป (ไม่นับในไทม์ไลน์ขั้นตอน) */
export async function logEvent(orderId: number, stage: string, note: string, by: string, tx: Tx | typeof db = db) {
  await tx.insert(s.orderEvents).values({ orderId, stage, note, by, at: nowSec() });
}

/** เปลี่ยนจำนวนสต็อกสินค้า + บันทึกความเคลื่อนไหว + ตั้งธงให้ส่งยอดใหม่ไปเว็บ */
async function moveItem(tx: Tx | typeof db, itemId: number, qty: number, reason: string, ref: string, by: string) {
  if (!qty) return;
  await tx.update(s.items).set({ stock: sql`${s.items.stock} + ${qty}`, pushPending: true }).where(eq(s.items.id, itemId));
  await tx.insert(s.stockMoves).values({ kind: 'item', itemId, qty, reason, ref, by, at: nowSec() });
}

/** สถานะที่ลูกค้าเห็น · ออเดอร์จากเว็บจะถูกส่งกลับเว็บในรอบ sync ถัดไป */
async function setStatus(orderId: number, status: Status) {
  const [o] = await db.select({ channel: s.orders.channel, status: s.orders.status }).from(s.orders).where(eq(s.orders.id, orderId));
  if (!o || o.status === status) return;
  await db.update(s.orders).set({ status, statusPending: o.channel === 'web' }).where(eq(s.orders.id, orderId));
}

/** คืนสต็อกของออเดอร์ (ตอนยกเลิก) */
const RESTOCK_REASON = 'คืนสต็อก (ยกเลิกออเดอร์)';
export async function restock(orderId: number, code: string, by: string, tx: Tx | typeof db = db) {
  // คืนเท่าที่ตัดออกจริง (สต็อกที่ตัดตอนขาย − ที่คืนไปแล้ว) + ของที่โรงงานผลิตเสร็จกันไว้ให้ออเดอร์นี้ — ไม่ใช่ qty ทั้งหมดของบรรทัด
  const moved = await tx.select({ itemId: s.stockMoves.itemId, q: sql<number>`sum(${s.stockMoves.qty})` }).from(s.stockMoves)
    .where(and(eq(s.stockMoves.kind, 'item'), eq(s.stockMoves.ref, code), inArray(s.stockMoves.reason, ['ขายให้ออเดอร์', 'ขายผ่านเว็บไซต์', RESTOCK_REASON])))
    .groupBy(s.stockMoves.itemId);
  const made = await tx.select({ itemId: s.productionOrders.itemId, q: sql<number>`sum(${s.productionOrders.goodQty})` }).from(s.productionOrders)
    .where(and(eq(s.productionOrders.orderId, orderId), eq(s.productionOrders.status, 'done')))
    .groupBy(s.productionOrders.itemId);
  const back = new Map<number, number>();
  for (const m of moved) back.set(m.itemId, (back.get(m.itemId) ?? 0) - Number(m.q));
  for (const m of made) back.set(m.itemId, (back.get(m.itemId) ?? 0) + Number(m.q));
  for (const [itemId, q] of back) if (q > 0) await moveItem(tx, itemId, q, RESTOCK_REASON, code, by);
}

// ---------------- ออเดอร์ ----------------

export async function orderContext(orderId: number) {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) throw new BoError('ไม่พบคำสั่งซื้อ', 404);
  const [[mo], [inv]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(s.productionOrders).where(and(eq(s.productionOrders.orderId, orderId), inArray(s.productionOrders.status, [...OPEN_MO]))),
    db.select().from(s.invoices).where(and(eq(s.invoices.orderId, orderId), eq(s.invoices.kind, 'tax_invoice'))).orderBy(desc(s.invoices.id)).limit(1),
  ]);
  const paid = inv ? inv.paidAt > 0 : o.paidAt > 0;
  return { o, openMOs: Number(mo.n), invoice: inv, paid };
}

/** ส่งออเดอร์ไปขั้นถัดไป (ตรวจเงื่อนไขของขั้นที่กำลังออก) */
export async function advanceOrder(orderId: number, by: string, note = '') {
  const c = await orderContext(orderId);
  const cur = c.o.stage as Stage;
  if (cur === 'received' && c.o.channel === 'web' && c.o.status === 'pending_payment') throw new BoError('ออเดอร์เว็บยังไม่ได้รับชำระเงิน กด "ยืนยันรับชำระ" ก่อนส่งต่อ');
  // ไม่มีเครดิต = ต้องชำระก่อนส่งของ
  if (c.o.channel === 'sales' && c.o.creditDays === 0 && c.o.status === 'pending_payment' && (cur === 'received' || cur === 'production')) throw new BoError('ออเดอร์นี้ไม่มีเครดิต (ชำระก่อนส่ง) กด "ยืนยันรับชำระ" ก่อนส่งต่อ');
  if (cur === 'production' && c.openMOs) throw new BoError(`ยังมีใบสั่งผลิตค้าง ${c.openMOs} ใบ`);
  if (cur === 'billing' && !c.invoice) throw new BoError('ยังไม่ได้ออกใบกำกับภาษี');
  if (cur === 'payment' && !c.paid) throw new BoError('ยังไม่ได้รับชำระเงิน');
  const to = nextStage(cur, { openMOs: c.openMOs, paid: c.paid });
  if (!to) throw new BoError('ออเดอร์นี้จบงานแล้ว');
  await setStage(orderId, to, by, note || (cur === 'approval' ? 'อนุมัติแล้ว' : ''));
  return to;
}

const STATUS_ON: Partial<Record<Stage, Status>> = { packing: 'preparing', billing: 'shipping', done: 'completed', cancelled: 'cancelled' };

export async function setStage(orderId: number, to: Stage, by: string, note = '') {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) throw new BoError('ไม่พบคำสั่งซื้อ', 404);
  if (o.stage === 'cancelled' || o.stage === 'done') throw new BoError('ออเดอร์นี้ปิดงานแล้ว');
  await db.transaction(async (tx) => {
    if (to === 'cancelled') {
      await restock(orderId, o.code, by, tx);
      await tx.update(s.productionOrders).set({ status: 'cancelled', updatedAt: nowSec() }).where(and(eq(s.productionOrders.orderId, orderId), inArray(s.productionOrders.status, ['waiting', 'queued'])));
    }
    await tx.update(s.orders).set({ stage: to, stageAt: nowSec(), assignee: '' }).where(eq(s.orders.id, orderId));
    await logEvent(orderId, to, note || `ย้ายไปขั้น ${STAGE_TH[to]}`, by, tx);
  });
  const st = STATUS_ON[to];
  // ยังไม่จ่าย: ลูกค้ายังเห็น "รอชำระเงิน" จนกว่าจะยืนยันรับเงิน
  if (st && !(o.status === 'pending_payment' && (to === 'packing' || to === 'billing'))) await setStatus(orderId, st);
}

/** ลูกค้าโอนเงินแล้ว (ออเดอร์เว็บที่รอชำระ / ออเดอร์เซลล์ที่ไม่มีเครดิต) */
export async function confirmPayment(orderId: number, by: string) {
  const c = await orderContext(orderId);
  if (c.o.status !== 'pending_payment') throw new BoError('ออเดอร์นี้ไม่ได้อยู่ในสถานะรอชำระ');
  await setStatus(orderId, 'paid');
  await db.update(s.orders).set({ paidAt: nowSec() }).where(eq(s.orders.id, orderId));
  if (c.invoice && !c.invoice.paidAt) await markPaid(c.invoice.id, by);
  else await logEvent(orderId, 'note', 'ยืนยันรับชำระเงินแล้ว', by);
}

export async function assignOrder(orderId: number, assignee: string, by: string) {
  await db.update(s.orders).set({ assignee }).where(eq(s.orders.id, orderId));
  await logEvent(orderId, 'note', assignee ? `มอบหมายให้ ${assignee}` : 'ล้างผู้รับผิดชอบ', by);
}

export async function setTracking(orderId: number, carrier: string, trackingNo: string, trackingUrl: string, by: string) {
  const [o] = await db.select({ channel: s.orders.channel }).from(s.orders).where(eq(s.orders.id, orderId));
  if (!o) throw new BoError('ไม่พบคำสั่งซื้อ', 404);
  if (trackingUrl && !/^https:\/\//.test(trackingUrl)) throw new BoError('ลิงก์ติดตามพัสดุต้องขึ้นต้นด้วย https://');
  await db.update(s.orders).set({ carrier, trackingNo, trackingUrl, statusPending: o.channel === 'web' }).where(eq(s.orders.id, orderId));
  await logEvent(orderId, 'note', `บันทึกขนส่ง ${carrier} ${trackingNo}`.trim(), by);
}

/** ออเดอร์พร้อมสถานะ SLA (ใช้ในแดชบอร์ดและหน้าติดตาม) · shortcut: คำนวณในแอปจาก 1,000 ออเดอร์ล่าสุด, ย้ายไป SQL เมื่อออเดอร์เยอะขึ้น */
export async function trackedOrders(opts: { includeClosed?: boolean } = {}) {
  const now = nowSec();
  const rows = await db.select().from(s.orders)
    .where(opts.includeClosed ? undefined : notInArray(s.orders.stage, ['done', 'cancelled'])).orderBy(desc(s.orders.id)).limit(1000);
  const mos = await db.select({ orderId: s.productionOrders.orderId, dueAt: s.productionOrders.dueAt, assignee: s.productionOrders.assignee })
    .from(s.productionOrders).where(inArray(s.productionOrders.status, [...OPEN_MO]));
  const moBy = new Map(mos.filter((m) => m.orderId).map((m) => [m.orderId!, m]));
  return rows.map((o) => {
    const since = o.stageAt || o.createdAt;
    const mo = moBy.get(o.id);
    const sla = slaHours(o.stage as Stage, o.creditDays, mo ? Math.max(1, (mo.dueAt - since) / 3600) : undefined);
    const late = ['done', 'cancelled'].includes(o.stage) ? 0 : lateBy(since, now, sla);
    return { ...o, since, inStage: now - since, sla, late, owner: o.assignee || mo?.assignee || STAGE_OWNER[o.stage as Stage] };
  });
}

// ---------------- ใบเสนอราคา → ออเดอร์ ----------------

export async function quoteLines(quoteId: number) {
  return db.select({ id: s.quoteItems.id, qty: s.quoteItems.qty, unitPrice: s.quoteItems.unitPrice, itemId: s.items.id, sku: s.items.sku, vName: s.items.variantName, pName: s.items.productName, stock: s.items.stock, weightKg: s.items.weightKg })
    .from(s.quoteItems).innerJoin(s.items, eq(s.items.id, s.quoteItems.itemId))
    .where(eq(s.quoteItems.quoteId, quoteId)).orderBy(s.quoteItems.id);
}

export const pricesIncludeVat = async () => (await getSetting('prices_include_vat', '0')) === '1';

/** ลูกค้ายืนยัน: สร้างออเดอร์ (ช่องทางเซลล์) ตัดสต็อกเท่าที่มี ส่วนที่ขาดเปิดใบสั่งผลิตให้อัตโนมัติ */
export async function convertQuote(quoteId: number, by: string) {
  const [q] = await db.select().from(s.quotes).where(eq(s.quotes.id, quoteId));
  if (!q) throw new BoError('ไม่พบใบเสนอราคา', 404);
  if (q.orderId) throw new BoError('ใบเสนอราคานี้เปิดออเดอร์ไปแล้ว');
  const lines = await quoteLines(quoteId);
  if (!lines.length) throw new BoError('ยังไม่มีรายการสินค้า');
  const t = quoteTotals(lines, q.discountPct, await pricesIncludeVat());
  const needsApproval = q.discountPct > MAX_SALES_DISCOUNT;
  const at = nowSec();
  const code = await nextDoc('SO');
  const orderId = await db.transaction(async (tx) => {
    const [o] = await tx.insert(s.orders).values({
      code, channel: 'sales', name: q.company || q.name, phone: q.phone, email: q.email, province: q.province, address: q.address,
      taxName: q.company, taxId: q.taxId, taxAddress: q.address, note: q.customerNote, shippingLabel: 'จัดส่งตามตกลงกับฝ่ายขาย',
      status: q.creditDays > 0 ? 'preparing' : 'pending_payment', subtotal: t.subtotal, discount: t.discount, vat: t.vat, total: t.total,
      creditDays: q.creditDays, stage: needsApproval ? 'approval' : 'received', stageAt: at, createdAt: at,
    }).returning();
    for (const l of lines) {
      await tx.insert(s.orderItems).values({ orderId: o.id, itemId: l.itemId, productName: l.pName, variantName: l.vName, sku: l.sku, unitPrice: l.unitPrice, qty: l.qty });
      const take = Math.min(Math.max(l.stock, 0), l.qty);
      if (take) await moveItem(tx, l.itemId, -take, 'ขายให้ออเดอร์', code, by);
    }
    await tx.update(s.quotes).set({ orderId: o.id, status: 'won' }).where(eq(s.quotes.id, quoteId));
    await logEvent(o.id, 'received', `เปิดจากใบเสนอราคา ${q.code}${needsApproval ? ` · ส่วนลด ${q.discountPct}% เกินสิทธิ์ รอหัวหน้าอนุมัติ` : ''}`, by, tx);
    return o.id;
  });
  for (const l of lines) {
    const short = l.qty - Math.min(Math.max(l.stock, 0), l.qty);
    if (short > 0) await createMO({ itemId: l.itemId, qty: short, orderId, by });
  }
  return orderId;
}


// ---------------- โรงงาน ----------------

async function bomOf(itemId: number) {
  return db.select({ materialId: s.materials.id, name: s.materials.name, unit: s.materials.unit, qtyPer: s.bom.qtyPer, stock: s.materials.stock })
    .from(s.bom).innerJoin(s.materials, eq(s.materials.id, s.bom.materialId)).where(eq(s.bom.itemId, itemId));
}
const shortNote = (x: ReturnType<typeof shortages>) => x.map((m) => `${m.name} ขาด ${m.short} ${m.unit}`).join(', ');

export async function createMO(p: { itemId: number; qty: number; orderId?: number; line?: string; assignee?: string; dueDays?: number; by: string }) {
  if (p.qty < 1) throw new BoError('จำนวนผลิตต้องมากกว่า 0');
  const short = shortages(await bomOf(p.itemId), p.qty);
  const at = nowSec();
  const code = await nextDoc('MO');
  const [mo] = await db.insert(s.productionOrders).values({
    code, itemId: p.itemId, qty: p.qty, orderId: p.orderId ?? null, line: p.line ?? '', assignee: p.assignee ?? '',
    status: short.length ? 'waiting' : 'queued', dueAt: at + (p.dueDays ?? 3) * 86400, createdAt: at, updatedAt: at, note: shortNote(short),
  }).returning();
  if (p.orderId) await logEvent(p.orderId, 'note', `เปิดใบสั่งผลิต ${code} จำนวน ${p.qty} ใบ`, p.by);
  return mo;
}

/** เริ่มผลิต: ตัดวัตถุดิบตามสูตร (ไม่พอ = ค้างที่ "รอวัตถุดิบ") */
export async function startMO(id: number, by: string) {
  const [mo] = await db.select().from(s.productionOrders).where(eq(s.productionOrders.id, id));
  if (!mo || !['waiting', 'queued'].includes(mo.status)) throw new BoError('ใบสั่งผลิตนี้เริ่มไม่ได้');
  const lines = await bomOf(mo.itemId);
  const short = shortages(lines, mo.qty);
  if (short.length) {
    await db.update(s.productionOrders).set({ status: 'waiting', note: shortNote(short), updatedAt: nowSec() }).where(eq(s.productionOrders.id, id));
    throw new BoError(`วัตถุดิบไม่พอ: ${shortNote(short)}`);
  }
  await db.transaction(async (tx) => {
    for (const l of lines) {
      const used = Math.round(l.qtyPer * mo.qty * 100) / 100;
      await tx.update(s.materials).set({ stock: sql`${s.materials.stock} - ${used}` }).where(eq(s.materials.id, l.materialId));
      await tx.insert(s.stockMoves).values({ kind: 'material', itemId: l.materialId, qty: -used, reason: 'เบิกเข้าผลิต', ref: mo.code, by, at: nowSec() });
    }
    await tx.update(s.productionOrders).set({ status: 'in_progress', note: '', updatedAt: nowSec() }).where(eq(s.productionOrders.id, id));
  });
}

/** บันทึกผลผลิต (จากมือถือหน้าไลน์) ครบจำนวน → ส่งทดสอบรั่วซึม */
export async function recordOutput(id: number, good: number, reject: number, reason: string, by: string) {
  const [mo] = await db.select().from(s.productionOrders).where(eq(s.productionOrders.id, id));
  if (!mo || mo.status !== 'in_progress') throw new BoError('บันทึกได้เฉพาะใบสั่งผลิตที่กำลังผลิต');
  if (good < 0 || reject < 0 || good + reject === 0) throw new BoError('กรอกจำนวนที่ผลิตได้', 400, 'good');
  const left = mo.qty - mo.goodQty;
  if (good > left) throw new BoError(`ผ่านทดสอบเกินจำนวนที่เหลือ (เหลือ ${left} ใบ)`, 400, 'good');
  const goodQty = mo.goodQty + good;
  const note = reject ? `${mo.note ? mo.note + ' · ' : ''}ไม่ผ่าน ${reject} ใบ${reason ? ` (${reason})` : ''}` : mo.note;
  await db.update(s.productionOrders).set({ goodQty, rejectQty: mo.rejectQty + reject, note, status: goodQty >= mo.qty ? 'qc' : 'in_progress', updatedAt: nowSec() }).where(eq(s.productionOrders.id, id));
  if (mo.orderId) await logEvent(mo.orderId, 'note', `${by} บันทึกผลิต ${mo.code} ได้ ${good} ใบ${reject ? ` ไม่ผ่าน ${reject} ใบ` : ''}`, by);
}

/** ผ่านทดสอบรั่วซึม → รับถังเข้าคลัง (ถ้าผลิตให้ออเดอร์ จะกันไว้ให้ออเดอร์นั้น ไม่เข้ายอดพร้อมขาย) */
export async function passQC(id: number, by: string) {
  const [mo] = await db.select().from(s.productionOrders).where(eq(s.productionOrders.id, id));
  if (!mo || mo.status !== 'qc') throw new BoError('ใบสั่งผลิตนี้ยังไม่อยู่ในขั้นทดสอบ');
  await db.transaction(async (tx) => {
    if (mo.orderId) await tx.insert(s.stockMoves).values({ kind: 'item', itemId: mo.itemId, qty: 0, reason: `รับจากโรงงาน ${mo.goodQty} ใบ (กันให้ออเดอร์)`, ref: mo.code, by, at: nowSec() });
    else await moveItem(tx, mo.itemId, mo.goodQty, 'รับจากโรงงาน', mo.code, by);
    await tx.update(s.productionOrders).set({ status: 'done', updatedAt: nowSec() }).where(eq(s.productionOrders.id, id));
  });
  if (mo.orderId) await logEvent(mo.orderId, 'note', `${mo.code} ผ่านทดสอบรั่วซึม ${mo.goodQty} ใบ เข้าคลังแล้ว`, by);
}

export async function cancelMO(id: number) {
  await db.update(s.productionOrders).set({ status: 'cancelled', updatedAt: nowSec() }).where(and(eq(s.productionOrders.id, id), inArray(s.productionOrders.status, ['waiting', 'queued'])));
}

// ---------------- สต็อก ----------------

export async function adjustStock(kind: 'item' | 'material', id: number, delta: number, reason: string, ref: string, by: string) {
  if (!delta) throw new BoError('จำนวนต้องไม่เป็น 0');
  await db.transaction(async (tx) => {
    const t = kind === 'item' ? s.items : s.materials;
    const [cur] = await tx.select({ stock: t.stock }).from(t).where(eq(t.id, id));
    if (!cur) throw new BoError('ไม่พบรายการ', 404);
    if (cur.stock + delta < 0) throw new BoError(`ยอดคงเหลือไม่พอ (มี ${cur.stock})`, 400, 'delta');
    if (kind === 'item') return moveItem(tx, id, delta, reason, ref, by);
    await tx.update(s.materials).set({ stock: sql`${s.materials.stock} + ${delta}` }).where(eq(s.materials.id, id));
    await tx.insert(s.stockMoves).values({ kind, itemId: id, qty: delta, reason, ref, by, at: nowSec() });
  });
}

/** ยอดที่จองไว้ให้ออเดอร์ที่ยังไม่ส่ง (สต็อกตัดตอนสั่งซื้อแล้ว: คงเหลือจริง = พร้อมขาย + จอง) */
export async function reservedByItem() {
  const rows = await db.select({ itemId: s.orderItems.itemId, qty: sql<number>`sum(${s.orderItems.qty})` })
    .from(s.orderItems).innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
    .where(notInArray(s.orders.stage, ['billing', 'payment', 'done', 'cancelled'])).groupBy(s.orderItems.itemId);
  return new Map(rows.map((r) => [r.itemId, Number(r.qty)]));
}

// ---------------- บัญชี ----------------

export async function issueInvoice(orderId: number, by: string) {
  const c = await orderContext(orderId);
  if (c.invoice) throw new BoError(`ออกใบกำกับภาษีไปแล้ว (${c.invoice.code})`);
  if (c.o.stage === 'cancelled') throw new BoError('ออเดอร์ถูกยกเลิก');
  const { subtotal, vat } = splitVat(c.o.total, c.o.vat);
  const at = nowSec();
  const paidUpfront = c.o.paidAt > 0;
  const code = await nextDoc('INV');
  const receiptCode = paidUpfront ? await nextDoc('RC') : '';
  await db.insert(s.invoices).values({
    code, orderId, buyerName: c.o.taxName || c.o.name, buyerTaxId: c.o.taxId, buyerAddress: c.o.taxAddress || [c.o.address, c.o.province, c.o.postcode].filter(Boolean).join(' '),
    buyerEmail: c.o.email, subtotal, vat, total: c.o.total, issuedAt: at, dueAt: at + c.o.creditDays * 86400, paidAt: paidUpfront ? at : 0, receiptCode,
  });
  await logEvent(orderId, 'note', `ออกใบกำกับภาษี ${code}${receiptCode ? ` และใบเสร็จ ${receiptCode} (ชำระแล้ว)` : ''}`, by);
  return code;
}

export async function markPaid(invoiceId: number, by: string) {
  const [inv] = await db.select().from(s.invoices).where(eq(s.invoices.id, invoiceId));
  if (!inv) throw new BoError('ไม่พบใบกำกับภาษี', 404);
  if (inv.paidAt) throw new BoError('บันทึกรับเงินไปแล้ว');
  const receiptCode = await nextDoc('RC');
  await db.update(s.invoices).set({ paidAt: nowSec(), receiptCode }).where(eq(s.invoices.id, invoiceId));
  const [o] = await db.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, inv.orderId));
  if (o?.status === 'pending_payment') await setStatus(inv.orderId, 'paid');
  await db.update(s.orders).set({ paidAt: nowSec() }).where(and(eq(s.orders.id, inv.orderId), eq(s.orders.paidAt, 0)));
  await logEvent(inv.orderId, 'note', `รับชำระ ${inv.code} ออกใบเสร็จ ${receiptCode}`, by);
  return receiptCode;
}
