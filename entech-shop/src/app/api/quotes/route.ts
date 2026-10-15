import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, schema as s } from '@/db';
import { readJson, apiError } from '@/lib/api';

const quoteSchema = z.object({
  name: z.string().trim().min(2, 'กรุณากรอกชื่อ').max(100),
  company: z.string().trim().max(150).default(''),
  phone: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์').regex(/^0\d{8,9}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)')),
  email: z.union([z.literal(''), z.string().trim().email('อีเมลไม่ถูกต้อง')]).default(''),
  topic: z.string().trim().min(1, 'กรุณาเลือกหัวข้อ').max(100),
  province: z.string().trim().max(50).default(''),
  detail: z.string().trim().max(3000).default(''),
  source: z.string().trim().max(250).default(''), // มาจากหน้าไหน/สินค้าตัวใด
  website: z.string().max(0).optional(), // honeypot กันบอท
});

export async function POST(req: Request) {
  try {
    const r = quoteSchema.safeParse(await readJson(req));
    if (!r.success) {
      const fields: Record<string, string> = {};
      for (const i of r.error.issues) fields[String(i.path[0])] ??= i.message;
      return NextResponse.json({ error: Object.values(fields)[0], fields }, { status: 400 });
    }
    const { website: _hp, source, ...data } = r.data;
    void _hp;
    if (source) data.detail = `[${source}]\n${data.detail}`.trim();
    await db.insert(s.quotes).values(data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
