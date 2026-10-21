/* ข้อมูลตั้งต้น: สินค้าจาก scripts/catalog.ts (ราคาจาก Price List), โซนค่าส่งจากชีต Delivery Fee */
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
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
    slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body, published: true, kind: a.kind ?? 'article', image: a.image ?? '',
    publishedAt: new Date(`${a.publishedAt}T09:00:00+07:00`),
  }));
  if (rows.length) await db.insert(s.articles).values(rows);
  // ฐานข้อมูลเดิม: อัปเดตบทความตั้งต้นตามรอบแก้ของลูกค้า (เฉพาะที่แอดมินยังไม่ได้แก้เอง)
  for (const a of ARTICLES.filter((x) => have.has(x.slug))) {
    const [cur] = await db.select().from(s.articles).where(eq(s.articles.slug, a.slug));
    const patch: Partial<typeof s.articles.$inferInsert> = {};
    if (a.kind === 'csr' && cur.kind === 'article') patch.kind = 'csr';
    if (a.image && !cur.image) patch.image = a.image;
    if (a.image && cur.image === a.image.replace('-v2.jpg', '.jpg')) patch.image = a.image; // รูปปกรุ่นใหม่ (ชื่อไฟล์ใหม่กัน cache)
    if (cur.body.includes('\n• ') && !cur.body.includes(' | ') && a.body.includes(' | ')) patch.body = a.body; // รายการ → ตาราง
    for (const [o, n] of TEXT_FIXES) if ((patch.body ?? cur.body).includes(o)) patch.body = (patch.body ?? cur.body).replace(o, n);
    if (Object.keys(patch).length) await db.update(s.articles).set(patch).where(eq(s.articles.id, cur.id));
  }
  return rows.length;
}

// ข้อความที่ลูกค้าขอแก้ (แก้ในฐานข้อมูลเดิมด้วย ถ้ายังเป็นข้อความเดิมอยู่ — ที่แอดมินแก้เองแล้วจะไม่ถูกแตะ)
const TEXT_FIXES: [string, string][] = [
  ['ก่อนสั่งซื้อ ให้วัดพื้นที่วางถังโดยเผื่อที่ว่างรอบถังไว้ เพื่อให้เดินท่อและดูแลได้สะดวก และตรวจว่าพื้นรับน้ำหนักถังเมื่อเต็มได้ (น้ำ 1,000 ลิตร หนักประมาณ 1,000 กิโลกรัม)',
    'ก่อนสั่งซื้อ ควรวัดพื้นที่สำหรับติดตั้งถัง โดยเผื่อพื้นที่รอบถังสำหรับเดินท่อ ตรวจเช็ก และบำรุงรักษาได้สะดวก รวมถึงตรวจสอบว่าพื้นบริเวณติดตั้งสามารถรองรับน้ำหนักของถังเมื่อบรรจุน้ำเต็มได้'],
];
const SETTING_FIXES: [string, string, string][] = [
  ['contact', '02-813-0971-5', '02-813-0971-4'],
  ['home', '"image":"/images/products/cat_tank.jpg"', '"image":"/images/hero-studio.webp","imageFit":"contain"'],
  ['home', '"image":"/images/hero-products.webp"', '"image":"/images/hero-studio.webp"'],
  ['home', '"image":"/images/hero-studio.webp","imageFit":"contain"', '"image":"/images/hero-scene-v3.webp","imageFit":"scene"'],
  ['home', '"image":"/images/hero-scene.webp"', '"image":"/images/hero-scene-v3.webp"'],
  ['home', '"image":"/images/hero-scene-v2.webp"', '"image":"/images/hero-scene-v3.webp"'],
  ['home', '"imageAlt":"ถังเก็บน้ำ ENTECH ที่โรงงาน"', '"imageAlt":"ถังเก็บน้ำและถังบำบัดน้ำเสีย ENTECH และ POLYTEC"'],
  ['home', 'ถังเก็บน้ำรับประกันสูงสุด 20 ปี พร้อมทีมงานดูแลหลังการขาย', 'รับประกัน 20 ปี ภายใต้เงื่อนไขการรับประกันของบริษัท ตามข้อกำหนดและเงื่อนไขการรับประกัน'],
];
async function fixSettings() {
  for (const [key, o, n] of SETTING_FIXES) {
    const [row] = await db.select().from(s.settings).where(eq(s.settings.key, key));
    if (row?.value.includes(o)) await db.update(s.settings).set({ value: row.value.replaceAll(o, n) }).where(eq(s.settings.key, key));
  }
}

// ตั้ง ADMIN_PASSWORD ใหม่แล้วรัน seed ซ้ำ (เช่น redeploy) = รีเซ็ตรหัสผ่านแอดมินคนนี้ได้ โดยไม่แตะข้อมูลอื่น
async function syncAdmin() {
  const explicitPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!explicitPassword) return; // ไม่ได้ตั้งมา = ไม่ยุ่งกับรหัสผ่านที่มีอยู่
  if (explicitPassword.length < 8) throw new Error('ADMIN_PASSWORD ต้องยาวอย่างน้อย 8 ตัวอักษร');
  const email = process.env.ADMIN_EMAIL?.trim() || 'admin@entech.local';
  const passwordHash = await bcrypt.hash(explicitPassword, 10);
  const [existingAdmin] = await db.select().from(s.admins).where(eq(s.admins.email, email));
  if (existingAdmin) {
    await db.update(s.admins).set({ passwordHash }).where(eq(s.admins.email, email));
    console.log(`✓ รีเซ็ตรหัสผ่านแอดมิน: ${email}`);
  } else {
    await db.insert(s.admins).values({ email, name: 'ผู้ดูแลระบบ', passwordHash });
    console.log(`✓ สร้างแอดมินใหม่: ${email}`);
  }
}

async function main() {
  const existing = await db.select().from(s.categories);
  if (existing.length) {
    // ฐานข้อมูลมีอยู่แล้ว → เพิ่มเฉพาะสินค้าใหม่ที่ยังไม่มี (ตาม slug) ไม่แตะข้อมูลเดิม
    const catId = Object.fromEntries(existing.map((c) => [c.slug, c.id]));
    const have = new Set((await db.select({ slug: s.products.slug }).from(s.products)).map((p) => p.slug));
    const added = await insertProducts(PRODUCTS.filter((p) => !have.has(p.slug)), catId);
    // รูปหมวด: เปลี่ยนเป็นรูปรวมสินค้า cat-<หมวด>.jpg (เฉพาะหมวดที่ยังใช้รูปตั้งต้นเดิม — รูปที่แอดมินเปลี่ยนเองไม่ถูกทับ)
    const OLD_CAT_IMG: Record<string, string> = {
      'water-tanks': 'tank-grand-stone', 'septic-tanks': 'septic-polytec-t', 'grease-traps': 'grease-set',
      'fiberglass-doors': 'door-edm-13', 'wall-bins': 'wallbin-louver', 'fiberglass-water-tanks': 'frp_septic', planters: 'planter',
    };
    // รูปหมวดชุดสตูดิโอ (cat-<หมวด>-studio.jpg) แทนรูปตั้งต้นรุ่นก่อน ๆ — ชื่อไฟล์ใหม่ = ไม่ติด cache รูปเก่า
    for (const [slug, old] of Object.entries(OLD_CAT_IMG)) {
      for (const prev of [`/images/products/${old}.jpg`, `/images/products/cat-${slug}.jpg`]) {
        await db.update(s.categories).set({ image: `/images/products/cat-${slug}-studio.jpg` })
          .where(and(eq(s.categories.slug, slug), eq(s.categories.image, prev)));
      }
    }
    const arts = await insertArticles();
    await fixSettings();
    if (arts) console.log(`✓ เพิ่มบทความ ${arts} เรื่อง`);
    await syncAdmin();
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
  if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) throw new Error('บน Vercel ต้องตั้ง ADMIN_PASSWORD (ห้ามใช้รหัสเริ่มต้น)');
  if (!process.env.ADMIN_PASSWORD) {
    // dev เท่านั้น: ไม่ได้ตั้ง ADMIN_PASSWORD มา ใช้รหัสเริ่มต้น (syncAdmin ข้ามเคสนี้เพราะต้องมี ADMIN_PASSWORD ชัดเจน)
    const email = process.env.ADMIN_EMAIL?.trim() || 'admin@entech.local';
    await db.insert(s.admins).values({ email, name: 'ผู้ดูแลระบบ', passwordHash: await bcrypt.hash('Entech@2026', 10) });
    console.log(`✓ seed เสร็จ — แอดมิน: ${email} / Entech@2026  ← เปลี่ยนทันทีบน production`);
    return;
  }
  await syncAdmin();
  console.log('✓ seed เสร็จ');
}
main().catch((e) => { console.error(e); process.exit(1); });
