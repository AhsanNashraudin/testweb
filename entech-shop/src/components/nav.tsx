'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LineIcon } from '@/components/line-icon';

export type NavItem = { href: string; label: string; image?: string; desc?: string };
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
  const hoverT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prodOn = path.startsWith('/product');
  const L = ({ href, label }: NavItem) => <Link href={href} className={linkCls(isActive(path, href))} aria-current={isActive(path, href) ? 'page' : undefined}>{label}</Link>;
  return (
    <nav aria-label="เมนูหลัก" className="hidden bg-navy-700 text-sm text-white md:block">
      <div className="container-x flex items-center gap-1 py-1">
        <L href="/" label="หน้าแรก" />
        {/* เอาเมาส์ชี้ "สินค้า" = เปิดเมนูทันที (ยังกด/ใช้คีย์บอร์ดได้เหมือนเดิม) · ออกจากเมนูแล้วปิดเองหลังหน่วงสั้น ๆ */}
        <details ref={ref} className="relative"
          onMouseEnter={() => { clearTimeout(hoverT.current); if (ref.current) ref.current.open = true; }}
          onMouseLeave={() => { hoverT.current = setTimeout(() => { if (ref.current) ref.current.open = false; }, 180); }}>
          <summary className={`${linkCls(prodOn)} flex list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
            // อุปกรณ์ที่มีเมาส์: เมนูเปิดจากการชี้อยู่แล้ว กดซ้ำไม่ให้ปิดทับ (ปิดด้วยการเลื่อนออก/คลิกข้างนอก/Esc)
            onClick={(e) => { if (window.matchMedia('(hover: hover)').matches && ref.current?.open) e.preventDefault(); }}>สินค้า <span aria-hidden>▾</span></summary>
          <ProductMenu cats={cats} path={path} />
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

/** เมนูสินค้า: รายชื่อหมวดเรียงแนวตั้งด้านซ้าย · ชี้/โฟกัสหมวดไหน ด้านขวาแสดงรูปรวมสินค้าและคำอธิบายของหมวดนั้น */
function ProductMenu({ cats, path }: { cats: NavItem[]; path: string }) {
  // ยังไม่ชี้ชื่อไหน = แสดงแค่รายชื่อ · ชี้ชื่อหมวดแล้วรูปจึงขึ้นด้านขวา
  const [i, setI] = useState(-1);
  const c = cats[i];
  return (
    <div className="absolute left-0 top-full z-50 flex pt-1"><div className="flex overflow-hidden rounded-2xl bg-white text-ink shadow-2xl ring-1 ring-slate-200" data-testid="product-menu">
      <ul className={`w-[280px] shrink-0 space-y-0.5 p-2 ${c ? 'border-r border-slate-100 bg-slate-50' : ''}`}>
        <li><Link href="/products" className="block rounded-lg px-3 py-2.5 font-semibold text-navy-700 hover:bg-white">สินค้าทั้งหมด →</Link></li>
        {cats.map((x, n) => (
          <li key={x.href}>
            <Link href={x.href} onMouseEnter={() => setI(n)} onFocus={() => setI(n)} aria-current={isActive(path, x.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${n === i ? 'bg-white font-semibold text-navy-700 shadow-sm' : 'hover:bg-white'}`}>
              <span className="min-w-0 flex-1">{x.label}</span>
              <span aria-hidden className={n === i ? 'text-cyan-700' : 'text-transparent'}>›</span>
            </Link>
          </li>
        ))}
      </ul>
      {c && (
        <Link href={c.href} className="group flex w-[440px] flex-col p-5" tabIndex={-1} aria-hidden data-testid="menu-preview">
          <span className="text-lg font-bold text-navy-900">{c.label}</span>
          {c.image && <span className="relative my-3 block aspect-[4/3] w-full"><Image src={c.image} alt="" fill sizes="420px" className="object-contain transition group-hover:scale-[1.03]" /></span>}
          {c.desc && <span className="line-clamp-2 text-sm text-muted">{c.desc}</span>}
          <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white group-hover:bg-navy-900">ดูสินค้าในหมวดนี้ →</span>
        </Link>
      )}
    </div></div>
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
          <Link key={i.href} href={i.href} aria-current={isActive(path, i.href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${i.image ? 'pl-7' : ''} ${isActive(path, i.href) ? 'bg-cyan-100 font-semibold text-navy-700' : 'hover:bg-navy-50'}`}>
            {i.label}
          </Link>
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
