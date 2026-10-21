/** GET /api/v1/items — รายการ SKU ทั้งหมดในเว็บ (ใช้กระทบยอดกับระบบสต็อก)
 *  PUT /api/v1/items — ระบบสต็อกเป็น master: ส่งรายการ SKU มาอัปเดต/สร้างใหม่ (ทีละไม่เกิน 500 รายการ)
 *    · SKU ที่มีอยู่แล้ว → อัปเดตเฉพาะช่องที่ส่งมา (ชื่อรุ่น ราคา สต็อก น้ำหนัก ราคาส่ง)
 *    · SKU ใหม่ → ต้องส่ง product { code, name, category } · สินค้าใหม่ถูกซ่อนไว้จนแอดมินใส่รูป/รายละเอียดแล้วกดเปิดขาย
 *    · รูป คำอธิบาย สเปก หมวด SEO ยังจัดการในหลังบ้านเว็บ (API ไม่ทับ) */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema as s } from '@/db';
import { readJson } from '@/lib/api';
import { compareAt } from '@/lib/pricing';
import { getSettings } from '@/lib/settings';
import { checkKey, fail } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = checkKey(req);
  if (denied) return denied;
  try {
    const rows = await db.select({
      sku: s.variants.sku, variantName: s.variants.name, price: s.variants.price, bulkPrice: s.variants.bulkPrice, bulkMinQty: s.variants.bulkMinQty,
      stock: s.variants.stock, weightKg: s.variants.weightKg,
      productCode: s.products.slug, productName: s.products.name, category: s.categories.slug, active: s.products.isActive,
    }).from(s.variants).innerJoin(s.products, eq(s.products.id, s.variants.productId)).innerJoin(s.categories, eq(s.categories.id, s.products.categoryId))
      .orderBy(asc(s.products.id), asc(s.variants.sort));
    return NextResponse.json({ data: rows });
  } catch (e) { return fail(e); }
}

const baht = z.number().int().min(0).max(10_000_000);
const Item = z.strictObject({
  sku: z.string().trim().min(1).max(60),
  variantName: z.string().trim().min(1).max(120).optional(),
  price: baht.optional(), // 0 = สอบถามราคา
  bulkPrice: baht.optional(), bulkMinQty: z.number().int().min(0).max(100_000).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  weightKg: z.number().min(0).max(5000).optional(),
  product: z.strictObject({
    code: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ใช้ a-z 0-9 และ - เท่านั้น').max(80),
    name: z.string().trim().min(2).max(200).optional(),
    category: z.string().trim().max(80).optional(),
  }).optional(),
});
const Body = z.strictObject({ items: z.array(Item).min(1).max(500) });

export async function PUT(req: Request) {
  const denied = checkKey(req);
  if (denied) return denied;
  try {
    const { items } = Body.parse(await readJson(req, 1_000_000));
    const markup = Number((await getSettings()).compare_markup ?? 0);
    const cats = Object.fromEntries((await db.select().from(s.categories)).map((c) => [c.slug, c.id]));
    const results: { sku: string; result: 'updated' | 'created' | 'error'; message?: string }[] = [];

    for (const it of items) {
      try {
        const patch: Partial<typeof s.variants.$inferInsert> = {};
        if (it.variantName !== undefined) patch.name = it.variantName;
        if (it.price !== undefined) Object.assign(patch, { price: it.price, compareAtPrice: compareAt(it.price, markup) });
        if (it.bulkPrice !== undefined) patch.bulkPrice = it.bulkPrice;
        if (it.bulkMinQty !== undefined) patch.bulkMinQty = it.bulkMinQty;
        if (it.stock !== undefined) patch.stock = it.stock;
        if (it.weightKg !== undefined) patch.weightKg = it.weightKg;

        const [cur] = await db.select({ id: s.variants.id }).from(s.variants).where(eq(s.variants.sku, it.sku));
        if (cur) {
          if (Object.keys(patch).length) await db.update(s.variants).set(patch).where(eq(s.variants.id, cur.id));
          results.push({ sku: it.sku, result: 'updated' });
          continue;
        }
        // SKU ใหม่
        if (!it.product) throw new Error('SKU ใหม่ต้องส่ง product.code (และ name, category ถ้าเป็นสินค้าใหม่)');
        if (it.price === undefined || it.variantName === undefined) throw new Error('SKU ใหม่ต้องส่ง variantName และ price');
        let [p] = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, it.product.code));
        if (!p) {
          const catId = cats[it.product.category ?? ''];
          if (!it.product.name || !catId) throw new Error(`สินค้าใหม่ต้องส่ง product.name และ product.category ที่มีอยู่ (${Object.keys(cats).join(', ')})`);
          [p] = await db.insert(s.products).values({ slug: it.product.code, name: it.product.name, categoryId: catId, isActive: false }).returning({ id: s.products.id });
        }
        await db.insert(s.variants).values({ productId: p.id, sku: it.sku, name: it.variantName, price: it.price, compareAtPrice: compareAt(it.price, markup), ...patch, sort: 99 });
        results.push({ sku: it.sku, result: 'created' });
      } catch (e) {
        results.push({ sku: it.sku, result: 'error', message: (e as Error).message });
      }
    }
    revalidatePath('/', 'layout');
    const errors = results.filter((r) => r.result === 'error').length;
    return NextResponse.json({ data: results, summary: { total: results.length, errors } }, { status: errors === results.length ? 400 : errors ? 207 : 200 });
  } catch (e) { return fail(e); }
}
