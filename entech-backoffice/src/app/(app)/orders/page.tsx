import Link from 'next/link';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { STAGE_TH, STAGES, type Stage } from '@/lib/backoffice-rules';
import { StatusBadge } from '@/components/status-badge';
import { Badge, Empty, PageHead, Tabs, thDateTime } from '@/components/bo';

export const metadata = { title: 'คำสั่งซื้อ' };

export default async function Orders({ searchParams }: { searchParams: Promise<{ ch?: string; stage?: string; q?: string }> }) {
  const { ch = '', stage = '', q = '' } = await searchParams;
  const term = q.trim().replace(/[%_]/g, '').slice(0, 40);
  const search = term ? or(like(s.orders.code, `%${term.toUpperCase()}%`), like(s.orders.name, `%${term}%`), like(s.orders.phone, `%${term}%`)) : undefined;
  const rows = await db.select().from(s.orders).where(and(
    ch === 'web' || ch === 'sales' ? eq(s.orders.channel, ch) : undefined,
    (STAGES as readonly string[]).includes(stage) || stage === 'cancelled' ? eq(s.orders.stage, stage as Stage) : undefined, search,
  )).orderBy(desc(s.orders.id)).limit(300);
  const href = (p: Record<string, string>) => '/orders?' + new URLSearchParams({ ...(ch && { ch }), ...(stage && { stage }), ...(q && { q }), ...p }).toString();
  return (
    <div className="space-y-5">
      <PageHead title="คำสั่งซื้อ" sub="ออเดอร์จากเว็บไซต์ (ซิงค์อัตโนมัติ) และจากทีมเซลล์ (เปิดจากใบเสนอราคา)">
        <Link href="/quotes?new=1" className="btn-primary">+ ใบเสนอราคา / ออเดอร์เซลล์</Link>
      </PageHead>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs current={ch || 'all'} items={[{ key: 'all', label: 'ทุกช่องทาง', href: href({ ch: '' }) }, { key: 'web', label: 'เว็บไซต์', href: href({ ch: 'web' }) }, { key: 'sales', label: 'ทีมเซลล์', href: href({ ch: 'sales' }) }]} />
        <form className="flex gap-2" role="search">
          {ch && <input type="hidden" name="ch" value={ch} />}
          <select name="stage" defaultValue={stage} aria-label="ขั้นตอน" className="input w-40"><option value="">ทุกขั้นตอน</option>{[...STAGES, 'cancelled' as const].map((x) => <option key={x} value={x}>{STAGE_TH[x]}</option>)}</select>
          <input name="q" type="search" defaultValue={q} placeholder="เลขออเดอร์ / ชื่อ / เบอร์" aria-label="ค้นหาออเดอร์" className="input w-56" />
          <button className="btn-outline">ค้นหา</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        {rows.length ? <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>ช่องทาง</th><th>ขั้นตอน</th><th className="text-right">ยอดรวม</th><th className="p-3 text-right">สถานะลูกค้า</th></tr></thead>
          <tbody>{rows.map((o) => (
            <tr key={o.id} className="border-t border-slate-100" data-testid="order-row">
              <td className="p-3"><Link href={`/orders/${o.id}`} className="font-semibold text-navy-700 hover:underline">{o.code}</Link></td>
              <td className="text-muted">{thDateTime(o.createdAt)}</td>
              <td>{o.name}<span className="block text-xs text-muted">{o.province}</span></td>
              <td><Badge tone={o.channel === 'web' ? 'ok' : 'neutral'}>{o.channel === 'web' ? 'เว็บไซต์' : 'เซลล์'}</Badge></td>
              <td>{STAGE_TH[o.stage as Stage]}</td>
              <td className="text-right font-semibold">{baht(o.total)}</td>
              <td className="p-3 text-right"><StatusBadge status={o.status} />{o.statusPending && <span className="block text-xs text-muted">รอส่งให้เว็บ</span>}</td>
            </tr>
          ))}</tbody>
        </table> : <Empty>{term ? `ไม่พบออเดอร์ที่ตรงกับ “${term}”` : 'ยังไม่มีออเดอร์ · ออเดอร์เว็บจะเข้ามาเองทุก 5 นาที'}</Empty>}
      </div>
    </div>
  );
}
