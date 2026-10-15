import { describe, it, expect } from 'vitest';
import { PROVINCES, REGIONS } from '@/lib/provinces';

describe('REGIONS', () => {
  it('ครอบคลุม 77 จังหวัด ไม่ซ้ำ ไม่ขาด', () => {
    const all = REGIONS.flatMap(([, p]) => p);
    expect(all).toHaveLength(77);
    expect(new Set(all).size).toBe(77);
    expect([...PROVINCES].sort()).toEqual([...all].sort());
  });
});
