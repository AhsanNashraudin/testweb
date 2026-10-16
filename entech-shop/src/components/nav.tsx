'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LineIcon } from '@/components/line-icon';

export type NavItem = { href: string; label: string };
const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

/** <details> ที่ปิดตัวเองเมื่อเปลี่ยนหน้า / คลิกข้างนอก / กด Esc */
function useAutoClose() {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [path]);
  useEffect(() => {
    const close = (e: Event) => {
      const d = ref.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) {
        d.open = false;
        if (e instanceof KeyboardEvent) d.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', close); };
  }, []);
  return { ref, path };
}

const linkCls = (on: boolean) => `block whitespace-nowrap rounded-md px-3 py-2.5 hover:bg-navy-600 ${on ? 'bg-navy-900 font-semibold' : ''}`;

/** เมนูหลักบนเดสก์ท็อป: หมวดสินค้ารวมใน dropdown เดียว เพื่อให้ทุกลิงก์อยู่ในจอ */
export function DesktopNav({ cats }: { cats: NavItem[] }) {
  const { ref, path } = useAutoClose();
  const prodOn = path.startsWith('/product');
  const L = ({ href, label }: NavItem) => <Link href={href} className={linkCls(isActive(path, href))} aria-current={isActive(path, href) ? 'page' : undefined}>{label}</Link>;
  return (
    <nav aria-label="เมนูหลัก" className="hidden bg-navy-700 text-sm text-white md:block">
      <div className="container-x flex items-center gap-1 py-1">
        <L href="/" label="หน้าแรก" />
        <details ref={ref} className="relative">
          <summary className={`${linkCls(prodOn)} flex list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>สินค้า <span aria-hidden>▾</span></summary>
          <div className="absolute left-0 top-full z-50 mt-1 grid w-[520px] grid-cols-2 gap-1 rounded-xl bg-white p-3 text-ink shadow-xl">
            <Link href="/products" className="rounded-lg px-3 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">สินค้าทั้งหมด</Link>
            {cats.map((c) => <Link key={c.href} href={c.href} aria-current={isActive(path, c.href) ? 'page' : undefined} className={`rounded-lg px-3 py-2.5 hover:bg-navy-50 ${isActive(path, c.href) ? 'bg-cyan-100 font-semibold' : ''}`}>{c.label}</Link>)}
          </div>
        </details>
        <L href="/services" label="บริการออกแบบระบบ" />
        <L href="/articles" label="บทความ" />
        <L href="/csr" label="กิจกรรม CSR" />
        <L href="/about" label="เกี่ยวกับเรา" />
        <L href="/contact" label="ติดต่อเรา" />
        <Link href="/services#quote" className="ml-auto whitespace-nowrap rounded-md bg-white px-4 py-2 font-semibold text-navy-700 hover:bg-cyan-100">ขอใบเสนอราคา</Link>
      </div>
    </nav>
  );
}

/** เมนูมือถือแบบลิ้นชัก */
export function MobileMenu({ cats, phone, phoneHref, lineUrl }: { cats: NavItem[]; phone: string; phoneHref: string; lineUrl: string }) {
  const { ref, path } = useAutoClose();
  const items: NavItem[] = [{ href: '/', label: 'หน้าแรก' }, { href: '/products', label: 'สินค้าทั้งหมด' }, ...cats, { href: '/services', label: 'บริการออกแบบระบบ / ขอใบเสนอราคา' }, { href: '/articles', label: 'บทความ' }, { href: '/csr', label: 'กิจกรรม CSR' }, { href: '/about', label: 'เกี่ยวกับเรา' }, { href: '/contact', label: 'ติดต่อเรา' }, { href: '/order/lookup', label: 'ตรวจสอบคำสั่งซื้อ' }];
  return (
    <details ref={ref} className="md:hidden">
      <summary aria-label="เปิดเมนู" className="flex h-11 w-11 list-none items-center justify-center rounded-lg border border-slate-300 [&::-webkit-details-marker]:hidden">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </summary>
      <nav aria-label="เมนูมือถือ" className="absolute inset-x-0 top-full z-50 max-h-[75vh] overflow-y-auto border-t border-slate-200 bg-white p-3 shadow-xl">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={isActive(path, i.href) ? 'page' : undefined} className={`block rounded-lg px-4 py-3 ${isActive(path, i.href) ? 'bg-cyan-100 font-semibold text-navy-700' : 'hover:bg-navy-50'}`}>{i.label}</Link>
        ))}
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
          <a href={phoneHref} className="btn-outline">โทร {phone}</a>
          <a href={lineUrl} target="_blank" rel="noopener" className="btn-line"><LineIcon />แอดไลน์</a>
        </div>
      </nav>
    </details>
  );
}

/** ปุ่มโทร/LINE ลอยบนมือถือ (ซ่อนในหน้าชำระเงินที่มีแถบยอดรวมด้านล่าง) */
export function FloatingContact({ phoneHref, lineUrl }: { phoneHref: string; lineUrl: string }) {
  const path = usePathname();
  if (path.startsWith('/checkout') || path.startsWith('/cart')) return null;
  const c = 'flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white';
  return (
    <div className="fixed bottom-4 right-3 z-30 flex flex-col gap-2 md:hidden">
      <a href={phoneHref} aria-label="โทรหาเรา" className={`${c} bg-navy-700`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>
      </a>
      <a href={lineUrl} target="_blank" rel="noopener" aria-label="แชท LINE" className={`${c} bg-line`}><LineIcon className="h-7 w-7" /></a>
    </div>
  );
}

/** เมนูหลังบ้าน: แสดงหน้าปัจจุบัน + บนมือถือพับเป็นปุ่มเมนู */
export function AdminNav({ items }: { items: NavItem[] }) {
  const { ref, path } = useAutoClose();
  const on = (h: string) => (h === '/admin' ? path === h : path.startsWith(h));
  const list = (cls: string) => items.map((i) => <Link key={i.href} href={i.href} aria-current={on(i.href) ? 'page' : undefined} className={`${cls} ${on(i.href) ? 'bg-navy-600 font-semibold' : 'hover:bg-navy-700'}`}>{i.label}</Link>);
  return (
    <>
      <nav aria-label="เมนูหลังบ้าน" className="hidden space-y-1 md:block">{list('block rounded-lg px-3 py-2.5')}</nav>
      <details ref={ref} className="md:hidden">
        <summary className="flex h-11 list-none items-center gap-2 rounded-lg border border-navy-600 px-3 [&::-webkit-details-marker]:hidden">☰ {items.find((i) => on(i.href))?.label ?? 'เมนู'}</summary>
        <nav aria-label="เมนูหลังบ้าน (มือถือ)" className="absolute inset-x-0 top-full z-50 space-y-1 bg-navy-900 p-3 shadow-xl">{list('block rounded-lg px-4 py-3')}</nav>
      </details>
    </>
  );
}
