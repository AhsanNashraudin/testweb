import Link from 'next/link';
import { CONTACT } from '@/components/site';

export type Section = { h: string; p: (string | React.ReactNode)[] };

/** โครงหน้าข้อความยาว (นโยบาย/เงื่อนไข) ใช้ร่วมกัน */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro?: string; sections: Section[] }) {
  return (
    <article className="container-x max-w-3xl py-10">
      <nav aria-label="breadcrumb" className="text-sm text-muted"><Link href="/" className="hover:underline">หน้าแรก</Link> › {title}</nav>
      <h1 className="mt-4 text-3xl font-bold text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-muted">ปรับปรุงล่าสุด {updated}</p>
      {intro && <p className="mt-6 text-ink">{intro}</p>}
      <div className="mt-6 space-y-8">
        {sections.map((s, i) => (
          <section key={s.h} aria-labelledby={`s${i}`}>
            <h2 id={`s${i}`} className="text-xl font-bold text-navy-900">{i + 1}. {s.h}</h2>
            <div className="mt-3 space-y-2 leading-relaxed text-ink">{s.p.map((x, j) => <p key={j}>{x}</p>)}</div>
          </section>
        ))}
      </div>
      <section className="card mt-10 p-5 text-sm">
        <p className="font-bold">{CONTACT.company}</p>
        <p className="mt-1 text-muted">{CONTACT.address}</p>
        <p className="mt-1">โทร <a href="tel:028130971" className="text-navy-700 underline">{CONTACT.phone}</a>, <a href="tel:0632061000" className="text-navy-700 underline">{CONTACT.mobile}</a> · อีเมล <a href={`mailto:${CONTACT.email}`} className="break-all text-navy-700 underline">{CONTACT.email}</a> · LINE <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="text-navy-700 underline">{CONTACT.line}</a></p>
      </section>
    </article>
  );
}
