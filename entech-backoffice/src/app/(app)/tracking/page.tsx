import Link from 'next/link';
import { trackedOrders } from '@/lib/backoffice';
import { durationTh, STAGE_TH, STAGES, type Stage } from '@/lib/backoffice-rules';
import { baht } from '@/lib/util';
import { Badge, Empty, PageHead, StageBar, Tabs, thDate } from '@/components/bo';

export const metadata = { title: 'ติดตามออเดอร์' };

type SP = Promise<{ f?: string; stage?: string; ch?: string; q?: string }>;

export default async function Tracking({ searchParams }: { searchParams: SP }) {
  const { f = 'open', stage = '', ch = '', q = '' } = await searchParams;
  const all = await trackedOrders({ includeClosed: true });
  const monthAgo = Date.now() / 1000 - 30 * 86400;
  const groups = {
    open: all.filter((o) => !['done', 'cancelled'].includes(o.stage)),
    late: all.filter((o) => o.late > 0),
    done: all.filter((o) => o.stage === 'done' && o.since > monthAgo),
  };
  const qq = q.trim().toLowerCase();
  const rows = (groups[f as keyof typeof groups] ?? groups.open)
    .filter((o) => (!stage || o.stage === stage) && (!ch || o.channel === ch) && (!qq || `${o.code} ${o.name}`.toLowerCase().includes(qq)))
    .sort((a, b) => b.late - a.late || b.inStage - a.inStage);
  const href = (p: Record<string, string>) => '/tracking?' + new URLSearchParams({ f, ...(stage && { stage }), ...(ch && { ch }), ...(q && { q }), ...p }).toString();

  return (
    <div className="space-y-5">
      <PageHead title="ติดตามออเดอร์" sub="ทุกออเดอร์อยู่ขั้นไหน ค้างที่ใคร และเกินเวลาที่กำหนดหรือไม่" />
      <Tabs current={f} items={[
        { key: 'open', label: 'กำลังดำเนินการ', href: href({ f: 'open' }), count: groups.open.length },
        { key: 'late', label: 'เกินกำหนด', href: href({ f: 'late' }), count: groups.late.length },
        { key: 'done', label: 'ปิดงานแล้ว (30 วัน)', href: href({ f: 'done' }), count: groups.done.length },
      ]} />
      <form className="card flex flex-wrap items-end gap-3 p-4" role="search">
        <input type="hidden" name="f" value={f} />
        <div className="min-w-56 flex-1"><label htmlFor="q" className="label">ค้นหา</label><input id="q" name="q" defaultValue={q} placeholder="เลขออเดอร์ หรือชื่อลูกค้า" className="input" /></div>
        <div><label htmlFor="stage" className="label">ขั้นตอน</label><select id="stage" name="stage" defaultValue={stage} className="input"><option value="">ทุกขั้นตอน</option>{STAGES.map((x) => <option key={x} value={x}>{STAGE_TH[x]}</option>)}</select></div>
        <div><label htmlFor="ch" className="label">ช่องทาง</label><select id="ch" name="ch" defaultValue={ch} className="input"><option value="">ทุกช่องทาง</option><option value="web">เว็บไซต์</option><option value="sales">ทีมเซลล์</option></select></div>
        <button className="btn-outline">กรอง</button>
        {(stage || ch || q) && <Link href={`/tracking?f=${f}`} className="btn px-3 text-navy-700 underline">ล้างตัวกรอง</Link>}
      </form>

      <div className="card overflow-x-auto">
        {rows.length ? <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted"><tr>
            <th className="p-3">ออเดอร์</th><th>ลูกค้า</th><th>ความคืบหน้า</th><th>ค้างที่</th><th>เวลาในขั้นตอน</th><th className="p-3">สถานะ</th>
          </tr></thead>
          <tbody>{rows.map((o) => (
            <tr key={o.id} className={`border-t border-slate-100 ${o.late ? 'bg-danger-50/60' : ''}`} data-testid="track-row">
              <td className="p-3"><Link href={`/orders/${o.id}`} className="font-semibold text-navy-700 hover:underline">{o.code}</Link><span className="block text-xs text-muted">{thDate(o.createdAt)} · {baht(o.total)}</span></td>
              <td><span className="font-medium">{o.name}</span><span className="mt-1 block"><Badge tone={o.channel === 'web' ? 'ok' : 'neutral'}>{o.channel === 'web' ? 'เว็บไซต์' : 'เซลล์'}</Badge></span></td>
              <td><StageBar stage={o.stage as Stage} late={o.late > 0} /><span className={`mt-1.5 block text-xs ${o.late ? 'font-semibold text-sale' : 'text-muted'}`}>{STAGE_TH[o.stage as Stage]}</span></td>
              <td>{o.stage === 'done' || o.stage === 'cancelled' ? <span className="text-muted">—</span> : <><span className="font-medium">{o.owner}</span>{o.assignee && <span className="block text-xs text-muted">{STAGE_TH[o.stage as Stage]}</span>}</>}</td>
              <td>{o.stage === 'done' ? '—' : <><span className={`font-medium ${o.late ? 'text-sale' : ''}`}>{durationTh(o.inStage)}</span><span className="block text-xs text-muted">{o.channel === 'sales' && o.stage === 'payment' ? `เครดิต ${o.creditDays} วัน` : `SLA ${durationTh(o.sla * 3600)}`}</span></>}</td>
              <td className="p-3">{o.stage === 'done' ? <Badge tone="ok">จบงาน</Badge> : o.stage === 'cancelled' ? <Badge tone="neutral">ยกเลิก</Badge> : o.late ? <Badge tone="bad">เกิน {durationTh(o.late)}</Badge> : <Badge tone="info">ตามกำหนด</Badge>}</td>
            </tr>
          ))}</tbody>
        </table> : <Empty>{f === 'late' ? 'ไม่มีออเดอร์เกินกำหนด' : 'ไม่พบออเดอร์ตามตัวกรอง'} · <Link href="/tracking" className="text-navy-700 underline">ดูทั้งหมด</Link> หรือ <Link href="/quotes" className="text-navy-700 underline">ไปหน้าใบเสนอราคา</Link></Empty>}
      </div>
      <p className="text-xs text-muted">แถบสี: <span className="font-semibold text-success">เขียว</span> ผ่านแล้ว · <span className="font-semibold text-navy-700">น้ำเงิน</span> กำลังทำ · <span className="font-semibold text-sale">แดง</span> เกินกำหนด — ขั้นตอน: {STAGES.filter((x) => x !== 'done').map((x) => STAGE_TH[x]).join(' → ')}</p>
    </div>
  );
}
