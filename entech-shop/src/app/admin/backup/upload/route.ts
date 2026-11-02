/** อัปโหลดไฟล์สำรอง (.db) เข้ารายการ — ยังไม่กู้คืนจนกว่าจะกดยืนยันในหน้าสำรองข้อมูล */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { saveUploadedBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  await requireAdmin();
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/backup?${q}`, req.url), 303);
  // กันเว็บอื่นส่งฟอร์มแทนแอดมิน
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host && origin !== new URL(req.url).origin) return back('err=' + encodeURIComponent('คำขอไม่ถูกต้อง'));
  try {
    const f = (await req.formData()).get('file');
    if (!(f instanceof File) || !f.size) throw new Error('กรุณาเลือกไฟล์สำรอง (.db หรือ entech.db จาก ZIP)');
    if (f.size > 500 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกินไป');
    const name = await saveUploadedBackup(new Uint8Array(await f.arrayBuffer()));
    return back('uploaded=' + encodeURIComponent(name));
  } catch (e) {
    return back('err=' + encodeURIComponent((e as Error).message));
  }
}
