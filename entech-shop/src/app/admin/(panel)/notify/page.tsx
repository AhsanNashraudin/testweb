import { ActionForm, SubmitButton } from '@/components/action-form';
import { LEVELS, getNotify, lineReady, type Member } from '@/lib/notify';
import { ALL_QUOTE_TOPICS } from '@/lib/status';
import { SITE_URL } from '@/lib/site';
import { deleteMember, saveMember, saveNotifySettings, testMember } from '../actions';

export const metadata = { title: 'ทีมขาย & แจ้งเตือน' };
export const dynamic = 'force-dynamic';

const LEVEL_DESC: Record<keyof typeof LEVELS, string> = {
  sales: 'รับเฉพาะลูกค้าที่ระบบเวียนคิวมอบหมายให้ (ตามหัวข้อที่เลือก) + เตือนเมื่อยังไม่ติดต่อกลับ',
  lead: 'รับทุกฟอร์ม + ชื่อผู้ดูแล · คำสั่งซื้อใหม่ · เตือนเมื่อลูกค้ารอนาน',
  exec: 'รับคำสั่งซื้อใหม่ · ยกระดับเมื่อลูกค้ารอนานเกินกำหนด',
};

function MemberForm({ m }: { m?: Member }) {
  return (
    <ActionForm action={saveMember} className="grid gap-3 md:grid-cols-[1fr_1.4fr_1fr]">
      {m && <input type="hidden" name="id" value={m.id} />}
      <label className="text-sm">ชื่อ<input name="name" defaultValue={m?.name} required className="input mt-1" placeholder="เช่น คุณเอ (เซลล์) / กลุ่มฝ่ายขาย" /></label>
      <label className="text-sm">LINE ID<input name="lineId" defaultValue={m?.lineId} className="input mt-1 font-mono text-xs" placeholder="U… (คน) หรือ C… (กลุ่ม)" spellCheck={false} /></label>
      <label className="text-sm">ระดับ
        <select name="level" defaultValue={m?.level ?? 'sales'} className="input mt-1">{Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </label>
      <fieldset className="text-sm md:col-span-3">
        <legend className="mb-1">หัวข้อที่ดูแล <span className="text-xs text-muted">(เฉพาะระดับ 1 · ไม่เลือก = ทุกหัวข้อ)</span></legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ALL_QUOTE_TOPICS.map((t) => <label key={t} className="flex items-center gap-1.5"><input type="checkbox" name="topics" value={t} defaultChecked={m?.topics.includes(t)} className="h-4 w-4" />{t}</label>)}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={m?.active ?? true} className="h-5 w-5" /> เปิดใช้ (รับงาน/แจ้งเตือน)</label>
        <SubmitButton className="btn-primary ml-auto">{m ? 'บันทึก' : '+ เพิ่มรายชื่อ'}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function NotifyPage() {
  const cfg = await getNotify();
  const ready = lineReady();
  const groups = Object.keys(LEVELS) as (keyof typeof LEVELS)[];
  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">ทีมขาย & แจ้งเตือน</h1>
        <p className="text-sm text-muted">ลูกค้าส่งฟอร์ม → ระบบเลือกผู้ดูแลแบบเวียนคิว → แจ้ง LINE ตามระดับ → ถ้าไม่มีใครติดต่อกลับตามเวลา ระบบเตือนซ้ำและยกระดับให้หัวหน้า/ผู้บริหาร</p>
      </div>

      <section className="card p-5">
        <h2 className="font-bold">1. การเชื่อม LINE</h2>
        {ready
          ? <p className="mt-2 rounded-lg bg-success-50 p-3 text-sm text-success" data-testid="line-status">✓ เชื่อม LINE แล้ว</p>
          : <p className="mt-2 rounded-lg bg-warning-50 p-3 text-sm text-warning" data-testid="line-status">ยังไม่เชื่อม LINE — ระบบยังมอบหมายผู้ดูแลได้ตามปกติ แต่ยังไม่ส่งข้อความ</p>}
        <details className="mt-3 text-sm" open={!ready}>
          <summary className="cursor-pointer font-semibold">วิธีตั้งค่า (ทำครั้งเดียว)</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>เข้า <b>LINE Official Account Manager</b> ของบริษัท → ตั้งค่า → Messaging API → เปิดใช้งาน (สร้าง OA ใหม่สำหรับแจ้งเตือนภายในก็ได้)</li>
            <li>เข้า <b>LINE Developers Console</b> → Channel ที่ได้ → คัดลอก <b>Channel secret</b> และกด Issue <b>Channel access token (long-lived)</b></li>
            <li>ใส่ในโฮสต์ (Plesk → Node.js → Environment Variables): <code>LINE_CHANNEL_TOKEN</code> และ <code>LINE_CHANNEL_SECRET</code> → Restart</li>
            <li>ตั้ง Webhook URL: <code className="break-all">{SITE_URL}/api/line/webhook</code> → เปิด Use webhook · เปิด &ldquo;Allow bot to join group chats&rdquo;</li>
            <li><b>หา LINE ID:</b> เพิ่มบอทเข้ากลุ่ม (เช่น กลุ่มฝ่ายขาย) → บอทตอบ ID ของกลุ่มให้ทันที · รายบุคคล: แอดบอทเป็นเพื่อนแล้วพิมพ์ <code>id</code></li>
          </ol>
        </details>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">2. เวลาเตือน</h2>
        <ActionForm action={saveNotifySettings} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm">เตือนผู้ดูแล + หัวหน้า เมื่อยังเป็น &ldquo;ใหม่&rdquo; เกิน (ชม.)<input name="remindHours" type="number" min={1} max={72} defaultValue={cfg.remindHours} className="input mt-1" /></label>
          <label className="text-sm">ยกระดับแจ้งผู้บริหาร เมื่อเกิน (ชม.)<input name="escalateHours" type="number" min={2} max={240} defaultValue={cfg.escalateHours} className="input mt-1" /></label>
          <SubmitButton>บันทึก</SubmitButton>
          <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" name="orders" defaultChecked={cfg.orders} className="h-5 w-5" /> แจ้งคำสั่งซื้อใหม่ (หน้าร้านออนไลน์) ให้ระดับ 2 และ 3</label>
        </ActionForm>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">3. รายชื่อผู้รับแจ้งเตือน</h2>
        {groups.map((lv) => {
          const list = cfg.team.filter((m) => m.level === lv);
          return (
            <div key={lv}>
              <h3 className="text-sm font-bold text-navy-700">{LEVELS[lv]} <span className="font-normal text-muted">— {LEVEL_DESC[lv]}</span></h3>
              {list.length ? (
                <ul className="mt-2 space-y-2">
                  {list.map((m) => (
                    <li key={m.id} className="rounded-xl border border-slate-200 p-3" data-testid="member">
                      <details>
                        <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                          <b>{m.name}</b>
                          {!m.active && <span className="rounded-full bg-slate-100 px-2 text-xs text-muted">ปิดอยู่</span>}
                          {!m.lineId && <span className="rounded-full bg-warning-50 px-2 text-xs text-warning">ยังไม่ใส่ LINE ID</span>}
                          {lv === 'sales' && <span className="text-xs text-muted">{m.topics.length ? m.topics.join(' · ') : 'ทุกหัวข้อ'}</span>}
                          <span className="ml-auto text-xs text-navy-700 underline">แก้ไข</span>
                        </summary>
                        <div className="mt-3 space-y-3">
                          <MemberForm m={m} />
                          <div className="flex flex-wrap gap-2">
                            <ActionForm action={testMember}><input type="hidden" name="id" value={m.id} /><SubmitButton className="btn-outline text-sm" pendingText="กำลังส่ง…">ส่งข้อความทดสอบ</SubmitButton></ActionForm>
                            <ActionForm action={deleteMember}><input type="hidden" name="id" value={m.id} /><SubmitButton className="btn-danger text-sm" confirm={`ลบ ${m.name} ออกจากรายชื่อ?`}>ลบ</SubmitButton></ActionForm>
                          </div>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-sm text-muted">ยังไม่มี</p>}
            </div>
          );
        })}
        <div className="rounded-xl bg-navy-50 p-4" data-testid="add-member">
          <h3 className="mb-3 font-bold">เพิ่มรายชื่อ</h3>
          <MemberForm />
        </div>
      </section>
    </div>
  );
}
