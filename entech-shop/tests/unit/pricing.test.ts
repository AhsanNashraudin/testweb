import { describe, it, expect } from 'vitest';
import { applyCoupon, subtotalOf, weightOf } from '@/lib/pricing';

const c = (o = {}) => ({ code: 'X', type: 'fixed' as const, value: 500, minSubtotal: 0, isActive: true, ...o });

describe('pricing', () => {
  it('sums lines', () => {
    const lines = [{ variantId: 1, qty: 2, unitPrice: 1290, weightKg: 3.5 }, { variantId: 2, qty: 1, unitPrice: 12900, weightKg: 45 }];
    expect(subtotalOf(lines)).toBe(15480);
    expect(weightOf(lines)).toBe(52);
  });
  it('fixed coupon', () => expect(applyCoupon(c(), 2000).discount).toBe(500));
  it('coupon cannot exceed subtotal', () => expect(applyCoupon(c({ value: 5000 }), 2000).discount).toBe(2000));
  it('percent coupon floors', () => expect(applyCoupon(c({ type: 'percent', value: 7 }), 1299).discount).toBe(90));
  it('min subtotal enforced', () => {
    const r = applyCoupon(c({ minSubtotal: 3000 }), 2999);
    expect(r.discount).toBe(0);
    expect(r.error).toMatch('3,000');
  });
  it('inactive / missing coupon', () => {
    expect(applyCoupon(c({ isActive: false }), 9999).error).toBeTruthy();
    expect(applyCoupon(null, 9999).discount).toBe(0);
  });
});
