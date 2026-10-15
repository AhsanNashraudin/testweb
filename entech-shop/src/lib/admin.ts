import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { COOKIE, verifySession } from './session';

/** ตรวจสิทธิ์ซ้ำในทุก server action/page (อย่าพึ่ง middleware อย่างเดียว) */
export async function requireAdmin() {
  const sess = await verifySession((await cookies()).get(COOKIE)?.value);
  if (!sess) redirect('/admin/login');
  const [a] = await db.select({ id: s.admins.id, name: s.admins.name, email: s.admins.email }).from(s.admins).where(eq(s.admins.id, sess.id));
  if (!a) redirect('/admin/login');
  return a;
}

export const int = (v: unknown, min = 0, max = 10_000_000) => {
  const n = Math.round(Number(v));
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw new Error(`ค่าตัวเลขไม่ถูกต้อง (${min}–${max})`);
  return n;
};
export const num = (v: unknown, min = 0, max = 100_000) => {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw new Error(`ค่าตัวเลขไม่ถูกต้อง (${min}–${max})`);
  return Math.round(n * 100) / 100;
};
export const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
