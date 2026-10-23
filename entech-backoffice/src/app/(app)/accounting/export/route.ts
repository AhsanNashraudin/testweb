/** ส่งออกรายการใบกำกับภาษีรายเดือนเป็น CSV (เปิดใน Excel ได้ภาษาไทย) ให้สำนักงานบัญชี / นำเข้า Bplus
 *  shortcut: คอลัมน์รูปแบบทั่วไป, ปรับให้ตรงไฟล์นำเข้าของ Bplus เมื่อได้ตัวอย่างจากผู้ให้บริการ */
import { and, eq, gte, lt } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { requireUser } from '@/lib/admin';
import { ETAX_TH } from '@/lib/status';

// ข้อความที่ขึ้นต้นด้วย = + - @ tab CR จะถูก Excel ตีความเป็นสูตร (CSV injection) — เติม ' นำหน้า · ตัวเลขคงเป็นตัวเลข
const cell = (v: string | number) => {
  const t = typeof v === 'number' ? String(v) : /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${t.replace(/"/g, '""')}"`;
};
/** เลขประจำตัวผู้เสียภาษี: บังคับเป็นข้อความ (="0105…") ไม่ให้ Excel/Calc ตัด 0 นำหน้า · มีแต่ตัวเลขจึงไม่เสี่ยงเป็นสูตร */
const taxId = (v: string) => { const d = v.replace(/\D/g, ''); return d ? `="${d}"` : '""'; };
const day = (sec: number) => (sec ? new Date(sec * 1000 + 7 * 3600e3).toISOString().slice(0, 10) : '');

export async function GET(req: Request) {
  await requireUser();
  const m = /^(\d{4})-(\d{2})$/.exec(new URL(req.url).searchParams.get('month') ?? '');
  if (!m) return new Response('month=YYYY-MM', { status: 400 });
  const from = Math.floor((Date.UTC(+m[1], +m[2] - 1, 1) - 7 * 3600e3) / 1000), to = Math.floor((Date.UTC(+m[1], +m[2], 1) - 7 * 3600e3) / 1000);
  const rows = await db.select({ inv: s.invoices, order: s.orders.code }).from(s.invoices).innerJoin(s.orders, eq(s.orders.id, s.invoices.orderId))
    .where(and(gte(s.invoices.issuedAt, from), lt(s.invoices.issuedAt, to))).orderBy(s.invoices.code);
  const head = ['วันที่', 'เลขที่ใบกำกับภาษี', 'ประเภท', 'เลขที่ออเดอร์', 'ชื่อผู้ซื้อ', 'เลขประจำตัวผู้เสียภาษี', 'ที่อยู่', 'มูลค่าก่อน VAT', 'VAT', 'รวม', 'วันครบกำหนด', 'วันที่รับเงิน', 'เลขที่ใบเสร็จ', 'สถานะ e-Tax'];
  const body = rows.map(({ inv, order }) => [day(inv.issuedAt), inv.code, inv.kind === 'credit_note' ? 'ใบลดหนี้' : 'ใบกำกับภาษี', order, inv.buyerName, inv.buyerTaxId, inv.buyerAddress, inv.subtotal, inv.vat, inv.total, day(inv.dueAt), day(inv.paidAt), inv.receiptCode, ETAX_TH[inv.etaxStatus]].map((v, i) => (i === 5 ? taxId(String(v)) : cell(v))).join(','));
  return new Response('﻿' + [head.map(cell).join(','), ...body].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="sales-tax-${m[1]}-${m[2]}.csv"`, 'Cache-Control': 'no-store' },
  });
}
