import { SITE_URL } from '@/lib/site';
import type { MetadataRoute } from 'next';

// อ่าน SITE_URL / NOINDEX ตอนรันจริง (ไม่ใช่ตอน build) → ย้ายโดเมนแค่แก้ค่าในโฮสต์
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL;
  // เว็บทดสอบ/สำรอง (เช่น Vercel หลังย้ายไปโฮสต์จริง) ตั้ง NOINDEX=1 → ไม่ให้ Google เก็บ กันเนื้อหาซ้ำกับเว็บจริง
  if (process.env.NOINDEX === '1') return { rules: [{ userAgent: '*', disallow: '/' }] };
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cart', '/checkout', '/order'] }], sitemap: `${site}/sitemap.xml` };
}
