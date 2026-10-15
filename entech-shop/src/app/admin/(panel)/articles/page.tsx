import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db, schema as s } from '@/db';

export const metadata = { title: 'บทความ' };

export default async function Articles() {
  const rows = await db.select().from(s.articles).orderBy(desc(s.articles.updatedAt));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">บทความ</h1>
        <Link href="/admin/articles/new" className="btn-primary">+ เขียนบทความใหม่</Link>
      </div>
      {rows.map((a) => (
        <Link key={a.id} href={`/admin/articles/${a.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:shadow-md" data-testid="admin-article-row">
          <div className="min-w-0">
            <p className="truncate font-bold">{a.title}</p>
            <p className="text-sm text-muted">/articles/{a.slug}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.published ? 'bg-success-50 text-success' : 'bg-slate-200 text-muted'}`}>
            {a.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
          </span>
        </Link>
      ))}
      {!rows.length && <p className="card p-6 text-muted">ยังไม่มีบทความ กดปุ่มด้านบนเพื่อเริ่มเขียน</p>}
    </div>
  );
}
