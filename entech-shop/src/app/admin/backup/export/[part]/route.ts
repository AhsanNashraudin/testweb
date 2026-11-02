/** ส่งออกข้อมูลแยกส่วน: products · orders · order-items · quotes · articles · settings · media */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { PARTS, exportPart, mediaEntries, stamp, type Part } from '@/lib/backup';
import { zip } from '@/lib/zip';
import { download } from '../../download';

export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ part: string }> }) {
  await requireAdmin();
  const part = (await params).part as Part;
  if (!Object.hasOwn(PARTS, part)) return new NextResponse('ไม่พบข้อมูลส่วนนี้', { status: 404 });
  const name = `${stamp()}-${PARTS[part].file}`;
  if (part === 'media') return download(zip(await mediaEntries()), name, 'application/zip');
  const body = await exportPart(part);
  return download(body, name, part === 'settings' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8');
}
