import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/nav';
import { NavProgress } from '@/components/nav-progress';
import { logout } from '../login/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: { default: 'หลังบ้าน', template: '%s | หลังบ้าน ENTECH' }, robots: { index: false } };

const NAV = [['/admin', 'ภาพรวม'], ['/admin/orders', 'คำสั่งซื้อ'], ['/admin/quotes', 'ใบเสนอราคา'], ['/admin/home', 'จัดการหน้าแรก'], ['/admin/products', 'สินค้า'], ['/admin/articles', 'บทความ & CSR'], ['/admin/site', 'ข้อมูลร้าน & ติดต่อ'], ['/admin/shipping', 'ค่าจัดส่ง & การชำระเงิน']].map(([href, label]) => ({ href, label }));

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <NavProgress />
      <a href="#admin-main" className="skip-link">ข้ามไปที่เนื้อหา</a>
      <aside className="relative z-40 flex items-center gap-3 bg-navy-900 p-3 text-white md:block md:w-60 md:shrink-0 md:p-4">
        <div className="inline-block shrink-0 rounded-lg bg-white p-1.5 md:mb-6 md:p-2"><Image src="/images/logo.png" alt="ENTECH" width={78} height={47} className="h-8 w-auto md:h-[47px]" /></div>
        <div className="flex-1 md:flex-none"><AdminNav items={NAV} /></div>
        <div className="hidden border-t border-navy-600 pt-4 text-sm md:mt-8 md:block">
          <p className="text-cyan-100">{me.name}</p>
          <p className="truncate text-xs text-navy-100">{me.email}</p>
          <form action={logout}><button className="mt-3 py-1 text-sm underline">ออกจากระบบ</button></form>
          <Link href="/" target="_blank" className="mt-2 block py-1 text-xs underline">ดูหน้าเว็บไซต์ ↗</Link>
        </div>
        <form action={logout} className="md:hidden"><button className="h-11 px-2 text-sm underline">ออก</button></form>
      </aside>
      <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-8">{children}</main>
    </div>
  );
}
