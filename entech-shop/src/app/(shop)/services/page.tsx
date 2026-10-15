import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote-form';

export const metadata: Metadata = {
  title: 'ออกแบบระบบบำบัดน้ำเสีย & ขอใบเสนอราคา',
  description: 'บริการออกแบบ ผลิต และติดตั้งระบบบำบัดน้ำเสีย ถังเก็บน้ำ และงานไฟเบอร์กลาสสำหรับชุมชน โรงงาน อาคาร โดยทีมวิศวกร ENTECH ขอใบเสนอราคาฟรี ตอบกลับภายใน 1 วันทำการ',
  alternates: { canonical: '/services' },
};

const SERVICES = [
  'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียชุมชนและอุตสาหกรรม', 'ถังบำบัดน้ำเสียไฟเบอร์กลาส', 'ถังเก็บน้ำไฟเบอร์กลาสและพลาสติก',
  'ถังเก็บสารเคมีและระบบท่ออุตสาหกรรม', 'ถังดักก๊าซและสารเคมีควบคุมมลพิษ', 'เคลือบไฟเบอร์กลาสผิวคอนกรีตและโลหะ',
  'ผลิตภัณฑ์ไฟเบอร์กลาสเลียนแบบวัสดุธรรมชาติ', 'ประตูและวงกบไฟเบอร์กลาส', 'ให้คำปรึกษาและออกแบบงานไฟเบอร์กลาสตามสั่ง',
];

export default async function Services({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const product = (await searchParams).product?.slice(0, 200);
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">บริการออกแบบ & ก่อสร้างระบบ</h1>
      <p className="mt-2 text-muted">โซลูชันวิศวกรรมสิ่งแวดล้อมครบวงจร สำหรับชุมชน โรงงาน อาคารพาณิชย์ และที่อยู่อาศัย</p>
      <ul className="my-8 grid gap-3 md:grid-cols-3">{SERVICES.map((t) => <li key={t} className="card p-5 font-semibold">{t}</li>)}</ul>
      <h2 id="quote" className="mb-4 scroll-mt-40 text-2xl font-bold text-navy-900">ขอใบเสนอราคา / ปรึกษาโครงการ</h2>
      <QuoteForm source={product ? `หน้าสินค้า: ${product}` : 'หน้าบริการ'} defaultDetail={product ? `สนใจสินค้า: ${product}\nจำนวน: ` : ''}
        topics={product ? ['ขอราคาสินค้า (สั่งจำนวนมาก/โครงการ)', 'ระบบบำบัดน้ำเสีย', 'อื่นๆ'] : ['ระบบบำบัดน้ำเสีย', 'ถังเก็บน้ำ (สั่งจำนวนมาก)', 'ถังเก็บสารเคมี / งานอุตสาหกรรม', 'งานเคลือบไฟเบอร์กลาส', 'อื่นๆ']} />
    </div>
  );
}
