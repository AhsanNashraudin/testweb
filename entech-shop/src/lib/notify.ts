/** แจ้งเตือน LINE ตามระดับ + มอบหมายผู้ดูแลลูกค้า (เวียนคิว) สำหรับฟอร์มขอใบเสนอราคา/ติดต่อ และคำสั่งซื้อใหม่
 *
 *  ระดับ 1 ผู้ดูแลลูกค้า (พนักงานขาย) — ได้รับเฉพาะรายที่ระบบเวียนคิวมอบหมายให้ (กรองตามหัวข้อที่ดูแลได้)
 *  ระดับ 2 หัวหน้าฝ่ายขาย          — ได้รับทุกรายการ + ผู้ที่ถูกมอบหมาย · คำสั่งซื้อใหม่ · เตือนเมื่อยังไม่มีใครรับเรื่อง
 *  ระดับ 3 ผู้บริหาร                — คำสั่งซื้อใหม่ · ยกระดับเมื่อลูกค้ารอนานเกินกำหนด
 *
 *  ใช้ LINE Messaging API (LINE Notify ปิดบริการแล้ว) — โทเคนเก็บใน env LINE_CHANNEL_TOKEN ไม่เก็บในฐานข้อมูล */
import 'server-only';
import { and, eq, lt } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { SITE_URL } from '@/lib/site';

export const LEVELS = { sales: 'ระดับ 1 · ผู้ดูแลลูกค้า (เซลล์)', lead: 'ระดับ 2 · หัวหน้าฝ่ายขาย', exec: 'ระดับ 3 · ผู้บริหาร' } as const;
export type Level = keyof typeof LEVELS;
export type Member = { id: string; name: string; lineId: string; level: Level; topics: string[]; active: boolean };
export type NotifyCfg = { team: Member[]; remindHours: number; escalateHours: number; orders: boolean; rr: number };
export const DEFAULT_NOTIFY: NotifyCfg = { team: [], remindHours: 2, escalateHours: 24, orders: true, rr: 0 };

export async function getNotify(): Promise<NotifyCfg> {
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, 'notify'));
  try { return { ...DEFAULT_NOTIFY, ...(row ? JSON.parse(row.value) : {}) }; } catch { return DEFAULT_NOTIFY; }
}
export async function saveNotify(cfg: NotifyCfg) {
  const value = JSON.stringify(cfg);
  await db.insert(s.settings).values({ key: 'notify', value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
}

export const lineReady = () => !!process.env.LINE_CHANNEL_TOKEN;
export const isLineId = (v: string) => /^[UCR][0-9a-f]{32}$/.test(v);

/** ส่งข้อความ LINE ทีละปลายทาง — ไม่ throw (แจ้งเตือนล้มเหลวต้องไม่ทำให้ลูกค้าส่งฟอร์มไม่ผ่าน) */
export async function pushLine(to: string[], text: string): Promise<{ sent: number; err?: string }> {
  const token = process.env.LINE_CHANNEL_TOKEN;
  const ids = [...new Set(to.filter(isLineId))];
  if (!token || !ids.length) return { sent: 0, err: token ? 'ไม่มี LINE ID ที่ถูกต้อง' : 'ยังไม่ได้ตั้งค่า LINE_CHANNEL_TOKEN' };
  let sent = 0, err: string | undefined;
  for (const id of ids) {
    try {
      const r = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: id, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
      });
      if (r.ok) sent++; else err = `LINE ตอบกลับ ${r.status}: ${(await r.text()).slice(0, 200)}`;
    } catch (e) { err = (e as Error).message; }
  }
  if (err) console.error('✗ แจ้งเตือน LINE:', err);
  return { sent, err };
}

const ids = (team: Member[], level: Level) => team.filter((m) => m.active && m.level === level).map((m) => m.lineId);
const hours = (ms: number) => `${Math.max(1, Math.round(ms / 3600_000))} ชม.`;
const quoteText = (q: typeof s.quotes.$inferSelect) =>
  `👤 ${q.name}${q.company ? ` (${q.company})` : ''}\n📞 ${q.phone}${q.province ? `\n📍 ${q.province}` : ''}\n📝 ${q.topic}${q.detail ? `\n${q.detail.slice(0, 400)}` : ''}\n🔗 ${SITE_URL}/admin/quotes#q-${q.id}`;

/** เลือกผู้ดูแลแบบเวียนคิว จากเซลล์ที่เปิดใช้และดูแลหัวข้อนี้ (ไม่ได้เลือกหัวข้อ = ดูแลทุกหัวข้อ) */
export function pickAssignee(cfg: NotifyCfg, topic: string): Member | undefined {
  const pool = cfg.team.filter((m) => m.active && m.level === 'sales' && (!m.topics.length || m.topics.includes(topic)));
  if (!pool.length) return undefined;
  const m = pool[cfg.rr % pool.length];
  cfg.rr = (cfg.rr + 1) % 1_000_000;
  return m;
}

/** ลูกค้าส่งฟอร์มใหม่ → มอบหมายผู้ดูแล → แจ้งผู้ดูแล (ระดับ 1) และหัวหน้า (ระดับ 2) */
export async function onNewQuote(id: number) {
  const [q] = await db.select().from(s.quotes).where(eq(s.quotes.id, id));
  if (!q) return;
  const cfg = await getNotify();
  const who = q.assignee ? cfg.team.find((m) => m.id === q.assignee) : pickAssignee(cfg, q.topic);
  if (who && !q.assignee) {
    await db.update(s.quotes).set({ assignee: who.id, updatedAt: Date.now() }).where(eq(s.quotes.id, id));
    await saveNotify(cfg); // บันทึกตำแหน่งคิว
  }
  const body = quoteText(q);
  if (who) await pushLine([who.lineId], `🔔 ลูกค้าใหม่ — มอบหมายให้คุณ${who.name ? ` (${who.name})` : ''}\nกรุณาติดต่อกลับภายใน ${cfg.remindHours} ชม.\n\n${body}`);
  await pushLine(ids(cfg.team, 'lead'), `📥 ฟอร์มใหม่ #${q.id} → ${who ? `ผู้ดูแล: ${who.name}` : '⚠ ยังไม่มีผู้ดูแล (กรุณามอบหมาย)'}\n\n${body}`);
}

/** แอดมินเปลี่ยนผู้ดูแลเอง → แจ้งคนใหม่ */
export async function onReassign(id: number) {
  const [q] = await db.select().from(s.quotes).where(eq(s.quotes.id, id));
  const cfg = await getNotify();
  const who = cfg.team.find((m) => m.id === q?.assignee);
  if (q && who) await pushLine([who.lineId], `🔔 มอบหมายลูกค้าให้คุณ (${who.name})\n\n${quoteText(q)}`);
}

export async function onNewOrder(o: { code: string; name: string; phone: string; province: string; total: number; paymentMethod: string }) {
  const cfg = await getNotify();
  if (!cfg.orders) return;
  const text = `🛒 คำสั่งซื้อใหม่ ${o.code}\n👤 ${o.name} · ${o.phone}\n📍 ${o.province || 'รับเองที่โรงงาน'}\n💰 ${o.total.toLocaleString('th-TH')} บาท (${o.paymentMethod === 'transfer' ? 'โอนธนาคาร' : 'PromptPay'})\n🔗 ${SITE_URL}/admin/orders`;
  await pushLine([...ids(cfg.team, 'lead'), ...ids(cfg.team, 'exec')], text);
}

/** เตือนตามเวลา: ยังเป็น "ใหม่" เกิน remindHours → เตือนผู้ดูแล+หัวหน้า · เกิน escalateHours → แจ้งผู้บริหาร */
export async function checkReminders(now = Date.now()) {
  const cfg = await getNotify();
  if (!cfg.team.length) return 0;
  const rows = await db.select().from(s.quotes)
    .where(and(eq(s.quotes.status, 'new'), lt(s.quotes.remindLevel, 2), lt(s.quotes.createdAt, new Date(now - cfg.remindHours * 3600_000))));
  let n = 0;
  for (const q of rows) {
    const age = now - q.createdAt.getTime();
    const who = cfg.team.find((m) => m.id === q.assignee);
    if (q.remindLevel < 1) {
      await pushLine([who?.lineId ?? '', ...ids(cfg.team, 'lead')], `⏰ ลูกค้ารอ ${hours(age)} ยังไม่มีการติดต่อกลับ\nผู้ดูแล: ${who?.name ?? 'ยังไม่มี'}\n\n${quoteText(q)}`);
      await db.update(s.quotes).set({ remindLevel: 1 }).where(eq(s.quotes.id, q.id));
      n++;
    } else if (age >= cfg.escalateHours * 3600_000) {
      await pushLine([...ids(cfg.team, 'exec'), ...ids(cfg.team, 'lead')], `🚨 ยกระดับ: ลูกค้ารอ ${hours(age)} ยังไม่มีการติดต่อกลับ\nผู้ดูแล: ${who?.name ?? 'ยังไม่มี'}\n\n${quoteText(q)}`);
      await db.update(s.quotes).set({ remindLevel: 2 }).where(eq(s.quotes.id, q.id));
      n++;
    }
  }
  return n;
}
