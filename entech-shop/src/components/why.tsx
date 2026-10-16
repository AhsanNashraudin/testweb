/** จุดเด่น "ทำไมต้อง ENTECH" — ใช้ทั้งหน้าแรกและหน้าสินค้า (ข้อความแก้ได้ที่หลังบ้าน > จัดการหน้าแรก) */
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

/** แบบเต็มความกว้าง (หน้าแรก): พื้นไล่สีน้ำเงิน + การ์ดโปร่งพร้อมไอคอน */
export function WhyBand({ title, items, children }: { title: string; items: Item[]; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-700 to-cyan-700 p-6 text-white md:p-10">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        {title && <h2 id="h-why" className="text-2xl font-bold md:text-3xl">{title}</h2>}
        <ul className={`grid gap-3 sm:grid-cols-2 md:gap-4 ${items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} ${title ? 'mt-6' : ''}`}>
          {items.map((w, i) => (
            // มือถือ: ไอคอนซ้าย ข้อความขวา (กระชับ) · จอใหญ่: ไอคอนบน
            <li key={i} className="flex gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15 sm:block sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-navy-700 shadow-md sm:h-12 sm:w-12"><WhyIcon i={i} /></span>
              <span className="block min-w-0">
                <span className="block text-lg font-bold leading-snug sm:mt-4">{w.title}</span>
                {w.desc && <span className="mt-1 block text-sm leading-relaxed text-navy-100">{w.desc}</span>}
              </span>
            </li>
          ))}
        </ul>
        {children}
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
