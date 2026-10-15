import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function readJson(req: Request): Promise<unknown> {
  if (Number(req.headers.get('content-length') ?? 0) > 50_000) throw new ZodError([]);
  try { return await req.json(); } catch { throw new ZodError([]); }
}

export function apiError(e: unknown) {
  if (e instanceof ZodError) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', fields: {} }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: 'ระบบขัดข้อง กรุณาลองใหม่' }, { status: 500 });
}
