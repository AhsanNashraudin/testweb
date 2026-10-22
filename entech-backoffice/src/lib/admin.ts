import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { COOKIE, verifySession } from './session';

/** ตรวจสิทธิ์ซ้ำในทุก server action/page (อย่าพึ่ง middleware อย่างเดียว) */
export async function requireUser() {
  const sess = await verifySession((await cookies()).get(COOKIE)?.value);
  if (!sess) redirect('/login');
  const [u] = await db.select({ id: s.users.id, name: s.users.name, email: s.users.email }).from(s.users).where(eq(s.users.id, sess.id));
  if (!u) redirect('/login');
  return u;
}
