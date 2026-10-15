import { and, desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';

/** บทความที่เผยแพร่แล้ว เรียงล่าสุดก่อน */
export const listPublished = () =>
  db.select().from(s.articles).where(eq(s.articles.published, true)).orderBy(desc(s.articles.publishedAt));

export const getPublished = async (slug: string) => {
  const [a] = await db.select().from(s.articles).where(and(eq(s.articles.slug, slug), eq(s.articles.published, true)));
  return a ?? null;
};

/** แยกเนื้อหาเป็นย่อหน้า (เว้นบรรทัดว่าง = ขึ้นย่อหน้าใหม่) — เป็นข้อความล้วน ไม่รับ HTML จึงปลอดภัย */
export const paragraphs = (body: string) => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
