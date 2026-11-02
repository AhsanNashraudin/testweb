import { sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Icon, type IconName } from '@/components/icons';
import { KIND_TH, PARTS, backupDir, isFileDb, listBackups, type Part } from '@/lib/backup';
import { backupNow, restoreBackup } from '../actions';

export const metadata = { title: 'สำรองข้อมูล' };
export const dynamic = 'force-dynamic';

const size = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const when = (at: string) => `${at.slice(6, 8)}/${at.slice(4, 6)}/${at.slice(0, 4)} ${at.slice(9, 11)}:${at.slice(11, 13)}`;

function Step({ n, title, desc, children, id }: { n: number; title: string; desc: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="card p-5 md:p-6" aria-labelledby={id}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-700 font-bold text-white">{n}</span>
        <div><h2 id={id} className="text-lg font-bold">{title}</h2><p className="text-sm text-muted">{desc}</p></div>
      </div>
      {children}
    </section>
  );
}

export default async function BackupPage({ searchParams }: { searchParams: Promise<{ uploaded?: string; err?: string }> }) {
  const sp = await searchParams;
  const file = isFileDb();
  const list = await listBackups();
  const lastAuto = list.find((b) => b.kind === 'auto');
  const count = async (t: typeof s.products | typeof s.orders | typeof s.quotes | typeof s.articles | typeof s.media | typeof s.variants) => (await db.select({ n: sql<number>`count(*)` }).from(t))[0].n;
  const [nVariants, nOrders, nQuotes, nArticles, nMedia] = await Promise.all([count(s.variants), count(s.orders), count(s.quotes), count(s.articles), count(s.media)]);
  const PART_INFO: Record<Part, [IconName, string]> = {
    products: ['tank', `${nVariants} รายการ (SKU) · ราคา ราคาส่ง สต็อก น้ำหนัก`],
    orders: ['doc', `${nOrders} คำสั่งซื้อ · ลูกค้า ที่อยู่ ยอดเงิน สถานะ เลขพัสดุ`],
    'order-items': ['check', 'สินค้าแต่ละรายการในทุกคำสั่งซื้อ'],
    quotes: ['chat', `${nQuotes} รายการ · ลูกค้าที่ขอใบเสนอราคา/ติดต่อมา`],
    articles: ['book', `${nArticles} เรื่อง · บทความและกิจกรรม CSR`],
    settings: ['wrench', 'ข้อความหน้าแรก ข้อมูลติดต่อ ค่าส่ง คูปอง หมวดสินค้า'],
    media: ['heart', `${nMedia} รูป · รูปที่อัปโหลดผ่านหลังบ้าน`],
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">สำรองข้อมูล</h1>
        <p className="text-sm text-muted">ไฟล์สำรองมีข้อมูลลูกค้า (ชื่อ เบอร์โทร ที่อยู่) — เก็บในที่ปลอดภัยของบริษัทเท่านั้น เช่น Google Drive ของบริษัท</p>
      </div>
      {sp.err && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-sm text-sale">{sp.err}</p>}
      {sp.uploaded && <p role="status" className="rounded-lg bg-success-50 p-3 text-sm text-success">✓ อัปโหลดแล้ว: {sp.uploaded} — กด &ldquo;กู้คืน&rdquo; ที่ไฟล์นี้ในข้อ 3 เพื่อใช้ข้อมูลชุดนี้</p>}

      <Step n={1} id="s-full" title="สำรองทั้งระบบ" desc="ข้อมูลทุกอย่างของเว็บ ใช้กู้คืนได้ทั้งหมด — แนะนำดาวน์โหลด “ชุดสำรองครบ” เก็บไว้สัปดาห์ละครั้ง">
        <div className="grid gap-3 sm:grid-cols-2">
          <a href="/admin/backup/bundle" className="btn-primary justify-center" data-testid="dl-bundle"><Icon name="briefcase" className="h-5 w-5" /> ดาวน์โหลดชุดสำรองครบ (ZIP)</a>
          <a href="/admin/backup/full" className="btn-outline justify-center" data-testid="dl-full"><Icon name="doc" className="h-5 w-5" /> ดาวน์โหลดเฉพาะฐานข้อมูล (.db)</a>
        </div>
        <p className="mt-3 text-xs text-muted">ชุดสำรองครบ = ฐานข้อมูล (.db) + ข้อมูลแยกส่วนเปิดด้วย Excel + รูปที่อัปโหลด ในไฟล์เดียว</p>
        {file ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-navy-50 p-4 text-sm">
            <Icon name="clock" className="h-5 w-5 text-navy-700" />
            <span className="flex-1">
              <b>สำรองอัตโนมัติทุกวัน</b> บนเซิร์ฟเวอร์ เก็บย้อนหลัง 14 วัน · ล่าสุด: <b data-testid="last-auto">{lastAuto ? when(lastAuto.at) : 'ยังไม่มี (สร้างภายใน 1 ชม. หลังเปิดเว็บ)'}</b>
            </span>
            <ActionForm action={backupNow} className="contents"><SubmitButton className="btn-outline" pendingText="กำลังสำรอง…">สำรองตอนนี้</SubmitButton></ActionForm>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-navy-50 p-4 text-sm">ฐานข้อมูลอยู่บน Turso (สำรองอัตโนมัติโดย Turso) — สำรองอัตโนมัติรายวันในหน้านี้ใช้เมื่อย้ายฐานข้อมูลไปไว้บนโฮสต์</p>
        )}
      </Step>

      <Step n={2} id="s-parts" title="ส่งออกข้อมูลแยกส่วน" desc="ดาวน์โหลดเฉพาะส่วนที่ต้องการ — ไฟล์ .csv เปิดด้วย Excel ได้ทันที (ภาษาไทยไม่เพี้ยน)">
        <ul className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(PARTS) as Part[]).map((p) => (
            <li key={p} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-600 to-navy-700 text-white"><Icon name={PART_INFO[p][0]} className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><b className="block">{PARTS[p].label}</b><span className="block text-xs text-muted">{PART_INFO[p][1]}</span></span>
              <a href={`/admin/backup/export/${p}`} className="btn-outline shrink-0 px-3 text-sm" data-testid={`dl-${p}`} aria-label={`ดาวน์โหลด ${PARTS[p].label}`}>⬇ {PARTS[p].file.split('.').pop()?.toUpperCase()}</a>
            </li>
          ))}
        </ul>
      </Step>

      {file && (
        <Step n={3} id="s-list" title="ไฟล์สำรองบนเซิร์ฟเวอร์" desc="ดาวน์โหลดหรือกู้คืนข้อมูลกลับไปเป็นตามวันเวลานั้น — ก่อนกู้คืนระบบจะสำรองข้อมูลปัจจุบันไว้ให้อัตโนมัติ (ย้อนกลับได้)">
          {list.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm" data-testid="backup-list">
              <thead className="text-left text-muted"><tr><th className="py-2">วันเวลา</th><th>ประเภท</th><th className="text-right">ขนาด</th><th /></tr></thead>
              <tbody>{list.map((b) => (
                <tr key={b.name} className="border-t border-slate-100">
                  <td className="py-2 font-semibold">{when(b.at)}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs ${b.kind === 'auto' ? 'bg-navy-50 text-navy-700' : b.kind === 'manual' ? 'bg-cyan-100 text-navy-900' : 'bg-warning-50 text-warning'}`}>{KIND_TH[b.kind]}</span></td>
                  <td className="text-right tabular-nums">{size(b.size)}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <a href={`/admin/backup/file/${encodeURIComponent(b.name)}`} className="btn-outline px-3 text-xs">⬇ ดาวน์โหลด</a>
                      <ActionForm action={restoreBackup}>
                        <input type="hidden" name="name" value={b.name} />
                        <SubmitButton className="btn-danger px-3 text-xs" pendingText="กำลังกู้คืน…" data-testid="restore-btn"
                          confirm={`กู้คืนข้อมูลกลับไปเป็นวันที่ ${when(b.at)}?\n\nข้อมูลที่เกิดหลังจากนั้น (เช่น คำสั่งซื้อใหม่) จะหายไปจากเว็บ แต่ระบบจะสำรองข้อมูลปัจจุบันไว้ก่อน ย้อนกลับได้`}>กู้คืน</SubmitButton>
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="text-sm text-muted">ยังไม่มีไฟล์สำรอง — กด &ldquo;สำรองตอนนี้&rdquo; ในข้อ 1</p>}
          <p className="mt-3 text-xs text-muted">เก็บอัตโนมัติ 14 วัน · กดสำรองเอง 10 ไฟล์ล่าสุด · ก่อนกู้คืน 5 ไฟล์ · โฟลเดอร์: <code className="break-all">{backupDir()}</code> (อยู่นอกเว็บ คนนอกเปิดไม่ได้)</p>
        </Step>
      )}

      {file && (
        <Step n={4} id="s-upload" title="กู้คืนจากไฟล์ในเครื่อง" desc="อัปโหลดไฟล์ .db ที่เคยดาวน์โหลดไว้ (หรือ entech.db ในชุดสำรองครบ) → ไฟล์จะขึ้นในรายการข้อ 3 แล้วกด “กู้คืน”">
          <form action="/admin/backup/upload" method="post" encType="multipart/form-data" className="flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".db,application/octet-stream" required className="input max-w-sm" aria-label="ไฟล์สำรอง (.db)" />
            <button className="btn-outline">อัปโหลดไฟล์สำรอง</button>
          </form>
        </Step>
      )}
    </div>
  );
}
