export const baht = (n: number) => '฿' + Math.round(n).toLocaleString('th-TH');

/** ตารางสเปกแบบข้อความ: บรรทัดแรก = หัวตาราง, คั่นคอลัมน์ด้วย | */
export function parseSpecs(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((c) => c.trim()));
  return lines.length >= 2 ? { head: lines[0], rows: lines.slice(1) } : null;
}
