import Link from 'next/link';
import { desc, eq, gte, and } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { trackedOrders } from '@/lib/backoffice';
import { agingBucket, AGING_TH, type AgingBucket } from '@/lib/backoffice-rules';
import { ETAX_TH } from '@/lib/status';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, Empty, PageHead, Stat, Tabs, thDate } from '@/components/bo';
import { issueInvoiceAction, markPaidAction, setEtaxAction } from '../actions';
import { requireUser } from '@/lib/admin';

export const metadata = { title: 'บัญชี & e-Tax' };
const AGE_COLOR: Record<AgingBucket, string> = { current: 'bg-success', d30: 'bg-warning', d60: 'bg-sale', d90: 'bg-ink' };

export default async function Accounting({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireUser();
  const { f = 'all' } = await searchParams;
  const now = Math.floor(Date.now() / 1000);
  const th = new Date(Date.now() + 7 * 3600e3);
  const monthStart = Math.floor((Date.UTC(th.getUTCFullYear(), th.getUTCMonth(), 1) - 7 * 3600e3) / 1000);
  const month = `${th.getUTCFullYear()}-${String(th.getUTCMonth() + 1).padStart(2, '0')}`;
  const [invoices, monthInv, orders] = await Promise.all([
    db.select({ inv: s.invoices, orderCode: s.orders.code }).from(s.invoices).innerJoin(s.orders, eq(s.orders.id, s.invoices.orderId)).orderBy(desc(s.invoices.id)).limit(300),
    db.select().from(s.invoices).where(and(gte(s.invoices.issuedAt, monthStart), eq(s.invoices.kind, 'tax_invoice'))),
    trackedOrders(),
  ]);
  const unpaid = invoices.filter((x) => !x.inv.paidAt);
  const overdue = unpaid.filter((x) => x.inv.dueAt < now);
  const issued = new Set(invoices.map((x) => x.inv.orderId));
  const toBill = orders.filter((o) => (o.stage === 'billing' || o.stage === 'packing') && !issued.has(o.id));
  const etaxTodo = invoices.filter((x) => x.inv.etaxStatus === 'pending' || x.inv.etaxStatus === 'failed');
  const aging = (['current', 'd30', 'd60', 'd90'] as AgingBucket[]).map((b) => ({ b, sum: unpaid.filter((x) => agingBucket(x.inv.dueAt, now) === b).reduce((a, x) => a + x.inv.total, 0) }));
  const arTotal = aging.reduce((a, x) => a + x.sum, 0);
  const rows = f === 'unpaid' ? unpaid : f === 'etax' ? etaxTodo : invoices;
  const failed = invoices.find((x) => x.inv.etaxStatus === 'failed');

  return (
    <div className="space-y-6">
      <PageHead title="บัญชีและ e-Tax Invoice" sub="ใบกำกับภาษีออกจากออเดอร์ · ติดตามลูกหนี้ · ส่งออกข้อมูลให้สำนักงานบัญชี / Bplus">
        <a href={`/accounting/export?month=${month}`} className="btn-outline">ส่งออก CSV เดือนนี้</a>
      </PageHead>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ลูกหนี้คงค้าง" value={baht(arTotal)} note={`${unpaid.length} บิล · เกินกำหนด ${baht(overdue.reduce((a, x) => a + x.inv.total, 0))}`} tone={overdue.length ? 'bad' : 'ok'} href="/accounting?f=unpaid" />
        <Stat label="รอออกใบกำกับภาษี" value={`${toBill.length} ออเดอร์`} note="ส่งของแล้ว / กำลังแพ็ค" tone={toBill.length ? 'warn' : 'ok'} />
        <Stat label="e-Tax ที่ต้องจัดการ" value={`${etaxTodo.length} ใบ`} note={failed ? 'มีใบที่ส่งไม่สำเร็จ' : 'รอส่ง'} tone={failed ? 'bad' : etaxTodo.length ? 'warn' : 'ok'} href="/accounting?f=etax" />
        <Stat label="ภาษีขายเดือนนี้" value={baht(monthInv.reduce((a, x) => a + x.vat, 0))} note={`จาก ${monthInv.length} ใบกำกับภาษี`} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <section className="card overflow-hidden" aria-labelledby="inv-h">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4"><h2 id="inv-h" className="font-bold">ใบกำกับภาษี</h2>
            <Tabs current={f} items={[{ key: 'all', label: 'ทั้งหมด', href: '/accounting' }, { key: 'unpaid', label: 'ค้างชำระ', href: '/accounting?f=unpaid', count: unpaid.length }, { key: 'etax', label: 'e-Tax ค้าง', href: '/accounting?f=etax', count: etaxTodo.length }]} /></div>
          <div className="overflow-x-auto">{rows.length ? <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">เลขที่ / วันที่</th><th>ผู้ซื้อ</th><th className="text-right">ยอดรวม</th><th className="pl-5">สถานะ e-Tax</th><th>การชำระ</th><th className="p-3" /></tr></thead>
            <tbody>{rows.map(({ inv, orderCode }) => {
              const age = agingBucket(inv.dueAt, now);
              return (
                <tr key={inv.id} className={`border-t border-slate-100 align-top ${inv.etaxStatus === 'failed' ? 'bg-danger-50/60' : ''}`} data-testid="invoice-row">
                  <td className="p-3"><Link href={`/accounting/invoice/${inv.id}`} className="font-semibold text-navy-700 hover:underline">{inv.code}</Link><span className="block text-xs text-muted">{thDate(inv.issuedAt)} · <Link href={`/orders/${inv.orderId}`} className="underline">{orderCode}</Link></span></td>
                  <td className="pt-3"><span className="font-medium">{inv.buyerName}</span><span className="block text-xs text-muted">{inv.buyerTaxId ? `เลขผู้เสียภาษี ${inv.buyerTaxId}` : 'บุคคลทั่วไป'}</span></td>
                  <td className="pt-3 text-right font-semibold">{baht(inv.total)}<span className="block text-xs font-normal text-muted">VAT {baht(inv.vat)}</span></td>
                  <td className="pl-5 pt-3">
                    <ActionForm action={setEtaxAction} className="flex gap-1.5"><input type="hidden" name="id" value={inv.id} /><input type="hidden" name="etaxNote" value={inv.etaxNote} />
                      <select name="etaxStatus" defaultValue={inv.etaxStatus} aria-label={`สถานะ e-Tax ${inv.code}`} className="input w-36 py-1.5">{Object.entries(ETAX_TH).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                      <SubmitButton className="btn-outline px-3" pendingText="…">บันทึก</SubmitButton></ActionForm>
                    {inv.etaxNote && <p className="mt-1 text-xs text-sale">{inv.etaxNote}</p>}
                  </td>
                  <td className="pt-3">{inv.paidAt ? <><Badge tone="ok">ชำระแล้ว</Badge><span className="mt-1 block text-xs text-muted">{inv.receiptCode}</span></> : <Badge tone={age === 'current' ? 'neutral' : 'bad'}>{age === 'current' ? `ครบ ${thDate(inv.dueAt)}` : `เกินกำหนด ${Math.floor((now - inv.dueAt) / 86400)} วัน`}</Badge>}</td>
                  <td className="p-3 text-right">{!inv.paidAt && <ActionForm action={markPaidAction}><input type="hidden" name="id" value={inv.id} /><SubmitButton className="btn-outline px-3" confirm={`ยืนยันรับเงิน ${baht(inv.total)} สำหรับ ${inv.code}?`}>รับเงิน</SubmitButton></ActionForm>}</td>
                </tr>
              );
            })}</tbody>
          </table> : <Empty>{f === 'all' ? 'ยังไม่มีใบกำกับภาษี ออกได้จากหน้าออเดอร์เมื่อถึงขั้นแพ็ค/ส่ง' : 'ไม่มีรายการค้าง'}</Empty>}</div>
        </section>

        <aside className="grid gap-5 md:grid-cols-3 2xl:block 2xl:space-y-5">
          <section className="card p-5" aria-labelledby="etax-h">
            <h2 id="etax-h" className="font-bold">ระบบ e-Tax Invoice</h2>
            <div className="mt-2"><Badge tone="warn">ยังไม่เชื่อมผู้ให้บริการ</Badge></div>
            <p className="mt-3 text-sm text-muted">ตอนนี้บันทึกสถานะ e-Tax ด้วยมือ เมื่อเลือกแบบ (Time Stamp / เต็มรูปแบบ หรือผ่าน Bplus) และได้บัญชีผู้ให้บริการแล้ว ระบบจะส่งและอัปเดตสถานะให้อัตโนมัติ</p>
            {failed && <div className="mt-4 rounded-xl border border-sale/40 bg-danger-50 p-3 text-sm"><p className="font-semibold text-sale">{failed.inv.code} ส่งไม่สำเร็จ</p><p className="text-muted">ตรวจอีเมลผู้ซื้อ ({failed.inv.buyerEmail || 'ไม่มีอีเมล'}) แล้วส่งใหม่</p></div>}
          </section>
          <section className="card p-5" aria-labelledby="age-h">
            <h2 id="age-h" className="font-bold">อายุลูกหนี้</h2><p className="mb-3 text-xs text-muted">ยอดค้างชำระแยกตามวันที่เกินกำหนด</p>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">{aging.map((a) => arTotal > 0 && a.sum > 0 && <div key={a.b} className={AGE_COLOR[a.b]} style={{ width: `${(a.sum / arTotal) * 100}%` }} />)}</div>
            <ul className="mt-4 space-y-2 text-sm">{aging.map((a) => <li key={a.b} className="flex items-center gap-2"><i aria-hidden className={`size-2.5 rounded-sm ${AGE_COLOR[a.b]}`} /><span className="flex-1 text-muted">{AGING_TH[a.b]}</span><b>{baht(a.sum)}</b></li>)}</ul>
          </section>
          <section className="card p-5" aria-labelledby="bill-h">
            <h2 id="bill-h" className="font-bold">รอออกใบกำกับภาษี</h2>
            {toBill.length ? <ul className="mt-3 divide-y divide-slate-100 text-sm">{toBill.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2"><span><Link href={`/orders/${o.id}`} className="font-semibold text-navy-700">{o.code}</Link><span className="block text-xs text-muted">{o.name} · {baht(o.total)}</span></span>
                <ActionForm action={issueInvoiceAction}><input type="hidden" name="id" value={o.id} /><SubmitButton className="btn-outline px-3" pendingText="…">ออกใบกำกับ</SubmitButton></ActionForm></li>
            ))}</ul> : <p className="mt-2 text-sm text-muted">ไม่มีออเดอร์ที่รอออกบิล</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
