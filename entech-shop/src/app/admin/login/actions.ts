'use server';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { COOKIE, signSession } from '@/lib/session';

const DUMMY = '$2b$10$qtPUZ6UiTn.ZUllyNfu0C.CdabjGz5iAyWWqLef2Nvk75rONZQ9ni';
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: unknown, form: FormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const a = attempts.get(ip);
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (a && a.until > Date.now() && a.n >= 8) return { email, error: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาที' };
  const password = String(form.get('password') ?? '');
  const [admin] = await db.select().from(s.admins).where(eq(s.admins.email, email));
  // เทียบ hash เสมอแม้ไม่พบผู้ใช้ เพื่อลด timing attack
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY);
  if (!admin || !ok) {
    attempts.set(ip, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 15 * 60e3 });
    return { email, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }
  attempts.delete(ip);
  const { value, maxAge } = await signSession(admin.id);
  (await cookies()).set(COOKIE, value, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
  const next = String(form.get('next') ?? '');
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin');
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect('/admin/login');
}
