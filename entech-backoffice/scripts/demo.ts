/* ข้อมูลตัวอย่างหลังบ้าน (ฐานข้อมูลในเครื่องเท่านั้น) — npm run db:demo
 * ต้องมีสินค้าแล้ว: เปิดเว็บไซต์ในเครื่องแล้วกด "ซิงค์ตอนนี้" หรือรัน script นี้ (นำเข้าให้เอง) */
import { eq, inArray, sql } from 'drizzle-orm';
import { db, schema as s } from '../src/db';
import { importItems } from '../src/lib/sync';
import { ensureFactory } from '../src/lib/factory';

async function main() {
  if (!String(process.env.DATABASE_URL ?? 'file:').startsWith('file:')) throw new Error('ใช้กับฐานข้อมูลในเครื่องเท่านั้น');
  if (!(await db.select().from(s.items).limit(1)).length) console.log('นำเข้าสินค้า', await importItems());
  await ensureFactory();
  const now = Math.floor(Date.now() / 1000); const H = 3600, D = 86400;
  await db.update(s.materials).set({ stock: 1800 }).where(eq(s.materials.sku, 'RM-LLDPE'));
  await db.update(s.materials).set({ stock: 140 }).where(eq(s.materials.sku, 'RM-MB-BLUE'));
  await db.update(s.materials).set({ stock: 260 }).where(inArray(s.materials.sku, ['RM-LID', 'RM-FIT']));
  await db.update(s.items).set({ reorderPoint: 5 }).where(sql`${s.items.price} > 0`);
  const pick = await db.select().from(s.items).where(inArray(s.items.sku, ['CW-1000', 'CW-2000', 'CW-3000', 'PT-600 T', 'CW-700']));
  const by = Object.fromEntries(pick.map((v) => [v.sku, v]));
  if (pick.length < 5) throw new Error('ไม่พบ SKU ตัวอย่าง (CW-1000 …) — นำเข้าสินค้าจากเว็บก่อน');
  await db.update(s.items).set({ stock: 2 }).where(eq(s.items.sku, 'CW-3000'));
  await db.update(s.items).set({ stock: 0 }).where(eq(s.items.sku, 'PT-600 T'));
  const mk = async (code: string, name: string, channel: 'web' | 'sales', stage: typeof s.orders.$inferInsert.stage, ago: number, sku: string, qty: number, status: typeof s.orders.$inferInsert.status, assignee = '', creditDays = 0) => {
    const v = by[sku]; const sub = v.price * qty; const vat = Math.round(sub * 0.07);
    const [o] = await db.insert(s.orders).values({ code, name, phone: '0812345678', email: 'buyer@example.com', province: 'ชลบุรี', shippingLabel: 'รถบริษัท', status, subtotal: sub, vat, total: sub + vat, channel, stage, stageAt: now - ago, assignee, creditDays, taxName: name, taxId: '0105556012345', createdAt: now - ago - 2 * H, paidAt: ['paid', 'completed'].includes(status) ? now - ago : 0 }).returning();
    await db.insert(s.orderItems).values({ orderId: o.id, itemId: v.id, productName: v.productName, variantName: v.variantName, sku, unitPrice: v.price, qty });
    await db.insert(s.orderEvents).values({ orderId: o.id, stage: 'received', note: 'สร้างออเดอร์ (ข้อมูลตัวอย่าง)', by: 'ระบบ', at: now - ago - 2 * H });
    return o;
  };
  const o1 = await mk('SO-DEMO-0018', 'บจก.สยามวัสดุก่อสร้าง', 'sales', 'production', 5 * D, 'CW-3000', 10, 'preparing', 'ช่างสมศักดิ์', 30);
  await mk('SO-DEMO-0022', 'บจก.เอบีซี เทรดดิ้ง', 'sales', 'approval', 2 * D, 'CW-2000', 20, 'pending_payment');
  await mk('ET-DEMO-0021', 'คุณมาลี ศรีสุข', 'sales', 'packing', 4 * H, 'CW-1000', 1, 'paid', 'น้อย');
  await mk('ET-DEMO-0019', 'หจก.เจริญการช่าง', 'sales', 'billing', 6 * H, 'CW-700', 2, 'shipping');
  const o15 = await mk('SO-DEMO-0015', 'หจก.ไทยเทค', 'sales', 'payment', 6 * D, 'CW-2000', 6, 'shipping', '', 30);
  const o11 = await mk('SO-DEMO-0011', 'บจก.รุ่งเรืองวัสดุ', 'sales', 'payment', 34 * D, 'CW-1000', 15, 'shipping', '', 30);
  const o9 = await mk('SO-DEMO-0009', 'บจก.เกษตรรุ่งเรือง', 'sales', 'done', 9 * D, 'CW-700', 3, 'completed');
  const inv = (code: string, o: typeof o9, issued: number, paid: number, etax: 'pending' | 'sent' | 'certified' | 'failed', receipt = '', etaxNote = '') =>
    db.insert(s.invoices).values({ code, orderId: o.id, buyerName: o.name, buyerTaxId: '0105556012345', buyerEmail: o.email, subtotal: o.total - o.vat, vat: o.vat, total: o.total, issuedAt: now - issued, dueAt: now - issued + o.creditDays * D, paidAt: paid ? now - paid : 0, receiptCode: receipt, etaxStatus: etax, etaxNote });
  await inv('INV-DEMO-0001', o11, 34 * D, 0, 'certified');
  await inv('INV-DEMO-0002', o15, 6 * D, 0, 'failed', '', 'อีเมลผู้ซื้อตีกลับ');
  await inv('INV-DEMO-0003', o9, 9 * D, 9 * D, 'certified', 'RC-DEMO-0001');
  const mo = (code: string, sku: string, qty: number, status: typeof s.productionOrders.$inferInsert.status, extra: Partial<typeof s.productionOrders.$inferInsert> = {}) =>
    db.insert(s.productionOrders).values({ code, itemId: by[sku].id, qty, status, createdAt: now - 3 * D, updatedAt: now, dueAt: now + 2 * D, ...extra });
  await mo('MO-DEMO-01', 'CW-3000', 10, 'in_progress', { orderId: o1.id, goodQty: 3, rejectQty: 1, line: 'แม่พิมพ์ 2', assignee: 'ช่างสมศักดิ์', dueAt: now - 2 * D, note: 'ไม่ผ่าน 1 ใบ (รั่วซึม)' });
  await mo('MO-DEMO-02', 'PT-600 T', 20, 'waiting', { note: 'ผงพลาสติก LLDPE ขาด 220 กก.' });
  await mo('MO-DEMO-03', 'CW-2000', 8, 'queued', { line: 'แม่พิมพ์ 1', assignee: 'ช่างชัยวัฒน์' });
  await mo('MO-DEMO-04', 'CW-1000', 12, 'qc', { goodQty: 12, line: 'แม่พิมพ์ 3', assignee: 'QC: วิไล' });
  await mo('MO-DEMO-05', 'CW-700', 30, 'done', { goodQty: 30 });
  await db.insert(s.quotes).values({ code: 'QT-DEMO-0031', name: 'คุณวิชัย', company: 'บจก.บ้านสวยพร็อพเพอร์ตี้', phone: '0891112222', province: 'นนทบุรี', topic: 'ถังบำบัด + ถังเก็บน้ำ โครงการ 40 หลัง', status: 'sent', salesperson: 'เซลล์: ปิยะ', createdAt: now - 1 * D });
  console.log('✓ ข้อมูลตัวอย่างหลังบ้าน');
}
main().catch((e) => { console.error(e); process.exit(1); });
