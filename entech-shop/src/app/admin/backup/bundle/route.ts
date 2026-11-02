/** ชุดสำรองครบในไฟล์ ZIP เดียว: ฐานข้อมูล + ข้อมูลแยกส่วน (Excel) + รูปที่อัปโหลด */
import { requireAdmin } from '@/lib/admin';
import { fullBundle, stamp } from '@/lib/backup';
import { download } from '../download';

export const dynamic = 'force-dynamic';
export async function GET() {
  await requireAdmin();
  return download(await fullBundle(), `ENTECH-สำรองข้อมูล-${stamp()}.zip`, 'application/zip');
}
