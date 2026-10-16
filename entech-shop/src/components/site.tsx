import Link from 'next/link';
import Image from 'next/image';
import { CartBadge } from './cart-badge';
import { getCategories } from '@/lib/catalog';
import { DesktopNav, MobileMenu } from './nav';
import { getContact } from '@/lib/content';
import { LineIcon } from '@/components/line-icon';


const Search = ({ className = '' }: { className?: string }) => (
  <form action="/products" role="search" className={`items-center rounded-full border-2 border-navy-700 bg-white p-1 pl-4 focus-within:ring-2 focus-within:ring-cyan-500/40 ${className}`}>
    <input name="q" type="search" enterKeyHint="search" placeholder="ค้นหาสินค้า เช่น ถังเก็บน้ำ 2000 ลิตร" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500 md:text-sm" aria-label="ค้นหาสินค้า" />
    <button className="min-h-10 shrink-0 rounded-full bg-navy-700 px-4 text-sm font-semibold text-white hover:bg-navy-900">ค้นหา</button>
  </form>
);

export async function Header() {
  const CONTACT = await getContact();
  const TEL = CONTACT.tel;
  const cats = (await getCategories()).map((c) => ({ href: `/products/${c.slug}`, label: c.name }));
  return (
    <header className="relative z-40 bg-white shadow-sm md:sticky md:top-0">
      <div className="bg-navy-900 text-xs text-white">
        <div className="container-x flex flex-wrap items-center justify-between gap-x-3 py-1.5 md:py-2">
          <span>☎ <a href={TEL.main} className="inline-block py-1 underline-offset-2 hover:underline">{CONTACT.phone}</a>, <a href={TEL.mobile} className="inline-block py-1 underline-offset-2 hover:underline">{CONTACT.mobile}</a><span className="hidden md:inline"> · {CONTACT.hours}</span></span>
          {CONTACT.topbar && <span className="hidden text-cyan-100 md:inline">{CONTACT.topbar}</span>}
          <Link href="/order/lookup" className="inline-block whitespace-nowrap py-1 underline md:hidden">ตรวจสอบคำสั่งซื้อ</Link>
        </div>
      </div>
      <div className="container-x flex items-center gap-3 py-3 md:gap-4">
        <MobileMenu cats={cats} phone={CONTACT.mobile} phoneHref={TEL.mobile} lineUrl={CONTACT.lineUrl} />
        <Link href="/" aria-label="ENTECH หน้าแรก" className="min-w-0 shrink"><Image src="/images/logo.png" alt="ENTECH" width={92} height={55} priority className="h-11 w-auto max-w-full object-contain md:h-[55px]" /></Link>
        <Search className="hidden flex-1 md:flex" />
        <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="btn-line ml-auto hidden md:ml-0 md:inline-flex"><LineIcon />แอดไลน์</a>
        <div className="ml-auto shrink-0 md:ml-0"><CartBadge /></div>
      </div>
      <div className="container-x pb-3 md:hidden"><Search className="flex" /></div>
      <DesktopNav cats={cats} />
    </header>
  );
}

export async function Footer() {
  const CONTACT = await getContact();
  const TEL = CONTACT.tel;
  return (
    <footer className="mt-16 bg-navy-900 pb-20 text-sm text-navy-100 md:pb-0">
      <div className="container-x grid gap-8 break-words py-12 md:grid-cols-3 [&>*]:min-w-0">
        <div>
          <div className="mb-3 inline-block rounded-lg bg-white p-2"><Image src="/images/logo.png" alt="ENTECH" width={78} height={47} /></div>
          <p>บริษัท เอนเทค โพรดักส์ จำกัด ผู้ผลิตและจัดจำหน่ายถังบำบัดน้ำเสียและถังเก็บน้ำ PE, FRP แบรนด์ ENTECH และ POLYTEC</p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">ติดต่อเรา</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 [&_a]:hover:text-white [&_a]:hover:underline [&_dt]:font-semibold [&_dt]:text-white">
            <dt>ที่อยู่:</dt><dd>{CONTACT.address}</dd>
            <dt>โทร:</dt><dd><a href={TEL.main}>{CONTACT.phone}</a>{CONTACT.mobile && <>, <a href={TEL.mobile}>{CONTACT.mobile}</a></>}</dd>
            {CONTACT.email && <><dt>อีเมล:</dt><dd><a href={`mailto:${CONTACT.email}`} className="break-all">{CONTACT.email}</a></dd></>}
            <dt>LINE:</dt><dd><a href={CONTACT.lineUrl} target="_blank" rel="noopener">{CONTACT.line}</a>{CONTACT.hours && <> · {CONTACT.hours}</>}</dd>
            {CONTACT.facebook && <><dt>Facebook:</dt><dd><a href={CONTACT.facebook} target="_blank" rel="noopener">{CONTACT.facebookName || 'Facebook'}</a></dd></>}
          </dl>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">ลิงก์</p>
          <ul className="grid grid-cols-2 gap-x-4 md:grid-cols-1">
            {[['/products', 'สินค้าทั้งหมด'], ['/services', 'ขอใบเสนอราคา'], ['/order/lookup', 'ตรวจสอบคำสั่งซื้อ'], ['/articles', 'บทความ'], ['/csr', 'กิจกรรม CSR'], ['/faq', 'คำถามที่พบบ่อย'], ['/about', 'เกี่ยวกับเรา'], ['/contact', 'ติดต่อเรา']].map(([h, l]) => <li key={h}><Link href={h} className="inline-block py-2 hover:text-white hover:underline md:py-1.5">{l}</Link></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-600 py-4 text-center text-xs">© {new Date().getFullYear() + 543} {CONTACT.company} · เลขทะเบียนนิติบุคคล {CONTACT.regNo} · <Link href="/terms" className="underline hover:text-white">เงื่อนไขการสั่งซื้อ</Link> · <Link href="/privacy" className="underline hover:text-white">นโยบายความเป็นส่วนตัว</Link></div>
    </footer>
  );
}
