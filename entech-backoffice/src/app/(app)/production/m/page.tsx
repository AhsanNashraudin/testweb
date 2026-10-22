import Link from 'next/link';
import { eq, inArray } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { requireUser } from '@/lib/admin';
import { Badge, thDate } from '@/components/bo';
import { MO_TH } from '@/lib/status';
import { OutputForm } from './output-form';

export const metadata = { title: 'บันทึกผลผลิต' };

/** หน้าสำหรับช่างหน้าไลน์ผลิต: ปุ่มใหญ่ กดง่ายบนมือถือ */
export default async function Worker({ searchParams }: { searchParams: Promise<{ mo?: string }> }) {
  const me = await requireUser();
  const sel = Number((await searchParams).mo) || 0;
  const now = Math.floor(Date.now() / 1000);
  const rows = await db.select({ mo: s.productionOrders, sku: s.items.sku, pName: s.items.productName, vName: s.items.variantName })
    .from(s.productionOrders).innerJoin(s.items, eq(s.items.id, s.productionOrders.itemId))
    .where(inArray(s.productionOrders.status, ['in_progress', 'queued', 'qc'])).orderBy(s.productionOrders.dueAt);
  const cur = rows.find((r) => r.mo.id === sel && r.mo.status === 'in_progress');
  const finished = rows.find((r) => r.mo.id === sel && r.mo.status === 'qc');

  if (cur) {
    const { mo } = cur;
    const pct = Math.round((mo.goodQty / mo.qty) * 100);
    return (
      <div className="mx-auto max-w-md space-y-5">
        <Link href="/production/m" className="inline-flex min-h-11 items-center font-semibold text-navy-700">← งานของฉัน</Link>
        <div><h1 className="text-xl font-bold">บันทึกผลผลิต</h1><p className="text-sm text-muted">{mo.code} · {cur.pName} {cur.vName}</p></div>
        <div className="card p-5">
          <div className="flex items-end justify-between"><div><p className="text-sm text-muted">ความคืบหน้า</p><p className="text-2xl font-bold">{mo.goodQty} / {mo.qty} ใบ</p></div><p className={`text-lg font-bold ${mo.dueAt < now ? 'text-sale' : 'text-navy-700'}`}>{pct}%</p></div>
          <div className="mt-3 h-2.5 rounded-full bg-slate-100"><div className={`h-2.5 rounded-full ${mo.dueAt < now ? 'bg-sale' : 'bg-navy-700'}`} style={{ width: `${pct}%` }} /></div>
          {mo.rejectQty > 0 && <p className="mt-2 text-sm text-warning">ไม่ผ่านสะสม {mo.rejectQty} ใบ</p>}
        </div>
        <OutputForm id={mo.id} remaining={mo.qty - mo.goodQty} />
        <p className="text-center text-xs text-muted">บันทึกในชื่อ {me.name} · ผลิตครบแล้วระบบส่งไปขั้นทดสอบรั่วซึมให้อัตโนมัติ</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div><h1 className="text-xl font-bold">งานผลิตวันนี้</h1><p className="text-sm text-muted">แตะงานที่กำลังผลิตเพื่อบันทึกจำนวน</p></div>
      {finished && <p role="status" data-testid="mo-finished" className="rounded-2xl bg-success-50 p-4 font-semibold text-success">✓ {finished.mo.code} ผลิตครบ {finished.mo.goodQty} ใบแล้ว ส่งไปทดสอบรั่วซึม</p>}
      {rows.map(({ mo, sku, pName, vName }) => {
        const late = mo.dueAt < now;
        const body = (
          <>
            <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-navy-700">{mo.code}</span>{late ? <Badge tone="bad">เลยกำหนด {thDate(mo.dueAt)}</Badge> : <Badge tone="neutral">{MO_TH[mo.status]}</Badge>}</div>
            <p className="mt-1 text-lg font-bold">{pName} {vName}</p>
            <p className="text-sm text-muted">{sku} · ผลิตแล้ว {mo.goodQty} / {mo.qty} ใบ{mo.line && ` · ${mo.line}`}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${late ? 'bg-sale' : 'bg-navy-700'}`} style={{ width: `${Math.max(2, (mo.goodQty / mo.qty) * 100)}%` }} /></div>
            <p className="mt-2 text-sm font-semibold text-navy-700">{mo.status === 'in_progress' ? 'แตะเพื่อบันทึกผลผลิต →' : mo.status === 'qc' ? 'รอทดสอบรั่วซึม' : 'อยู่ในคิว เริ่มได้ที่หน้าโรงงาน'}</p>
          </>
        );
        return mo.status === 'in_progress'
          ? <Link key={mo.id} href={`/production/m?mo=${mo.id}`} className={`block rounded-2xl border-2 bg-white p-5 ${late ? 'border-sale' : 'border-slate-200 hover:border-navy-700'}`}>{body}</Link>
          : <div key={mo.id} className="rounded-2xl border border-slate-200 bg-white p-5 opacity-80">{body}</div>;
      })}
      {!rows.length && <p className="card p-6 text-center text-muted">ยังไม่มีงานผลิต · <Link href="/production" className="text-navy-700 underline">ไปหน้าโรงงาน</Link></p>}
    </div>
  );
}
