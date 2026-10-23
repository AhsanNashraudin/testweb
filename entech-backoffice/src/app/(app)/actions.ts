'use server';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { requireUser } from '@/lib/admin';
import { int, num, str, nowSec, BoError } from '@/lib/util';
import * as B from '@/lib/backoffice';
import { runSync } from '@/lib/sync';
import { companyMissing, getCompany } from '@/lib/company';
import { STAGE_TH, type Stage } from '@/lib/backoffice-rules';

type Result = { ok?: string; err?: string; field?: string } | null;

/** รันงานแล้วคืนผลลัพธ์ให้ ActionForm แสดงใกล้ฟอร์ม (ไม่ redirect → ค่าที่กรอกไม่หายเมื่อผิดพลาด) */
async function run(fn: (me: { name: string }) => Promise<string | void>, okMsg = 'บันทึกแล้ว'): Promise<Result> {
  const me = await requireUser();
  try {
    const msg = await fn(me);
    return { ok: msg || okMsg };
  } catch (e) {
    unstable_rethrow(e); // redirect()/notFound() ไม่ใช่ข้อผิดพลาด
    if (e instanceof BoError) return { err: e.message, field: e.field };
    // ข้อผิดพลาดภายใน (เช่น SQL) ไม่ส่งรายละเอียดให้หน้าจอ — เก็บใน log ฝั่งเซิร์ฟเวอร์
    console.error(e);
    const unique = /UNIQUE constraint/i.test(String((e as { cause?: unknown })?.cause ?? '') + String((e as Error)?.message ?? ''));
    return { err: unique ? 'มีคนบันทึกเลขเอกสารเดียวกันพร้อมกัน กรุณากดบันทึกอีกครั้ง' : 'บันทึกไม่สำเร็จ ลองอีกครั้ง ถ้ายังไม่ได้ให้แจ้งผู้ดูแลระบบ' };
  } finally {
    revalidatePath('/', 'layout'); // อัปเดตหน้าจอทั้งตอนสำเร็จและล้มเหลว (เช่น กล่อง "ซิงค์ล่าสุด")
  }
}
const id = (form: FormData, k = 'id') => int(form.get(k), 1);

// ---------- ออเดอร์ ----------
export async function advanceOrderAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => `ส่งต่อไปขั้น "${STAGE_TH[(await B.advanceOrder(id(form), me.name, str(form.get('note'), 300))) as Stage]}" แล้ว`);
}
export async function cancelOrderAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => { await B.setStage(id(form), 'cancelled', me.name, str(form.get('note'), 300) || 'ยกเลิกออเดอร์'); }, 'ยกเลิกออเดอร์แล้ว คืนสต็อกเรียบร้อย');
}
export async function confirmPaymentAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => { await B.confirmPayment(id(form), me.name); }, 'ยืนยันรับชำระแล้ว');
}
export async function assignOrderAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => { await B.assignOrder(id(form), str(form.get('assignee'), 60), me.name); });
}
export async function trackingAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const url = str(form.get('trackingUrl'), 300);
    if (url && !/^https?:\/\/[^\s]+$/i.test(url)) throw new BoError('ลิงก์ติดตามพัสดุต้องขึ้นต้นด้วย https://', 400, 'trackingUrl');
    await B.setTracking(id(form), str(form.get('carrier'), 80), str(form.get('trackingNo'), 80), url, me.name);
  }, 'บันทึกขนส่งแล้ว');
}
export async function noteOrderAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const note = str(form.get('note'), 500);
    if (!note) throw new BoError('พิมพ์บันทึกก่อนส่ง');
    await B.logEvent(id(form), 'note', note, me.name);
  });
}

// ---------- บัญชี ----------
export async function issueInvoiceAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const missing = companyMissing(await getCompany());
    if (missing.length) throw new BoError(`ออกใบกำกับภาษีไม่ได้ · หัวเอกสารยังขาด ${missing.join(', ')} (กรอกที่หน้าตั้งค่า)`);
    return `ออกใบกำกับภาษี ${await B.issueInvoice(id(form), me.name)} แล้ว`;
  });
}
export async function markPaidAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => `บันทึกรับเงินแล้ว ใบเสร็จ ${await B.markPaid(id(form), me.name)}`);
}
export async function setEtaxAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const st = str(form.get('etaxStatus'));
    if (!['pending', 'sent', 'certified', 'failed'].includes(st)) throw new BoError('สถานะไม่ถูกต้อง');
    await db.update(s.invoices).set({ etaxStatus: st as 'pending', etaxNote: str(form.get('etaxNote'), 300) }).where(eq(s.invoices.id, id(form)));
  });
}

// ---------- โรงงาน ----------
export async function createMOAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const mo = await B.createMO({
      itemId: id(form, 'itemId'), qty: int(form.get('qty'), 1, 10_000, ['qty', 'จำนวน']), dueDays: int(form.get('dueDays') || 3, 0, 365, ['dueDays', 'เสร็จใน (วัน)']),
      line: str(form.get('line'), 60), assignee: str(form.get('assignee'), 60), orderId: form.get('orderId') ? id(form, 'orderId') : undefined, by: me.name,
    });
    return `เปิดใบสั่งผลิต ${mo.code} แล้ว${mo.status === 'waiting' ? ' (รอวัตถุดิบ)' : ''}`;
  });
}
export async function moAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const op = str(form.get('op'));
    if (op === 'start') return void (await B.startMO(id(form), me.name));
    if (op === 'qc') return void (await B.passQC(id(form), me.name));
    if (op === 'cancel') return void (await B.cancelMO(id(form)));
    throw new BoError('คำสั่งไม่ถูกต้อง');
  });
}
export async function recordOutputAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const good = int(form.get('good') || 0, 0, 10_000, ['good', 'ผ่านทดสอบ']), reject = int(form.get('reject') || 0, 0, 10_000, ['reject', 'ของเสีย']);
    await B.recordOutput(id(form), good, reject, str(form.get('reason'), 60), me.name);
    return `บันทึกแล้ว ผ่าน ${good} ใบ${reject ? ` · ไม่ผ่าน ${reject} ใบ` : ''}`;
  });
}

// ---------- สต็อก / สินค้า ----------
export async function adjustStockAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const kind = form.get('kind') === 'material' ? 'material' : 'item';
    const reason = str(form.get('reason'), 80);
    if (!reason) throw new BoError('ระบุเหตุผล เช่น รับจากผู้ขาย, ตรวจนับ, ชำรุด', 400, 'reason');
    const delta = kind === 'material' ? num(form.get('delta'), -100_000, 100_000, ['delta', 'จำนวนที่ปรับ']) : int(form.get('delta'), -100_000, 100_000, ['delta', 'จำนวนที่ปรับ']);
    const itemId = id(form, 'itemId');
    await B.adjustStock(kind, itemId, delta, reason, str(form.get('ref'), 60), me.name);
    const t = kind === 'item' ? s.items : s.materials;
    const [r] = await db.select({ sku: t.sku, stock: t.stock }).from(t).where(eq(t.id, itemId));
    return `ปรับยอดแล้ว: ${r?.sku} ${delta > 0 ? '+' : ''}${delta} · คงเหลือ ${r?.stock.toLocaleString('th-TH')}`;
  });
}
export async function setReorderAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    if (form.get('kind') === 'material') await db.update(s.materials).set({ reorderPoint: num(form.get('reorderPoint'), 0, 1_000_000, ['reorderPoint', 'จุดสั่ง']) }).where(eq(s.materials.id, id(form, 'itemId')));
    else await db.update(s.items).set({ reorderPoint: int(form.get('reorderPoint'), 0, 100_000, ['reorderPoint', 'จุดสั่ง']) }).where(eq(s.items.id, id(form, 'itemId')));
  }, 'บันทึกจุดสั่งแล้ว');
}
/** แก้ราคา/ชื่อรุ่น/น้ำหนัก หรือเพิ่ม SKU ใหม่ → ส่งให้เว็บรอบ sync ถัดไป */
export async function saveItemAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const values = {
      productName: str(form.get('productName'), 200), variantName: str(form.get('variantName'), 120),
      price: int(form.get('price') || 0, 0, 10_000_000, ['price', 'ราคา']), bulkPrice: int(form.get('bulkPrice') || 0, 0, 10_000_000, ['bulkPrice', 'ราคาส่ง']), bulkMinQty: int(form.get('bulkMinQty') || 0, 0, 100_000, ['bulkMinQty', 'ขั้นต่ำราคาส่ง']),
      weightKg: num(form.get('weightKg') || 0, 0, 5000, ['weightKg', 'น้ำหนัก']), pushPending: true,
    };
    if (values.productName.length < 2) throw new BoError('กรอกชื่อสินค้า', 400, 'productName');
    if (form.get('id')) return void (await db.update(s.items).set(values).where(eq(s.items.id, id(form))));
    const sku = str(form.get('sku'), 60).toUpperCase();
    const productCode = str(form.get('productCode'), 80).toLowerCase();
    if (!sku) throw new BoError('กรอก SKU', 400, 'sku');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(productCode)) throw new BoError('รหัสกลุ่มสินค้าใช้ a-z 0-9 และ - เช่น tank-grand-stone', 400, 'productCode');
    // เว็บรับ SKU ใหม่ได้ต่อเมื่อมีรุ่น/ขนาดและราคา
    if (!values.variantName) throw new BoError('กรอกรุ่น / ขนาด (เว็บต้องใช้ตอนสร้างสินค้าใหม่)', 400, 'variantName');
    if (!values.price) throw new BoError('กรอกราคา (เว็บต้องใช้ตอนสร้างสินค้าใหม่)', 400, 'price');
    const [dup] = await db.select({ id: s.items.id }).from(s.items).where(eq(s.items.sku, sku));
    if (dup) throw new BoError('SKU นี้มีอยู่แล้ว', 400, 'sku');
    const [row] = await db.insert(s.items).values({ ...values, sku, productCode, category: str(form.get('category'), 80) }).returning({ id: s.items.id });
    redirect(`/inventory/${row.id}?added=1`);
  }, 'บันทึกแล้ว — ส่งขึ้นเว็บในรอบซิงค์ถัดไป');
}

// ---------- ใบเสนอราคา ----------
export async function createQuoteAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const name = str(form.get('name'), 120);
    if (!name) throw new BoError('กรอกชื่อผู้ติดต่อ', 400, 'name');
    const [q] = await db.insert(s.quotes).values({
      code: await B.nextDoc('QT'), name, company: str(form.get('company'), 160), phone: str(form.get('phone'), 30), email: str(form.get('email'), 120),
      province: str(form.get('province'), 60), topic: str(form.get('topic'), 200), salesperson: me.name, createdAt: nowSec(),
    }).returning({ id: s.quotes.id });
    redirect(`/quotes/${q.id}`);
  });
}
export async function saveQuoteAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    await db.update(s.quotes).set({
      name: str(form.get('name'), 120) || undefined, company: str(form.get('company'), 160), phone: str(form.get('phone'), 30), email: str(form.get('email'), 120),
      taxId: str(form.get('taxId'), 20), address: str(form.get('address'), 500), province: str(form.get('province'), 60),
      discountPct: num(form.get('discountPct') || 0, 0, 50, ['discountPct', 'ส่วนลด %']), creditDays: int(form.get('creditDays') || 0, 0, 180, ['creditDays', 'เครดิต (วัน)']), validDays: int(form.get('validDays') || 30, 1, 180, ['validDays', 'ยืนราคา (วัน)']),
      customerNote: str(form.get('customerNote'), 1000),
    }).where(and(eq(s.quotes.id, id(form)), sql`${s.quotes.orderId} is null`));
  });
}
export async function quoteStatusAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const st = str(form.get('status'));
    if (!['draft', 'sent', 'lost'].includes(st)) throw new BoError('สถานะไม่ถูกต้อง');
    await db.update(s.quotes).set({ status: st as 'draft' }).where(and(eq(s.quotes.id, id(form)), sql`${s.quotes.orderId} is null`));
  });
}
const unitPriceFor = (v: { price: number; bulkPrice: number; bulkMinQty: number }, qty: number) => (v.bulkPrice && v.bulkMinQty && qty >= v.bulkMinQty ? v.bulkPrice : v.price);
export async function quoteItemAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const quoteId = id(form, 'quoteId');
    const [q] = await db.select({ orderId: s.quotes.orderId }).from(s.quotes).where(eq(s.quotes.id, quoteId));
    if (!q || q.orderId) throw new BoError('ใบเสนอราคานี้แก้ไขไม่ได้แล้ว');
    const op = str(form.get('op'));
    const line = and(eq(s.quoteItems.quoteId, quoteId), eq(s.quoteItems.id, int(form.get('lineId') || 0, 0)));
    if (op === 'remove') return void (await db.delete(s.quoteItems).where(line));
    if (op === 'update') return void (await db.update(s.quoteItems).set({ qty: int(form.get('qty'), 1, 10_000, ['qty', 'จำนวน']), unitPrice: int(form.get('unitPrice'), 0, 10_000_000, ['unitPrice', 'ราคา/หน่วย']) }).where(line));
    const [v] = await db.select().from(s.items).where(eq(s.items.sku, str(form.get('sku'), 60).toUpperCase()));
    if (!v) throw new BoError('ไม่พบรหัสสินค้า เลือกจากรายการ');
    const qty = int(form.get('qty') || 1, 1, 10_000, ['qty', 'จำนวน']);
    await db.insert(s.quoteItems).values({ quoteId, itemId: v.id, qty, unitPrice: unitPriceFor(v, qty) });
  });
}
export async function convertQuoteAction(_p: Result, form: FormData): Promise<Result> {
  return run(async (me) => {
    const orderId = await B.convertQuote(id(form), me.name);
    const [o] = await db.select({ code: s.orders.code }).from(s.orders).where(eq(s.orders.id, orderId));
    return `เปิดออเดอร์ ${o.code} แล้ว`;
  });
}

// ---------- เชื่อมเว็บไซต์ ----------
export async function syncNowAction(): Promise<Result> {
  return run(async () => {
    const r = await runSync();
    if (!r.ok) throw new BoError('ซิงค์ไม่สำเร็จ — ดูรายละเอียดในกล่อง "ผลซิงค์ล่าสุด"');
    return 'ซิงค์สำเร็จ';
  });
}
export async function settingsAction(_p: Result, form: FormData): Promise<Result> {
  return run(async () => {
    await B.setSetting('prices_include_vat', form.get('prices_include_vat') === 'on' ? '1' : '0');
    const c = { name: str(form.get('cname'), 160), taxId: str(form.get('ctax'), 20).replace(/\D/g, ''), address: str(form.get('caddr'), 500), phone: str(form.get('cphone'), 40) };
    if (c.name.length < 2) throw new BoError('กรอกชื่อบริษัท', 400, 'cname');
    if (c.taxId && c.taxId.length !== 13) throw new BoError('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 400, 'ctax');
    await B.setSetting('company', JSON.stringify(c));
  });
}
