/**
 * คำนวณค่าส่งอัตโนมัติจาก "จังหวัด" ของลูกค้า (pure function — ไม่แตะ DB, ทดสอบได้ง่าย)
 *
 * กติกา:
 *  - แต่ละจังหวัดผูกกับได้ 1 โซน (บังคับด้วย primary key ใน DB)
 *  - ถ้าจังหวัดไม่อยู่ในโซนใด → ใช้โซนสำรอง (isFallback) ถ้ามี
 *  - วิธีคิด: flat = ค่าคงที่ต่อออเดอร์ | weight = baseFee + (น้ำหนักส่วนเกิน includedKg ปัดขึ้นเป็นกก.) × perKgFee
 *  - freeOver > 0 และยอดสินค้า (หลังหักส่วนลด) ≥ freeOver → ส่งฟรี
 *  - รับเองที่โรงงาน (pickup) = 0 บาท เมื่อเปิดใช้งาน
 */
export type ShippingMethod = 'flat' | 'weight';

export interface Zone {
  id: number;
  name: string;
  method: ShippingMethod;
  baseFee: number;
  perKgFee: number;
  includedKg: number;
  freeOver: number;
  etaText: string;
  isActive: boolean;
  isFallback: boolean;
}

export interface ShippingOption {
  id: string; // 'zone:<id>' | 'pickup'
  label: string;
  fee: number;
  eta: string;
  isFree: boolean;
}

export interface QuoteInput {
  province: string;
  subtotal: number; // บาท หลังหักส่วนลด
  weightKg: number;
  zones: Zone[];
  provinceZone: Record<string, number>; // province -> zoneId
  pickup?: { enabled: boolean; label: string; eta: string };
}

export function zoneFee(zone: Zone, subtotal: number, weightKg: number): number {
  if (zone.freeOver > 0 && subtotal >= zone.freeOver) return 0;
  if (zone.method === 'flat') return zone.baseFee;
  const extraKg = Math.max(0, Math.ceil(weightKg - zone.includedKg - 1e-9));
  return zone.baseFee + extraKg * zone.perKgFee;
}

export function resolveZone(province: string, zones: Zone[], provinceZone: Record<string, number>): Zone | null {
  const active = zones.filter((z) => z.isActive);
  const mapped = active.find((z) => z.id === provinceZone[province]);
  return mapped ?? active.find((z) => z.isFallback) ?? null;
}

export function quoteShipping(i: QuoteInput): ShippingOption[] {
  const out: ShippingOption[] = [];
  const zone = resolveZone(i.province, i.zones, i.provinceZone);
  if (zone) {
    const fee = zoneFee(zone, i.subtotal, Math.max(0, i.weightKg));
    out.push({ id: `zone:${zone.id}`, label: `จัดส่งถึงบ้าน — ${zone.name}`, fee, eta: zone.etaText, isFree: fee === 0 });
  }
  if (i.pickup?.enabled) out.push({ id: 'pickup', label: i.pickup.label, fee: 0, eta: i.pickup.eta, isFree: true });
  return out;
}
