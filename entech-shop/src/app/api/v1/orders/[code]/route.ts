/** GET   /api/v1/orders/{code} — คำสั่งซื้อเดียว
 *  PATCH /api/v1/orders/{code} — อัปเดตสถานะ/เลขพัสดุจากระบบสต็อก (ยกเลิก = คืนสต็อกอัตโนมัติ) */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema as s } from '@/db';
import { readJson } from '@/lib/api';
import { updateOrder } from '@/lib/orders';
import { checkKey, fail, orderJson } from '@/lib/stock-api';
import { STATUS_TH } from '@/lib/status';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ code: string }> };

async function load(code: string) {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.code, code));
  return o;
}
const notFound = () => NextResponse.json({ error: 'not_found' }, { status: 404 });

export async function GET(req: Request, { params }: Ctx) {
  const denied = checkKey(req);
  if (denied) return denied;
  try {
    const o = await load((await params).code);
    if (!o) return notFound();
    return NextResponse.json({ data: orderJson(o, await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id))) });
  } catch (e) { return fail(e); }
}

const Patch = z.strictObject({
  status: z.enum(Object.keys(STATUS_TH) as [string, ...string[]]).optional(),
  carrier: z.string().max(80).optional(),
  trackingNo: z.string().max(80).optional(),
  trackingUrl: z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(500)]).optional(),
}).refine((p) => Object.keys(p).length > 0, 'ต้องส่งอย่างน้อย 1 ช่อง');

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = checkKey(req);
  if (denied) return denied;
  try {
    const o = await load((await params).code);
    if (!o) return notFound();
    const r = await updateOrder(o.id, Patch.parse(await readJson(req, 10_000)));
    revalidatePath('/admin', 'layout');
    return NextResponse.json({ data: orderJson(r, await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id))) });
  } catch (e) { return fail(e); }
}
