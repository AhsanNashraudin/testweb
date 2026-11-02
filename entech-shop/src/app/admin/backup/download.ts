import { NextResponse } from 'next/server';

/** ส่งไฟล์ให้เบราว์เซอร์ดาวน์โหลด (ชื่อไฟล์ภาษาไทยได้) — ไม่ cache เพราะมีข้อมูลลูกค้า */
export const download = (data: Buffer | string, filename: string, type: string) =>
  new NextResponse(typeof data === 'string' ? data : new Uint8Array(data), { headers: {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
  } });
