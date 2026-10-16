import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote-form';
import { Icon, type IconName } from '@/components/icons';

export const metadata: Metadata = {
  title: 'ออกแบบระบบบำบัดน้ำเสีย & ขอใบเสนอราคา',
  description: 'บริการออกแบบ ผลิต และติดตั้งระบบบำบัดน้ำเสีย ถังเก็บน้ำ และงานไฟเบอร์กลาสสำหรับชุมชน โรงงาน อาคาร โดยทีมวิศวกร ENTECH ขอใบเสนอราคาฟรี ตอบกลับภายใน 1 วันทำการ',
  alternates: { canonical: '/services' },
};

const SERVICES: [IconName, string, string][] = [
  ['treatment', 'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียชุมชนและอุตสาหกรรม', 'สำรวจหน้างาน คำนวณปริมาณน้ำเสีย ออกแบบ และก่อสร้างให้ผ่านมาตรฐานน้ำทิ้ง'],
  ['capsule', 'ถังบำบัดน้ำเสียไฟเบอร์กลาส', 'ผลิตตามขนาดสำหรับอาคาร โรงงาน และโครงการ ทนการกัดกร่อน อายุใช้งานยาว'],
  ['tank', 'ถังเก็บน้ำไฟเบอร์กลาสและพลาสติก', 'ถัง PE และ FRP ตั้งแต่บ้านพักอาศัยถึงงานขนาดใหญ่ ได้มาตรฐาน มอก.'],
  ['flask', 'ถังเก็บสารเคมีและระบบท่ออุตสาหกรรม', 'เลือกเรซินให้เหมาะกับสารเคมีแต่ละชนิด พร้อมงานเดินระบบท่อ'],
  ['wind', 'ถังดักก๊าซและสารเคมีควบคุมมลพิษ', 'อุปกรณ์ไฟเบอร์กลาสสำหรับระบบบำบัดอากาศและควบคุมมลพิษ'],
  ['roller', 'เคลือบไฟเบอร์กลาสผิวคอนกรีตและโลหะ', 'กันรั่วซึม กันสนิม ยืดอายุบ่อ ถัง และโครงสร้างเดิม'],
  ['leaf', 'ผลิตภัณฑ์ไฟเบอร์กลาสเลียนแบบวัสดุธรรมชาติ', 'ลายไม้ ลายหิน สำหรับตกแต่งสวนและอาคาร ลดการใช้ไม้จริง'],
  ['door', 'ประตูและวงกบไฟเบอร์กลาส', 'ไม่ผุ ไม่บวมน้ำ เหมาะกับห้องน้ำ วัด โรงเรียน และอาคารสาธารณะ'],
  ['pen', 'ให้คำปรึกษาและออกแบบงานไฟเบอร์กลาสตามสั่ง', 'มีแบบหรือมีแค่ไอเดีย ทีมวิศวกรช่วยออกแบบและประเมินราคาให้'],
];
const STEPS: [IconName, string, string][] = [
  ['chat', 'ปรึกษาฟรี', 'แจ้งความต้องการทางฟอร์มหรือ LINE'],
  ['pen', 'สำรวจ & ออกแบบ', 'วิศวกรออกแบบและเสนอราคา'],
  ['factory', 'ผลิตที่โรงงาน', 'ควบคุมคุณภาพตามมาตรฐาน'],
  ['truck', 'ขนส่ง & ติดตั้ง', 'ส่งมอบพร้อมคำแนะนำการใช้งาน'],
];

export default async function Services({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const product = (await searchParams).product?.slice(0, 200);
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold text-navy-900">บริการออกแบบ & ก่อสร้างระบบ</h1>
      <p className="mt-2 text-muted">โซลูชันวิศวกรรมสิ่งแวดล้อมครบวงจร สำหรับชุมชน โรงงาน อาคารพาณิชย์ และที่อยู่อาศัย</p>
      <ul className="my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(([icon, title, desc], i) => (
          <li key={title} className="card group flex gap-4 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-md">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-sm ${i % 2 ? 'bg-cyan-700' : 'bg-navy-700'}`}><Icon name={icon} /></span>
            <span className="min-w-0">
              <span className="block font-bold leading-snug text-navy-900">{title}</span>
              <span className="mt-1 block text-sm text-muted">{desc}</span>
            </span>
          </li>
        ))}
      </ul>
      <section aria-labelledby="h-steps" className="mb-10 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-700 to-cyan-700 p-6 text-white md:p-8">
        <h2 id="h-steps" className="text-xl font-bold md:text-2xl">ขั้นตอนการทำงาน</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([icon, title, desc], i) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-navy-700">
                <Icon name={icon} />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-cyan-500 text-[11px] font-bold text-white">{i + 1}</span>
              </span>
              <span><span className="block font-bold">{title}</span><span className="block text-sm text-navy-100">{desc}</span></span>
            </li>
          ))}
        </ol>
      </section>
      <h2 id="quote" className="mb-4 scroll-mt-40 text-2xl font-bold text-navy-900">ขอใบเสนอราคา / ปรึกษาโครงการ</h2>
      <QuoteForm source={product ? `หน้าสินค้า: ${product}` : 'หน้าบริการ'} defaultDetail={product ? `สนใจสินค้า: ${product}\nจำนวน: ` : ''}
        topics={product ? ['ขอราคาสินค้า (สั่งจำนวนมาก/โครงการ)', 'ระบบบำบัดน้ำเสีย', 'อื่นๆ'] : ['ระบบบำบัดน้ำเสีย', 'ถังเก็บน้ำ (สั่งจำนวนมาก)', 'ถังเก็บสารเคมี / งานอุตสาหกรรม', 'งานเคลือบไฟเบอร์กลาส', 'อื่นๆ']} />
    </div>
  );
}
