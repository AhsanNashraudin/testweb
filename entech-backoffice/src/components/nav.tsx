'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export type NavItem = { href: string; label: string; group: string; icon: string; badge?: number };
// ไอคอนเส้น 24px (path d) — ไม่ต้องลง icon library เพิ่ม
const ICON: Record<string, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  track: 'M3 12h4l3-8 4 16 3-8h4',
  order: 'M6 3h12l1 4H5zM5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 11h6',
  quote: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  box: 'M12 3l9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8',
  factory: 'M3 21V10l6 4v-4l6 4V5h6v16zM7 17h2M13 17h2M17 17h2',
  bill: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  sync: 'M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5',
};
export const Icon = ({ name, className = 'size-5' }: { name: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d={ICON[name]} /></svg>
);

const isOn = (path: string, h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (ref.current) ref.current.open = false; }, [path]);
  const list = items.map((i, n) => (
    <div key={i.href}>
      {i.group !== items[n - 1]?.group && <p className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-100/70 ${n ? 'pt-5' : ''}`}>{i.group}</p>}
      <Link href={i.href} aria-current={isOn(path, i.href) ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isOn(path, i.href) ? 'bg-white font-semibold text-navy-900 shadow-sm' : 'text-navy-50 hover:bg-white/10'}`}>
        <Icon name={i.icon} /><span className="flex-1">{i.label}</span>
        {!!i.badge && <span className="rounded-full bg-sale px-2 text-xs font-bold text-white">{i.badge}</span>}
      </Link>
    </div>
  ));
  return (
    <>
      <nav aria-label="เมนูหลัก" className="hidden space-y-0.5 md:block">{list}</nav>
      <details ref={ref} className="md:hidden">
        <summary className="flex h-11 list-none items-center gap-2 rounded-lg border border-navy-600 px-3 text-sm [&::-webkit-details-marker]:hidden">☰ {items.find((i) => isOn(path, i.href))?.label ?? 'เมนู'}</summary>
        <nav aria-label="เมนูหลัก (มือถือ)" className="absolute inset-x-0 top-full z-50 space-y-0.5 bg-navy-900 p-3 shadow-xl">{list}</nav>
      </details>
    </>
  );
}
