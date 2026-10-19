/** จุดเด่น "ทำไมต้อง ENTECH" — ใช้ทั้งหน้าแรกและหน้าสินค้า (ข้อความแก้ได้ที่หลังบ้าน > จัดการหน้าแรก) */
import Image from 'next/image';
import { LineIcon } from '@/components/line-icon';

type Item = { title: string; desc: string };

// ไอคอนเส้น (24×24) เรียงตามลำดับกล่อง: โรงงาน · มาตรฐาน · รับประกัน · วิศวกร · รถส่งของ · หยดน้ำ · แชท · ดาว
const ICONS = [
  'M2 20h20M4 20V9l5 3V9l5 3V5h6v15M8 16h2m4 0h2',
  'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3.5-1L7 21l5-2.5L17 21l-1.5-7',
  'M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Zm-3-10 2 2 4-4',
  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0M9 4.5h6',
  'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z',
  'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z',
];

export function WhyIcon({ i, className = 'h-6 w-6' }: { i: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICONS[i % ICONS.length]} />
    </svg>
  );
}

/** แบบเต็มความกว้าง (หน้าแรก): ภาพโรงงานจริงเป็นพื้นหลัง + ซ้าย = หัวข้อ/ตัวเลขเด่น/ปุ่ม · ขวา = การ์ดขาว 2×2 */
export function WhyBand({ title, items, intro, stats = [], children }: {
  title: string; items: Item[]; intro?: string; stats?: { value: string; label: string }[]; children?: React.ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl text-white shadow-xl">
      <Image src="/images/products/cat_tank.jpg" alt="" fill sizes="1200px" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/95 via-navy-900/90 to-navy-700/90 lg:bg-gradient-to-r lg:to-navy-700/70" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full border-[36px] border-cyan-500/15" />
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-100 ring-1 ring-cyan-500/40">
            <WhyIcon i={7} className="h-3.5 w-3.5" /> Why ENTECH
          </span>
          {title && <h2 id="h-why" className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{title}</h2>}
          <span aria-hidden className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-line" />
          {intro && <p className="mt-4 leading-relaxed text-navy-100">{intro}</p>}
          {stats.length > 0 && (
            <dl className="mt-6 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm">
                  <dd className="text-2xl font-bold text-white md:text-3xl">{s.value}</dd>
                  <dt className="mt-0.5 text-xs text-navy-100">{s.label}</dt>
                </div>
              ))}
            </dl>
          )}
          {children}
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 md:gap-4">
          {items.map((w, i) => (
            <li key={i} className="group relative overflow-hidden rounded-2xl bg-white p-5 text-ink shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
              <span aria-hidden className="absolute right-3 top-1 text-5xl font-bold text-navy-50 transition group-hover:text-cyan-100">{String(i + 1).padStart(2, '0')}</span>
              <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-600 to-navy-700 text-white shadow-md"><WhyIcon i={i} /></span>
              <span className="relative mt-4 block text-lg font-bold leading-snug text-navy-900">{w.title}</span>
              {w.desc && <span className="relative mt-1 block text-sm leading-relaxed text-muted">{w.desc}</span>}
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-cyan-500 to-navy-700 transition-transform group-hover:scale-x-100" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** แบบกล่องข้าง (หน้าสินค้า) */
export function WhyCard({ title, items, lineUrl }: { title: string; items: Item[]; lineUrl: string }) {
  return (
    <aside className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-700 to-cyan-700 p-6 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-500/25 blur-2xl" />
      <h2 className="relative text-lg font-bold">{title}</h2>
      <ul className="relative mt-4 space-y-3">
        {items.map((w, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20"><WhyIcon i={i} className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block font-semibold leading-snug">{w.title}</span>{w.desc && <span className="block text-xs leading-relaxed text-navy-100">{w.desc}</span>}</span>
          </li>
        ))}
      </ul>
      <a href={lineUrl} target="_blank" rel="noopener" className="btn-line relative mt-6 w-full"><LineIcon />ปรึกษาฟรีทาง LINE</a>
    </aside>
  );
}
