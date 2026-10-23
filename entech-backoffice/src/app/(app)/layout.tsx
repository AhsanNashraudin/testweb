import Image from 'next/image';
import { notInArray, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { requireUser } from '@/lib/admin';
import { trackedOrders } from '@/lib/backoffice';
import { SideNav, type NavItem } from '@/components/nav';
import { NavProgress } from '@/components/nav-progress';
import { logout } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const [orders, [mo]] = await Promise.all([
    trackedOrders(),
    db.select({ n: sql<number>`count(*)` }).from(s.productionOrders).where(notInArray(s.productionOrders.status, ['done', 'cancelled'])),
  ]);
  const late = orders.filter((o) => o.late > 0).length;
  const nav: NavItem[] = [
    { group: 'ภาพรวม', href: '/', label: 'แดชบอร์ด', icon: 'home' },
    { group: 'ภาพรวม', href: '/tracking', label: 'ติดตามออเดอร์', icon: 'track', badge: late },
    { group: 'การขาย', href: '/orders', label: 'คำสั่งซื้อ', icon: 'order' },
    { group: 'การขาย', href: '/quotes', label: 'ใบเสนอราคา', icon: 'quote' },
    { group: 'ปฏิบัติการ', href: '/inventory', label: 'คลังสินค้า', icon: 'box' },
    { group: 'ปฏิบัติการ', href: '/production', label: `โรงงานผลิต${mo.n ? ` (${mo.n})` : ''}`, icon: 'factory' },
    { group: 'การเงิน', href: '/accounting', label: 'บัญชี & e-Tax', icon: 'bill' },
    { group: 'ระบบ', href: '/settings', label: 'ตั้งค่า & เชื่อมเว็บ', icon: 'sync' },
  ];
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <NavProgress />
      <a href="#main" className="skip-link">ข้ามไปที่เนื้อหา</a>
      <aside className="relative z-40 flex items-center gap-3 bg-navy-900 p-3 text-white print:hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:items-stretch md:overflow-y-auto md:p-4">
        <div className="flex shrink-0 items-center gap-3 md:mb-6">
          <span className="rounded-lg bg-white p-1.5"><Image src="/logo.png" alt="ENTECH" width={64} height={38} className="h-7 w-auto md:h-9" /></span>
          <span className="hidden leading-tight md:block"><b className="block text-sm">ระบบหลังบ้าน</b><span className="text-xs text-navy-100">สำหรับพนักงาน ENTECH</span></span>
        </div>
        <div className="min-w-0 flex-1"><SideNav items={nav} /></div>
        <div className="hidden rounded-xl bg-white/5 p-3 text-sm md:mt-6 md:block">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-cyan-700 font-bold">{me.name.slice(0, 1)}</span>
            <span className="min-w-0"><b className="block truncate">{me.name}</b><span className="block truncate text-xs text-navy-100">{me.email}</span></span>
          </div>
          <form action={logout}><button className="mt-3 min-h-11 w-full rounded-lg border border-white/20 text-sm hover:bg-white/10">ออกจากระบบ</button></form>
        </div>
        <form action={logout} className="shrink-0 md:hidden"><button className="min-h-11 px-2 text-sm underline">ออก</button></form>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-8">{children}</main>
    </div>
  );
}
