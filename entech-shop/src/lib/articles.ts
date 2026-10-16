import { cache } from 'react';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';

export type Kind = 'article' | 'csr';
export const KIND = {
  article: { label: 'บทความ', href: '/articles', desc: 'ความรู้และคำแนะนำจากทีมงาน ENTECH' },
  csr: { label: 'กิจกรรม CSR', href: '/csr', desc: 'กิจกรรมเพื่อสังคมของ ENTECH — มอบถังเก็บน้ำ ประตูไฟเบอร์กลาส และอุปกรณ์การเรียนให้ชุมชน' },
} as const;

/** ที่เผยแพร่แล้ว เรียงล่าสุดก่อน (ระบุ kind = เฉพาะประเภทนั้น) */
export const listPublished = (kind?: Kind) =>
  db.select().from(s.articles)
    .where(kind ? and(eq(s.articles.published, true), eq(s.articles.kind, kind)) : eq(s.articles.published, true))
    .orderBy(desc(s.articles.publishedAt));

export const getPublished = cache(async (slug: string) => {
  const [a] = await db.select().from(s.articles).where(and(eq(s.articles.slug, slug), eq(s.articles.published, true)));
  return a ?? null;
});

/** แยกเนื้อหาเป็นย่อหน้า (เว้นบรรทัดว่าง = ขึ้นย่อหน้าใหม่) — เป็นข้อความล้วน ไม่รับ HTML จึงปลอดภัย */
export const paragraphs = (body: string) => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export type Block = { t: 'p'; text: string } | { t: 'table'; head: string[]; rows: string[][] } | { t: 'ul'; items: string[] };
/** ย่อหน้าที่ทุกบรรทัดมี | (2 บรรทัดขึ้นไป) = ตาราง (บรรทัดแรกเป็นหัวตาราง) · ทุกบรรทัดขึ้นต้นด้วย • หรือ - = รายการ */
export function blocks(body: string): Block[] {
  return paragraphs(body).map((p): Block => {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2 && lines.every((l) => l.includes('|'))) {
      const cells = lines.map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      return { t: 'table', head: cells[0], rows: cells.slice(1) };
    }
    if (lines.every((l) => /^[•\-]\s/.test(l))) return { t: 'ul', items: lines.map((l) => l.replace(/^[•\-]\s*/, '')) };
    return { t: 'p', text: p };
  });
}
