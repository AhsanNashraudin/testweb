import { and, eq, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { getSetting } from '@/lib/backoffice';
import { getCompany } from '@/lib/company';
import { webConfigured } from '@/lib/sync';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, PageHead, Stat, thDateTime } from '@/components/bo';
import { settingsAction, syncNowAction } from '../actions';
import { requireUser } from '@/lib/admin';

export const metadata = { title: 'เชื่อมเว็บไซต์ & ตั้งค่า' };

export default async function Settings() {
  await requireUser();
  const [lastRaw, vatIn, company, [items], [orders], [status]] = await Promise.all([
    getSetting('sync_last'), getSetting('prices_include_vat', '0'), getCompany(),
    db.select({ n: sql<number>`count(*)` }).from(s.items).where(eq(s.items.pushPending, true)),
    db.select({ n: sql<number>`count(*)` }).from(s.orders).where(eq(s.orders.channel, 'web')),
    db.select({ n: sql<number>`count(*)` }).from(s.orders).where(and(eq(s.orders.channel, 'web'), eq(s.orders.statusPending, true))),
  ]);
  const last = lastRaw ? (JSON.parse(lastRaw) as { at: number; ok: boolean; msg: string; errors: string[] }) : null;
  const ok = webConfigured();
  return (
    <div className="max-w-5xl space-y-6">
      <PageHead title="เชื่อมเว็บไซต์ & ตั้งค่า" sub="หลังบ้านเป็นระบบแยกจากเว็บไซต์ คุยกันผ่าน Stock API ทุก 5 นาที" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="การเชื่อมต่อ" value={ok ? 'ตั้งค่าแล้ว' : 'ยังไม่ตั้งค่า'} tone={ok ? 'ok' : 'bad'} note={ok ? process.env.WEB_API_URL!.replace(/^https?:\/\//, '') : 'ใส่ WEB_API_URL และ WEB_API_KEY'} />
        <Stat label="ซิงค์ล่าสุด" value={last ? thDateTime(last.at) : '—'} tone={last ? (last.ok ? 'ok' : 'bad') : undefined} note={last ? (last.ok ? 'สำเร็จ' : 'ผิดพลาด') : 'ยังไม่เคยซิงค์'} />
        <Stat label="ออเดอร์จากเว็บ" value={`${orders.n} รายการ`} note={`รอส่งสถานะ ${status.n}`} />
        <Stat label="SKU รอส่งขึ้นเว็บ" value={`${items.n} รายการ`} note="สต็อก/ราคาที่เปลี่ยน" tone={items.n ? 'warn' : 'ok'} />
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-bold">ซิงค์กับเว็บไซต์</h2><p className="mt-1 max-w-xl text-sm text-muted">ทุกรอบ: ① ดึงออเดอร์ใหม่จากเว็บและตัดสต็อก ② ส่งสถานะ/เลขพัสดุกลับให้ลูกค้าเห็น ③ ส่งสต็อกและราคาล่าสุดขึ้นเว็บ</p></div>
          <ActionForm action={syncNowAction}><SubmitButton disabled={!ok} pendingText="กำลังซิงค์…">ซิงค์ตอนนี้</SubmitButton></ActionForm>
        </div>
        {last && <div className={`mt-4 rounded-xl p-3 text-sm ${last.ok ? 'bg-success-50 text-success' : 'bg-danger-50 text-sale'}`}><b>{last.ok ? '✓' : '!'} </b>{last.msg}
          {last.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs">{last.errors.map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          {[['เว็บเป็นเจ้าของ', 'รูป คำอธิบาย หมวด SEO การเปิดขาย และสร้างออเดอร์'], ['หลังบ้านเป็นเจ้าของ', 'SKU ราคา ราคาส่ง สต็อก น้ำหนัก สถานะออเดอร์ เลขพัสดุ'], ['ความปลอดภัย', 'ใช้คีย์ STOCK_API_KEY ของเว็บ เก็บใน env ของเซิร์ฟเวอร์เท่านั้น']].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 p-3"><dt className="font-semibold">{k}</dt><dd className="mt-1 text-muted">{v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-bold">ข้อมูลบริษัท (หัวเอกสาร)</h2><p className="mb-4 text-sm text-muted">ใช้ในใบเสนอราคาและใบกำกับภาษีที่พิมพ์ออกไป</p>
        <ActionForm action={settingsAction} className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="cname">ชื่อบริษัท</label><input id="cname" name="cname" defaultValue={company.name} className="input" /></div>
          <div><label className="label" htmlFor="ctax">เลขประจำตัวผู้เสียภาษี</label><input id="ctax" name="ctax" defaultValue={company.taxId} inputMode="numeric" className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="caddr">ที่อยู่</label><input id="caddr" name="caddr" defaultValue={company.address} className="input" /></div>
          <div><label className="label" htmlFor="cphone">โทร</label><input id="cphone" name="cphone" defaultValue={company.phone} className="input" /></div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="prices_include_vat" defaultChecked={vatIn === '1'} className="size-5" />ราคาขายรวม VAT แล้ว <Badge tone="neutral">ใช้คิดใบเสนอราคา</Badge></label>
          <div className="sm:col-span-2"><SubmitButton>บันทึก</SubmitButton></div>
        </ActionForm>
      </section>
    </div>
  );
}
