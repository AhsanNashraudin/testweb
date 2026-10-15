import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote-form';
import { CONTACT, TEL } from '@/components/site';
import { MAP_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'ติดต่อเรา',
  description: `ติดต่อ ENTECH ผู้ผลิตถังเก็บน้ำและถังบำบัดน้ำเสีย โทร ${CONTACT.phone}, ${CONTACT.mobile} LINE ${CONTACT.line} โรงงาน ต.อ้อมน้อย จ.สมุทรสาคร เปิด ${CONTACT.hours}`,
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">ติดต่อเรา</h1>
      <div className="my-6 grid gap-4 break-words md:grid-cols-4 [&>*]:min-w-0">
        <div className="card p-5"><p className="text-sm text-muted">โทรศัพท์</p><a href={TEL.main} className="block py-1 font-semibold text-navy-700 underline">{CONTACT.phone}</a><a href={TEL.mobile} className="block py-1 font-semibold text-navy-700 underline">{CONTACT.mobile}</a></div>
        <div className="card p-5"><p className="text-sm text-muted">LINE / Facebook</p><a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="block py-1 font-semibold text-navy-700 underline">{CONTACT.line}</a><a href={CONTACT.facebook} target="_blank" rel="noopener" className="block py-1 font-semibold text-navy-700 underline">Facebook เอนเทค โพรดักส์</a></div>
        <div className="card p-5"><p className="text-sm text-muted">อีเมล</p><a href={`mailto:${CONTACT.email}`} className="block break-all py-1 font-semibold text-navy-700 underline">{CONTACT.email}</a></div>
        <div className="card p-5"><p className="text-sm text-muted">เวลาทำการ</p><p className="py-1 font-semibold">{CONTACT.hours}</p></div>
      </div>
      <p className="mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-navy-50 p-4">📍 {CONTACT.address} <a href={MAP_URL} target="_blank" rel="noopener" className="btn-outline">เปิดแผนที่</a></p>
      <h2 id="quote" className="mb-4 scroll-mt-40 text-2xl font-bold text-navy-900">ส่งข้อความถึงเรา</h2>
      <QuoteForm source="หน้าติดต่อเรา" topics={['สอบถามสินค้า', 'ขอใบเสนอราคา', 'บริการหลังการขาย', 'อื่นๆ']} />
    </div>
  );
}
