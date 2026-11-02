/** งานตามเวลา สำหรับโฮสต์ที่พักแอปเมื่อไม่มีคนเข้า (Plesk → Scheduled Tasks → Fetch a URL ทุก 15 นาที)
 *  GET /api/cron?key=<CRON_KEY> → เตือนฟอร์มค้าง + สำรองข้อมูลรายวัน (ถ้าถึงเวลา) */
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { checkReminders } from '@/lib/notify';
import { autoBackupIfDue, isFileDb } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const want = process.env.CRON_KEY ?? '';
  const got = new URL(req.url).searchParams.get('key') ?? '';
  if (want.length < 16 || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want)))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const reminded = await checkReminders();
  const backup = isFileDb() && process.env.BACKUP_AUTO !== '0' ? (await autoBackupIfDue())?.name ?? null : null;
  return NextResponse.json({ ok: true, reminded, backup });
}
