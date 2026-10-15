/* ข้อมูลตั้งต้น: สินค้าจาก scripts/catalog.ts (ราคาจาก Price List), โซนค่าส่งจากชีต Delivery Fee */
import bcrypt from 'bcryptjs';
import { db, schema as s } from '../src/db';
import { CATS, PRODUCTS, type P } from './catalog';
import { ARTICLES } from './articles';
import { compareAt } from '../src/lib/pricing';

const COMPARE_MARKUP = 20; // ราคาก่อนลด (mock up) = ราคาขาย +20% · เปลี่ยนได้ในหลังบ้าน (0 / 20 / 40)

// ค่าขนส่งต่อเที่ยวจากชีต Delivery Fee: กระบะ 2,500 · ขนส่งเอกชน 4,000–5,000 (ใช้ 5,000)
const ZONES = [
  { name: 'กรุงเทพฯ ปริมณฑล และสมุทรสาคร (รถกระบะ)', method: 'flat' as const, baseFee: 2500, perKgFee: 0, includedKg: 0, freeOver: 0, etaText: '1–3 วันทำการ',
    provinces: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครปฐม', 'สมุทรสาคร'] },
  { name: 'ต่างจังหวัด (ขนส่งเอกชน)', method: 'flat' as const, baseFee: 5000, perKgFee: 0, includedKg: 0, freeOver: 0, etaText: '3–7 วันทำการ', provinces: [] as string[], isFallback: true },
];

async function insertProducts(list: P[], catId: Record<string, number>) {
  for (const p of list) {
    const [r] = await db.insert(s.products).values({
      slug: p.slug, name: p.name, brand: p.brand ?? 'ENTECH', categoryId: catId[p.cat], shortDesc: p.short, description: p.desc,
      image: `/images/products/${p.img}.jpg`, badge: p.badge ?? '', isFeatured: !!p.featured, specs: p.specs ?? '',
    }).returning();
    await db.insert(s.variants).values(p.v.map((v, i) => ({ productId: r.id, ...v, compareAtPrice: compareAt(v.price, COMPARE_MARKUP), sort: i })));
  }
  return list.length;
}

async function insertArticles() {
  const have = new Set((await db.select({ slug: s.articles.slug }).from(s.articles)).map((a) => a.slug));
  const rows = ARTICLES.filter((a) => !have.has(a.slug)).map((a) => ({
    slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body, published: true,
    publishedAt: new Date(`${a.publishedAt}T09:00:00+07:00`),
  }));
  if (rows.length) await db.insert(s.articles).values(rows);
  return rows.length;
}

async function main() {
  const existing = await db.select().from(s.categories);
  if (existing.length) {
    // ฐานข้อมูลมีอยู่แล้ว → เพิ่มเฉพาะสินค้าใหม่ที่ยังไม่มี (ตาม slug) ไม่แตะข้อมูลเดิม
    const catId = Object.fromEntries(existing.map((c) => [c.slug, c.id]));
    const have = new Set((await db.select({ slug: s.products.slug }).from(s.products)).map((p) => p.slug));
    const added = await insertProducts(PRODUCTS.filter((p) => !have.has(p.slug)), catId);
    const arts = await insertArticles();
    if (arts) console.log(`✓ เพิ่มบทความ ${arts} เรื่อง`);
    return console.log(added ? `✓ เพิ่มสินค้าใหม่ ${added} รายการ (ข้อมูลเดิมไม่เปลี่ยน)` : '↷ มีข้อมูลครบแล้ว (ใช้ npm run db:reset เพื่อล้างใหม่)');
  }
  const catId: Record<string, number> = {};
  for (const [i, [slug, name, description, img]] of CATS.entries()) {
    const [r] = await db.insert(s.categories).values({ slug, name, description, image: `/images/products/${img}.jpg`, sort: i }).returning();
    catId[slug] = r.id;
  }
  await insertProducts(PRODUCTS, catId);
  await insertArticles();
  for (const [i, z] of ZONES.entries()) {
    const { provinces, ...rest } = z;
    const [r] = await db.insert(s.shippingZones).values({ ...rest, sort: i }).returning();
    if (provinces.length) await db.insert(s.zoneProvinces).values(provinces.map((province) => ({ province, zoneId: r.id })));
  }
  await db.insert(s.settings).values([
    { key: 'pickup_enabled', value: '1' },
    { key: 'pickup_label', value: 'รับเองที่โรงงาน (ต.อ้อมน้อย จ.สมุทรสาคร)' },
    { key: 'pickup_eta', value: 'จันทร์–เสาร์ 08:00–16:30' },
    { key: 'promptpay_id', value: '0632061000' }, // ⚠ ต้องยืนยันกับลูกค้าว่าเป็น PromptPay ของบริษัท
    { key: 'promptpay_name', value: '' },
    // Price List ประตู/วงกบระบุ "ราคาไม่รวม VAT" → ค่าเริ่มต้น: ราคาในเว็บยังไม่รวม VAT ระบบบวก 7% ตอนชำระ (เปลี่ยนได้ในหลังบ้าน)
    { key: 'prices_include_vat', value: '0' },
    { key: 'compare_markup', value: String(COMPARE_MARKUP) },
    // บัญชีโอน: เว้นว่างไว้ = ปิดตัวเลือก "โอนผ่านธนาคาร" จนกว่าแอดมินจะกรอกในหลังบ้าน
    { key: 'bank_name', value: '' }, { key: 'bank_account', value: '' }, { key: 'bank_holder', value: '' },
  ]);
  await db.insert(s.coupons).values([{ code: 'ENTECH500', type: 'fixed', value: 500, minSubtotal: 5000 }]);
  const email = process.env.ADMIN_EMAIL?.trim() || 'admin@entech.local';
  const password = process.env.ADMIN_PASSWORD?.trim() || 'Entech@2026';
  if (password.length < 8) throw new Error('ADMIN_PASSWORD ต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) throw new Error('บน Vercel ต้องตั้ง ADMIN_PASSWORD (ห้ามใช้รหัสเริ่มต้น)');
  await db.insert(s.admins).values({ email, name: 'ผู้ดูแลระบบ', passwordHash: await bcrypt.hash(password, 10) });
  console.log(`✓ seed เสร็จ — แอดมิน: ${email} / ${process.env.ADMIN_PASSWORD ? '(จาก ADMIN_PASSWORD)' : password + '  ← เปลี่ยนทันทีบน production'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
