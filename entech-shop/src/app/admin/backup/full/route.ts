/** ดาวน์โหลดฐานข้อมูลทั้งระบบ ณ ตอนนี้ (.db) */
import { requireAdmin } from '@/lib/admin';
import { freshDbFile, stamp } from '@/lib/backup';
import { download } from '../download';

export const dynamic = 'force-dynamic';
export async function GET() {
  await requireAdmin();
  return download(await freshDbFile(), `entech-backup-${stamp()}.db`, 'application/octet-stream');
}
