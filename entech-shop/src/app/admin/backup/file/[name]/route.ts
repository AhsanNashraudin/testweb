/** ดาวน์โหลดไฟล์สำรองที่เก็บไว้บนเซิร์ฟเวอร์ */
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { backupPath } from '@/lib/backup';
import { download } from '../../download';

export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  await requireAdmin();
  const name = decodeURIComponent((await params).name);
  try {
    return download(await readFile(backupPath(name)), name, 'application/octet-stream');
  } catch {
    return new NextResponse('ไม่พบไฟล์สำรอง', { status: 404 });
  }
}
