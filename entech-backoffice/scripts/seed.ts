/* ข้อมูลตั้งต้นหลังบ้าน: ผู้ใช้แอดมิน + วัตถุดิบ + ค่าตั้งต้น (รันซ้ำได้ ไม่ทับข้อมูลเดิม)
 * สินค้า (SKU) ไม่ seed ที่นี่ — นำเข้าจากเว็บอัตโนมัติในการซิงค์ครั้งแรก */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '../src/db';
import { dbUrl } from '../src/db/env';
import { ensureFactory } from '../src/lib/factory';

async function main() {
  await ensureFactory();
  await db.insert(s.settings).values([{ key: 'prices_include_vat', value: '0' }]).onConflictDoNothing();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@entech.local';
  const pw = process.env.ADMIN_PASSWORD?.trim();
  if ((process.env.VERCEL || !dbUrl().startsWith('file:')) && !pw) throw new Error('ฐานข้อมูลจริง/Vercel ต้องตั้ง ADMIN_PASSWORD');
  if (pw && pw.length < 8) throw new Error('ADMIN_PASSWORD ต้องยาวอย่างน้อย 8 ตัวอักษร');
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email));
  if (u && pw) {
    await db.update(s.users).set({ passwordHash: await bcrypt.hash(pw, 10) }).where(eq(s.users.id, u.id)); // ตั้งรหัสใหม่แล้ว redeploy = รีเซ็ตรหัสผ่าน
    console.log(`✓ รีเซ็ตรหัสผ่าน ${email}`);
  } else if (!u) {
    await db.insert(s.users).values({ email, name: 'ผู้ดูแลระบบ', passwordHash: await bcrypt.hash(pw || 'Entech@2026', 10) });
    console.log(`✓ สร้างผู้ใช้ ${email}${pw ? '' : ' / Entech@2026 (dev เท่านั้น)'}`);
  }
  console.log('✓ seed หลังบ้านเสร็จ');
}
main().catch((e) => { console.error(e); process.exit(1); });
