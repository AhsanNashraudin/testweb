import type { Metadata } from 'next';
import Link from 'next/link';
import { KIND, listPublished } from '@/lib/articles';
import { ArticleCards } from '@/components/article-list';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'บทความ',
  description: 'บทความความรู้เรื่องถังเก็บน้ำ ถังบำบัดน้ำเสีย และการเลือกใช้งานจาก ENTECH',
  alternates: { canonical: '/articles' },
};

export default async function Articles() {
  const rows = await listPublished('article');
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">{KIND.article.label}</h1>
      <p className="mt-2 text-muted">{KIND.article.desc} · ดู <Link href="/csr" className="font-semibold text-navy-700 underline">กิจกรรม CSR</Link></p>
      <div className="mt-8">{rows.length ? <ArticleCards rows={rows} /> : <p className="card p-6 text-muted">ยังไม่มีบทความ</p>}</div>
    </div>
  );
}
