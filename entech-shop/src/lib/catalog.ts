import 'server-only';
import { and, asc, eq, like, or, sql, desc } from 'drizzle-orm';
import { db, schema as s } from '@/db';

export const getCategories = () => db.select().from(s.categories).orderBy(asc(s.categories.sort));

const priceAgg = {
  minPrice: sql<number>`min(${s.variants.price})`.as('min_price'),
  // SQLite: คอลัมน์เปล่าคู่กับ min() จะได้ค่าจากแถวที่ราคาต่ำสุด → ราคาก่อนลดของตัวเลือกเดียวกัน
  minCompare: sql<number>`${s.variants.compareAtPrice}`.as('min_compare'),
  variantCount: sql<number>`count(${s.variants.id})`.as('variant_count'),
  totalStock: sql<number>`sum(${s.variants.stock})`.as('total_stock'),
};

export type ProductCardData = Awaited<ReturnType<typeof listProducts>>[number];

export async function listProducts(opts: { categoryId?: number; q?: string; sort?: string; featured?: boolean; limit?: number } = {}) {
  const where = [eq(s.products.isActive, true)];
  if (opts.categoryId) where.push(eq(s.products.categoryId, opts.categoryId));
  if (opts.featured) where.push(eq(s.products.isFeatured, true));
  // ค้นทีละคำ (ทุกคำต้องเจอ) ในชื่อ/คำโปรย/แบรนด์/ชื่อตัวเลือก โดยไม่สนเครื่องหมายจุลภาค: "2000 ลิตร" เจอ "2,000 ลิตร"
  const terms = (opts.q ?? '').replace(/[,%_]/g, '').split(/\s+/).filter(Boolean).slice(0, 6);
  for (const t of terms) {
    const q = `%${t}%`;
    const plain = (col: typeof s.products.name) => sql`replace(${col}, ',', '') like ${q}`;
    where.push(or(plain(s.products.name), like(s.products.shortDesc, q), like(s.products.brand, q),
      sql`exists (select 1 from variants v2 where v2.product_id = ${s.products.id} and replace(v2.name, ',', '') like ${q})`)!);
  }
  const order =
    opts.sort === 'price_asc' ? sql`min_price = 0, min_price` : opts.sort === 'price_desc' ? desc(sql`min_price`) : opts.sort === 'new' ? desc(s.products.id) : asc(s.products.id);
  return db
    .select({ id: s.products.id, slug: s.products.slug, name: s.products.name, brand: s.products.brand, shortDesc: s.products.shortDesc, image: s.products.image, badge: s.products.badge, ...priceAgg })
    .from(s.products)
    .innerJoin(s.variants, eq(s.variants.productId, s.products.id))
    .where(and(...where))
    .groupBy(s.products.id)
    .orderBy(order)
    .limit(opts.limit ?? 60);
}

export async function getProduct(slug: string) {
  const [p] = await db
    .select({ product: s.products, category: s.categories })
    .from(s.products)
    .innerJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .where(and(eq(s.products.slug, slug), eq(s.products.isActive, true)));
  if (!p) return null;
  const variants = await db.select().from(s.variants).where(eq(s.variants.productId, p.product.id)).orderBy(asc(s.variants.sort));
  return { ...p, variants };
}

export async function relatedProducts(categoryId: number, excludeId: number) {
  const list = await listProducts({ categoryId, limit: 5 });
  return list.filter((p) => p.id !== excludeId).slice(0, 4);
}


