import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { companyMissing, getCompany } from '@/lib/company';
import { ETAX_TH, ETAX_TONE } from '@/lib/status';
import { Badge, thDate, thDateFull } from '@/components/bo';
import { DocHead } from '@/components/doc-head';
import { PrintButton } from '@/components/print-button';
import { requireUser } from '@/lib/admin';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [inv] = Number.isInteger(id) ? await db.select({ code: s.invoices.code }).from(s.invoices).where(eq(s.invoices.id, id)) : [];
  return { title: inv ? `${inv.code} ใบกำกับภาษี` : 'ไม่พบใบกำกับภาษี' };
}

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [inv] = Number.isInteger(id) ? await db.select().from(s.invoices).where(eq(s.invoices.id, id)) : [];
  if (!inv) notFound();
  const [[o], items, company] = await Promise.all([
    db.select().from(s.orders).where(eq(s.orders.id, inv.orderId)),
    db.select().from(s.orderItems).where(eq(s.orderItems.orderId, inv.orderId)),
    getCompany(),
  ]);
  const missing = companyMissing(company);
  const title = inv.paidAt ? 'ใบกำกับภาษี / ใบเสร็จรับเงิน' : 'ใบกำกับภาษี / ใบแจ้งหนี้';
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/accounting" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy-700">← บัญชี</Link>
        <div className="flex items-center gap-2"><Badge tone={ETAX_TONE[inv.etaxStatus]}>e-Tax: {ETAX_TH[inv.etaxStatus]}</Badge><PrintButton disabled={missing.length > 0} /></div>
      </div>
      {missing.length > 0 && <div role="alert" className="rounded-xl border border-warning bg-warning-50 p-4 text-sm text-warning print:hidden">
        <b>ยังพิมพ์ใบกำกับภาษีไม่ได้</b> · หัวเอกสารยังขาด {missing.join(', ')} ซึ่งใบกำกับภาษีต้องมีตามกฎหมาย · <Link href="/settings#company" className="font-semibold underline">กรอกที่หน้าตั้งค่า →</Link></div>}
      <article className="card p-8 print:border-0 print:p-0">
        <DocHead c={company} title={title} code={inv.code} lines={[['วันที่', thDateFull(inv.issuedAt)], ['อ้างอิง', o.code], ...(inv.receiptCode ? [['ใบเสร็จ', inv.receiptCode] as [string, string]] : [])]} />
        <div className="mb-6 flex flex-wrap justify-between gap-4 print:hidden"><div><p className="text-sm text-muted">{title}</p><h1 className="text-2xl font-bold text-navy-900">{inv.code}</h1></div>
          <div className="text-right text-sm text-muted">ออก {thDate(inv.issuedAt)} · ครบกำหนด {thDate(inv.dueAt)}<br />ออเดอร์ <Link href={`/orders/${o.id}`} className="text-navy-700 underline">{o.code}</Link></div></div>
        <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm print:bg-transparent print:p-0">
          <p className="text-xs text-muted">ผู้ซื้อ</p><p className="font-semibold">{inv.buyerName}</p><p>{inv.buyerAddress}</p>
          <p>{inv.buyerTaxId ? `เลขประจำตัวผู้เสียภาษี ${inv.buyerTaxId}` : 'บุคคลทั่วไป'}</p>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm">
          <thead className="border-y border-slate-300 text-left text-xs text-muted"><tr><th className="py-2 pr-2">#</th><th>รายการ</th><th className="text-right">จำนวน</th><th className="text-right">ราคา/หน่วย</th><th className="text-right">จำนวนเงิน</th></tr></thead>
          <tbody>
            {items.map((i, n) => <tr key={i.id} className="border-b border-slate-100"><td className="py-2 pr-2">{n + 1}</td><td>{i.productName} {i.variantName}<span className="block text-xs text-muted">{i.sku}</span></td><td className="text-right">{i.qty}</td><td className="text-right">{baht(i.unitPrice)}</td><td className="text-right">{baht(i.qty * i.unitPrice)}</td></tr>)}
            {o.shippingFee > 0 && <tr className="border-b border-slate-100"><td className="py-2" /><td>ค่าจัดส่ง</td><td /><td /><td className="text-right">{baht(o.shippingFee)}</td></tr>}
            {o.discount > 0 && <tr className="border-b border-slate-100"><td className="py-2" /><td>ส่วนลด</td><td /><td /><td className="text-right">−{baht(o.discount)}</td></tr>}
          </tbody>
        </table></div>
        <dl className="ml-auto mt-4 w-full max-w-72 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>มูลค่าสินค้า/บริการ</dt><dd>{baht(inv.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>ภาษีมูลค่าเพิ่ม 7%</dt><dd>{baht(inv.vat)}</dd></div>
          <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold"><dt>รวมทั้งสิ้น</dt><dd>{baht(inv.total)}</dd></div>
        </dl>
        <div className="mt-16 grid grid-cols-2 gap-10 text-center text-xs text-muted"><p className="border-t border-slate-300 pt-2">ผู้รับสินค้า / วันที่</p><p className="border-t border-slate-300 pt-2">ผู้มีอำนาจลงนาม</p></div>
      </article>
    </div>
  );
}
