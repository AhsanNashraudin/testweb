import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { blocks, getPublished, KIND } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getPublished((await params).slug);
  if (!a) return { title: 'ไม่พบบทความ' };
  return {
    title: a.seoTitle || a.title,
    description: a.seoDesc || a.excerpt || undefined,
    alternates: { canonical: `/articles/${a.slug}` },
    ...(a.image && { openGraph: { images: [{ url: a.image, alt: a.title }] } }),
  };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getPublished((await params).slug);
  if (!a) notFound();
  const k = KIND[a.kind];
  return (
    <article className="container-x max-w-3xl py-10">
      <nav aria-label="breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:underline">หน้าแรก</Link> › <Link href={k.href} className="hover:underline">{k.label}</Link>
      </nav>
      <h1 className="mt-4 text-3xl font-bold text-navy-900">{a.title}</h1>
      {a.publishedAt && (
        <p className="mt-2 text-sm text-muted">{a.publishedAt.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' })}</p>
      )}
      {a.image && (
        <div className="relative mt-6 aspect-[3/2] overflow-hidden rounded-2xl bg-navy-50">
          <Image src={a.image} alt={a.title} fill priority sizes="(max-width:768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      <div className="mt-6 space-y-4 text-ink" data-testid="article-body">
        {blocks(a.body).map((b, i) =>
          b.t === 'table' ? (
            <div key={i} className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[420px] text-sm" data-testid="article-table">
                <thead className="bg-navy-700 text-left text-white"><tr>{b.head.map((h) => <th key={h} className="p-2.5 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, j) => <tr key={j} className="border-t border-slate-100 odd:bg-white even:bg-navy-50/50">{r.map((c, n) => <td key={n} className="whitespace-nowrap p-2.5">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          ) : b.t === 'ul' ? (
            <ul key={i} className="list-disc space-y-1 pl-6 leading-relaxed">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          ) : (
            <p key={i} className="whitespace-pre-line leading-relaxed">{b.text}</p>
          ))}
      </div>
      <p className="mt-10 border-t border-slate-200 pt-6"><Link href={k.href} className="font-semibold text-navy-700 underline">← {k.label}ทั้งหมด</Link></p>
    </article>
  );
}
