/* ปรับข้อมูลเฉพาะฐานข้อมูลทดสอบ (data/test.db) ให้มีกรณีสินค้าหมด/สต็อกน้อย */
import { inArray, eq } from 'drizzle-orm';
import { db, schema as s } from '../../src/db';

async function main() {
  if (!String(process.env.DATABASE_URL).includes('test.db')) throw new Error('ใช้กับ data/test.db เท่านั้น');
  await db.update(s.variants).set({ stock: 0 }).where(eq(s.variants.sku, 'PT-140 KU'));
  await db.update(s.variants).set({ stock: 4 }).where(inArray(s.variants.sku, ['CW-5000 G', 'CW-4000 G'])); // CW-5000 G ใช้ทดสอบสั่งพร้อมกัน, CW-4000 G ใช้ทดสอบขีดจำกัดจำนวน
  await db.update(s.variants).set({ stock: 30 }).where(inArray(s.variants.sku, ['PT-20 KG', 'PT-30 KG']));
  console.log('✓ test fixtures');
}
main();
