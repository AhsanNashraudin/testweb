import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { pricesIncludeVat } from '@/lib/backoffice';
import { quoteTotals } from '@/lib/backoffice-rules';
import { QUOTE_STATUS_TH, QUOTE_TONE } from '@/lib/status';
import { Badge, Empty, PageHead, Tabs, thDate } from '@/components/bo';
import { createQuoteAction } from '../actions';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Disclosure } from '@/components/disclosure';
import { requireUser } from '@/lib/admin';

export const metadata = { title: 'ใบเสนอราคา' };

export default async function Quotes({ searchParams }: { searchParams: Promise<{ f?: string; new?: string }> }) {
  await requireUser();
  const { f = 'open', new: showNew } = await searchParams;
  const [rows, lines, vatIn] = await Promise.all([
    db.select({ q: s.quotes, orderCode: s.orders.code }).from(s.quotes).leftJoin(s.orders, eq(s.orders.id, s.quotes.orderId)).orderBy(desc(s.quotes.id)).limit(300),
    db.select().from(s.quoteItems),
    pricesIncludeVat(),
  ]);
  const totalOf = (q: typeof s.quotes.$inferSelect) => quoteTotals(lines.filter((l) => l.quoteId === q.id), q.discountPct, vatIn).total;
  const groups = { open: rows.filter((r) => r.q.status === 'draft' || r.q.status === 'sent'), won: rows.filter((r) => r.q.status === 'won'), lost: rows.filter((r) => r.q.status === 'lost') };
  const list = groups[f as keyof typeof groups] ?? groups.open;
  const pipeline = groups.open.reduce((a, r) => a + totalOf(r.q), 0);
  return (
    <div className="space-y-5">
      <PageHead title="ใบเสนอราคา" sub={`กำลังเสนอ ${groups.open.length} ใบ · มูลค่ารวม ${baht(pipeline)} · ลูกค้ายืนยันแล้วเปิดออเดอร์ได้ในคลิกเดียว`}>
        <a href="#new-quote" className="btn-primary">+ ใบเสนอราคาใหม่</a>
      </PageHead>
      <Disclosure id="new-quote" defaultOpen={!!showNew} className="card scroll-mt-4 p-5"
        summary={<summary className="flex min-h-11 cursor-pointer items-center font-bold text-navy-700">+ สร้างใบเสนอราคาใหม่</summary>}>
        <ActionForm action={createQuoteAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <div><label className="label" htmlFor="name">ชื่อผู้ติดต่อ *</label><input id="name" name="name" required maxLength={120} className="input" /></div>
          <div><label className="label" htmlFor="company">บริษัท / หน่วยงาน</label><input id="company" name="company" maxLength={160} className="input" /></div>
          <div><label className="label" htmlFor="phone">เบอร์โทร</label><input id="phone" name="phone" type="tel" maxLength={30} className="input" /></div>
          <div><label className="label" htmlFor="email">อีเมล</label><input id="email" name="email" type="email" maxLength={120} className="input" /></div>
          <div><label className="label" htmlFor="province">จังหวัด</label><input id="province" name="province" maxLength={60} className="input" /></div>
          <div><label className="label" htmlFor="topic">เรื่อง</label><input id="topic" name="topic" maxLength={200} placeholder="เช่น ถังบำบัด 20 ใบ โครงการหมู่บ้าน" className="input" /></div>
          <div className="md:col-span-3"><SubmitButton pendingText="กำลังสร้าง…">สร้าง แล้วใส่รายการสินค้า →</SubmitButton></div>
        </ActionForm>
      </Disclosure>
      <Tabs current={f} items={[
        { key: 'open', label: 'กำลังเสนอ', href: '/quotes?f=open', count: groups.open.length },
        { key: 'won', label: 'ปิดการขาย', href: '/quotes?f=won', count: groups.won.length },
        { key: 'lost', label: 'ไม่สำเร็จ', href: '/quotes?f=lost', count: groups.lost.length },
      ]} />
      <div className="card overflow-x-auto">
        {list.length ? <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">เลขที่</th><th>ลูกค้า</th><th>เรื่อง</th><th>เซลล์</th><th className="text-right">มูลค่า</th><th className="p-3 text-right">สถานะ</th></tr></thead>
          <tbody>{list.map(({ q, orderCode }) => (
            <tr key={q.id} className="border-t border-slate-100" data-testid="quote-row">
              <td className="p-3"><Link href={`/quotes/${q.id}`} className="font-semibold text-navy-700 hover:underline">{q.code}</Link><span className="block text-xs text-muted">{thDate(q.createdAt)}</span></td>
              <td><span className="font-medium">{q.company || q.name}</span><span className="block text-xs text-muted">{q.phone}</span></td>
              <td className="max-w-64 truncate">{q.topic || '—'}</td>
              <td className="text-muted">{q.salesperson}</td>
              <td className="text-right font-semibold">{baht(totalOf(q))}</td>
              <td className="p-3 text-right"><Badge tone={QUOTE_TONE[q.status]}>{QUOTE_STATUS_TH[q.status]}</Badge>{orderCode && <span className="block text-xs text-muted">{orderCode}</span>}</td>
            </tr>
          ))}</tbody>
        </table> : <Empty>ยังไม่มีใบเสนอราคาในกลุ่มนี้</Empty>}
      </div>
    </div>
  );
}
