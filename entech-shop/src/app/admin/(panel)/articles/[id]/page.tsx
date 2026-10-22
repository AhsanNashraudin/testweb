import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { ArticleForm } from '../article-form';
import { requireAdmin } from '@/lib/admin';

export const metadata = { title: 'แก้ไขบทความ' };

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [a] = await db.select().from(s.articles).where(eq(s.articles.id, id));
  if (!a) notFound();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/articles" className="text-navy-700 underline">← กลับไปรายการบทความ</Link>
        {a.published && <Link href={`/articles/${a.slug}`} target="_blank" className="text-navy-700 underline">ดูหน้าบทความ ↗</Link>}
      </div>
      <ArticleForm article={a} />
    </div>
  );
}
