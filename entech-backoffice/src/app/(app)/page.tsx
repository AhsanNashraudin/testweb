import Link from 'next/link';
import { and, gte, lt, ne, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { trackedOrders } from '@/lib/backoffice';
import { durationTh, STAGE_TH, STAGES, type Stage } from '@/lib/backoffice-rules';
import { Badge, Empty, PageHead, Stat } from '@/components/bo';

export const metadata = { title: 'แดชบอร์ด' };
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default async function Dashboard() {
  const th = new Date(Date.now() + 7 * 3600e3);
  const y = th.getUTCFullYear(), m = th.getUTCMonth();
  const at = (mm: number) => (Date.UTC(y, mm, 1) - 7 * 3600e3) / 1000;
  const monthStart = at(m), prevStart = at(m - 1), yearStart = at(0);
  const live = ne(s.orders.status, 'cancelled');
  const [orders, [cur], [prev], byMonth, lowV, lowM, [newQuotes]] = await Promise.all([
    trackedOrders(),
    db.select({ sum: sql<number>`coalesce(sum(${s.orders.total}),0)` }).from(s.orders).where(and(live, gte(s.orders.createdAt, monthStart))),
    db.select({ sum: sql<number>`coalesce(sum(${s.orders.total}),0)` }).from(s.orders).where(and(live, gte(s.orders.createdAt, prevStart), lt(s.orders.createdAt, monthStart))),
    db.select({ m: sql<number>`cast(strftime('%m', ${s.orders.createdAt}, 'unixepoch', '+7 hours') as integer)`, ch: s.orders.channel, sum: sql<number>`sum(${s.orders.total})` })
      .from(s.orders).where(and(live, gte(s.orders.createdAt, yearStart))).groupBy(sql`1`, s.orders.channel),
    db.select({ sku: s.items.sku, name: s.items.productName, v: s.items.variantName, stock: s.items.stock, rp: s.items.reorderPoint }).from(s.items)
      .where(and(sql`${s.items.reorderPoint} > 0`, sql`${s.items.stock} <= ${s.items.reorderPoint}`)).orderBy(s.items.stock).limit(6),
    db.select().from(s.materials).where(sql`${s.materials.stock} <= ${s.materials.reorderPoint}`),
    db.select({ n: sql<number>`count(*)` }).from(s.quotes).where(sql`${s.quotes.status} in ('draft','sent')`),
  ]);
  const late = orders.filter((o) => o.late > 0).sort((a, b) => b.late - a.late);
  const delta = prev.sum ? Math.round(((cur.sum - prev.sum) / prev.sum) * 1000) / 10 : 0;
  const series = MONTHS.map((_, i) => ({ web: 0, sales: 0, ...Object.fromEntries(byMonth.filter((r) => r.m === i + 1).map((r) => [r.ch, Number(r.sum)])) }));
  const max = Math.max(1, ...series.map((x) => x.web + x.sales));
  const pipe = STAGES.filter((x) => x !== 'done').map((st) => ({ st, n: orders.filter((o) => o.stage === st).length, late: orders.filter((o) => o.stage === st && o.late).length }));
  const lowCount = lowV.length + lowM.length;

  return (
    <div className="space-y-6">
      <PageHead title="แดชบอร์ด" sub={`${th.toLocaleDateString('th-TH', { dateStyle: 'full', timeZone: 'UTC' })} · ${late.length ? `มีงาน ${late.length} รายการเกินกำหนด` : 'ไม่มีงานเกินกำหนด'}`}>
        <Link href="/quotes" className="btn-outline">ใบเสนอราคาที่กำลังเสนอ ({newQuotes.n})</Link><Link href="/quotes?new=1" className="btn-primary">+ ใบเสนอราคาใหม่</Link>
      </PageHead>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="ยอดขายเดือนนี้" value={baht(cur.sum)} note={prev.sum ? `${delta >= 0 ? '+' : ''}${delta}% จากเดือนก่อน` : 'ยังไม่มีข้อมูลเดือนก่อน'} tone={delta >= 0 ? 'ok' : 'bad'} />
        <Stat label="ออเดอร์ที่กำลังดำเนินการ" value={String(orders.length)} note={`รอแพ็ค/ส่ง ${pipe.find((p) => p.st === 'packing')?.n ?? 0} รายการ`} href="/tracking" />
        <Stat label="งานเกินกำหนด" value={String(late.length)} note={late.length ? 'ต้องติดตามด่วน' : 'ทุกงานตามกำหนด'} tone={late.length ? 'bad' : 'ok'} href="/tracking?f=late" />
        <Stat label="สต็อกต่ำกว่าจุดสั่ง" value={`${lowCount} รายการ`} note={lowCount ? 'สั่งผลิต/สั่งซื้อได้จากหน้าคลัง' : 'สต็อกเพียงพอ'} tone={lowCount ? 'warn' : 'ok'} href="/inventory?f=low" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <section className="card p-5" aria-labelledby="chart-h">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div><h2 id="chart-h" className="font-bold">ยอดขายรายเดือน</h2><p className="text-xs text-muted">ปี {y + 543} แยกตามช่องทาง</p></div>
            <div className="flex gap-4 text-xs text-muted"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-success" />เว็บไซต์</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-navy-700" />ทีมเซลล์</span></div>
          </div>
          <div className="flex h-56 items-end justify-between gap-1.5" role="img" aria-label="กราฟยอดขายรายเดือน">
            {series.map((x, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${MONTHS[i]}: เว็บ ${baht(x.web)} · เซลล์ ${baht(x.sales)}`}>
                <div className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-md" style={{ height: `${((x.web + x.sales) / max) * 100}%` }}>
                  <div className="bg-navy-700" style={{ flexGrow: x.sales }} /><div className="bg-success" style={{ flexGrow: x.web }} />
                </div>
                <span className={`text-xs ${i === m ? 'font-bold text-ink' : 'text-muted'}`}>{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5" aria-labelledby="pipe-h">
          <h2 id="pipe-h" className="font-bold">ออเดอร์ตามขั้นตอน</h2><p className="mb-4 text-xs text-muted">{orders.length} ออเดอร์ที่ยังไม่ปิดงาน</p>
          <ul className="space-y-4">{pipe.map((p) => (
            <li key={p.st}><Link href={`/tracking?stage=${p.st}`} className="block">
              <div className="mb-1.5 flex items-center gap-2 text-sm"><span className="flex-1 font-medium">{STAGE_TH[p.st]}</span>{p.late > 0 && <Badge tone="bad">เกิน {p.late}</Badge>}<b>{p.n}</b></div>
              <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${p.late ? 'bg-sale' : 'bg-navy-700'}`} style={{ width: `${orders.length ? (p.n / orders.length) * 100 : 0}%` }} /></div>
            </Link></li>
          ))}</ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <section className="card p-5" aria-labelledby="late-h">
          <div className="mb-3 flex items-center justify-between"><div><h2 id="late-h" className="font-bold">งานเกินกำหนด</h2><p className="text-xs text-muted">เรียงจากเกินนานที่สุด</p></div><Link href="/tracking?f=late" className="text-sm font-semibold text-navy-700">ดูทั้งหมด →</Link></div>
          {late.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="rounded-l-lg p-2.5">ออเดอร์</th><th>ลูกค้า</th><th>ค้างที่</th><th>ผู้รับผิดชอบ</th><th className="rounded-r-lg p-2.5 text-right">เกินกำหนด</th></tr></thead>
            <tbody>{late.slice(0, 6).map((o) => (
              <tr key={o.id} className="border-b border-slate-100"><td className="p-2.5"><Link href={`/orders/${o.id}`} className="font-semibold text-navy-700">{o.code}</Link></td><td>{o.name}</td><td>{STAGE_TH[o.stage as Stage]}</td><td className="text-muted">{o.owner}</td><td className="p-2.5 text-right"><Badge tone="bad">เกิน {durationTh(o.late)}</Badge></td></tr>
            ))}</tbody></table></div> : <Empty>ไม่มีงานเกินกำหนด ทุกขั้นตอนเดินตามเวลา</Empty>}
        </section>
        <section className="card p-5" aria-labelledby="low-h">
          <div className="mb-3 flex items-center justify-between"><h2 id="low-h" className="font-bold">ต่ำกว่าจุดสั่ง</h2><Link href="/inventory?f=low" className="text-sm font-semibold text-navy-700">ไปหน้าคลัง →</Link></div>
          {lowCount ? <ul className="divide-y divide-slate-100 text-sm">
            {lowV.map((l) => <li key={l.sku} className="flex justify-between gap-3 py-2"><span>{l.name} {l.v}<span className="block text-xs text-muted">{l.sku}</span></span><span className="text-right"><b className={l.stock > 0 ? 'text-warning' : 'text-sale'}>{l.stock < 0 ? `ขาด ${-l.stock}` : l.stock} ใบ</b><span className="block text-xs text-muted">จุดสั่ง {l.rp}</span></span></li>)}
            {lowM.map((x) => <li key={x.sku} className="flex justify-between gap-3 py-2"><span>{x.name}<span className="block text-xs text-muted">วัตถุดิบ · {x.sku}</span></span><span className="text-right"><b className="text-sale">{x.stock.toLocaleString('th-TH')} {x.unit}</b><span className="block text-xs text-muted">จุดสั่ง {x.reorderPoint.toLocaleString('th-TH')}</span></span></li>)}
          </ul> : <Empty>สต็อกทุกรายการสูงกว่าจุดสั่ง</Empty>}
        </section>
      </div>
    </div>
  );
}
