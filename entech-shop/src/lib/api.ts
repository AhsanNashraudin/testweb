import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** อ่าน JSON จาก request พร้อมจำกัดขนาด — นับไบต์ระหว่างอ่านสตรีม แล้วหยุดทันทีเมื่อเกิน
 *  (ไม่เชื่อ content-length และไม่โหลดทั้งก้อนเข้าหน่วยความจำก่อนตรวจ เช่นกรณีส่งแบบ chunked) */
export async function readJson(req: Request, maxBytes = 50_000): Promise<unknown> {
  if (Number(req.headers.get('content-length') ?? 0) > maxBytes) throw new ZodError([]);
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = req.body?.getReader();
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel().catch(() => {}); throw new ZodError([]); }
      chunks.push(value);
    }
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ZodError([]); }
}

export function apiError(e: unknown) {
  if (e instanceof ZodError) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fields: {} }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: 'ระบบขัดข้อง กรุณาลองใหม่' }, { status: 500 });
}
