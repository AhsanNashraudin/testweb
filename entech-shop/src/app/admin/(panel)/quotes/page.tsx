import Link from 'next/link';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { QUOTE_STATUS_TH } from '@/lib/status';
import { getNotify, lineReady } from '@/lib/notify';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { updateQuote } from '../actions';

export const metadata = { title: 'ใบเสนอราคา' };

const BADGE: Record<string, string> = { new: 'bg-danger-50 text-sale', in_progress: 'bg-warning-50 text-warning', sent: 'bg-cyan-100 text-navy-900', won: 'bg-success-50 text-success', lost: 'bg-slate-100 text-muted' };
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} นาที` : m < 1440 ? `${Math.round(m / 60)} ชม.` : `${Math.round(m / 1440)} วัน`;
};

export default async function Quotes({ searchParams }: { searchParams: Promise<{ status?: string; who?: string }> }) {
  const sp = await searchParams;
  const status = sp.status && Object.hasOwn(QUOTE_STATUS_TH, sp.status) ? sp.status : '';
  const who = sp.who ?? '';
  const cfg = await getNotify();
  const where: SQL[] = [];
  if (status) where.push(eq(s.quotes.status, status as 'new'));
  if (who) where.push(eq(s.quotes.assignee, who === 'none' ? '' : who));
  const [rows, counts] = await Promise.all([
    db.select().from(s.quotes).where(where.length ? and(...where) : undefined).orderBy(desc(s.quotes.id)).limit(200),
    db.select({ status: s.quotes.status, n: sql<number>`count(*)` }).from(s.quotes).groupBy(s.quotes.status),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const sales = cfg.team.filter((m) => m.level === 'sales');
  const nameOf = (id: string) => cfg.team.find((m) => m.id === id)?.name;
  const href = (p: { status?: string; who?: string }) => {
    const q = new URLSearchParams(Object.entries({ status, who, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/admin/quotes${q.size ? `?${q}` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ใบเสนอราคา / ข้อความติดต่อ</h1>
          <p className="text-sm text-muted">ฟอร์มจากหน้าติดต่อเรา หน้าบริการ และหน้าสินค้า — ระบบมอบหมายผู้ดูแลแบบเวียนคิวและแจ้ง LINE ให้อัตโนมัติ</p>
        </div>
        <Link href="/admin/notify" className="btn-outline text-sm">⚙ ทีมขาย & แจ้งเตือน{!lineReady() && <span className="ml-1 rounded-full bg-warning-50 px-2 text-xs text-warning">ยังไม่เชื่อม LINE</span>}</Link>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="กรองตามสถานะ">
        {[['', 'ทั้งหมด', total], ...Object.entries(QUOTE_STATUS_TH).map(([k, l]) => [k, l, count[k] ?? 0])].map(([k, l, n]) => (
          <Link key={k as string} href={href({ status: k as string })} aria-current={status === k ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 ring-1 ${status === k ? 'bg-navy-700 text-white ring-navy-700' : 'bg-white ring-slate-200'}`}>
            {l} <b className="tabular-nums">{n}</b>
          </Link>
        ))}
        {sales.length > 0 && (
          <form className="ml-auto flex items-center gap-2" action="/admin/quotes">
            {status && <input type="hidden" name="status" value={status} />}
            <select name="who" defaultValue={who} className="input py-1.5" aria-label="กรองตามผู้ดูแล">
              <option value="">ผู้ดูแล: ทุกคน</option><option value="none">ยังไม่มีผู้ดูแล</option>
              {sales.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button className="btn-outline px-3 py-1.5">กรอง</button>
          </form>
        )}
      </nav>

      {rows.map((q) => (
        <div key={q.id} id={`q-${q.id}`} className="card grid scroll-mt-4 gap-4 p-5 lg:grid-cols-[1fr_320px]" data-testid="quote-row">
          <div className="min-w-0 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-muted">#{q.id}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[q.status]}`}>{QUOTE_STATUS_TH[q.status]}</span>
              {q.status === 'new' && <span className="text-xs text-sale">รอ {ago(q.createdAt)}</span>}
              <b>{q.topic} — {q.name}{q.company && ` (${q.company})`}</b>
            </p>
            <p className="mt-1 text-muted"><a href={`tel:${q.phone}`} className="text-navy-700 underline">{q.phone}</a> · {q.email || '-'} · {q.province || '-'} · {q.createdAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
            {q.detail && <p className="mt-2 whitespace-pre-line">{q.detail}</p>}
            <p className="mt-2 text-xs">ผู้ดูแล: <b data-testid="quote-assignee">{nameOf(q.assignee) ?? 'ยังไม่มี'}</b></p>
          </div>
          <ActionForm action={updateQuote} className="grid content-start gap-2">
            <input type="hidden" name="id" value={q.id} />
            <div className="grid grid-cols-2 gap-2">
              <select name="status" defaultValue={q.status} className="input" aria-label="สถานะ">{Object.entries(QUOTE_STATUS_TH).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <select name="assignee" defaultValue={q.assignee} className="input" aria-label="ผู้ดูแล">
                <option value="">— ผู้ดูแล —</option>
                {cfg.team.filter((m) => m.level === 'sales' || m.id === q.assignee).map((m) => <option key={m.id} value={m.id}>{m.name}{!m.active ? ' (ปิด)' : ''}</option>)}
              </select>
            </div>
            <textarea name="note" defaultValue={q.note} rows={2} className="input" placeholder="บันทึกภายใน เช่น โทรแล้ว นัดดูหน้างาน…" aria-label="บันทึกภายใน" />
            <SubmitButton>บันทึก</SubmitButton>
          </ActionForm>
        </div>
      ))}
      {!rows.length && <p className="card p-6 text-muted">ยังไม่มีข้อมูล</p>}
    </div>
  );
}
