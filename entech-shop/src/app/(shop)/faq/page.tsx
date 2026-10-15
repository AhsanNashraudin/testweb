import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT } from '@/components/site';
import { loadShippingConfig } from '@/lib/settings';
import { baht } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย',
  description: 'คำถามที่พบบ่อยเรื่องการสั่งซื้อถังเก็บน้ำ ถังบำบัด ถังดักไขมัน และประตูไฟเบอร์กลาสจาก ENTECH: ราคา VAT ค่าส่ง การชำระเงิน ใบกำกับภาษี และการรับประกัน',
  alternates: { canonical: '/faq' },
};

type QA = { q: string; a: string; link?: [string, string] };

export default async function Faq() {
  const cfg = await loadShippingConfig();
  const vatIn = cfg.settings.prices_include_vat === '1';
  const bank = !!cfg.settings.bank_account;
  const fees = cfg.zones.map((z) => `${z.name} ${baht(z.baseFee)}`).join(', ');
  const items: QA[] = [
    { q: 'ราคาในเว็บรวม VAT แล้วหรือยัง?', a: vatIn ? 'ราคาที่แสดงรวมภาษีมูลค่าเพิ่ม 7% แล้ว' : 'ราคาที่แสดงยังไม่รวม VAT 7% ระบบจะบวก VAT ให้เห็นในหน้าชำระเงินก่อนยืนยันคำสั่งซื้อ' },
    { q: 'ค่าจัดส่งคิดอย่างไร?', a: `ระบบคำนวณค่าส่งอัตโนมัติตามจังหวัดปลายทาง ต่อคำสั่งซื้อ: ${fees}${cfg.pickup.enabled ? ' หรือรับสินค้าเองที่โรงงานโดยไม่มีค่าจัดส่ง' : ''} ท่านจะเห็นค่าส่งก่อนกดยืนยันเสมอ`, link: ['/terms', 'ดูเงื่อนไขการจัดส่ง'] },
    { q: 'รับสินค้าเองที่โรงงานได้ไหม?', a: `ได้ เลือก "${cfg.pickup.label}" ในหน้าชำระเงิน ที่อยู่ ${CONTACT.address} เวลา ${cfg.pickup.eta}` },
    { q: 'ซื้อจำนวนมากได้ราคาพิเศษไหม?', a: 'สินค้าที่มีราคาส่ง เมื่อสั่งรุ่นเดียวกันครบ 5 ชิ้นขึ้นไป ระบบคิดราคาส่งให้อัตโนมัติ ถ้าเป็นงานโครงการหรือสั่งจำนวนมากกว่านี้ ขอใบเสนอราคาหรือคุยกับฝ่ายขายทาง LINE ได้', link: ['/services#quote', 'ขอใบเสนอราคา'] },
    { q: 'ชำระเงินช่องทางไหนได้บ้าง?', a: `สแกน PromptPay QR ที่แสดงหลังสั่งซื้อ${bank ? ' หรือโอนเข้าบัญชีธนาคารของบริษัท' : ''} แล้วส่งสลิปพร้อมเลขคำสั่งซื้อทาง LINE ${CONTACT.line}` },
    { q: 'ขอใบกำกับภาษีได้ไหม?', a: 'ได้ ติ๊ก "ต้องการใบกำกับภาษี" ในหน้าชำระเงิน แล้วกรอกชื่อบริษัท เลขประจำตัวผู้เสียภาษี สาขา และที่อยู่' },
    { q: 'ตรวจสอบสถานะคำสั่งซื้อได้ที่ไหน?', a: 'ที่หน้าตรวจสอบคำสั่งซื้อ ใช้เลขคำสั่งซื้อและเบอร์โทรศัพท์ที่ใช้สั่ง', link: ['/order/lookup', 'ตรวจสอบคำสั่งซื้อ'] },
    { q: 'สินค้าที่ขึ้นว่า "สอบถามราคา" สั่งอย่างไร?', a: 'เป็นสินค้าสั่งผลิตหรือราคาตามสเปก กดปุ่ม "สอบถามราคาทาง LINE" หรือ "ขอใบเสนอราคา" ในหน้าสินค้า ทีมขายจะตอบกลับภายในวันทำการ' },
    { q: 'ถังเก็บน้ำรับประกันกี่ปี?', a: 'ถังเก็บน้ำรุ่น CW สีฟ้า รับประกันตัวถัง 12 ปี ส่วนรุ่น GRAND STONE และ NATURAL DESIGN รับประกันตัวถัง 20 ปี รายละเอียดอยู่ในหน้าสินค้าแต่ละรุ่น' },
    { q: 'เลือกขนาดถังเก็บน้ำอย่างไร?', a: 'ดูจากจำนวนคนที่ใช้น้ำ เช่น บ้าน 3–4 คน ใช้ 700 ลิตร บ้าน 9–10 คน ใช้ 2,000 ลิตร มีตารางเทียบครบทุกขนาดในบทความ', link: ['/articles/water-tank-size-guide', 'อ่านวิธีเลือกขนาดถัง'] },
    { q: 'ถังดักไขมันร้านอาหารใช้ขนาดไหน?', a: 'เลือกตามจำนวนโต๊ะ เช่น 1–3 โต๊ะ ใช้ PT-15 ถึง 21–40 โต๊ะ ใช้ PT-140', link: ['/articles/grease-trap-size-guide', 'อ่านตารางเทียบขนาด'] },
    { q: 'ประตูไฟเบอร์กลาสปรับขนาดหรือสั่งเจาะได้ไหม?', a: 'ไสปรับขนาดได้ด้านละไม่เกิน 1 มม. และสั่งเจาะบานเกล็ด ช่องกระจก หรือเสริมขอบบังใบได้ โดยมีราคาเพิ่มตามตารางในหน้าสินค้า' },
  ];
  const jsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
  return (
    <div className="container-x max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <h1 className="text-3xl font-bold text-navy-900">คำถามที่พบบ่อย</h1>
      <div className="mt-6 space-y-3">
        {items.map((i) => (
          <details key={i.q} className="card group p-5" data-testid="faq-item">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
              {i.q}<span aria-hidden className="transition group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink">{i.a}</p>
            {i.link && <Link href={i.link[0]} className="mt-2 inline-block text-sm font-semibold text-navy-700 underline">{i.link[1]} →</Link>}
          </details>
        ))}
      </div>
      <p className="mt-8 text-muted">ไม่พบคำตอบที่ต้องการ? ติดต่อ LINE <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="text-navy-700 underline">{CONTACT.line}</a> หรือโทร <a href="tel:028130971" className="text-navy-700 underline">{CONTACT.phone}</a></p>
    </div>
  );
}
