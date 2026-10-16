/** URL จริงของเว็บ ใช้กับ canonical / sitemap / JSON-LD / og
 *  บน production ถ้าลืมตั้ง SITE_URL ให้ล้มทันที แทนที่จะส่ง localhost ให้ Google แบบเงียบ ๆ */
// บน Vercel ถ้ายังไม่ตั้ง SITE_URL ใช้โดเมน production ของโปรเจกต์ (เช่น entech-demo.vercel.app)
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const raw = process.env.SITE_URL || (vercel ? `https://${vercel}` : undefined);
if (!raw && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build')
  throw new Error('ต้องตั้งค่า SITE_URL (เช่น https://www.entech-products.com) ก่อนรันบน production');
export const SITE_URL = (raw || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'ENTECH Products';

export const DEFAULT_DESC = 'ผู้ผลิตถังเก็บน้ำและถังบำบัดน้ำเสีย PE, FRP แบรนด์ ENTECH และ POLYTEC มาตรฐาน มอก. ตั้งแต่ปี 2537 สั่งซื้อออนไลน์ ค่าส่งคำนวณอัตโนมัติ จัดส่งทั่วประเทศ';
export const OG = { type: 'website' as const, locale: 'th_TH', siteName: SITE_NAME, images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'ENTECH ถังเก็บน้ำ ถังบำบัดน้ำเสีย' }] };
