import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';

/** รูปที่อัปโหลดจากหลังบ้าน — id ไม่ซ้ำและไม่เปลี่ยนเนื้อหา จึง cache ได้ยาว */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response('Not found', { status: 404 });
  const [m] = await db.select().from(s.media).where(eq(s.media.id, id));
  if (!m) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(m.data, 'base64'), {
    headers: { 'Content-Type': m.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
