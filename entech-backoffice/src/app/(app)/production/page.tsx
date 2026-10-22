import Link from 'next/link';
import { and, eq, gte, inArray, ne, or } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, PageHead, Stat, thDate } from '@/components/bo';
import { MO_TH } from '@/lib/status';
import { createMOAction, moAction } from './../actions';

export const metadata = { title: 'โรงงานผลิต' };
const COLS = ['waiting', 'queued', 'in_progress', 'qc', 'done'] as const;
const DOT: Record<string, string> = { waiting: 'bg-warning', queued: 'bg-slate-400', in_progress: 'bg-navy-700', qc: 'bg-cyan-600', done: 'bg-success' };

export default async function Production() {
  const now = Math.floor(Date.now() / 1000);
  const weekAgo = now - 7 * 86400;
  const [rows, variants] = await Promise.all([
    db.select({ mo: s.productionOrders, sku: s.items.sku, vName: s.items.variantName, pName: s.items.productName, orderCode: s.orders.code })
      .from(s.productionOrders).innerJoin(s.items, eq(s.items.id, s.productionOrders.itemId))
      .leftJoin(s.orders, eq(s.orders.id, s.productionOrders.orderId))
      .where(and(ne(s.productionOrders.status, 'cancelled'), or(ne(s.productionOrders.status, 'done'), gte(s.productionOrders.updatedAt, weekAgo))))
      .orderBy(s.productionOrders.dueAt),
    db.select({ id: s.items.id, sku: s.items.sku, name: s.items.productName, v: s.items.variantName }).from(s.items)
      .where(inArray(s.items.id, db.select({ v: s.bom.itemId }).from(s.bom))).orderBy(s.items.productName, s.items.sku),
  ]);
  const open = rows.filter((r) => r.mo.status !== 'done');
  const doneWeek = rows.filter((r) => r.mo.status === 'done');
  const made = doneWeek.reduce((a, r) => a + r.mo.goodQty, 0);
  const rej = rows.reduce((a, r) => a + r.mo.rejectQty, 0), tot = rows.reduce((a, r) => a + r.mo.goodQty + r.mo.rejectQty, 0);
  const late = open.filter((r) => r.mo.dueAt < now);

  return (
    <div className="space-y-6">
      <PageHead title="โรงงานผลิต" sub="ใบสั่งผลิตทั้งหมด · เริ่มผลิตแล้วระบบตัดวัตถุดิบตามสูตร ผ่านทดสอบรั่วซึมแล้วรับถังเข้าคลังให้อัตโนมัติ">
        <Link href="/production/m" className="btn-outline">หน้าบันทึกผลผลิต (มือถือ)</Link>
      </PageHead>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ใบสั่งผลิตที่เปิดอยู่" value={String(open.length)} note={`ผลิตให้ออเดอร์ ${open.filter((r) => r.mo.orderId).length} · เก็บสต็อก ${open.filter((r) => !r.mo.orderId).length}`} />
        <Stat label="ผลิตเสร็จ 7 วัน" value={`${made} ใบ`} tone="ok" note={`${doneWeek.length} ใบสั่งผลิต`} />
        <Stat label="ไม่ผ่านทดสอบรั่วซึม" value={tot ? `${Math.round((rej / tot) * 1000) / 10}%` : '0%'} note={`${rej} จาก ${tot} ใบ`} tone={rej ? 'warn' : 'ok'} />
        <Stat label="ช้ากว่ากำหนด" value={`${late.length} ใบ`} note={late.length ? `กระทบออเดอร์ ${late.filter((r) => r.mo.orderId).length} ราย` : 'ทุกใบตามกำหนด'} tone={late.length ? 'bad' : 'ok'} />
      </div>

      <div className="grid grid-cols-[repeat(5,minmax(210px,1fr))] gap-3 overflow-x-auto pb-2">
        {COLS.map((c) => {
          const list = rows.filter((r) => r.mo.status === c);
          return (
            <section key={c} className="rounded-2xl bg-slate-100 p-3" aria-labelledby={`col-${c}`}>
              <h2 id={`col-${c}`} className="mb-3 flex items-center gap-2 px-1 text-sm font-bold"><span aria-hidden className={`size-2.5 rounded-full ${DOT[c]}`} />{MO_TH[c]}<span className="ml-auto rounded-full bg-white px-2 text-xs text-muted">{list.length}</span></h2>
              <ul className="space-y-2.5">{list.map(({ mo, pName, vName, orderCode }) => {
                const isLate = c !== 'done' && mo.dueAt < now;
                const pct = Math.min(100, Math.round((mo.goodQty / mo.qty) * 100));
                return (
                  <li key={mo.id} className={`rounded-xl border bg-white p-3.5 ${isLate ? 'border-sale ring-1 ring-sale/30' : 'border-slate-200'}`} data-testid="mo-card">
                    <p className="text-xs font-semibold text-navy-700">{mo.code}</p>
                    <p className="mt-0.5 font-bold leading-snug">{vName}</p>
                    <p className="line-clamp-1 text-xs text-muted" title={pName}>{pName}</p>
                    <p className="mt-1 text-xs text-ink">{mo.qty} ใบ · {orderCode ? `ออเดอร์ ${orderCode}` : 'ผลิตเก็บสต็อก'}</p>
                    {(c === 'in_progress' || c === 'qc') && <div className="mt-2"><div className="h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${isLate ? 'bg-sale' : 'bg-navy-700'}`} style={{ width: `${pct}%` }} /></div><p className="mt-1 text-right text-xs text-muted">{mo.goodQty}/{mo.qty} ใบ</p></div>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isLate ? <Badge tone="bad">เลยกำหนด {thDate(mo.dueAt)}</Badge> : c !== 'done' && <Badge tone="neutral">กำหนดเสร็จ {thDate(mo.dueAt)}</Badge>}
                      {mo.rejectQty > 0 && <Badge tone="warn">ไม่ผ่าน {mo.rejectQty}</Badge>}
                    </div>
                    {mo.note && c === 'waiting' && <p className="mt-2 text-xs text-warning">{mo.note}</p>}
                    {(mo.assignee || mo.line) && <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-muted">{[mo.line, mo.assignee].filter(Boolean).join(' · ')}</p>}
                    {c !== 'done' && (
                      <ActionForm action={moAction} className="mt-2.5">
                        <input type="hidden" name="id" value={mo.id} />
                        {(c === 'waiting' || c === 'queued') && <SubmitButton name="op" value="start" className="btn-outline w-full" pendingText="กำลังตรวจวัตถุดิบ…">{c === 'waiting' ? 'ตรวจวัตถุดิบแล้วเริ่มผลิต' : 'เริ่มผลิต (ตัดวัตถุดิบ)'}</SubmitButton>}
                        {c === 'in_progress' && <Link href={`/production/m?mo=${mo.id}`} className="btn-outline w-full">บันทึกผลผลิต</Link>}
                        {c === 'qc' && <SubmitButton name="op" value="qc" className="btn-primary w-full" confirm={`ยืนยันผ่านทดสอบรั่วซึม ${mo.goodQty} ใบ และรับเข้าคลัง?`}>ผ่านทดสอบ · รับเข้าคลัง</SubmitButton>}
                      </ActionForm>
                    )}
                  </li>
                );
              })}{!list.length && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-muted">ไม่มีงาน</li>}</ul>
            </section>
          );
        })}
      </div>

      <section className="card p-5" aria-labelledby="new-mo">
        <h2 id="new-mo" className="font-bold">เปิดใบสั่งผลิต (ผลิตเก็บสต็อก)</h2>
        <p className="mb-3 text-xs text-muted">ใบสั่งผลิตของออเดอร์ลูกค้าเปิดอัตโนมัติจากใบเสนอราคา หรือเปิดเองได้ที่หน้าออเดอร์ · ถ้าวัตถุดิบไม่พอจะอยู่ช่อง “รอวัตถุดิบ”</p>
        <ActionForm action={createMOAction} resetOnSuccess className="grid gap-3 md:grid-cols-[2fr_100px_110px_1fr_1fr_auto] md:items-end">
          <div><label htmlFor="v" className="label">สินค้า</label><select id="v" name="itemId" required className="input">{variants.map((v) => <option key={v.id} value={v.id}>{v.name} {v.v} ({v.sku})</option>)}</select></div>
          <div><label htmlFor="q" className="label">จำนวน (ใบ)</label><input id="q" name="qty" type="number" min={1} required defaultValue={10} className="input" /></div>
          <div><label htmlFor="d" className="label">เสร็จใน (วัน)</label><input id="d" name="dueDays" type="number" min={0} defaultValue={3} className="input" /></div>
          <div><label htmlFor="l" className="label">แม่พิมพ์/ไลน์</label><input id="l" name="line" maxLength={60} placeholder="แม่พิมพ์ 1" className="input" /></div>
          <div><label htmlFor="a" className="label">ผู้รับผิดชอบ</label><input id="a" name="assignee" maxLength={60} placeholder="ชื่อช่าง" className="input" /></div>
          <SubmitButton>เปิดใบสั่งผลิต</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
