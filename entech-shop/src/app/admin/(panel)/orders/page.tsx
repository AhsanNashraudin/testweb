import Link from 'next/link';
import type { Metadata } from 'next';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { StatusBadge } from '@/components/status-badge';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/format';
import { STATUS_TH } from '@/lib/status';
import { requireAdmin } from '@/lib/admin';

export const metadata: Metadata = { title: 'คำสั่งซื้อ' };

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const { status = '', q = '' } = await searchParams;
  const term = q.trim().replace(/[%_]/g, '').slice(0, 40);
  const digits = term.replace(/\D/g, '');
  const valid = Object.hasOwn(STATUS_TH, status);
  const search = term ? or(like(s.orders.code, `%${term.toUpperCase()}%`), like(s.orders.name, `%${term}%`), digits.length >= 4 ? like(s.orders.phone, `%${digits}%`) : undefined) : undefined;
  const rows = await db.select().from(s.orders).where(and(valid ? eq(s.orders.status, status as 'paid') : undefined, search)).orderBy(desc(s.orders.id)).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">คำสั่งซื้อ</h1>
      <form className="flex max-w-lg gap-2" role="search">
        {valid && <input type="hidden" name="status" value={status} />}
        <input name="q" type="search" defaultValue={q} placeholder="ค้นหาเลขคำสั่งซื้อ / ชื่อ / เบอร์โทร" aria-label="ค้นหาคำสั่งซื้อ" className="input" />
        <button className="btn-primary">ค้นหา</button>
      </form>
      <div className="flex flex-wrap gap-2 text-sm">
        {[['', 'ทั้งหมด'], ...Object.entries(STATUS_TH)].map(([k, l]) => <Link key={k} href={k ? `?status=${k}` : '?'} aria-current={status === k || (!k && !valid) ? 'page' : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 ${status === k || (!k && !valid) ? 'bg-navy-700 text-white' : 'bg-white hover:bg-navy-50'}`}>{l}</Link>)}
      </div>
      <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
        <thead className="bg-slate-50 text-left text-muted"><tr><th className="p-3">เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>จังหวัด / จัดส่ง</th><th className="text-right">ยอดรวม</th><th className="p-3 text-right">สถานะ</th></tr></thead>
        <tbody>{rows.map((o) => (
          <tr key={o.id} className="border-t border-slate-100" data-testid="order-row">
            <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy-700">{o.code}</Link></td>
            <td>{o.createdAt.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}</td>
            <td>{o.name}<br /><span className="text-xs text-muted">{o.phone}</span></td>
            <td>{o.province}<br /><span className="text-xs text-muted">{o.shippingOption === 'pickup' ? 'รับเอง' : `ค่าส่ง ${baht(o.shippingFee)}`}</span></td>
            <td className="text-right font-semibold">{baht(o.total)}</td>
            <td className="p-3 text-right"><StatusBadge status={o.status} /></td>
          </tr>
        ))}{!rows.length && <tr><td className="p-6 text-muted" colSpan={6}>{term ? `ไม่พบคำสั่งซื้อที่ตรงกับ “${term}”` : 'ไม่มีคำสั่งซื้อ'}</td></tr>}</tbody>
      </table></div>
    </div>
  );
}
