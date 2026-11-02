/** เพิ่มคอลัมน์ใหม่ให้ฐานข้อมูลเดิมอัตโนมัติตอนเปิดเว็บ (โฮสต์ที่ไม่ได้รัน drizzle-kit push เช่น Hostatom)
 *  เพิ่มอย่างเดียว ไม่ลบ/ไม่แก้ข้อมูลเดิม — รันซ้ำได้ */
import { client } from '@/db';

const COLUMNS: [table: string, column: string, def: string][] = [
  ['quotes', 'assignee', "TEXT NOT NULL DEFAULT ''"],
  ['quotes', 'note', "TEXT NOT NULL DEFAULT ''"],
  ['quotes', 'remind_level', 'INTEGER NOT NULL DEFAULT 0'],
  ['quotes', 'updated_at', 'INTEGER NOT NULL DEFAULT 0'],
];

export async function ensureSchema() {
  const have = new Map<string, Set<string>>();
  for (const [t, c, def] of COLUMNS) {
    if (!have.has(t)) have.set(t, new Set((await client.execute(`PRAGMA table_info(${t})`)).rows.map((r) => String(r.name))));
    if (have.get(t)!.has(c)) continue;
    await client.execute(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`);
    have.get(t)!.add(c);
    console.log(`✓ เพิ่มคอลัมน์ ${t}.${c}`);
  }
}
