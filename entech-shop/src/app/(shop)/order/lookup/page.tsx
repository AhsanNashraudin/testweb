import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { CONTACT } from '@/components/site';

export const metadata: Metadata = { title: 'ตรวจสอบคำสั่งซื้อ', robots: { index: false } };

type SP = Promise<{ code?: string; phone?: string }>;

export default async function OrderLookup({ searchParams }: { searchParams: SP }) {
  const { code = '', phone = '' } = await searchParams;
  const c = code.trim().toUpperCase().slice(0, 20), p = phone.replace(/\D/g, '').slice(0, 10);
  let notFound = false;
  if (c && p) {
    // ต้องตรงทั้งเลขคำสั่งซื้อและเบอร์โทร จึงจะพาไปหน้าคำสั่งซื้อ (กันคนอื่นเดาเลข)
    const [o] = await db.select({ code: s.orders.code, k: s.orders.accessKey }).from(s.orders).where(and(eq(s.orders.code, c), eq(s.orders.phone, p)));
    if (o) redirect(`/order/${o.code}?k=${o.k}`);
    notFound = true;
  }
  return (
    <div className="container-x max-w-xl py-10">
      <h1 className="text-3xl font-bold text-navy-900">ตรวจสอบคำสั่งซื้อ</h1>
      <p className="mt-2 text-muted">กรอกเลขคำสั่งซื้อ (เช่น ET261005-AB2CD) และเบอร์โทรที่ใช้สั่งซื้อ</p>
      <form className="card mt-6 grid gap-4 p-6">
        <div><label htmlFor="code" className="label">เลขคำสั่งซื้อ</label><input id="code" name="code" defaultValue={code} required className="input uppercase" autoComplete="off" aria-invalid={notFound || undefined} aria-describedby={notFound ? 'lookup-err' : undefined} /></div>
        <div><label htmlFor="phone" className="label">เบอร์โทรศัพท์</label><input id="phone" name="phone" type="tel" defaultValue={phone} required inputMode="tel" className="input" autoComplete="tel" aria-invalid={notFound || undefined} /></div>
        {(code || phone) && (!c || !p) && <p className="err" role="alert">กรุณากรอกให้ครบทั้ง 2 ช่อง</p>}
        {notFound && <p id="lookup-err" className="err" role="alert">ไม่พบคำสั่งซื้อที่ตรงกับข้อมูลนี้ — ตรวจสอบเลขคำสั่งซื้อและเบอร์โทรอีกครั้ง หรือติดต่อ LINE {CONTACT.line}</p>}
        <button className="btn-primary">ค้นหาคำสั่งซื้อ</button>
      </form>
    </div>
  );
}
