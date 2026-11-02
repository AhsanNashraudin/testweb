/** การ์ดความน่าเชื่อถือในแบนเนอร์หน้าแรก: ISO 9001 (กดแล้ว popup เครื่องหมาย UKAS) · มอก. — ตามแบบที่ลูกค้าส่งมา */
import Image from 'next/image';
import { CertPopup } from './cert-popup';

const CARD = 'flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-5 shadow-[0_8px_24px_-12px_rgba(15,39,71,0.35)] ring-1 ring-slate-200/80';

function Text({ title, desc }: { title: string; desc: string }) {
  return (
    <span className="leading-tight">
      <span className="block font-bold text-navy-900">{title}</span>
      <span className="mt-0.5 block text-xs text-muted">{desc}</span>
    </span>
  );
}

export function HeroCerts() {
  return (
    <ul className="grid gap-3 sm:flex sm:flex-wrap sm:items-stretch" aria-label="ความน่าเชื่อถือ" data-testid="hero-certs">
      <li className="flex">
        <CertPopup className={`${CARD} w-full`} image="/images/cert-ukas.png" alt="เครื่องหมาย UKAS Management Systems — ใบรับรอง ISO 9001" w={754} h={992}>
          <Image src="/images/cert-iso9001.jpg" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
          <Text title="ISO 9001" desc="ระบบบริหารคุณภาพ" />
        </CertPopup>
      </li>
      <li className={CARD}>
        <Image src="/images/cert-tisi-mark.png" alt="เครื่องหมาย มอก." width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
        <Text title="มาตรฐาน มอก." desc="สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม" />
      </li>
    </ul>
  );
}
