import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublished } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'บทความ',
  description: 'บทความความรู้เรื่องถังเก็บน้ำ ถังบำบัดน้ำเสีย และการเลือกใช้งานจาก ENTECH',
  alternates: { canonical: '/articles' },
};

export default async function Articles() {
  const rows = await listPublished();
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">บทความ</h1>
      <p className="mt-2 text-muted">ความรู้และคำแนะนำจากทีมงาน ENTECH</p>
      {rows.length ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/articles/${a.slug}`} className="card block h-full p-5 hover:shadow-md" data-testid="article-card">
                <h2 className="text-lg font-bold text-navy-900">{a.title}</h2>
                {a.excerpt && <p className="mt-2 text-sm text-muted">{a.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card mt-8 p-6 text-muted">ยังไม่มีบทความ</p>
      )}
    </div>
  );
}
