/** วัตถุดิบ + สูตรการผลิตตั้งต้น (เพิ่มเฉพาะที่ยังไม่มี ไม่แตะยอดที่นับจริงแล้ว)
 *  ⚠ อัตราใช้ต่อใบประมาณจากน้ำหนักถัง ต้องให้โรงงานยืนยันก่อนใช้งานจริง */
import { db, schema as s } from '@/db';

export const MATERIALS = [
  { sku: 'RM-LLDPE', name: 'ผงพลาสติก LLDPE', unit: 'กก.', reorderPoint: 2000, cost: 52 },
  { sku: 'RM-MB-BLUE', name: 'สีผสม (Masterbatch) ฟ้า', unit: 'กก.', reorderPoint: 50, cost: 180 },
  { sku: 'RM-LID', name: 'ฝาถังพร้อมขอบ', unit: 'ชิ้น', reorderPoint: 100, cost: 85 },
  { sku: 'RM-FIT', name: 'ชุดข้อต่อ/ลูกลอย', unit: 'ชุด', reorderPoint: 100, cost: 120 },
];
// ผลิตเองเฉพาะถัง PE (โรโตโมลด์) · ไฟเบอร์กลาส/ประตู/กระถาง ใช้สูตรอื่น ตั้งภายหลัง
const MADE_HERE = ['water-tanks', 'septic-tanks', 'grease-traps'];

/** น้ำหนักถัง: ใช้ค่าจริงถ้ามี ไม่มีประมาณจากความจุ (ถัง PE ≈ 28 กก. ต่อ 1,000 ลิตร) */
export function tankKg(v: { weightKg: number; variantName: string; productName: string }) {
  if (v.weightKg > 0) return v.weightKg;
  const m = /([\d,]+)\s*(?:ลิตร|L\b)/i.exec(`${v.variantName} ${v.productName}`);
  return m ? Math.round(Number(m[1].replace(/,/g, '')) * 0.028 * 10) / 10 : 0;
}

export async function ensureFactory() {
  await db.insert(s.materials).values(MATERIALS).onConflictDoNothing();
  const mats = Object.fromEntries((await db.select().from(s.materials)).map((m) => [m.sku, m.id]));
  const withBom = new Set((await db.select({ v: s.bom.itemId }).from(s.bom)).map((b) => b.v));
  const items = (await db.select().from(s.items)).map((v) => ({ ...v, kg: tankKg(v) })).filter((v) => v.kg > 0 && MADE_HERE.includes(v.category) && !withBom.has(v.id));
  const rows = items.flatMap((v) => [
    { itemId: v.id, materialId: mats['RM-LLDPE'], qtyPer: Math.round(v.kg * 1.05 * 100) / 100 }, // เผื่อเศษ 5%
    { itemId: v.id, materialId: mats['RM-MB-BLUE'], qtyPer: Math.round(v.kg * 0.02 * 100) / 100 },
    { itemId: v.id, materialId: mats['RM-LID'], qtyPer: 1 },
    { itemId: v.id, materialId: mats['RM-FIT'], qtyPer: 1 },
  ]);
  for (let i = 0; i < rows.length; i += 200) await db.insert(s.bom).values(rows.slice(i, i + 200));
  return items.length;
}
