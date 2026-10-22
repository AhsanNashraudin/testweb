import { notFound } from 'next/navigation';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { StatusBadge } from '@/components/status-badge';
import { advanceOrderAction, assignOrderAction, cancelOrderAction, confirmPaymentAction, createMOAction, issueInvoiceAction, markPaidAction, noteOrderAction, trackingAction } from '../../actions';
import { trackedOrders, orderContext } from '@/lib/backoffice';
import { durationTh, nextStage, STAGE_OWNER, STAGE_TH, STAGES, type Stage } from '@/lib/backoffice-rules';
import { Badge, thDate, thDateTime } from '@/components/bo';
import { MO_TH, MO_TONE, ETAX_TH, ETAX_TONE } from '@/lib/status';
import { requireUser } from '@/lib/admin';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const [o] = await db.select({ code: s.orders.code }).from(s.orders).where(eq(s.orders.id, Number((await params).id) || 0));
  return { title: o ? `ออเดอร์ ${o.code}` : 'ไม่พบออเดอร์' };
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) notFound();
  const [items, events, mos, ctx, tracked] = await Promise.all([
    db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id)),
    db.select().from(s.orderEvents).where(eq(s.orderEvents.orderId, id)).orderBy(desc(s.orderEvents.id)),
    db.select({ mo: s.productionOrders, sku: s.items.sku }).from(s.productionOrders).innerJoin(s.items, eq(s.items.id, s.productionOrders.itemId)).where(eq(s.productionOrders.orderId, id)),
    orderContext(id), trackedOrders({ includeClosed: true }),
  ]);
  const t = tracked.find((x) => x.id === id)!;
  const stage = o.stage as Stage;
  const open = stage !== 'done' && stage !== 'cancelled';
  const curIdx = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const nxt = nextStage(stage, { openMOs: ctx.openMOs, paid: ctx.paid });
  const reached = new Map(events.map((e) => [e.stage, e]));
  const inv = ctx.invoice;
  const makeable = items.filter((i) => i.itemId);
  return (
    <div className="max-w-6xl space-y-5">
      <Link href="/tracking" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy-700">← กลับไปหน้าติดตามออเดอร์</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-navy-900">ออเดอร์ {o.code} <StatusBadge status={o.status} />{t.late > 0 && <Badge tone="bad">เกินกำหนด {durationTh(t.late)}</Badge>}<Badge tone={o.channel === 'web' ? 'ok' : 'neutral'}>{o.channel === 'web' ? 'เว็บไซต์' : 'ทีมเซลล์'}</Badge></h1>
          <p className="mt-1 text-sm text-muted">{o.name} · สั่งเมื่อ {thDateTime(o.createdAt)}{o.creditDays ? ` · เครดิต ${o.creditDays} วัน` : ''}{o.statusPending && ' · รอส่งสถานะให้เว็บ'}</p>
        </div>
        {open && (
          <div className="flex flex-wrap gap-2">
            <ActionForm action={cancelOrderAction}><input type="hidden" name="id" value={o.id} /><SubmitButton className="btn-danger" confirm="ยืนยันยกเลิกออเดอร์นี้? ระบบจะคืนสต็อกและยกเลิกใบสั่งผลิตที่ยังไม่เริ่ม">ยกเลิกออเดอร์</SubmitButton></ActionForm>
            {o.status === 'pending_payment' && <ActionForm action={confirmPaymentAction}><input type="hidden" name="id" value={o.id} /><SubmitButton className="btn-outline" confirm={`ยืนยันว่าได้รับเงิน ${baht(o.total)} แล้ว?`}>ยืนยันรับชำระ</SubmitButton></ActionForm>}
            {nxt && <ActionForm action={advanceOrderAction}><input type="hidden" name="id" value={o.id} /><SubmitButton pendingText="กำลังส่งต่อ…">{stage === 'approval' ? 'อนุมัติ และส่งต่อ' : `ส่งต่อ: ${STAGE_TH[nxt]} →`}</SubmitButton></ActionForm>}
          </div>
        )}
      </div>

      <ol className="card grid grid-cols-3 gap-y-5 p-5 md:grid-cols-6" aria-label="ขั้นตอนออเดอร์">
        {STAGES.filter((x) => x !== 'done').map((st, i) => {
          const done = stage === 'done' || (curIdx > i && stage !== 'cancelled');
          const now = st === stage;
          const ev = reached.get(st);
          return (
            <li key={st} className="relative pr-2" aria-current={now ? 'step' : undefined}>
              <div className="flex items-center gap-2">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? 'bg-success text-white' : now ? (t.late ? 'bg-sale text-white' : 'bg-navy-700 text-white') : 'bg-slate-100 text-muted'}`}>{done ? '✓' : now && t.late ? '!' : i + 1}</span>
                {i < 5 && <span className={`h-0.5 flex-1 rounded ${done ? 'bg-success' : 'bg-slate-200'}`} />}
              </div>
              <p className={`mt-2 text-sm font-semibold ${!done && !now ? 'text-muted' : ''}`}>{STAGE_TH[st]}</p>
              <p className="text-xs text-muted">{now ? (o.assignee || t.owner) : ev?.by && done ? ev.by : STAGE_OWNER[st]}</p>
              <p className={`text-xs ${now && t.late ? 'font-semibold text-sale' : 'text-muted'}`}>{now ? `อยู่ขั้นนี้ ${durationTh(t.inStage)}` : ev && done ? thDateTime(ev.at) : '—'}</p>
            </li>
          );
        })}
      </ol>
      {stage === 'cancelled' && <p className="rounded-xl bg-slate-200 p-3 text-sm">ออเดอร์นี้ถูกยกเลิกแล้ว สต็อกถูกคืนเรียบร้อย</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="space-y-5">
          <div className="card overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">สินค้า</th><th>SKU</th><th className="text-right">ราคา</th><th className="text-right">จำนวน</th><th className="p-3 text-right">รวม</th></tr></thead>
            <tbody>
              {items.map((i) => <tr key={i.id} className="border-t border-slate-100"><td className="p-3">{i.productName} {i.variantName && `(${i.variantName})`}{!i.itemId && <span className="ml-2"><Badge tone="warn">ไม่มี SKU ในหลังบ้าน</Badge></span>}</td><td>{i.sku}</td><td className="text-right">{baht(i.unitPrice)}</td><td className="text-right">{i.qty}</td><td className="p-3 text-right">{baht(i.unitPrice * i.qty)}</td></tr>)}
              <tr className="border-t"><td className="p-3" colSpan={4}>ยอดรวมสินค้า</td><td className="p-3 text-right">{baht(o.subtotal)}</td></tr>
              {o.discount > 0 && <tr><td className="px-3" colSpan={4}>ส่วนลด</td><td className="px-3 text-right">-{baht(o.discount)}</td></tr>}
              {o.shippingFee > 0 && <tr><td className="px-3" colSpan={4}>ค่าจัดส่ง</td><td className="px-3 text-right">{baht(o.shippingFee)}</td></tr>}
              {o.vat > 0 && <tr><td className="px-3" colSpan={4}>VAT 7%</td><td className="px-3 text-right">{baht(o.vat)}</td></tr>}
              <tr className="font-bold"><td className="p-3" colSpan={4}>ยอดสุทธิ</td><td className="p-3 text-right">{baht(o.total)}</td></tr>
            </tbody>
          </table></div>

          {(mos.length > 0 || (open && ['received', 'approval', 'production'].includes(stage))) && (
            <section className="card p-5" aria-labelledby="mo-h">
              <h2 id="mo-h" className="mb-3 font-bold">ใบสั่งผลิตของออเดอร์นี้</h2>
              {mos.length ? <ul className="divide-y divide-slate-100 text-sm">{mos.map(({ mo, sku }) => (
                <li key={mo.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><Link href="/production" className="font-semibold text-navy-700">{mo.code}</Link> · {sku} × {mo.qty} ใบ<span className="block text-xs text-muted">ผลิตแล้ว {mo.goodQty}/{mo.qty}{mo.note && ` · ${mo.note}`}</span></span><Badge tone={MO_TONE[mo.status]}>{MO_TH[mo.status]}</Badge></li>
              ))}</ul> : <p className="text-sm text-muted">ยังไม่มีใบสั่งผลิต ถ้าของไม่พอให้สั่งผลิตด้านล่าง</p>}
              {open && makeable.length > 0 && (
                <ActionForm action={createMOAction} className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_100px_auto] sm:items-end">
                  <input type="hidden" name="orderId" value={o.id} />
                  <div><label className="label" htmlFor="mo-v">สินค้าที่จะผลิต</label><select id="mo-v" name="itemId" className="input">{makeable.map((i) => <option key={i.id} value={i.itemId!}>{i.productName} {i.variantName} ({i.sku})</option>)}</select></div>
                  <div><label className="label" htmlFor="mo-q">จำนวน</label><input id="mo-q" name="qty" type="number" min={1} defaultValue={1} className="input" /></div>
                  <SubmitButton className="btn-outline">เปิดใบสั่งผลิต</SubmitButton>
                </ActionForm>
              )}
            </section>
          )}

          <section className="card p-5" aria-labelledby="ship-h">
            <h2 id="ship-h" className="mb-3 font-bold">การจัดส่ง</h2>
            <p className="mb-3 text-sm text-muted">{o.shippingLabel || '—'}{o.channel === 'web' && ' · บันทึกแล้วลูกค้าเห็นในหน้า "ตรวจสอบคำสั่งซื้อ" บนเว็บ'}</p>
            <ActionForm action={trackingAction} className="grid gap-3 md:grid-cols-3 md:items-end">
              <input type="hidden" name="id" value={o.id} />
              <div><label htmlFor="carrier" className="label">ขนส่ง</label><input id="carrier" name="carrier" defaultValue={o.carrier} maxLength={80} placeholder="เช่น Kerry, รถบริษัท" className="input" /></div>
              <div><label htmlFor="trackingNo" className="label">เลขพัสดุ</label><input id="trackingNo" name="trackingNo" defaultValue={o.trackingNo} maxLength={80} className="input" /></div>
              <div><label htmlFor="trackingUrl" className="label">ลิงก์ติดตาม (https://)</label><input id="trackingUrl" name="trackingUrl" type="url" defaultValue={o.trackingUrl} maxLength={300} className="input" /></div>
              <div className="md:col-span-3"><SubmitButton className="btn-outline">บันทึกขนส่ง</SubmitButton></div>
            </ActionForm>
          </section>

          <section className="card p-5" aria-labelledby="doc-h">
            <h2 id="doc-h" className="mb-3 font-bold">เอกสารบัญชี</h2>
            {inv ? (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-muted">ใบกำกับภาษี</p><Link href={`/accounting/invoice/${inv.id}`} className="font-semibold text-navy-700 underline">{inv.code}</Link><p className="text-xs text-muted">ออก {thDate(inv.issuedAt)} · ครบกำหนด {thDate(inv.dueAt)}</p><div className="mt-2"><Badge tone={ETAX_TONE[inv.etaxStatus]}>e-Tax: {ETAX_TH[inv.etaxStatus]}</Badge></div></div>
                <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-muted">ใบเสร็จรับเงิน</p>{inv.paidAt ? <><p className="font-semibold text-navy-700">{inv.receiptCode}</p><p className="text-xs text-muted">รับเงิน {thDate(inv.paidAt)}</p></> : <><p className="font-semibold text-warning">ยังไม่ได้รับเงิน</p><ActionForm action={markPaidAction} className="mt-2"><input type="hidden" name="id" value={inv.id} /><SubmitButton className="btn-outline" confirm={`ยืนยันรับเงิน ${baht(inv.total)} สำหรับ ${inv.code}?`}>บันทึกรับเงิน</SubmitButton></ActionForm></>}</div>
              </div>
            ) : open && ['packing', 'billing'].includes(stage) ? (
              <ActionForm action={issueInvoiceAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="id" value={o.id} /><SubmitButton>ออกใบกำกับภาษี</SubmitButton><span className="text-xs text-muted">ใช้ข้อมูลผู้ซื้อจากออเดอร์ · ส่ง e-Tax ได้ที่หน้าบัญชี</span></ActionForm>
            ) : <p className="text-sm text-muted">ออกใบกำกับภาษีได้เมื่อถึงขั้นแพ็ค/ส่ง หรือออกบิล</p>}
          </section>

          <div className="card space-y-1 p-5 text-sm">
            <h2 className="mb-2 font-bold">ลูกค้า</h2>
            <p>{o.name}{o.phone && <> · <a className="text-navy-700 underline" href={`tel:${o.phone}`}>{o.phone}</a></>}</p>
            {o.email && <p><a className="text-navy-700 underline" href={`mailto:${o.email}`}>{o.email}</a></p>}
            <p>{[o.address, o.province && `จ.${o.province}`, o.postcode].filter(Boolean).join(' ') || 'รับเองที่โรงงาน'}</p>
            {o.taxId && <p className="pt-2"><b>ใบกำกับภาษี:</b> {o.taxName} · เลข {o.taxId}<br />{o.taxAddress}</p>}
            {o.note && <p className="pt-2">หมายเหตุ: {o.note}</p>}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="card p-5" aria-labelledby="as-h">
            <h2 id="as-h" className="mb-2 font-bold">ผู้รับผิดชอบขั้นนี้</h2>
            <ActionForm action={assignOrderAction} className="flex gap-2"><input type="hidden" name="id" value={o.id} /><input name="assignee" aria-label="ผู้รับผิดชอบ" defaultValue={o.assignee} placeholder={STAGE_OWNER[stage] || 'ชื่อพนักงาน'} maxLength={60} className="input" /><SubmitButton className="btn-outline">บันทึก</SubmitButton></ActionForm>
          </section>
          <section className="card p-5" aria-labelledby="ev-h">
            <h2 id="ev-h" className="font-bold">ประวัติการดำเนินงาน</h2><p className="mb-3 text-xs text-muted">บันทึกอัตโนมัติทุกการเปลี่ยนขั้นตอน</p>
            <ActionForm action={noteOrderAction} resetOnSuccess className="mb-4 flex gap-2"><input type="hidden" name="id" value={o.id} /><input name="note" aria-label="บันทึก" placeholder="พิมพ์บันทึกถึงเพื่อนร่วมงาน…" maxLength={500} className="input" /><SubmitButton className="btn-outline px-4" pendingText="…">ส่ง</SubmitButton></ActionForm>
            <ol className="space-y-3 text-sm">{events.map((e) => (
              <li key={e.id} className="flex gap-3"><span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${e.stage === 'cancelled' ? 'bg-sale' : e.stage === 'note' ? 'bg-slate-400' : 'bg-navy-700'}`} /><span><span className="block">{e.note}</span><span className="text-xs text-muted">{e.by} · {thDateTime(e.at)}</span></span></li>
            ))}{!events.length && <li className="text-muted">ยังไม่มีประวัติ</li>}</ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
