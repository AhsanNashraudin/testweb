// ดึงข้อมูลทั้งหมดจาก Turso ออกมาเป็นไฟล์ SQLite (สำหรับย้ายฐานข้อมูลไปไว้บนโฮสต์ Hostatom)
// ใช้: ตั้งค่าใน .env หรือพิมพ์ก่อนคำสั่ง แล้วรัน
//   TURSO_URL=libsql://xxx.turso.io TURSO_TOKEN=xxxx node scripts/export-turso.mjs
// ผลลัพธ์: deploy/entech.db (อัปไฟล์นี้ขึ้นโฟลเดอร์ entech-data บนโฮสต์)
import { createClient } from '@libsql/client';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';

// อ่าน .env (ถ้ามี) แบบง่าย ๆ — ไม่ต้องติดตั้งอะไรเพิ่ม
if (existsSync('.env')) for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const url = process.env.TURSO_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_TOKEN || process.env.DATABASE_AUTH_TOKEN;
if (!url || url === `file:${process.env.OUT || 'deploy/entech.db'}`) { console.error('✗ ตั้ง TURSO_URL=libsql://... และ TURSO_TOKEN=... ก่อน'); process.exit(1); }

const OUT = process.env.OUT || 'deploy/entech.db';
mkdirSync('deploy', { recursive: true });
for (const f of [OUT, `${OUT}-wal`, `${OUT}-shm`]) rmSync(f, { force: true });

const src = createClient({ url, authToken });
const dst = createClient({ url: `file:${OUT}` });

const objs = (await src.execute(
  "select type, name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' and name not like '_litestream%' and name not like 'libsql_%' order by case type when 'table' then 0 else 1 end",
)).rows;

let total = 0;
for (const o of objs.filter((x) => x.type === 'table')) {
  await dst.execute(o.sql);
  const cols = (await src.execute(`pragma table_info("${o.name}")`)).rows.map((c) => c.name);
  const ph = cols.map(() => '?').join(',');
  const insert = `insert into "${o.name}" (${cols.map((c) => `"${c}"`).join(',')}) values (${ph})`;
  // ดึงทีละ 200 แถว (ตาราง media เก็บรูปเป็นข้อความยาว ไม่ดึงทั้งก้อนในครั้งเดียว)
  for (let off = 0; ; off += 200) {
    const rows = (await src.execute(`select * from "${o.name}" limit 200 offset ${off}`)).rows;
    if (!rows.length) break;
    await dst.batch(rows.map((r) => ({ sql: insert, args: cols.map((c) => r[c]) })), 'write');
    total += rows.length;
    if (rows.length < 200) break;
  }
  const n = (await dst.execute(`select count(*) as n from "${o.name}"`)).rows[0].n;
  console.log(`✓ ${o.name}: ${n} แถว`);
}
for (const o of objs.filter((x) => x.type !== 'table')) await dst.execute(o.sql); // index / view / trigger
await dst.execute('pragma journal_mode=delete'); // รวมเป็นไฟล์เดียว อัปง่าย
console.log(`\n✓ เสร็จ ${total} แถว → ${OUT}`);
src.close(); dst.close();
