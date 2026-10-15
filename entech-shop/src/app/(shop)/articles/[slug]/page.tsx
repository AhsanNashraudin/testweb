import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublished, paragraphs } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getPublished((await params).slug);
  if (!a) return { title: 'ไม่พบบทความ' };
  return {
    title: a.seoTitle || a.title,
    description: a.seoDesc || a.excerpt || undefined,
    alternates: { canonical: `/articles/${a.slug}` },
  };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getPublished((await params).slug);
  if (!a) notFound();
  return (
    <article className="container-x max-w-3xl py-10">
      <nav aria-label="breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:underline">หน้าแรก</Link> › <Link href="/articles" className="hover:underline">บทความ</Link>
      </nav>
      <h1 className="mt-4 text-3xl font-bold text-navy-900">{a.title}</h1>
      {a.publishedAt && (
        <p className="mt-2 text-sm text-muted">{a.publishedAt.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' })}</p>
      )}
      <div className="mt-6 space-y-4 text-ink" data-testid="article-body">
        {paragraphs(a.body).map((p, i) => <p key={i} className="whitespace-pre-line leading-relaxed">{p}</p>)}
      </div>
    </article>
  );
}
