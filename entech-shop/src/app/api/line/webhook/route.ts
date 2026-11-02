/** LINE webhook — ใช้หา "LINE ID" ของคน/กลุ่มที่จะรับแจ้งเตือน
 *  เพิ่มบอทเข้ากลุ่ม → บอทตอบ ID ของกลุ่มให้ทันที · หรือพิมพ์ "id" ในแชทกับบอท/ในกลุ่ม */
import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

type Ev = { type: string; replyToken?: string; message?: { type: string; text?: string }; source?: { type: string; userId?: string; groupId?: string; roomId?: string } };

export async function POST(req: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET, token = process.env.LINE_CHANNEL_TOKEN;
  const raw = await req.text();
  const sig = Buffer.from(req.headers.get('x-line-signature') ?? '');
  const want = Buffer.from(secret ? createHmac('sha256', secret).update(raw).digest('base64') : '');
  if (!secret || !token || sig.length !== want.length || !timingSafeEqual(sig, want)) return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  const { events = [] } = JSON.parse(raw) as { events?: Ev[] };
  for (const e of events) {
    const asked = e.type === 'join' || (e.type === 'message' && /^\s*(id|ไอดี)\s*$/i.test(e.message?.text ?? ''));
    if (!asked || !e.replyToken || !e.source) continue;
    const src = e.source;
    const id = src.groupId ?? src.roomId ?? src.userId;
    const what = src.groupId ? 'กลุ่มนี้' : src.roomId ? 'ห้องนี้' : 'คุณ';
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyToken: e.replyToken, messages: [{ type: 'text', text: `LINE ID ของ${what}:\n${id}\n\nคัดลอกไปวางในหลังบ้านเว็บ → ทีมขาย & แจ้งเตือน` }] }),
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
