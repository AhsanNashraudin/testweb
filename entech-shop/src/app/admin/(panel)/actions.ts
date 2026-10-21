'use server';
import { revalidatePath } from 'next/cache';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { requireAdmin, int, num, str } from '@/lib/admin';
import { isProvince } from '@/lib/provinces';
import { QUOTE_STATUS_TH } from '@/lib/status';
import { updateOrder } from '@/lib/orders';
import { ICON, type IconName } from '@/components/icons';
import { DEFAULT_CONTACT, DEFAULT_HOME, SECTION_KEYS, safeHref, safeImage, type Home } from '@/lib/content';

type Result = { ok?: string; err?: string } | null;

/** รันงานแล้วคืนผลลัพธ์ให้ ActionForm แสดงใกล้ฟอร์ม (ไม่ redirect → ค่าที่กรอกไม่หายเมื่อผิดพลาด) */
async function run(fn: () => Promise<string | void>, okMsg = 'บันทึกแล้ว'): Promise<Result> {
  await requireAdmin();
  try {
    const msg = await fn();
    revalidatePath('/', 'layout');
    return { ok: msg || okMsg };
  } catch (e) {
    return { err: (e as Error).message || 'บันทึกไม่สำเร็จ' };
  }
}

// ---------- คำสั่งซื้อ ----------
export async function updateOrderStatus(_prev: Result, form: FormData): Promise<Result> {
  const id = int(form.get('id'), 1);
  return run(async () => {
    const opt = (k: string) => (form.has(k) ? str(form.get(k), 500) : undefined);
    await updateOrder(id, { status: str(form.get('status')), carrier: opt('carrier'), trackingNo: opt('trackingNo'), trackingUrl: opt('trackingUrl') });
  });
}

// ---------- สินค้า ----------
export async function saveProduct(_prev: Result, form: FormData): Promise<Result> {
  const id = int(form.get('id'), 1);
  return run(async () => {
    const name = str(form.get('name'), 200);
    if (name.length < 2) throw new Error('กรุณากรอกชื่อสินค้า');
    // ตรวจทุกช่องให้ครบก่อน แล้วค่อยบันทึกทั้งหมดใน transaction เดียว (ไม่มีการบันทึกครึ่ง ๆ กลาง ๆ)
    const variants = form.getAll('variantId').map((vid) => {
      const v = int(vid, 1);
      const label = String(form.get(`label_${v}`) ?? v);
      const price = int(form.get(`price_${v}`), 0); // 0 = สอบถามราคา
      const compareAtPrice = int(form.get(`compare_${v}`) || 0, 0);
      const bulkPrice = int(form.get(`bulk_${v}`) || 0, 0);
      const bulkMinQty = int(form.get(`bulkqty_${v}`) || 0, 0, 999);
      if (compareAtPrice && compareAtPrice <= price) throw new Error(`${label}: ราคาก่อนลดต้องมากกว่าราคาขาย (หรือใส่ 0 ถ้าไม่มีส่วนลด)`);
      if (bulkPrice && (!price || bulkPrice >= price)) throw new Error(`${label}: ราคาส่งต้องน้อยกว่าราคาขายปกติ`);
      if (bulkPrice && bulkMinQty < 2) throw new Error(`${label}: กรุณาระบุจำนวนขั้นต่ำของราคาส่ง (2 ขึ้นไป)`);
      return { v, price, compareAtPrice, bulkPrice: bulkPrice ? bulkPrice : 0, bulkMinQty: bulkPrice ? bulkMinQty : 0, stock: int(form.get(`stock_${v}`), 0, 100000), weightKg: num(form.get(`weight_${v}`), 0, 5000) };
    });
    const image = form.has('image') ? safeImage(str(form.get('image'))) : undefined;
    if (image === '') throw new Error('กรุณาเลือกรูปสินค้า');
    const product = {
      name, ...(image && { image }), shortDesc: str(form.get('shortDesc'), 300), description: str(form.get('description'), 5000), badge: str(form.get('badge'), 30),
      isActive: form.get('isActive') === 'on', isFeatured: form.get('isFeatured') === 'on',
      seoTitle: str(form.get('seoTitle'), 70), seoDesc: str(form.get('seoDesc'), 170),
      specs: str(form.get('specs'), 8000),
    };
    await db.transaction(async (tx) => {
      await tx.update(s.products).set(product).where(eq(s.products.id, id));
      for (const { v, ...data } of variants) await tx.update(s.variants).set(data).where(and(eq(s.variants.id, v), eq(s.variants.productId, id)));
    });
  });
}

// ---------- ค่าจัดส่ง ----------
export async function saveZone(_prev: Result, form: FormData): Promise<Result> {
  if (form.get('_op') === 'delete') return deleteZone(_prev, form);
  return run(async () => {
    const id = form.get('id') ? int(form.get('id'), 1) : 0;
    const name = str(form.get('name'), 100);
    if (name.length < 2) throw new Error('กรุณาตั้งชื่อโซน');
    const method = form.get('method') === 'weight' ? 'weight' : 'flat';
    const data = {
      name, method: method as 'flat' | 'weight', baseFee: int(form.get('baseFee'), 0, 1_000_000), perKgFee: int(form.get('perKgFee') || 0, 0, 100_000),
      includedKg: num(form.get('includedKg') || 0, 0, 100_000), freeOver: int(form.get('freeOver') || 0, 0, 100_000_000),
      etaText: str(form.get('etaText'), 60), isActive: form.get('isActive') === 'on', isFallback: form.get('isFallback') === 'on',
    };
    await db.transaction(async (tx) => {
      const zoneId = id
        ? (await tx.update(s.shippingZones).set(data).where(eq(s.shippingZones.id, id)).returning())[0]?.id
        : (await tx.insert(s.shippingZones).values({ ...data, sort: 99 }).returning())[0].id;
      if (!zoneId) throw new Error('ไม่พบโซน');
      // โซนสำรองมีได้แค่โซนเดียว
      if (data.isFallback) await tx.update(s.shippingZones).set({ isFallback: false }).where(ne(s.shippingZones.id, zoneId));
    });
    return id ? 'บันทึกโซนแล้ว' : `เพิ่มโซน “${name}” แล้ว — อย่าลืมจับคู่จังหวัดด้านล่าง`;
  });
}

export async function deleteZone(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const id = int(form.get('id'), 1);
    await db.transaction(async (tx) => {
      await tx.delete(s.zoneProvinces).where(eq(s.zoneProvinces.zoneId, id));
      await tx.delete(s.shippingZones).where(eq(s.shippingZones.id, id));
    });
  }, 'ลบโซนแล้ว จังหวัดในโซนนี้จะใช้โซนสำรองแทน');
}

export async function saveProvinceMap(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const zoneIds = new Set((await db.select({ id: s.shippingZones.id }).from(s.shippingZones)).map((z) => z.id));
    const rows: { province: string; zoneId: number }[] = [];
    for (const [k, v] of form.entries()) {
      if (!k.startsWith('p:') || !v) continue;
      const province = k.slice(2), zoneId = Number(v);
      if (!isProvince(province) || !zoneIds.has(zoneId)) throw new Error(`ข้อมูลจังหวัด/โซนไม่ถูกต้อง: ${province}`);
      rows.push({ province, zoneId });
    }
    await db.transaction(async (tx) => {
      await tx.delete(s.zoneProvinces);
      if (rows.length) await tx.insert(s.zoneProvinces).values(rows);
    });
  }, 'บันทึกการจับคู่จังหวัดแล้ว');
}

export async function savePickup(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const entries = {
      pickup_enabled: form.get('pickup_enabled') === 'on' ? '1' : '0', pickup_label: str(form.get('pickup_label'), 120), pickup_eta: str(form.get('pickup_eta'), 120),
      promptpay_id: str(form.get('promptpay_id'), 20).replace(/\D/g, ''), promptpay_name: str(form.get('promptpay_name'), 120),
      prices_include_vat: form.get('prices_include_vat') === 'on' ? '1' : '0',
      bank_name: str(form.get('bank_name'), 80), bank_account: str(form.get('bank_account'), 30).replace(/[^\d-]/g, ''), bank_holder: str(form.get('bank_holder'), 120),
    };
    if (entries.promptpay_id && ![10, 13].includes(entries.promptpay_id.length)) throw new Error('PromptPay ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขผู้เสียภาษี 13 หลัก');
    const bank = [entries.bank_name, entries.bank_account, entries.bank_holder];
    if (bank.some(Boolean) && !bank.every(Boolean)) throw new Error('ข้อมูลบัญชีโอนต้องกรอกให้ครบ 3 ช่อง (ธนาคาร เลขบัญชี ชื่อบัญชี) หรือเว้นว่างทั้งหมดเพื่อปิดการโอน');
    if (entries.bank_account && entries.bank_account.replace(/\D/g, '').length < 10) throw new Error('เลขบัญชีธนาคารไม่ถูกต้อง');
    for (const [key, value] of Object.entries(entries))
      await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  });
}

// ---------- ใบเสนอราคา ----------
export async function updateQuoteStatus(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const status = str(form.get('status'));
    if (!Object.hasOwn(QUOTE_STATUS_TH, status)) throw new Error('สถานะไม่ถูกต้อง');
    await db.update(s.quotes).set({ status: status as 'new' }).where(eq(s.quotes.id, int(form.get('id'), 1)));
  });
}

// ---------- ราคาก่อนลด (mock up) ----------
/** ตั้งราคาก่อนลดของทุกสินค้า = ราคาขาย + X% (0 = ไม่แสดงราคาขีดฆ่า) */
export async function applyCompareMarkup(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const pct = int(form.get('markup'), 0, 100);
    await db.insert(s.settings).values({ key: 'compare_markup', value: String(pct) }).onConflictDoUpdate({ target: s.settings.key, set: { value: String(pct) } });
    await db.update(s.variants).set({ compareAtPrice: pct ? sql`case when ${s.variants.price} > 0 then cast(round(${s.variants.price} * ${100 + pct} / 100.0) as integer) else 0 end` : 0 });
    return pct ? `ตั้งราคาก่อนลด = ราคาขาย +${pct}% ทุกสินค้าแล้ว` : 'ปิดการแสดงราคาก่อนลดทุกสินค้าแล้ว';
  });
}

// ---------- บทความ ----------
export async function saveArticle(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const id = form.get('id') ? int(form.get('id'), 1) : null;
    const title = str(form.get('title'), 150);
    const slug = str(form.get('slug'), 80).toLowerCase();
    if (!title) throw new Error('กรุณาใส่หัวข้อบทความ');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('slug ใช้ได้เฉพาะ a-z ตัวเลข และขีด เช่น how-to-choose-tank');
    const [dup] = await db.select({ id: s.articles.id }).from(s.articles)
      .where(id ? and(eq(s.articles.slug, slug), ne(s.articles.id, id)) : eq(s.articles.slug, slug));
    if (dup) throw new Error('slug นี้ถูกใช้แล้ว ให้เปลี่ยนเป็นอย่างอื่น');
    const existing = id ? (await db.select().from(s.articles).where(eq(s.articles.id, id)))[0] : undefined;
    if (id && !existing) throw new Error('ไม่พบบทความนี้');
    const published = form.get('published') === 'on';
    const body = String(form.get('body') ?? '').trim().slice(0, 50_000);
    if (published && !body) throw new Error('บทความที่เผยแพร่ต้องมีเนื้อหา');
    const values = {
      title, slug, body,
      excerpt: str(form.get('excerpt'), 300),
      kind: form.get('kind') === 'csr' ? 'csr' as const : 'article' as const,
      image: safeImage(str(form.get('image'))),
      seoTitle: str(form.get('seoTitle'), 70),
      seoDesc: str(form.get('seoDesc'), 180),
      published,
      publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    };
    if (id) await db.update(s.articles).set(values).where(eq(s.articles.id, id));
    else await db.insert(s.articles).values(values);
  }, 'บันทึกบทความแล้ว');
}

// ---------- รูปภาพ ----------
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** อัปโหลดรูป 1 รูป (ย่อขนาดในเบราว์เซอร์มาแล้ว) → คืน URL /media/<id> */
export async function uploadMedia(form: FormData): Promise<{ url?: string; err?: string }> {
  await requireAdmin();
  const f = form.get('file');
  if (!(f instanceof File) || !f.size) return { err: 'ไม่พบไฟล์รูป' };
  if (!IMAGE_TYPES.includes(f.type)) return { err: 'รองรับเฉพาะรูป JPG, PNG หรือ WebP' };
  if (f.size > 3_000_000) return { err: 'รูปใหญ่เกินไป (เกิน 3 MB)' };
  const [m] = await db.insert(s.media).values({ mime: f.type, data: Buffer.from(await f.arrayBuffer()).toString('base64') }).returning({ id: s.media.id });
  return { url: `/media/${m.id}` };
}

// ---------- ข้อมูลติดต่อ (ใช้ทั้งเว็บ) ----------
export async function saveContact(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const c = Object.fromEntries(Object.keys(DEFAULT_CONTACT).map((k) => [k, str(form.get(k), 300)])) as typeof DEFAULT_CONTACT;
    for (const k of ['company', 'phone', 'line'] as const) if (!c[k]) throw new Error('กรุณากรอกชื่อบริษัท เบอร์โทร และ LINE');
    for (const k of ['lineUrl', 'facebook', 'mapUrl'] as const) if (c[k] && !c[k].startsWith('https://')) throw new Error('ลิงก์ต้องขึ้นต้นด้วย https://');
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new Error('อีเมลไม่ถูกต้อง');
    await db.insert(s.settings).values({ key: 'contact', value: JSON.stringify(c) })
      .onConflictDoUpdate({ target: s.settings.key, set: { value: JSON.stringify(c) } });
  }, 'บันทึกข้อมูลติดต่อแล้ว — แสดงทั้งเว็บทันที');
}

// ---------- หน้าแรก ----------
export async function saveHome(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    let raw: Partial<Home>;
    try { raw = JSON.parse(String(form.get('config') ?? '{}')); } catch { throw new Error('ข้อมูลไม่ถูกต้อง ลองโหลดหน้าใหม่'); }
    const t = (v: unknown, max = 300) => str(typeof v === 'string' ? v : '', max);
    const link = (v: unknown, label: string) => {
      const h = t(v, 300);
      if (h && !safeHref(h)) throw new Error(`ลิงก์ "${label}" ต้องขึ้นต้นด้วย / (หน้าในเว็บ) หรือ https://`);
      return h;
    };
    const h = raw.hero ?? DEFAULT_HOME.hero;
    const image = t(h.image);
    if (!safeImage(image)) throw new Error('กรุณาเลือกรูปแบนเนอร์');
    const hero = {
      badge: t(h.badge, 60), title: t(h.title, 120), lead: t(h.lead, 300), sub: t(h.sub, 300),
      btn1Label: t(h.btn1Label, 40), btn1Href: link(h.btn1Href, 'ปุ่มที่ 1'),
      btn2Label: t(h.btn2Label, 40), btn2Href: link(h.btn2Href, 'ปุ่มที่ 2'),
      image, imageAlt: t(h.imageAlt, 120) || 'ENTECH', imageSide: h.imageSide === 'left' ? 'left' as const : 'right' as const,
      imageFit: (['scene', 'contain', 'cover'] as const).find((f) => f === h.imageFit) ?? 'cover',
      showCerts: h.showCerts !== false,
      certImage: safeImage(t(h.certImage)),
    };
    if (!hero.title) throw new Error('กรุณาใส่หัวข้อหลักของแบนเนอร์');
    const sections = (Array.isArray(raw.sections) ? raw.sections : [])
      .filter((x, i, a) => SECTION_KEYS.includes(x?.key) && a.findIndex((y) => y?.key === x.key) === i)
      .map((x) => ({ key: x.key, visible: x.visible !== false, title: t(x.title, 80) }));
    const why = (Array.isArray(raw.why) ? raw.why : []).slice(0, 8)
      .map((w) => ({ title: t(w?.title, 60), desc: t(w?.desc, 200) })).filter((w) => w.title);
    const c = raw.cta ?? DEFAULT_HOME.cta;
    const f = raw.features ?? DEFAULT_HOME.features;
    const features = {
      desc: t(f.desc, 400),
      items: (Array.isArray(f.items) ? f.items : []).slice(0, 9)
        .map((x) => ({ icon: (Object.hasOwn(ICON, x?.icon) ? x.icon : 'star') as IconName, title: t(x?.title, 60), desc: t(x?.desc, 200) }))
        .filter((x) => x.title),
    };
    const whyStats = (Array.isArray(raw.whyStats) ? raw.whyStats : []).slice(0, 4)
      .map((x) => ({ value: t(x?.value, 12), label: t(x?.label, 40) })).filter((x) => x.value);
    const home: Home = {
      hero, sections, why, features, whyStats, whyIntro: t(raw.whyIntro, 300),
      featuredCount: Math.min(16, Math.max(4, Math.round(Number(raw.featuredCount) / 4) * 4 || 8)),
      cta: { title: t(c.title, 120), desc: t(c.desc, 300), btnLabel: t(c.btnLabel, 40), btnHref: link(c.btnHref, 'ปุ่มแถบปิดท้าย'), showLine: c.showLine !== false },
      seoTitle: t(raw.seoTitle, 70), seoDesc: t(raw.seoDesc, 170),
    };
    await db.insert(s.settings).values({ key: 'home', value: JSON.stringify(home) })
      .onConflictDoUpdate({ target: s.settings.key, set: { value: JSON.stringify(home) } });
  }, 'บันทึกหน้าแรกแล้ว');
}

// ---------- หมวดสินค้า ----------
export async function saveCategory(_prev: Result, form: FormData): Promise<Result> {
  return run(async () => {
    const id = int(form.get('id'), 1);
    const name = str(form.get('name'), 80);
    if (name.length < 2) throw new Error('กรุณาใส่ชื่อหมวด');
    const image = safeImage(str(form.get('image')));
    if (!image) throw new Error('กรุณาเลือกรูปหมวด');
    await db.update(s.categories).set({ name, description: str(form.get('description'), 400), image }).where(eq(s.categories.id, id));
  }, 'บันทึกหมวดแล้ว — เมนูและหน้าแรกเปลี่ยนตามทันที');
}
