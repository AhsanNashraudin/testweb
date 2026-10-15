import { describe, it, expect } from 'vitest';
import { PROVINCES, isProvince } from '@/lib/provinces';
import { quoteShipping, zoneFee, resolveZone, type Zone } from '@/lib/shipping';

const Z = (o: Partial<Zone>): Zone => ({ id: 1, name: 'Z', method: 'flat', baseFee: 0, perKgFee: 0, includedKg: 0, freeOver: 0, etaText: '', isActive: true, isFallback: false, ...o });
const zones = [
  Z({ id: 1, name: 'สมุทรสาคร', baseFee: 300 }),
  Z({ id: 2, name: 'กทม.', baseFee: 850, freeOver: 30000 }),
  Z({ id: 3, name: 'ภาคกลาง', method: 'weight', baseFee: 1200, includedKg: 30, perKgFee: 15 }),
  Z({ id: 4, name: 'อื่นๆ', method: 'weight', baseFee: 1800, includedKg: 30, perKgFee: 20, isFallback: true }),
];
const map = { สมุทรสาคร: 1, กรุงเทพมหานคร: 2, นนทบุรี: 2, ชลบุรี: 3 };
const pickup = { enabled: true, label: 'รับเองที่โรงงาน', eta: '' };

describe('provinces', () => {
  it('has exactly 77 unique provinces', () => {
    expect(PROVINCES.length).toBe(77);
    expect(new Set(PROVINCES).size).toBe(77);
  });
  it('validates', () => {
    expect(isProvince('ชลบุรี')).toBe(true);
    expect(isProvince('ชลบุรี ')).toBe(false);
    expect(isProvince(undefined)).toBe(false);
  });
});

describe('zoneFee', () => {
  it('flat fee ignores weight', () => expect(zoneFee(zones[0], 1000, 500)).toBe(300));
  it('free over threshold (inclusive)', () => {
    expect(zoneFee(zones[1], 29999, 1)).toBe(850);
    expect(zoneFee(zones[1], 30000, 1)).toBe(0);
  });
  it('weight: within included kg = base', () => expect(zoneFee(zones[2], 0, 30)).toBe(1200));
  it('weight: rounds extra kg up', () => {
    expect(zoneFee(zones[2], 0, 30.1)).toBe(1215);
    expect(zoneFee(zones[2], 0, 45)).toBe(1200 + 15 * 15);
  });
  it('weight: float noise does not add a kg', () => expect(zoneFee(zones[2], 0, 0.1 + 0.2 + 29.7)).toBe(1200));
});

describe('resolveZone / quoteShipping', () => {
  it('maps province to its zone', () => expect(resolveZone('นนทบุรี', zones, map)?.id).toBe(2));
  it('unmapped province falls back', () => expect(resolveZone('เชียงใหม่', zones, map)?.id).toBe(4));
  it('inactive mapped zone falls back', () => {
    const z = zones.map((x) => (x.id === 2 ? { ...x, isActive: false } : x));
    expect(resolveZone('นนทบุรี', z, map)?.id).toBe(4);
  });
  it('no fallback → only pickup', () => {
    const z = zones.filter((x) => !x.isFallback);
    const o = quoteShipping({ province: 'เชียงใหม่', subtotal: 1000, weightKg: 10, zones: z, provinceZone: map, pickup });
    expect(o.map((x) => x.id)).toEqual(['pickup']);
  });
  it('returns delivery + pickup with fee', () => {
    const o = quoteShipping({ province: 'ชลบุรี', subtotal: 5000, weightKg: 50, zones, provinceZone: map, pickup });
    expect(o).toHaveLength(2);
    expect(o[0]).toMatchObject({ id: 'zone:3', fee: 1500, isFree: false });
    expect(o[1]).toMatchObject({ id: 'pickup', fee: 0 });
  });
  it('negative weight treated as 0', () => {
    const o = quoteShipping({ province: 'ชลบุรี', subtotal: 0, weightKg: -5, zones, provinceZone: map });
    expect(o[0].fee).toBe(1200);
  });
});
