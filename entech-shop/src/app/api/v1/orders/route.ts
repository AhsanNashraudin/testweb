/** GET /api/v1/orders — รายการคำสั่งซื้อที่สร้าง/แก้ไขหลังเวลาที่กำหนด (เรียงเก่า → ใหม่ แบ่งหน้าด้วย cursor) */
import { NextResponse } from 'next/server';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema as s } from '@/db';
import { checkKey, fail, orderJson, changedAt } from '@/lib/stock-api';
import { STATUS_TH } from '@/lib/status';

export const dynamic = 'force-dynamic';

const Q = z.object({
  updatedSince: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(Object.keys(STATUS_TH) as [string, ...string[]]).optional(),
  cursor: z.string().regex(/^\d+_\d+$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  const denied = checkKey(req);
  if (denied) return denied;
  try {
    const q = Q.parse(Object.fromEntries(new URL(req.url).searchParams));
    const changed = sql<number>`max(${s.orders.updatedAt}, ${s.orders.createdAt})`;
    const [cTs, cId] = (q.cursor ?? '').split('_').map(Number);
    const rows = await db.select().from(s.orders).where(and(
      q.updatedSince ? sql`${changed} >= ${Math.floor(Date.parse(q.updatedSince) / 1000)}` : undefined,
      q.status ? eq(s.orders.status, q.status as typeof s.orders.$inferSelect.status) : undefined,
      q.cursor ? sql`(${changed} > ${cTs} or (${changed} = ${cTs} and ${s.orders.id} > ${cId}))` : undefined,
    )).orderBy(asc(changed), asc(s.orders.id)).limit(q.limit + 1);
    const page = rows.slice(0, q.limit);
    const items = page.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, page.map((o) => o.id))) : [];
    const last = page.at(-1);
    return NextResponse.json({
      data: page.map((o) => orderJson(o, items.filter((i) => i.orderId === o.id))),
      nextCursor: rows.length > q.limit && last ? `${changedAt(last)}_${last.id}` : null,
    });
  } catch (e) { return fail(e); }
}
