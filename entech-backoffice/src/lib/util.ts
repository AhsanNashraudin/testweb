export const nowSec = () => Math.floor(Date.now() / 1000);
/** ข้อผิดพลาดที่แสดงให้ผู้ใช้เห็นได้ (ข้อความภาษาไทย) */
export class BoError extends Error {
  constructor(message: string, public status = 400, public field?: string) { super(message); }
}
/** ชื่อช่องสำหรับข้อความผิดพลาด: [ชื่อ input, ป้ายที่ผู้ใช้เห็น] */
type F = [name: string, label: string];
const bad = (min: number, max: number, f?: F) =>
  new BoError(f ? `${f[1]}: กรอกตัวเลข ${min.toLocaleString('th-TH')}–${max.toLocaleString('th-TH')}` : `ค่าตัวเลขไม่ถูกต้อง (${min}–${max})`, 400, f?.[0]);
export const baht = (n: number) => '฿' + Math.round(n).toLocaleString('th-TH');
export const int = (v: unknown, min = 0, max = 10_000_000, f?: F) => {
  const n = Math.round(Number(v));
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw bad(min, max, f);
  return n;
};
export const num = (v: unknown, min = 0, max = 100_000, f?: F) => {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw bad(min, max, f);
  return Math.round(n * 100) / 100;
};
export const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
