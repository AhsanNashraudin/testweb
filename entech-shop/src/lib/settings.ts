import { db, schema as s } from '@/db';

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(s.settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function loadShippingConfig() {
  const [zones, links, st] = await Promise.all([
    db.select().from(s.shippingZones).orderBy(s.shippingZones.sort),
    db.select().from(s.zoneProvinces),
    getSettings(),
  ]);
  return {
    zones,
    provinceZone: Object.fromEntries(links.map((l) => [l.province, l.zoneId])) as Record<string, number>,
    pickup: { enabled: st.pickup_enabled === '1', label: st.pickup_label ?? 'รับเองที่โรงงาน', eta: st.pickup_eta ?? '' },
    settings: st,
  };
}
