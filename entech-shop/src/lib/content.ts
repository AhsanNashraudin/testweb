/** เนื้อหาที่แก้ได้จากหลังบ้าน: ข้อมูลติดต่อ (ใช้ทั้งเว็บ) และหน้าแรก
 *  เก็บใน settings เป็น JSON (คีย์ contact / home) — ค่าที่ยังไม่เคยแก้ใช้ค่าเริ่มต้นด้านล่าง */
import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import type { IconName } from '@/components/icons';

export const DEFAULT_CONTACT = {
  company: 'บริษัท เอนเทค โพรดักส์ จำกัด', regNo: '0105537038071',
  phone: '02-813-0971-5', mobile: '063-206-1000', email: 'Entechproducts1@gmail.com',
  line: '@entechproducts', lineUrl: 'https://line.me/R/ti/p/@entechproducts',
  facebook: 'https://www.facebook.com/Entechproducts2026', facebookName: '@Entechproducts2026',
  hours: 'จันทร์–เสาร์ 08:00–16:30',
  address: '10/6 หมู่ 9 ซ.สุขาภิบาล 2 ถ.พุทธมณฑลสาย 4 ต.อ้อมน้อย อ.กระทุ่มแบน จ.สมุทรสาคร 74130',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('บริษัท เอนเทค โพรดักส์ จำกัด อ้อมน้อย กระทุ่มแบน สมุทรสาคร'),
  topbar: 'ผู้ผลิตถังเก็บน้ำและถังบำบัดน้ำเสีย มาตรฐาน มอก. ตั้งแต่ปี 2537',
};
export type Contact = typeof DEFAULT_CONTACT;

export const SECTION_KEYS = ['features', 'categories', 'featured', 'why', 'articles', 'csr', 'cta'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const SECTION_LABEL: Record<SectionKey, string> = {
  features: 'จุดเด่นบริการ (ไอคอน 6 ข้อ)', categories: 'หมวดหมู่สินค้า', featured: 'สินค้าแนะนำ', why: 'จุดเด่น (ทำไมต้องเรา)', articles: 'บทความล่าสุด', csr: 'กิจกรรม CSR ล่าสุด', cta: 'แถบปิดท้าย (ขอใบเสนอราคา)',
};

export const DEFAULT_HOME = {
  hero: {
    badge: '',
    title: 'ถังเก็บน้ำ & ถังบำบัดน้ำเสีย\nคุณภาพมาตรฐาน มอก.',
    lead: 'ผู้ผลิตโดยตรงสำหรับบ้าน ร้านอาหาร และโครงการ ที่มีประสบการณ์มากกว่า 30 ปี',
    sub: 'สั่งออนไลน์ได้ทันที ค่าส่งคำนวณอัตโนมัติ ส่งทั่วประเทศ หรือรับเองที่โรงงาน',
    btn1Label: 'เลือกซื้อสินค้า', btn1Href: '/products',
    btn2Label: 'ขอใบเสนอราคา', btn2Href: '/services#quote',
    image: '/images/products/cat_tank.jpg', imageAlt: 'ถังเก็บน้ำ ENTECH ที่โรงงาน',
    imageSide: 'right' as 'right' | 'left',
    showCerts: true, // โลโก้มาตรฐาน ISO 9001 และ มอก. ใต้ข้อความรอง
  },
  // ลำดับในรายการ = ลำดับบนหน้าเว็บ · title = หัวข้อที่แสดง (แถบปิดท้ายใช้หัวข้อใน cta)
  sections: ([
    ['features', 'ถังเก็บน้ำ ถังบำบัดน้ำเสีย ถังดักไขมัน BY ENTECH'], ['categories', 'หมวดหมู่สินค้า'], ['featured', 'สินค้าแนะนำ'], ['why', 'ทำไมต้อง ENTECH'], ['articles', 'บทความน่ารู้'], ['csr', 'กิจกรรมเพื่อสังคม (CSR)'], ['cta', ''],
  ] as [SectionKey, string][]).map(([key, title]) => ({ key, visible: true, title })),
  featuredCount: 8,
  // ส่วนจุดเด่นบริการ (หัวข้อ = ชื่อส่วนในรายการ sections) · คำอธิบายใต้หัวข้อช่วย SEO
  features: {
    desc: 'ผู้ผลิตและจัดจำหน่ายถังเก็บน้ำ ถังบำบัดน้ำเสีย ถังดักไขมัน และประตูไฟเบอร์กลาส พร้อมบริการออกแบบและติดตั้งระบบบำบัดน้ำเสีย ภายใต้แบรนด์ ENTECH และ POLYTEC',
    items: [
      { icon: 'truck', title: 'จัดส่งสินค้าทั่วประเทศ', desc: 'กรุงเทพฯ ปริมณฑล และต่างจังหวัด ค่าส่งคำนวณอัตโนมัติตามจังหวัด หรือรับเองที่โรงงาน' },
      { icon: 'award', title: 'สินค้ามาตรฐาน มอก.', desc: 'ผลิตภัณฑ์ได้รับมาตรฐาน มอก. 1379-2551, 816-2538 และ 435-2548' },
      { icon: 'shield', title: 'รับประกันคุณภาพ', desc: 'ถังเก็บน้ำรับประกันสูงสุด 20 ปี พร้อมทีมงานดูแลหลังการขาย' },
      { icon: 'headset', title: 'บริการให้คำปรึกษาฟรี', desc: 'ช่วยเลือกขนาดและรุ่นที่เหมาะกับบ้าน ร้านอาหาร อาคาร และโรงงาน' },
      { icon: 'doc', title: 'ขอใบเสนอราคาฟรี', desc: 'ส่งรายละเอียดงานมา ทีมงานตอบกลับพร้อมใบเสนอราคา ไม่มีค่าใช้จ่าย' },
      { icon: 'stopwatch', title: 'บริการรวดเร็วทันใจ', desc: 'ตอบคำถามทาง LINE และโทรศัพท์ในเวลาทำการ ผลิตและส่งมอบตรงเวลา' },
    ] as { icon: IconName; title: string; desc: string }[],
  },
  // ส่วน "ทำไมต้อง ENTECH": คำโปรย + ตัวเลขเด่น
  whyIntro: 'ผู้ผลิตถังเก็บน้ำและถังบำบัดน้ำเสียที่ลูกค้าบ้าน ร้านอาหาร และโรงงานไว้วางใจ ด้วยประสบการณ์กว่า 30 ปี',
  whyStats: [
    { value: '30+', label: 'ปีประสบการณ์' },
    { value: '20 ปี', label: 'รับประกันสูงสุด' },
    { value: '77', label: 'จังหวัดที่จัดส่ง' },
  ],
  why: [
    { title: 'ผู้ผลิตโดยตรง', desc: 'ออกแบบและผลิตเองตั้งแต่ปี 2537 ราคาจากโรงงาน' },
    { title: 'มาตรฐาน มอก.', desc: 'ถัง PE และไฟเบอร์กลาสได้รับมาตรฐานผลิตภัณฑ์อุตสาหกรรม' },
    { title: 'รับประกันสูงสุด 20 ปี', desc: 'ถังเก็บน้ำรุ่น GRAND STONE และ NATURAL DESIGN' },
    { title: 'ทีมวิศวกร', desc: 'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียสำหรับชุมชนและโรงงาน' },
  ],
  cta: {
    title: 'ต้องการระบบบำบัดน้ำเสียสำหรับโครงการ?', desc: 'ทีมวิศวกรพร้อมออกแบบ ผลิต และติดตั้ง — ประเมินราคาฟรี',
    btnLabel: 'ขอใบเสนอราคา', btnHref: '/services#quote', showLine: true,
  },
  seoTitle: '', seoDesc: '',
};
export type Home = typeof DEFAULT_HOME;

async function readJson(key: string): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, key));
  try { return row ? JSON.parse(row.value) : {}; } catch { return {}; }
}

/** ค่าที่บันทึกไว้ทับค่าเริ่มต้นทีละช่อง — เพิ่มช่องใหม่ในอนาคตแล้วของเดิมไม่พัง */
export const getContact = cache(async () => {
  const c = { ...DEFAULT_CONTACT, ...(await readJson('contact')) } as Contact;
  const digits = (v: string) => v.split(/[,/]/)[0].replace(/\D/g, '').slice(0, 10);
  return { ...c, tel: { main: `tel:${digits(c.phone)}`, mobile: `tel:${digits(c.mobile)}` } };
});

export const getHome = cache(async (): Promise<Home> => {
  const saved = (await readJson('home')) as Partial<Home>;
  const sections = Array.isArray(saved.sections) ? saved.sections.filter((x) => SECTION_KEYS.includes(x?.key)) : [];
  // หมวดที่ยังไม่อยู่ในรายการที่บันทึก (เช่น ส่วนใหม่ที่เพิ่มภายหลัง) ต่อท้ายให้อัตโนมัติ
  DEFAULT_HOME.sections.forEach((d, i) => {
    if (sections.some((x) => x.key === d.key)) return;
    // ส่วนแรกของค่าเริ่มต้น → ไว้บนสุด · อื่น ๆ วางต่อจากส่วนที่อยู่ก่อนหน้าในค่าเริ่มต้น (ไม่พบ = ต่อท้าย)
    const after = sections.findIndex((x) => x.key === DEFAULT_HOME.sections[i - 1]?.key);
    sections.splice(i === 0 ? 0 : after === -1 ? sections.length : after + 1, 0, d);
  });
  return {
    ...DEFAULT_HOME, ...saved,
    hero: { ...DEFAULT_HOME.hero, ...saved.hero },
    cta: { ...DEFAULT_HOME.cta, ...saved.cta },
    features: { ...DEFAULT_HOME.features, ...saved.features, items: Array.isArray(saved.features?.items) ? saved.features.items : DEFAULT_HOME.features.items },
    whyStats: Array.isArray(saved.whyStats) ? saved.whyStats : DEFAULT_HOME.whyStats,
    why: Array.isArray(saved.why) ? saved.why : DEFAULT_HOME.why,
    sections,
  };
});

/** ลิงก์ที่ยอมให้ใส่: หน้าในเว็บ (/...), https://, tel:, mailto: */
export const safeHref = (v: string) => (/^(\/(?!\/)|https:\/\/|tel:|mailto:)/.test(v) ? v : '');
/** รูปที่ยอมให้ใช้: อัปโหลดผ่านหลังบ้าน (/media/N) หรือรูปในเว็บ (/images/...) */
export const safeImage = (v: string) => (/^\/media\/\d+$|^\/images\/[\w./-]+$/.test(v) && !v.includes('..') ? v : '');
