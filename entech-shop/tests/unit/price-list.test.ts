import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRODUCTS } from '../../scripts/catalog';
import { compareAt, unitPriceFor, vatOf } from '@/lib/pricing';

/** อ่านชีตต้นฉบับ (คัดลอกจาก Google Sheet ของลูกค้า ไม่แก้ไข) แยกจาก price-list.csv เพื่อตรวจไขว้ */
const raw = readFileSync('tests/fixtures/price-list-sheet.txt', 'utf8');
/** แยก CSV 1 บรรทัด (รองรับค่าในเครื่องหมาย " ที่มีจุลภาค) */
const cells = (line: string) => {
  const out: string[] = []; let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  return [...out, cur.trim()];
};
const n = (s: string) => Number(s.replace(/,/g, ''));
const sheet = raw.split('\n').filter((l) => /^ถัง|^ประตู|^วงกบ/.test(l)).map(cells);

const variants = PRODUCTS.flatMap((p) => p.v.map((v) => ({ ...v, product: p.slug })));
const bySku = new Map(variants.map((v) => [v.sku, v]));

describe('ราคาในเว็บตรงกับ Price List ของลูกค้าทุกรายการ', () => {
  const tanks = sheet.filter((r) => r[0].startsWith('ถัง'));
  it('อ่านชีตได้ครบ 44 รุ่นถัง + 4 ประตู + 4 วงกบ', () => {
    expect(tanks).toHaveLength(44);
    expect(sheet.filter((r) => r[0].startsWith('ประตู'))).toHaveLength(4);
    expect(sheet.filter((r) => r[0].startsWith('วงกบ'))).toHaveLength(4);
  });

  it.each(tanks.map((r) => [r[1], n(r[2]), n(r[3]), n(r[4]), n(r[5]), n(r[6]), n(r[7])] as const))(
    '%s: ราคา %d / 5 ใบขึ้นไป %d / mock up +20%% %d,%d / +40%% %d,%d', (code, price, bulk, m20, m20b, m40, m40b) => {
      // "PT-15K , KU" = รุ่นใต้ซิงค์ (KG) และฝังดิน (KU) ราคาเดียวกัน
      const skus = code.includes('K , KU') ? [code.replace('K , KU', ' KG'), code.replace('K , KU', ' KU')] : [code];
      for (const sku of skus) {
        const v = bySku.get(sku);
        expect(v, `ไม่พบ ${sku} ในเว็บ`).toBeDefined();
        expect(v!.price).toBe(price);
        expect(v!.bulkPrice).toBe(bulk);
        expect(v!.bulkMinQty).toBe(5);
        expect(unitPriceFor(v!, 4)).toBe(price);
        expect(unitPriceFor(v!, 5)).toBe(bulk);
      }
      // คอลัมน์ mock up ในชีต = ราคาขาย/ราคาส่ง +20% และ +40% พอดี
      expect([compareAt(price, 20), compareAt(bulk, 20), compareAt(price, 40), compareAt(bulk, 40)]).toEqual([m20, m20b, m40, m40b]);
    });

  it('ประตูทุกรุ่น ทุกขนาด = ราคาบานทึบตามชีต', () => {
    const door = Object.fromEntries(sheet.filter((r) => r[0].startsWith('ประตู')).map((r) => [r[1].split('*')[0], n(r[2])]));
    const doors = variants.filter((v) => /^ET-ED[MP]-/.test(v.sku));
    expect(doors).toHaveLength(20 * 4);
    for (const v of doors) expect(v.price, v.sku).toBe(door[v.sku.split('-').pop()!]);
  });

  it('วงกบทุกขนาด = ราคาตามชีต', () => {
    const frame = Object.fromEntries(sheet.filter((r) => r[0].startsWith('วงกบ')).map((r) => [r[1].split('*')[0], n(r.filter(Boolean).pop()!)]));
    for (const w of ['70', '80', '90', '100']) expect(bySku.get(`ET-FRAME-${w}`)!.price).toBe(frame[w]);
  });

  it('ไม่มี SKU ซ้ำ และสินค้าที่ไม่มีในชีตเป็น "สอบถามราคา" ทั้งหมด', () => {
    expect(new Set(variants.map((v) => v.sku)).size).toBe(variants.length);
    const inSheet = new Set(tanks.flatMap((r) => r[1].includes('K , KU') ? [r[1].replace('K , KU', ' KG'), r[1].replace('K , KU', ' KU')] : [r[1]]));
    for (const v of variants) if (!inSheet.has(v.sku) && !/^ET-(ED[MP]|FRAME)-/.test(v.sku)) expect(v.price, v.sku).toBe(0);
  });

  it('VAT 7% ปัดเป็นบาท', () => {
    expect(vatOf(3200, false)).toBe(224);
    expect(vatOf(3200, true)).toBe(0);
  });
});
