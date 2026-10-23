/** กฎงานหลังบ้านที่ไม่แตะฐานข้อมูล (ทดสอบใน tests/unit/backoffice.test.ts) */

export const STAGES = ['received', 'approval', 'production', 'packing', 'billing', 'payment', 'done'] as const;
export type Stage = (typeof STAGES)[number] | 'cancelled';

export const STAGE_TH: Record<Stage, string> = {
  received: 'รับออเดอร์', approval: 'อนุมัติ', production: 'ผลิต', packing: 'แพ็ค/ส่ง', billing: 'ออกบิล', payment: 'รับเงิน', done: 'จบงาน', cancelled: 'ยกเลิก',
};
/** ใครถืองานในแต่ละขั้น (ค่าเริ่มต้นเมื่อไม่ได้ระบุผู้รับผิดชอบ) */
export const STAGE_OWNER: Record<Stage, string> = {
  received: 'ฝ่ายขาย', approval: 'หัวหน้าฝ่ายขาย', production: 'โรงงาน', packing: 'คลังสินค้า', billing: 'บัญชี', payment: 'บัญชี', done: '', cancelled: '',
};
/** เวลาที่ยอมให้อยู่ในแต่ละขั้น (ชั่วโมง) · shortcut: ค่าคงที่ในโค้ด, ย้ายไปหน้าตั้งค่าเมื่อลูกค้าต้องการปรับเอง */
export const SLA_HOURS: Record<Stage, number> = { received: 24, approval: 24, production: 72, packing: 24, billing: 24, payment: 72, done: 0, cancelled: 0 };

/** ส่วนลดสูงสุดที่เซลล์ให้ได้เอง (%) เกินนี้ออเดอร์ต้องผ่านหัวหน้าอนุมัติ */
export const MAX_SALES_DISCOUNT = 5;

/** ขั้นถัดไป: ข้ามอนุมัติ (เข้าเฉพาะตอนสร้างจากใบเสนอราคาที่ส่วนลดเกิน), ข้ามผลิตถ้าไม่มีใบสั่งผลิตค้าง, ข้ามรับเงินถ้าจ่ายแล้ว */
export function nextStage(cur: Stage, ctx: { openMOs: number; paid: boolean }): Stage | null {
  if (cur === 'done' || cur === 'cancelled') return null;
  for (let i = STAGES.indexOf(cur) + 1; i < STAGES.length; i++) {
    const st = STAGES[i];
    if (st === 'approval') continue;
    if (st === 'production' && ctx.openMOs === 0) continue;
    if (st === 'payment' && ctx.paid) continue;
    return st;
  }
  return null;
}

/** SLA ของขั้นปัจจุบัน (ชั่วโมง): รับเงิน = ตามเครดิต, ผลิต = ตามกำหนดเสร็จของใบสั่งผลิต */
export function slaHours(stage: Stage, creditDays: number, moDueHours?: number) {
  if (stage === 'payment' && creditDays > 0) return creditDays * 24;
  if (stage === 'production' && moDueHours) return moDueHours;
  return SLA_HOURS[stage];
}

export function lateBy(stageSince: number, now: number, sla: number) {
  if (!sla) return 0;
  return Math.max(0, now - stageSince - sla * 3600);
}

export function durationTh(sec: number) {
  if (sec < 3600) return `${Math.max(1, Math.round(sec / 60))} นาที`;
  if (sec < 86400) return `${Math.round(sec / 3600)} ชม.`;
  return `${Math.floor(sec / 86400)} วัน`;
}

/** วัตถุดิบที่ขาดสำหรับผลิต qty ใบ */
export function shortages(bomLines: { materialId: number; name: string; unit: string; qtyPer: number; stock: number }[], qty: number) {
  return bomLines
    .map((b) => ({ ...b, need: Math.round(b.qtyPer * qty * 100) / 100 }))
    .filter((b) => b.need > b.stock)
    .map((b) => ({ materialId: b.materialId, name: b.name, unit: b.unit, need: b.need, short: Math.round((b.need - b.stock) * 100) / 100 }));
}

/** ยอดใบเสนอราคา (ราคาในระบบยังไม่รวม VAT ตาม Price List) */
export function quoteTotals(lines: { qty: number; unitPrice: number }[], discountPct: number, pricesIncludeVat: boolean) {
  const subtotal = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const discount = Math.round((subtotal * discountPct) / 100);
  const after = subtotal - discount;
  const vat = pricesIncludeVat ? 0 : Math.round(after * 0.07);
  return { subtotal, discount, vat, total: after + vat };
}

/** แยก VAT ออกจากยอดรวม เพื่อออกใบกำกับภาษี */
export function splitVat(total: number, vatAdded: number) {
  const vat = vatAdded > 0 ? vatAdded : Math.round((total * 7) / 107);
  return { subtotal: total - vat, vat };
}

export type AgingBucket = 'current' | 'd30' | 'd60' | 'd90';
export const AGING_TH: Record<AgingBucket, string> = { current: 'ยังไม่ครบกำหนด', d30: '1–30 วัน', d60: '31–60 วัน', d90: 'เกิน 60 วัน' };
export function agingBucket(dueAt: number, now: number): AgingBucket {
  const days = Math.floor((now - dueAt) / 86400);
  return days <= 0 ? 'current' : days <= 30 ? 'd30' : days <= 60 ? 'd60' : 'd90';
}

/** เลขเอกสาร PREFIX-ปปดด-ลำดับ (ลำดับเริ่มใหม่ทุกเดือน, ปี พ.ศ. 2 หลัก) */
export function docHead(prefix: string, now: Date) {
  const th = new Date(now.getTime() + 7 * 3600e3);
  return `${prefix}-${String((th.getUTCFullYear() + 543) % 100).padStart(2, '0')}${String(th.getUTCMonth() + 1).padStart(2, '0')}-`;
}
export function docCode(prefix: string, now: Date, lastCode: string | undefined) {
  const head = docHead(prefix, now);
  const seq = lastCode?.startsWith(head) ? Number(lastCode.slice(head.length)) + 1 : 1;
  return head + String(seq).padStart(4, '0');
}
