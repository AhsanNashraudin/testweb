/** ระบบสำรองข้อมูล
 *  1) สำรองทั้งระบบ (.db) — อัตโนมัติวันละครั้ง + กดสำรองเอง + ก่อนกู้คืนทุกครั้ง · เก็บใน entech-data/backups (เฉพาะฐานข้อมูลแบบไฟล์บนโฮสต์)
 *  2) ส่งออกแยกส่วน (เปิดด้วย Excel ได้) — สินค้า · คำสั่งซื้อ · ใบเสนอราคา · บทความ · ตั้งค่าเว็บ · รูปที่อัปโหลด · หรือรวมทุกอย่างใน ZIP เดียว
 *  3) กู้คืนจากไฟล์สำรอง — สำรองข้อมูลปัจจุบันก่อนเสมอ แล้วคัดลอกทุกตารางจากไฟล์สำรองทับใน transaction เดียว */
import 'server-only';
import { chmod, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createClient } from '@libsql/client';
import { client } from '@/db';
import { dbUrl } from '@/db/env';
import { zip, type ZipEntry } from '@/lib/zip';
import { STATUS_TH, QUOTE_STATUS_TH } from '@/lib/status';

// ---------- ที่เก็บไฟล์ ----------
export const isFileDb = () => dbUrl().startsWith('file:');
const dbFile = () => resolve(process.cwd(), dbUrl().slice('file:'.length));
export const backupDir = () => resolve(process.env.BACKUP_DIR || join(dirname(dbFile()), 'backups'));
const KEEP = { auto: Number(process.env.BACKUP_KEEP_DAYS) || 14, manual: 10, 'before-restore': 5, upload: 5 } as const;
export type BackupKind = keyof typeof KEEP;
export const KIND_TH: Record<BackupKind, string> = { auto: 'อัตโนมัติรายวัน', manual: 'กดสำรองเอง', 'before-restore': 'ก่อนกู้คืน', upload: 'อัปโหลดเข้ามา' };
const NAME_RE = /^entech-(\d{8}-\d{4})-(auto|manual|before-restore|upload)\.db$/;

// ---------- ความปลอดภัยของไฟล์ข้อมูล ----------
/** ห้ามเก็บฐานข้อมูล/ไฟล์สำรองไว้ในโฟลเดอร์ที่เปิดให้คนนอกดาวน์โหลดได้ (public / httpdocs/public) */
export function assertPrivateLocation() {
  if (!isFileDb()) return;
  const pub = resolve(process.cwd(), 'public');
  for (const p of [dbFile(), backupDir()]) {
    if (p === pub || p.startsWith(pub + '/') || p.startsWith(pub + '\\')) throw new Error(`ไม่ปลอดภัย: ${p} อยู่ในโฟลเดอร์ public ที่คนนอกเปิดได้ — ย้ายไปไว้นอก httpdocs`);
  }
}
/** สิทธิ์ไฟล์: เจ้าของอ่าน/เขียนได้คนเดียว (600) · โฟลเดอร์ 700 — ผู้ใช้อื่นบนเซิร์ฟเวอร์เดียวกันเปิดไม่ได้ */
export async function lockDown() {
  if (!isFileDb()) return;
  const f = dbFile();
  for (const p of [f, `${f}-wal`, `${f}-shm`]) await chmod(p, 0o600).catch(() => {});
  await chmod(dirname(f), 0o700).catch(() => {});
  await mkdir(backupDir(), { recursive: true, mode: 0o700 }).catch(() => {});
  await chmod(backupDir(), 0o700).catch(() => {});
  for (const n of await readdir(backupDir()).catch(() => [] as string[])) await chmod(join(backupDir(), n), 0o600).catch(() => {});
}

/** เวลาไทย YYYYMMDD-HHmm */
export const stamp = (d = new Date()) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace(/-/g, '').replace('T', '-').replace(':', '');

export type BackupFile = { name: string; kind: BackupKind; at: string; size: number };

export async function listBackups(): Promise<BackupFile[]> {
  if (!isFileDb()) return [];
  const names = await readdir(backupDir()).catch(() => [] as string[]);
  const out: BackupFile[] = [];
  for (const name of names) {
    const m = name.match(NAME_RE);
    if (!m) continue;
    const st = await stat(join(backupDir(), name));
    out.push({ name, kind: m[2] as BackupKind, at: m[1], size: st.size });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at) || b.name.localeCompare(a.name));
}

/** ชื่อไฟล์ต้องตรงรูปแบบเท่านั้น (กันอ่าน/ลบไฟล์อื่นนอกโฟลเดอร์สำรอง) */
export function backupPath(name: string) {
  if (!NAME_RE.test(name)) throw new Error('ชื่อไฟล์สำรองไม่ถูกต้อง');
  return join(backupDir(), name);
}

/** สำเนาฐานข้อมูลทั้งก้อนที่สมบูรณ์ (ไฟล์ = VACUUM INTO · Turso = คัดลอกทีละตาราง) */
export async function snapshotTo(dest: string) {
  await rm(dest, { force: true });
  if (isFileDb()) {
    await client.execute(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
    return;
  }
  const out = createClient({ url: `file:${dest}` });
  const objs = (await client.execute("select type, name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' and name not like '_litestream%' and name not like 'libsql_%' order by case type when 'table' then 0 else 1 end")).rows;
  for (const o of objs) {
    await out.execute(String(o.sql));
    if (o.type !== 'table') continue;
    for (let off = 0; ; off += 200) {
      const rs = await client.execute(`select * from "${o.name}" limit 200 offset ${off}`);
      if (!rs.rows.length) break;
      const cols = rs.columns;
      const ins = `insert into "${o.name}" (${cols.map((c) => `"${c}"`).join(',')}) values (${cols.map(() => '?').join(',')})`;
      await out.batch(rs.rows.map((r) => ({ sql: ins, args: cols.map((c) => r[c]) })), 'write');
      if (rs.rows.length < 200) break;
    }
  }
  out.close();
}

export async function createBackup(kind: BackupKind): Promise<BackupFile> {
  if (!isFileDb()) throw new Error('ฐานข้อมูลอยู่บน Turso (สำรองอัตโนมัติที่ Turso) — ใช้ "ดาวน์โหลด" แทน');
  assertPrivateLocation();
  await mkdir(backupDir(), { recursive: true, mode: 0o700 });
  const name = `entech-${stamp()}-${kind}.db`;
  await snapshotTo(join(backupDir(), name));
  await chmod(join(backupDir(), name), 0o600).catch(() => {});
  await prune(kind);
  return (await listBackups()).find((b) => b.name === name)!;
}

async function prune(kind: BackupKind) {
  const files = (await listBackups()).filter((b) => b.kind === kind);
  for (const f of files.slice(KEEP[kind])) await rm(join(backupDir(), f.name), { force: true });
}

/** สำรองอัตโนมัติ: ถ้าวันนี้ (เวลาไทย) ยังไม่มีไฟล์ auto ให้สร้าง — เรียกจาก instrumentation ทุกชั่วโมง */
export async function autoBackupIfDue() {
  if (!isFileDb()) return null;
  const today = stamp().slice(0, 8);
  if ((await listBackups()).some((b) => b.kind === 'auto' && b.at.startsWith(today))) return null;
  return createBackup('auto');
}

// ---------- กู้คืน ----------
const REQUIRED = ['products', 'variants', 'orders', 'settings'];

export async function restoreFrom(name: string) {
  if (!isFileDb()) throw new Error('กู้คืนผ่านหลังบ้านได้เฉพาะฐานข้อมูลบนโฮสต์');
  const src = backupPath(name);
  const head = (await readFile(src)).subarray(0, 15).toString();
  if (head !== 'SQLite format 3') throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูล');
  const safety = await createBackup('before-restore'); // ย้อนกลับได้เสมอ

  await client.execute(`ATTACH DATABASE '${src.replace(/'/g, "''")}' AS bk`);
  try {
    const bkTables = new Set((await client.execute("select name from bk.sqlite_master where type='table'")).rows.map((r) => String(r.name)));
    const missing = REQUIRED.filter((t) => !bkTables.has(t));
    if (missing.length) throw new Error(`ไฟล์สำรองไม่ครบ (ไม่มีตาราง ${missing.join(', ')})`);
    const tables = (await client.execute("select name from main.sqlite_master where type='table' and name not like 'sqlite_%' and name not like '__drizzle%'")).rows.map((r) => String(r.name));
    const stmts: string[] = ['PRAGMA defer_foreign_keys = ON']; // ตรวจความสัมพันธ์ตอนจบ (ลบ-เติมครบทุกตารางก่อน)
    for (const t of tables) {
      stmts.push(`delete from main."${t}"`);
      if (!bkTables.has(t)) continue; // ตารางใหม่ที่ไฟล์สำรองรุ่นเก่ายังไม่มี → ว่างไว้
      // ใช้เฉพาะคอลัมน์ที่มีทั้งสองฝั่ง → กู้ไฟล์สำรองจากเวอร์ชันก่อนหน้าได้ (คอลัมน์ใหม่ใช้ค่าเริ่มต้น)
      const cols = async (db: string) => new Set((await client.execute(`pragma ${db}.table_info("${t}")`)).rows.map((r) => String(r.name)));
      const [a, b] = [await cols('main'), await cols('bk')];
      const shared = [...a].filter((c) => b.has(c)).map((c) => `"${c}"`).join(',');
      if (shared) stmts.push(`insert into main."${t}" (${shared}) select ${shared} from bk."${t}"`);
    }
    await client.batch(stmts, 'write'); // ทั้งหมดหรือไม่เลย
  } finally {
    await client.execute('DETACH DATABASE bk').catch(() => {});
  }
  return safety;
}

/** รับไฟล์สำรองที่อัปโหลดเข้ามา เก็บไว้ในรายการ (ยังไม่กู้คืนจนกว่าจะกดยืนยัน) */
export async function saveUploadedBackup(data: Uint8Array) {
  if (!isFileDb()) throw new Error('ใช้ได้เฉพาะฐานข้อมูลบนโฮสต์');
  if (Buffer.from(data.subarray(0, 15)).toString() !== 'SQLite format 3') throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูล (.db)');
  assertPrivateLocation();
  await mkdir(backupDir(), { recursive: true, mode: 0o700 });
  const name = `entech-${stamp()}-upload.db`;
  await writeFile(join(backupDir(), name), data, { mode: 0o600 });
  await prune('upload');
  return name;
}

// ---------- ส่งออกแยกส่วน ----------
export const PARTS = {
  products: { label: 'สินค้า ราคา และสต็อก', file: 'สินค้า-ราคา-สต็อก.csv' },
  orders: { label: 'คำสั่งซื้อ', file: 'คำสั่งซื้อ.csv' },
  'order-items': { label: 'รายการสินค้าในคำสั่งซื้อ', file: 'รายการสินค้าในคำสั่งซื้อ.csv' },
  quotes: { label: 'ใบเสนอราคา / ลูกค้าติดต่อ', file: 'ใบเสนอราคา.csv' },
  articles: { label: 'บทความ & CSR', file: 'บทความ-CSR.csv' },
  settings: { label: 'ตั้งค่าเว็บ (หน้าแรก ติดต่อ ค่าส่ง คูปอง หมวด)', file: 'ตั้งค่าเว็บ.json' },
  media: { label: 'รูปที่อัปโหลดจากหลังบ้าน', file: 'รูปที่อัปโหลด.zip' },
} as const;
export type Part = keyof typeof PARTS;

const q = async (s: string) => (await client.execute(s)).rows as unknown as Record<string, unknown>[];
const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** CSV ภาษาไทยที่ Excel เปิดได้ทันที (มี BOM) */
const csv = (head: string[], rows: unknown[][]) => '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
const thDate = (sec: unknown) => (sec ? new Date(Number(sec) * 1000 + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '');

export async function exportPart(part: Exclude<Part, 'media'>): Promise<string> {
  switch (part) {
    case 'products': {
      const r = await q(`select c.name cat, p.slug, p.name, p.brand, v.sku, v.name vname, v.price, v.compare_at_price, v.bulk_price, v.bulk_min_qty, v.stock, v.weight_kg, p.is_active
        from variants v join products p on p.id = v.product_id join categories c on c.id = p.category_id order by c.sort, p.id, v.sort`);
      return csv(['หมวด', 'รหัสสินค้า', 'ชื่อสินค้า', 'แบรนด์', 'SKU', 'ตัวเลือก', 'ราคาขาย', 'ราคาก่อนลด', 'ราคาส่ง', 'ส่งขั้นต่ำ', 'สต็อก', 'น้ำหนัก(กก.)', 'แสดงบนเว็บ'],
        r.map((x) => [x.cat, x.slug, x.name, x.brand, x.sku, x.vname, x.price, x.compare_at_price, x.bulk_price, x.bulk_min_qty, x.stock, x.weight_kg, x.is_active ? 'ใช่' : 'ไม่']));
    }
    case 'orders': {
      const r = await q('select * from orders order by id');
      return csv(['เลขคำสั่งซื้อ', 'วันที่', 'สถานะ', 'ชื่อ', 'โทร', 'อีเมล', 'ที่อยู่', 'จังหวัด', 'รหัสไปรษณีย์', 'การจัดส่ง', 'ชำระเงิน', 'คูปอง', 'ยอดสินค้า', 'ส่วนลด', 'ค่าส่ง', 'VAT', 'ยอดรวม', 'ขนส่ง', 'เลขพัสดุ', 'ใบกำกับ: ชื่อ', 'ใบกำกับ: เลขผู้เสียภาษี', 'ใบกำกับ: สาขา', 'ใบกำกับ: ที่อยู่', 'หมายเหตุ'],
        r.map((x) => [x.code, thDate(x.created_at), STATUS_TH[String(x.status)] ?? x.status, x.name, x.phone, x.email, x.address, x.province, x.postcode, x.shipping_label, x.payment_method === 'promptpay' ? 'PromptPay' : 'โอนธนาคาร', x.coupon_code, x.subtotal, x.discount, x.shipping_fee, x.vat, x.total, x.carrier, x.tracking_no, x.tax_name, x.tax_id, x.tax_branch, x.tax_address, x.note]));
    }
    case 'order-items': {
      const r = await q('select o.code, i.sku, i.product_name, i.variant_name, i.unit_price, i.qty from order_items i join orders o on o.id = i.order_id order by o.id, i.id');
      return csv(['เลขคำสั่งซื้อ', 'SKU', 'สินค้า', 'ตัวเลือก', 'ราคา/หน่วย', 'จำนวน', 'รวม'], r.map((x) => [x.code, x.sku, x.product_name, x.variant_name, x.unit_price, x.qty, Number(x.unit_price) * Number(x.qty)]));
    }
    case 'quotes': {
      const r = await q('select * from quotes order by id');
      return csv(['วันที่', 'ชื่อ', 'บริษัท', 'โทร', 'อีเมล', 'เรื่อง', 'จังหวัด', 'รายละเอียด', 'สถานะ'],
        r.map((x) => [thDate(x.created_at), x.name, x.company, x.phone, x.email, x.topic, x.province, x.detail, QUOTE_STATUS_TH[String(x.status)] ?? x.status]));
    }
    case 'articles': {
      const r = await q('select * from articles order by id');
      return csv(['ประเภท', 'รหัส (slug)', 'หัวข้อ', 'คำโปรย', 'เนื้อหา', 'รูปปก', 'เผยแพร่', 'วันที่เผยแพร่'],
        r.map((x) => [x.kind === 'csr' ? 'CSR' : 'บทความ', x.slug, x.title, x.excerpt, x.body, x.image, x.published ? 'ใช่' : 'ไม่', thDate(x.published_at)]));
    }
    case 'settings': {
      const settings = Object.fromEntries((await q('select key, value from settings')).map((r) => {
        const v = String(r.value);
        try { return [r.key, v.startsWith('{') || v.startsWith('[') ? JSON.parse(v) : v]; } catch { return [r.key, v]; }
      }));
      return JSON.stringify({
        exportedAt: new Date().toISOString(), settings,
        categories: await q('select slug, name, description, image, sort from categories order by sort'),
        shippingZones: await q('select * from shipping_zones order by sort'),
        zoneProvinces: await q('select * from zone_provinces'),
        coupons: await q('select * from coupons'),
      }, null, 2);
    }
  }
}

const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };
export async function mediaEntries(prefix = ''): Promise<ZipEntry[]> {
  const rows = await q('select id, mime, data from media order by id');
  return rows.map((r) => ({ name: `${prefix}${r.id}.${EXT[String(r.mime)] ?? 'bin'}`, data: Buffer.from(String(r.data), 'base64') }));
}

/** ชุดสำรองครบในไฟล์เดียว: ฐานข้อมูล (.db) + ข้อมูลแยกส่วน (CSV/JSON) + รูปที่อัปโหลด + คำอธิบาย */
export async function fullBundle(): Promise<Buffer> {
  const tmp = join(tmpdir(), `entech-bundle-${process.pid}-${Date.now()}.db`);
  try {
    await snapshotTo(tmp);
    const entries: ZipEntry[] = [
      { name: 'อ่านก่อน.txt', data: README },
      { name: '1-ฐานข้อมูลทั้งระบบ/entech.db', data: await readFile(tmp) },
    ];
    for (const p of ['products', 'orders', 'order-items', 'quotes', 'articles', 'settings'] as const) {
      entries.push({ name: `2-ข้อมูลแยกส่วน/${PARTS[p].file}`, data: await exportPart(p) });
    }
    entries.push(...await mediaEntries('3-รูปที่อัปโหลด/'));
    return zip(entries);
  } finally {
    await rm(tmp, { force: true });
  }
}

const README = `ชุดสำรองข้อมูลเว็บไซต์ ENTECH (สร้างเมื่อ ${stamp()} เวลาไทย)

1-ฐานข้อมูลทั้งระบบ/entech.db
   ข้อมูลทุกอย่างของเว็บในไฟล์เดียว — ใช้ "กู้คืน" ในหลังบ้าน > สำรองข้อมูล > อัปโหลดไฟล์สำรอง

2-ข้อมูลแยกส่วน/
   ไฟล์ .csv เปิดด้วย Excel ได้ทันที (สินค้า-ราคา-สต็อก, คำสั่งซื้อ, รายการสินค้าในคำสั่งซื้อ, ใบเสนอราคา, บทความ-CSR)
   ตั้งค่าเว็บ.json = ข้อความหน้าแรก ข้อมูลติดต่อ ค่าส่ง คูปอง หมวดสินค้า

3-รูปที่อัปโหลด/
   รูปที่อัปโหลดผ่านหลังบ้าน (ชื่อไฟล์ = เลขรูป ตรงกับลิงก์ /media/เลขรูป)
   รูปสินค้าตั้งต้นอยู่ในตัวเว็บ (public/images) ไม่ต้องสำรองแยก

เก็บไฟล์นี้ไว้ในที่ปลอดภัย (มีข้อมูลลูกค้า ชื่อ เบอร์โทร ที่อยู่) เช่น Google Drive ของบริษัท
`;

/** ไฟล์ .db ใหม่สำหรับดาวน์โหลด (สร้างในโฟลเดอร์ชั่วคราว แล้วลบทิ้ง) */
export async function freshDbFile(): Promise<Buffer> {
  const tmp = join(tmpdir(), `entech-dl-${process.pid}-${Date.now()}.db`);
  try { await snapshotTo(tmp); return await readFile(tmp); } finally { await rm(tmp, { force: true }); }
}
