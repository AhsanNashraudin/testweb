import type { Metadata } from 'next';
import Link from 'next/link';
import { KIND, listPublished } from '@/lib/articles';
import { ArticleCards } from '@/components/article-list';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'กิจกรรม CSR',
  description: 'กิจกรรมเพื่อสังคมของ ENTECH: มอบถังเก็บน้ำให้โรงเรียนและวัด ประตูไฟเบอร์กลาส และอุปกรณ์การเรียนให้ชุมชน',
  alternates: { canonical: '/csr' },
};

export default async function Csr() {
  const rows = await listPublished('csr');
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">{KIND.csr.label}</h1>
      <p className="mt-2 text-muted">{KIND.csr.desc} · ดู <Link href="/articles" className="font-semibold text-navy-700 underline">บทความความรู้</Link></p>
      <div className="mt-8">{rows.length ? <ArticleCards rows={rows} /> : <p className="card p-6 text-muted">ยังไม่มีกิจกรรม</p>}</div>
    </div>
  );
}
