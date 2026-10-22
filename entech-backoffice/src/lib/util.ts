export const nowSec = () => Math.floor(Date.now() / 1000);
/** ข้อผิดพลาดที่แสดงให้ผู้ใช้เห็นได้ (ข้อความภาษาไทย) */
export class BoError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const baht = (n: number) => '฿' + Math.round(n).toLocaleString('th-TH');
export const int = (v: unknown, min = 0, max = 10_000_000) => {
  const n = Math.round(Number(v));
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw new BoError(`ค่าตัวเลขไม่ถูกต้อง (${min}–${max})`);
  return n;
};
export const num = (v: unknown, min = 0, max = 100_000) => {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw new BoError(`ค่าตัวเลขไม่ถูกต้อง (${min}–${max})`);
  return Math.round(n * 100) / 100;
};
export const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
