import Link from 'next/link';
import { and, desc, eq, gte, lt, ne, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/format';
import { StatusBadge } from '@/components/status-badge';
import { requireAdmin } from '@/lib/admin';

export const metadata = { title: 'ภาพรวม' };

export default async function Dashboard() {
  await requireAdmin();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [[today], [pending], [newQuotes], low, recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(${s.orders.total}),0)` }).from(s.orders).where(and(gte(s.orders.createdAt, startOfDay), ne(s.orders.status, 'cancelled'))),
    db.select({ n: sql<number>`count(*)` }).from(s.orders).where(eq(s.orders.status, 'pending_payment')),
    db.select({ n: sql<number>`count(*)` }).from(s.quotes).where(eq(s.quotes.status, 'new')),
    db.select({ sku: s.variants.sku, name: s.products.name, v: s.variants.name, stock: s.variants.stock, pid: s.products.id }).from(s.variants).innerJoin(s.products, eq(s.products.id, s.variants.productId)).where(lt(s.variants.stock, 5)).orderBy(s.variants.stock).limit(8),
    db.select().from(s.orders).orderBy(desc(s.orders.id)).limit(8),
  ]);
  const kpi = [['ยอดขายวันนี้', baht(today.sum)], ['คำสั่งซื้อวันนี้', String(today.n)], ['รอชำระเงิน', String(pending.n)], ['ใบเสนอราคาใหม่', String(newQuotes.n)]];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ภาพรวม</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{kpi.map(([l, v]) => <div key={l} className="card p-5"><p className="text-sm text-muted">{l}</p><p className="text-2xl font-bold" data-testid={`kpi-${l}`}>{v}</p></div>)}</div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">คำสั่งซื้อล่าสุด</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><tbody>{recent.map((o) => (
            <tr key={o.id} className="border-b border-slate-100"><td className="py-2"><Link className="font-semibold text-navy-700" href={`/admin/orders/${o.id}`}>{o.code}</Link></td><td>{o.name}</td><td>{o.province}</td><td className="text-right">{baht(o.total)}</td><td className="text-right"><StatusBadge status={o.status} /></td></tr>
          ))}{!recent.length && <tr><td className="py-4 text-muted">ยังไม่มีคำสั่งซื้อ</td></tr>}</tbody></table></div>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold">สต็อกใกล้หมด (&lt; 5)</h2>
          <ul className="space-y-2 text-sm">{low.map((l) => <li key={l.sku} className="flex justify-between"><Link href={`/admin/products/${l.pid}`} className="hover:text-navy-700">{l.name} · {l.v}</Link><b className={l.stock ? 'text-warning' : 'text-sale'}>{l.stock}</b></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
