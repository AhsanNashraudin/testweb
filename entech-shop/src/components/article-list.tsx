import Link from 'next/link';
import Image from 'next/image';
import { KIND, type Kind } from '@/lib/articles';

type Row = { id: number; slug: string; title: string; excerpt: string; image: string; kind: Kind; publishedAt: Date | null };

const date = (d: Date | null) => d?.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' });

/** การ์ดบทความ/กิจกรรม พร้อมรูปปก (ไม่มีรูป = พื้นสีพร้อมชื่อหมวด) */
export function ArticleCards({ rows }: { rows: Row[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((a) => (
        <li key={a.id}>
          <Link href={`/articles/${a.slug}`} data-testid="article-card" className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-navy-700 to-cyan-700">
              {a.image
                ? <Image src={a.image} alt="" fill sizes="(max-width:640px) 100vw, 380px" className="object-cover transition group-hover:scale-105" />
                : <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white/80">{KIND[a.kind].label} · ENTECH</span>}
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-navy-700">{KIND[a.kind].label}</span>
            </span>
            <span className="flex flex-1 flex-col p-5">
              <span className="font-bold leading-snug text-navy-900 group-hover:underline">{a.title}</span>
              {a.excerpt && <span className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</span>}
              {a.publishedAt && <span className="mt-auto pt-3 text-xs text-muted">{date(a.publishedAt)}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
