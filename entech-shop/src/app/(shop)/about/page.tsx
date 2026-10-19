import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getContact } from '@/lib/content';
import { Icon, type IconName } from '@/components/icons';

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
const CUSTOMERS: [IconName, string][] = [['factory', 'โรงงานอุตสาหกรรม'], ['building', 'งานก่อสร้างอาคาร'], ['tank', 'บ้านพักอาศัยและอาคารสำนักงาน'], ['wrench', 'ผู้รับเหมาก่อสร้าง']];
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

/** หัวข้อส่วน: ไอคอนในกล่องไล่สี + เส้นใต้ */
function H2({ id, icon, children, light }: { id: string; icon: IconName; children: React.ReactNode; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-600 to-navy-700 text-white shadow-md"><Icon name={icon} /></span>
      <div>
        <h2 id={id} className={`text-2xl font-bold ${light ? 'text-white' : 'text-navy-900'}`}>{children}</h2>
        <span aria-hidden className="mt-1 block h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-navy-700" />
      </div>
    </div>
  );
}

export default async function About() {
  const CONTACT = await getContact();
  const STATS: [IconName, string, string][] = [['clock', 'ก่อตั้ง', '29 มีนาคม 2537'], ['star', 'ประสบการณ์', 'มากกว่า 30 ปี'], ['briefcase', 'ทุนจดทะเบียน', '47,000,000 บาท'], ['award', 'มาตรฐาน', 'มอก. 1379-2551 · 816-2538 · 435-2548']];
  return (
    <div className="pb-6">
      {/* ส่วนหัว: พื้นอ่อนไล่สี */}
      <section className="bg-gradient-to-b from-navy-50 to-white">
        <div className="container-x grid items-center gap-10 py-10 md:grid-cols-2">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700"><Icon name="factory" className="h-4 w-4" /> ผู้ผลิตโดยตรง ตั้งแต่ปี 2537</span>
            <h1 className="text-3xl font-bold text-navy-900 md:text-4xl">{CONTACT.company}</h1>
            <p className="text-ink">ผู้ออกแบบ ผลิต และจัดจำหน่ายถังบำบัดน้ำเสียและถังเก็บน้ำ PE และไฟเบอร์กลาส (FRP) ภายใต้แบรนด์ ENTECH และ POLYTEC ผลิตภัณฑ์ได้รับมาตรฐานผลิตภัณฑ์อุตสาหกรรม มอก. 1379-2551, มอก. 816-2538 และ มอก. 435-2548</p>
            <p className="text-ink">นอกจากสินค้าสำเร็จรูป ทีมวิศวกรของเรารับออกแบบและก่อสร้างระบบบำบัดน้ำเสียสำหรับชุมชนและโรงงาน รวมถึงงานไฟเบอร์กลาสตามสั่ง</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products" className="btn-primary">ดูสินค้าทั้งหมด</Link>
              <Link href="/services#quote" className="btn-outline">ขอใบเสนอราคา</Link>
            </div>
          </div>
          {/* ลูกค้าขอเอารูปอินโฟกราฟิกเดิมออก → แสดงสินค้าหลัก 4 หมวดแทน */}
          <ul className="grid grid-cols-2 gap-3" aria-label="สินค้าหลัก">
            {([['water-tanks', 'ถังเก็บน้ำ'], ['septic-tanks', 'ถังบำบัดน้ำเสีย'], ['fiberglass-doors', 'ประตูไฟเบอร์กลาส'], ['planters', 'กระถางไฟเบอร์กลาส']] as const).map(([slug, name]) => (
              <li key={slug}>
                <Link href={`/products/${slug}`} className="card group block overflow-hidden p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-md">
                  <span className="relative block aspect-square"><Image src={`/images/products/cat-${slug}.jpg`} alt={name} fill sizes="(max-width:768px) 45vw, 280px" className="object-contain transition group-hover:scale-105" /></span>
                  <span className="mt-1 block text-sm font-semibold text-navy-900">{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-x space-y-14">
        {/* ตัวเลขบริษัท */}
        <dl className="-mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([icon, k, v]) => (
            <div key={k} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-200">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cyan-100 text-cyan-700"><Icon name={icon} /></span>
              <div className="min-w-0"><dt className="text-sm text-muted">{k}</dt><dd className="mt-0.5 font-bold text-navy-900">{v}</dd></div>
            </div>
          ))}
        </dl>

        <section aria-labelledby="h-history">
          <H2 id="h-history" icon="clock">ประวัติบริษัท</H2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {HISTORY.map(([y, t], i) => (
              <li key={y} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold text-white ${i === HISTORY.length - 1 ? 'bg-gradient-to-r from-cyan-600 to-navy-700' : 'bg-navy-700'}`}>{y === 'ปัจจุบัน' ? y : `พ.ศ. ${y}`}</span>
                <p className="mt-3 text-sm leading-relaxed text-ink">{t}</p>
                {i < HISTORY.length - 1 && <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-cyan-500 text-white md:grid"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></span>}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="h-svc" className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <H2 id="h-svc" icon="wrench">สินค้าและบริการ</H2>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <li key={s} className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-600 text-white"><Icon name="check" className="h-3.5 w-3.5" /></span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <H2 id="h-cust" icon="users">กลุ่มลูกค้า</H2>
            <ul className="mt-6 space-y-2.5">
              {CUSTOMERS.map(([icon, c]) => (
                <li key={c} className="flex items-center gap-3 rounded-xl bg-navy-50 p-4 text-sm font-semibold text-navy-900">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-navy-700 shadow-sm"><Icon name={icon} className="h-5 w-5" /></span>{c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="h-works" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-700 to-cyan-700 p-6 text-white md:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[30px] border-white/5" />
          <H2 id="h-works" icon="award" light>ตัวอย่างผลงาน</H2>
          <div className="relative mt-6 grid gap-4 md:grid-cols-2">
            {WORKS.map(([t, d], i) => (
              <div key={t} className="flex gap-4 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-navy-700"><Icon name={i ? 'factory' : 'treatment'} /></span>
                <div><p className="font-bold">{t}</p><p className="mt-1 text-sm text-navy-100">{d}</p></div>
              </div>
            ))}
          </div>
          <p className="relative mt-6 flex flex-wrap items-center gap-2 text-navy-100"><Icon name="heart" className="h-5 w-5 text-cyan-100" /> เรายังมีโครงการ &ldquo;Entech เพื่อชุมชน&rdquo; มอบถังเก็บน้ำและประตูไฟเบอร์กลาสให้วัด โรงเรียน และหน่วยงานในต่างจังหวัด <Link href="/csr" className="font-semibold text-white underline">ดูกิจกรรม CSR</Link></p>
        </section>

        <section aria-labelledby="h-office" className="grid gap-4 md:grid-cols-3">
          <h2 id="h-office" className="sr-only">ติดต่อบริษัท</h2>
          {([['pin', 'ที่ตั้งโรงงานและสำนักงาน', CONTACT.address], ['phone', 'โทร', `${CONTACT.phone}, ${CONTACT.mobile}`], ['clock', 'เวลาทำการ', `${CONTACT.hours} · เลขทะเบียนนิติบุคคล ${CONTACT.regNo}`]] as [IconName, string, string][]).map(([icon, k, v]) => (
            <div key={k} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-navy-700 text-white"><Icon name={icon} className="h-5 w-5" /></span>
              <div className="min-w-0 text-sm"><p className="font-bold text-navy-900">{k}:</p><p className="mt-0.5 text-muted">{v}</p></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
