/* สินค้าทดสอบ (แทนการนำเข้าจากเว็บ) */
import { db, schema as s } from '../../src/db';

async function main() {
  await db.insert(s.items).values([
  { sku: 'ND-550 G', productCode: 'water-tank-nd', productName: 'ถังเก็บน้ำ ND สีเทา', variantName: '550 ลิตร', category: 'water-tanks', price: 2150, stock: 100, weightKg: 0 },
  { sku: 'CW-1000', productCode: 'water-tank-cw-blue', productName: 'ถังเก็บน้ำบนดิน CW สีฟ้า', variantName: '1000 ลิตร', category: 'water-tanks', price: 3200, bulkPrice: 3000, bulkMinQty: 5, stock: 20, weightKg: 0 },
]);
  console.log('✓ test items');
}
main().catch((e) => { console.error(e); process.exit(1); });
