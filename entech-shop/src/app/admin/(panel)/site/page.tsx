import { ActionForm, SubmitButton } from '@/components/action-form';
import { getContact, type Contact } from '@/lib/content';
import { saveContact } from '../actions';

export const metadata = { title: 'ข้อมูลร้าน & ติดต่อ' };

const FIELDS: { k: keyof Contact; label: string; hint?: string; wide?: boolean; type?: string }[] = [
  { k: 'company', label: 'ชื่อบริษัท *' },
  { k: 'regNo', label: 'เลขทะเบียนนิติบุคคล' },
  { k: 'phone', label: 'เบอร์โทรหลัก *', hint: 'เช่น 02-813-0971-5' },
  { k: 'mobile', label: 'เบอร์มือถือ', hint: 'ใช้กับปุ่มโทรลอยด้านล่างจอมือถือ' },
  { k: 'email', label: 'อีเมล', type: 'email' },
  { k: 'hours', label: 'เวลาทำการ' },
  { k: 'line', label: 'LINE ID *', hint: 'เช่น @entechproducts' },
  { k: 'lineUrl', label: 'ลิงก์ LINE', hint: 'https://line.me/R/ti/p/@...' },
  { k: 'facebook', label: 'ลิงก์ Facebook', hint: 'https://www.facebook.com/...' },
  { k: 'facebookName', label: 'ชื่อ Facebook ที่แสดง', hint: 'เช่น @Entechproducts2026' },
  { k: 'address', label: 'ที่อยู่', wide: true },
  { k: 'mapUrl', label: 'ลิงก์ Google Maps', wide: true, hint: 'เปิด Google Maps → แชร์ → คัดลอกลิงก์ มาวาง' },
  { k: 'topbar', label: 'ข้อความแถบบนสุดของเว็บ', wide: true, hint: 'แสดงบนคอมพิวเตอร์ ข้างเบอร์โทร · เว้นว่าง = ไม่แสดง' },
];

export default async function SiteSettings() {
  const c = await getContact();
  return (
    <ActionForm action={saveContact} className="max-w-3xl space-y-5">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-slate-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลร้าน & ติดต่อ</h1>
          <p className="text-sm text-muted">แก้ที่นี่ที่เดียว เปลี่ยนทุกหน้า (หัวเว็บ ท้ายเว็บ หน้าติดต่อ คำสั่งซื้อ ฯลฯ)</p>
        </div>
        <SubmitButton>บันทึก</SubmitButton>
      </div>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.k} className={f.wide ? 'sm:col-span-2' : ''}>
            <label className="label" htmlFor={f.k}>{f.label}</label>
            {f.k === 'address'
              ? <textarea id={f.k} name={f.k} defaultValue={c[f.k]} rows={2} className="input" maxLength={300} />
              : <input id={f.k} name={f.k} type={f.type ?? 'text'} defaultValue={c[f.k]} className="input" maxLength={300} />}
            {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
          </div>
        ))}
      </section>
    </ActionForm>
  );
}
