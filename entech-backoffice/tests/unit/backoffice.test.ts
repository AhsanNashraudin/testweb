import { describe, expect, it } from 'vitest';
import { agingBucket, docCode, lateBy, nextStage, quoteTotals, shortages, splitVat } from '@/lib/backoffice-rules';

describe('nextStage', () => {
  it('ข้ามผลิตเมื่อไม่มีใบสั่งผลิต และข้ามรับเงินเมื่อจ่ายแล้ว', () => {
    expect(nextStage('received', { openMOs: 0, paid: true })).toBe('packing');
    expect(nextStage('billing', { openMOs: 0, paid: true })).toBe('done');
    expect(nextStage('billing', { openMOs: 0, paid: false })).toBe('payment');
  });
  it('เข้าผลิตเมื่อมีใบสั่งผลิตค้าง และอนุมัติไม่ถูกเลือกจากการกดถัดไป', () => {
    expect(nextStage('received', { openMOs: 2, paid: false })).toBe('production');
    expect(nextStage('approval', { openMOs: 0, paid: false })).toBe('packing');
  });
  it('จบงาน/ยกเลิกแล้วไปต่อไม่ได้', () => {
    expect(nextStage('done', { openMOs: 0, paid: true })).toBeNull();
    expect(nextStage('cancelled', { openMOs: 0, paid: true })).toBeNull();
  });
});

it('lateBy นับเฉพาะส่วนที่เกิน SLA', () => {
  expect(lateBy(0, 3600 * 10, 24)).toBe(0);
  expect(lateBy(0, 3600 * 30, 24)).toBe(3600 * 6);
  expect(lateBy(0, 3600 * 30, 0)).toBe(0);
});

it('shortages คืนเฉพาะวัตถุดิบที่ไม่พอ', () => {
  const b = [{ materialId: 1, name: 'LLDPE', unit: 'กก.', qtyPer: 41.2, stock: 300 }, { materialId: 2, name: 'ฝา', unit: 'ชิ้น', qtyPer: 1, stock: 50 }];
  expect(shortages(b, 10)).toEqual([{ materialId: 1, name: 'LLDPE', unit: 'กก.', need: 412, short: 112 }]);
  expect(shortages(b, 5)).toEqual([]);
});

it('quoteTotals คิดส่วนลดก่อน VAT', () => {
  expect(quoteTotals([{ qty: 10, unitPrice: 2600 }], 8, false)).toEqual({ subtotal: 26000, discount: 2080, vat: 1674, total: 25594 });
  expect(quoteTotals([{ qty: 1, unitPrice: 1070 }], 0, true)).toEqual({ subtotal: 1070, discount: 0, vat: 0, total: 1070 });
});

it('splitVat ใช้ VAT ที่บวกไว้ หรือถอด VAT จากราคารวม', () => {
  expect(splitVat(1070, 70)).toEqual({ subtotal: 1000, vat: 70 });
  expect(splitVat(1070, 0)).toEqual({ subtotal: 1000, vat: 70 });
});

it('agingBucket', () => {
  const d = 86400;
  expect(agingBucket(10 * d, 5 * d)).toBe('current');
  expect(agingBucket(0, 15 * d)).toBe('d30');
  expect(agingBucket(0, 45 * d)).toBe('d60');
  expect(agingBucket(0, 61 * d)).toBe('d90');
});

it('docCode รันเลขต่อเนื่องและเริ่มใหม่เมื่อขึ้นเดือน', () => {
  const oct = new Date('2026-10-22T03:00:00Z');
  expect(docCode('INV', oct, undefined)).toBe('INV-6910-0001');
  expect(docCode('INV', oct, 'INV-6910-0041')).toBe('INV-6910-0042');
  expect(docCode('INV', oct, 'INV-6909-0099')).toBe('INV-6910-0001');
});

import { tankKg } from '../../src/lib/factory';
describe('tankKg', () => {
  it('ใช้น้ำหนักจริงถ้ามี ไม่มีประมาณจากลิตร', () => {
    expect(tankKg({ weightKg: 21, variantName: '1000 ลิตร', productName: '' })).toBe(21);
    expect(tankKg({ weightKg: 0, variantName: '1,000 ลิตร (CW-1000)', productName: '' })).toBe(28);
    expect(tankKg({ weightKg: 0, variantName: 'ประตูบานเดี่ยว', productName: 'ประตู' })).toBe(0);
  });
});
