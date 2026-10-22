import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { pricesIncludeVat, quoteLines } from '@/lib/backoffice';
import { getCompany } from '@/lib/company';
import { MAX_SALES_DISCOUNT, quoteTotals } from '@/lib/backoffice-rules';
import { QUOTE_STATUS_TH, QUOTE_TONE } from '@/lib/status';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, thDate } from '@/components/bo';
import { DocHead } from '@/components/doc-head';
import { PrintButton } from '@/components/print-button';
import { convertQuoteAction, quoteItemAction, quoteStatusAction, saveQuoteAction } from '../../actions';

export const metadata = { title: 'ใบเสนอราคา' };

export default async function QuoteBuilder({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[q], lines, vatIn, catalog, company] = await Promise.all([
    db.select().from(s.quotes).where(eq(s.quotes.id, id)), quoteLines(id), pricesIncludeVat(),
    db.select({ sku: s.items.sku, name: s.items.productName, v: s.items.variantName, price: s.items.price }).from(s.items).orderBy(s.items.productName),
    getCompany(),
  ]);
  if (!q) notFound();
  const t = quoteTotals(lines, q.discountPct, vatIn);
  const locked = !!q.orderId;
  const needsApproval = q.discountPct > MAX_SALES_DISCOUNT;
  const shortLines = lines.filter((l) => l.stock < l.qty);
  const [order] = q.orderId ? await db.select({ code: s.orders.code }).from(s.orders).where(eq(s.orders.id, q.orderId)) : [];
  const validUntil = q.createdAt + q.validDays * 86400;
  const f = (name: keyof typeof q, label: string, cls = '', type = 'text') => (
    <div className={cls}><label htmlFor={`q-${name}`} className="label">{label}</label><input id={`q-${name}`} name={name} type={type} defaultValue={String(q[name] ?? '')} disabled={locked} className="input" /></div>
  );

  return (
    <div className="max-w-6xl space-y-5">
      <DocHead c={company} title="ใบเสนอราคา" code={q.code} lines={[['วันที่', thDate(q.createdAt)], ['ยืนราคาถึง', thDate(validUntil)], ['ผู้เสนอ', q.salesperson]]} />
      <Link href="/quotes" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy-700 print:hidden">← ใบเสนอราคาทั้งหมด</Link>
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-navy-900">ใบเสนอราคา {q.code} <Badge tone={QUOTE_TONE[q.status]}>{QUOTE_STATUS_TH[q.status]}</Badge></h1>
          <p className="mt-1 text-sm text-muted">{q.topic || 'ไม่ระบุเรื่อง'} · ยืนราคาถึง {thDate(validUntil)} · เซลล์ {q.salesperson}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!locked && <ActionForm action={quoteStatusAction} className="flex gap-2"><input type="hidden" name="id" value={id} />
            <select name="status" defaultValue={q.status} aria-label="สถานะใบเสนอราคา" className="input w-40">{(['draft', 'sent', 'lost'] as const).map((k) => <option key={k} value={k}>{QUOTE_STATUS_TH[k]}</option>)}</select>
            <SubmitButton className="btn-outline">บันทึก</SubmitButton></ActionForm>}
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] print:block [&>*]:min-w-0">
        <div className="space-y-5">
          <section className="card p-5 print:border-0 print:p-0" aria-labelledby="cust-h">
            <h2 id="cust-h" className="mb-3 font-bold">ลูกค้า</h2>
            <div className="hidden text-sm print:block"><b>{q.company || q.name}</b>{q.company && ` · ผู้ติดต่อ ${q.name}`}<br />{q.address} {q.province}<br />{q.taxId && `เลขผู้เสียภาษี ${q.taxId} · `}{q.phone} {q.email}</div>
            <ActionForm action={saveQuoteAction} className="grid gap-3 sm:grid-cols-3 print:hidden">
              <input type="hidden" name="id" value={id} />
              {f('name', 'ผู้ติดต่อ')}{f('company', 'บริษัท / หน่วยงาน')}{f('taxId', 'เลขผู้เสียภาษี')}
              {f('phone', 'โทร', '', 'tel')}{f('email', 'อีเมล', '', 'email')}{f('province', 'จังหวัด')}
              {f('address', 'ที่อยู่ (ใช้ออกใบกำกับภาษี)', 'sm:col-span-3')}
              <div><label htmlFor="disc" className="label">ส่วนลด (%)</label><input id="disc" name="discountPct" type="number" min={0} max={50} step="0.5" defaultValue={q.discountPct} disabled={locked} className="input" /></div>
              <div><label htmlFor="credit" className="label">เครดิต (วัน)</label><input id="credit" name="creditDays" type="number" min={0} max={180} defaultValue={q.creditDays} disabled={locked} className="input" /><p className="mt-1 text-xs text-muted">0 = ชำระก่อนส่ง</p></div>
              <div><label htmlFor="valid" className="label">ยืนราคา (วัน)</label><input id="valid" name="validDays" type="number" min={1} max={180} defaultValue={q.validDays} disabled={locked} className="input" /></div>
              <div className="sm:col-span-3"><label htmlFor="note" className="label">หมายเหตุถึงลูกค้า</label><textarea id="note" name="customerNote" rows={2} maxLength={1000} defaultValue={q.customerNote} disabled={locked} placeholder="เช่น ราคารวมค่าจัดส่งในกรุงเทพฯ รับประกันถัง 12 ปี" className="input" /></div>
              {!locked && <div className="sm:col-span-3"><SubmitButton className="btn-outline">บันทึกข้อมูลลูกค้า & เงื่อนไข</SubmitButton></div>}
            </ActionForm>
          </section>

          <section className="card p-5 print:mt-4 print:border-0 print:p-0" aria-labelledby="items-h">
            <h2 id="items-h" className="font-bold">รายการสินค้า</h2><p className="mb-3 text-xs text-muted print:hidden">ราคาเริ่มจาก Price List (ราคาส่งเมื่อถึงจำนวน) แก้ราคาต่อหน่วยได้ · สถานะสต็อกตรงกับคลังจริง</p>
            {lines.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm print:min-w-0">
              <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="rounded-l-lg p-2.5">สินค้า</th><th className="print:hidden">สต็อก</th><th>จำนวน / ราคาต่อหน่วย</th><th className="rounded-r-lg p-2.5 text-right">รวม</th></tr></thead>
              <tbody>{lines.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="p-2.5"><span className="font-medium">{l.pName} {l.vName}</span><span className="block text-xs text-muted">{l.sku}</span></td>
                  <td className="print:hidden">{l.stock >= l.qty ? <Badge tone="ok">พร้อมขาย {l.stock}</Badge> : <Badge tone="warn">ขาด {l.qty - Math.max(0, l.stock)} · ต้องผลิต</Badge>}</td>
                  <td>{locked ? `${l.qty} × ${baht(l.unitPrice)}` : (<>
                    <span className="hidden print:inline">{l.qty} × {baht(l.unitPrice)}</span>
                    <ActionForm action={quoteItemAction} className="flex items-center gap-1.5 print:hidden">
                      <input type="hidden" name="quoteId" value={id} /><input type="hidden" name="lineId" value={l.id} />
                      <input name="qty" type="number" min={1} defaultValue={l.qty} aria-label={`จำนวน ${l.sku}`} className="input w-20 py-1.5" />
                      <input name="unitPrice" type="number" min={0} defaultValue={l.unitPrice} aria-label={`ราคาต่อหน่วย ${l.sku}`} className="input w-28 py-1.5" />
                      <SubmitButton name="op" value="update" className="btn-outline min-h-9 px-3" pendingText="…">บันทึก</SubmitButton>
                      <SubmitButton name="op" value="remove" className="btn min-h-9 px-2 text-sale" pendingText="…" aria-label={`ลบ ${l.sku}`} confirm="ลบรายการนี้?">✕</SubmitButton>
                    </ActionForm></>
                  )}</td>
                  <td className="p-2.5 text-right font-semibold">{baht(l.qty * l.unitPrice)}</td>
                </tr>
              ))}</tbody></table></div> : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-muted">ยังไม่มีรายการ เพิ่มสินค้าด้านล่าง</p>}
            {!locked && (
              <ActionForm action={quoteItemAction} resetOnSuccess className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_100px_auto] sm:items-end print:hidden">
                <input type="hidden" name="quoteId" value={id} /><input type="hidden" name="op" value="add" />
                <div><label htmlFor="sku" className="label">เพิ่มสินค้า (พิมพ์รหัสหรือชื่อ)</label><input id="sku" name="sku" list="catalog" required className="input" placeholder="CW-1000" autoComplete="off" />
                  <datalist id="catalog">{catalog.map((c) => <option key={c.sku} value={c.sku}>{c.name} {c.v} · {c.price ? baht(c.price) : 'สอบถามราคา'}</option>)}</datalist></div>
                <div><label htmlFor="qty" className="label">จำนวน</label><input id="qty" name="qty" type="number" min={1} defaultValue={1} className="input" /></div>
                <SubmitButton className="btn-outline">+ เพิ่ม</SubmitButton>
              </ActionForm>
            )}
            <dl className="ml-auto mt-4 hidden w-64 space-y-1 text-sm print:block">
              <div className="flex justify-between"><dt>ยอดรวม</dt><dd>{baht(t.subtotal)}</dd></div>
              {t.discount > 0 && <div className="flex justify-between"><dt>ส่วนลด {q.discountPct}%</dt><dd>−{baht(t.discount)}</dd></div>}
              {t.vat > 0 && <div className="flex justify-between"><dt>VAT 7%</dt><dd>{baht(t.vat)}</dd></div>}
              <div className="flex justify-between border-t pt-1 font-bold"><dt>ยอดสุทธิ</dt><dd>{baht(t.total)}</dd></div>
            </dl>
            {(q.customerNote || q.creditDays > 0) && <p className="mt-4 hidden text-sm print:block">เงื่อนไข: {q.creditDays ? `เครดิต ${q.creditDays} วัน` : 'ชำระก่อนส่งสินค้า'} · {q.customerNote}</p>}
          </section>
        </div>

        <aside className="space-y-5 print:hidden">
          <section className="card p-5" aria-labelledby="sum-h">
            <h2 id="sum-h" className="mb-3 font-bold">สรุปยอด</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">ยอดรวม</dt><dd>{baht(t.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">ส่วนลด {q.discountPct}%</dt><dd>−{baht(t.discount)}</dd></div>
              {t.vat > 0 && <div className="flex justify-between"><dt className="text-muted">VAT 7%{vatIn ? ' (รวมในราคา)' : ''}</dt><dd>{baht(t.vat)}</dd></div>}
              <div className="flex items-end justify-between border-t border-slate-200 pt-3"><dt className="font-bold">ยอดสุทธิ</dt><dd className="text-2xl font-bold text-navy-700">{baht(t.total)}</dd></div>
            </dl>
          </section>
          {needsApproval && !locked && (
            <div role="note" className="rounded-2xl border border-warning/40 bg-warning-50 p-4 text-sm">
              <p className="font-bold text-warning">ส่วนลดเกินสิทธิ์ ({MAX_SALES_DISCOUNT}%)</p>
              <p className="mt-1 text-ink">เปิดออเดอร์ได้ แต่ออเดอร์จะค้างที่ขั้น “อนุมัติ” จนกว่าหัวหน้าฝ่ายขายจะอนุมัติ</p>
            </div>
          )}
          {shortLines.length > 0 && !locked && (
            <div className="rounded-2xl border border-slate-200 bg-cyan-100/60 p-4 text-sm">
              <p className="font-bold text-navy-700">ต้องผลิตเพิ่ม {shortLines.length} รายการ</p>
              <p className="mt-1">เมื่อเปิดออเดอร์ ระบบจะเปิดใบสั่งผลิตส่วนที่ขาดให้โรงงานอัตโนมัติ (ประมาณ 3 วันทำการ)</p>
            </div>
          )}
          <section className="card p-5">
            {locked ? (
              <><p className="text-sm">เปิดออเดอร์แล้ว</p><Link href={`/orders/${q.orderId}`} className="btn-primary mt-3 w-full">ไปที่ออเดอร์ {order?.code}</Link></>
            ) : (
              <ActionForm action={convertQuoteAction}>
                <input type="hidden" name="id" value={id} />
                <p className="mb-3 text-sm text-muted">ลูกค้ายืนยันแล้ว? เปิดออเดอร์ ตัดสต็อก และส่งงานต่อให้คลัง/โรงงานในคลิกเดียว</p>
                <SubmitButton className="btn-primary w-full" disabled={!lines.length} confirm={`ยืนยันเปิดออเดอร์ ${baht(t.total)}?`}>ลูกค้ายืนยัน · เปิดออเดอร์</SubmitButton>
                {!lines.length && <p className="mt-2 text-xs text-muted">เพิ่มสินค้าอย่างน้อย 1 รายการก่อน</p>}
              </ActionForm>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
