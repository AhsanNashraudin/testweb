import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getContact } from '@/lib/content';

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา',
  description: 'บริษัท เอนเทค โพรดักส์ จำกัด ก่อตั้งปี 2537 ผู้ผลิตถังเก็บน้ำและถังบำบัดน้ำเสีย PE, FRP แบรนด์ ENTECH และ POLYTEC มาตรฐาน มอก. พร้อมบริการออกแบบระบบบำบัดน้ำเสีย',
  alternates: { canonical: '/about' },
};

const HISTORY = [
  ['2537', 'ก่อตั้งเมื่อวันที่ 29 มีนาคม 2537 โดยกลุ่มวิศวกร เริ่มจากออกแบบและจำหน่ายถังเก็บน้ำให้โครงการอสังหาริมทรัพย์ ซึ่งกฎหมายจัดสรรที่ดินกำหนดให้ต้องมีถังเก็บน้ำ'],
  ['2540', 'ช่วงวิกฤตต้มยำกุ้ง บริษัทปรับทิศทาง ขยายสู่ลูกค้ากลุ่มอุตสาหกรรมหลากหลาย เช่น โรงงานเครื่องยนต์และอาหาร และเพิ่มบริการออกแบบและก่อสร้างระบบบำบัดน้ำเสีย'],
  ['ปัจจุบัน', 'ผลิตถังบำบัดน้ำเสียและถังเก็บน้ำ PE และ FRP ภายใต้แบรนด์ ENTECH และ POLYTEC และพัฒนาเฟอร์นิเจอร์ไฟเบอร์กลาสลายไม้ 3 มิติ เพื่อช่วยลดการตัดไม้'],
];
const CUSTOMERS = ['โรงงานอุตสาหกรรม', 'งานก่อสร้างอาคาร', 'บ้านพักอาศัยและอาคารสำนักงาน', 'ผู้รับเหมาก่อสร้าง'];
const WORKS = [
  ['ระบบบำบัดน้ำเสีย นิคมอุตสาหกรรมสินสาคร', 'งานระบบบำบัดน้ำเสียของนิคมอุตสาหกรรม จ.สมุทรสาคร'],
  ['ผลิตถังแบบ OEM ให้ร้านค้าในเครือเอสซีจี', 'ผลิตถังภายใต้แบรนด์ของลูกค้า (OEM) ให้ร้านค้าในเครือเอสซีจี โฮมมาร์ท'],
];
const SERVICES = [
  'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียชุมชน', 'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียอุตสาหกรรม', 'ถังบำบัดน้ำเสียและระบบบำบัดไฟเบอร์กลาส',
  'ถังเก็บน้ำไฟเบอร์กลาสและพลาสติก', 'ถังเก็บสารเคมีและอุปกรณ์กระบวนการไฟเบอร์กลาส รวมถึงข้อต่อท่อ', 'ถังดักก๊าซและสารเคมีเพื่อควบคุมมลพิษ',
  'เคลือบไฟเบอร์กลาสป้องกันการกัดกร่อนบนคอนกรีตและโลหะ', 'ผลิตภัณฑ์ไฟเบอร์กลาสตกแต่งเลียนแบบธรรมชาติ', 'ประตูและวงกบไฟเบอร์กลาส',
  'ให้คำปรึกษาและออกแบบงานไฟเบอร์กลาส',
];

export default async function About() {
  const CONTACT = await getContact();
  return (
    <div className="container-x space-y-14 py-10">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <p className="font-semibold text-cyan-700">ผู้ผลิตโดยตรง ตั้งแต่ปี 2537</p>
          <h1 className="text-3xl font-bold text-navy-900">{CONTACT.company}</h1>
          <p className="text-ink">ผู้ออกแบบ ผลิต และจัดจำหน่ายถังบำบัดน้ำเสียและถังเก็บน้ำ PE และไฟเบอร์กลาส (FRP) ภายใต้แบรนด์ ENTECH และ POLYTEC ผลิตภัณฑ์ได้รับมาตรฐานผลิตภัณฑ์อุตสาหกรรม มอก. 1379-2551, มอก. 816-2538 และ มอก. 435-2548</p>
          <p className="text-ink">นอกจากสินค้าสำเร็จรูป ทีมวิศวกรของเรารับออกแบบและก่อสร้างระบบบำบัดน้ำเสียสำหรับชุมชนและโรงงาน รวมถึงงานไฟเบอร์กลาสตามสั่ง</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/products" className="btn-primary">ดูสินค้าทั้งหมด</Link>
            <Link href="/services#quote" className="btn-outline">ขอใบเสนอราคา</Link>
          </div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-3xl"><Image src="/images/products/about1.jpg" alt="ข้อมูลบริษัท ENTECH: ก่อตั้ง 29 มีนาคม 2537 ทุนจดทะเบียน 47 ล้านบาท" fill sizes="(max-width:768px) 100vw, 600px" className="object-cover" /></div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['ก่อตั้ง', '29 มีนาคม 2537'], ['ประสบการณ์', 'มากกว่า 30 ปี'], ['ทุนจดทะเบียน', '47,000,000 บาท'], ['มาตรฐาน', 'มอก. 1379-2551 · 816-2538 · 435-2548']].map(([k, v]) => (
          <div key={k} className="card p-5"><dt className="text-sm text-muted">{k}</dt><dd className="mt-1 font-bold text-navy-900">{v}</dd></div>
        ))}
      </dl>

      <section aria-labelledby="h-history">
        <h2 id="h-history" className="text-2xl font-bold text-navy-900">ประวัติบริษัท</h2>
        <ol className="mt-6 space-y-4 border-l-2 border-cyan-500 pl-6">
          {HISTORY.map(([y, t]) => (
            <li key={y} className="relative"><span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-white bg-cyan-500" aria-hidden />
              <p className="font-bold text-navy-900">{y === 'ปัจจุบัน' ? y : `พ.ศ. ${y}`}</p><p className="text-ink">{t}</p></li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-svc" className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 id="h-svc" className="text-2xl font-bold text-navy-900">สินค้าและบริการ</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">{SERVICES.map((s) => <li key={s} className="card p-4 text-sm">✓ {s}</li>)}</ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy-900">กลุ่มลูกค้า</h2>
          <ul className="mt-4 space-y-2">{CUSTOMERS.map((c) => <li key={c} className="card p-4 text-sm">{c}</li>)}</ul>
        </div>
      </section>

      <section aria-labelledby="h-works">
        <h2 id="h-works" className="text-2xl font-bold text-navy-900">ตัวอย่างผลงาน</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {WORKS.map(([t, d]) => <div key={t} className="card p-5"><p className="font-bold text-navy-900">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>)}
        </div>
        <p className="mt-6 text-ink">เรายังมีโครงการ &ldquo;Entech เพื่อชุมชน&rdquo; มอบถังเก็บน้ำและประตูไฟเบอร์กลาสให้วัด โรงเรียน และหน่วยงานในต่างจังหวัด <Link href="/articles" className="font-semibold text-navy-700 underline">อ่านข่าวกิจกรรม</Link></p>
      </section>

      <section className="card grid gap-2 p-6 md:grid-cols-2">
        <div><p className="font-bold">ที่ตั้งโรงงานและสำนักงาน</p><p className="text-sm text-muted">{CONTACT.address}</p></div>
        <div className="text-sm"><p>โทร: {CONTACT.phone}, {CONTACT.mobile}</p><p>เวลาทำการ: {CONTACT.hours}</p><p>เลขทะเบียนนิติบุคคล: {CONTACT.regNo}</p></div>
      </section>
    </div>
  );
}
