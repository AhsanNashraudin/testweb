import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** อ่าน JSON จาก request พร้อมจำกัดขนาด (นับจากเนื้อหาจริง ไม่เชื่อ content-length อย่างเดียว) */
export async function readJson(req: Request, maxBytes = 50_000): Promise<unknown> {
  if (Number(req.headers.get('content-length') ?? 0) > maxBytes) throw new ZodError([]);
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new ZodError([]);
  try { return JSON.parse(text); } catch { throw new ZodError([]); }
}

export function apiError(e: unknown) {
  if (e instanceof ZodError) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fields: {} }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: 'ระบบขัดข้อง กรุณาลองใหม่' }, { status: 500 });
}
