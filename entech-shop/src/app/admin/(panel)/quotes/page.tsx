import { desc } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { QUOTE_STATUS_TH } from '@/lib/status';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { updateQuoteStatus } from '../actions';

export const metadata = { title: 'ใบเสนอราคา' };

export default async function Quotes() {
  const rows = await db.select().from(s.quotes).orderBy(desc(s.quotes.id)).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ใบเสนอราคา / ข้อความติดต่อ</h1>
      {rows.map((q) => (
        <div key={q.id} className="card grid gap-3 p-5 md:grid-cols-[1fr_auto]" data-testid="quote-row">
          <div className="text-sm">
            <p className="font-bold">{q.topic} — {q.name}{q.company && ` (${q.company})`}</p>
            <p className="text-muted"><a href={`tel:${q.phone}`} className="text-navy-700 underline">{q.phone}</a> · {q.email || '-'} · {q.province || '-'} · {q.createdAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
            {q.detail && <p className="mt-2 whitespace-pre-line">{q.detail}</p>}
          </div>
          <ActionForm action={updateQuoteStatus} className="flex flex-wrap items-start gap-2">
            <input type="hidden" name="id" value={q.id} />
            <select name="status" defaultValue={q.status} className="input" aria-label="สถานะ">{Object.entries(QUOTE_STATUS_TH).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <SubmitButton>บันทึก</SubmitButton>
          </ActionForm>
        </div>
      ))}
      {!rows.length && <p className="card p-6 text-muted">ยังไม่มีข้อมูล</p>}
    </div>
  );
}
