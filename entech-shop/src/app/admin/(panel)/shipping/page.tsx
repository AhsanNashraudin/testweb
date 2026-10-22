import { loadShippingConfig } from '@/lib/settings';
import { PROVINCES, REGIONS, isProvince } from '@/lib/provinces';
import { quoteShipping } from '@/lib/shipping';
import { baht } from '@/lib/format';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { saveZone, saveProvinceMap, savePickup, applyCompareMarkup } from '../actions';
import { requireAdmin } from '@/lib/admin';

export const metadata = { title: 'ค่าจัดส่ง & การชำระเงิน' };

type Z = Awaited<ReturnType<typeof loadShippingConfig>>['zones'][number];

function ZoneForm({ z }: { z?: Z }) {
  const k = z?.id ?? 'new';
  return (
    <ActionForm action={saveZone} resetOnSuccess={!z} className="card grid gap-3 p-5 md:grid-cols-4" data-testid={`zone-${k}`}>
      {z && <input type="hidden" name="id" value={z.id} />}
      <div className="md:col-span-2"><label className="label" htmlFor={`name-${k}`}>ชื่อโซน</label><input id={`name-${k}`} name="name" defaultValue={z?.name} className="input" required placeholder="เช่น ภาคเหนือ" /></div>
      <div><label className="label" htmlFor={`method-${k}`}>วิธีคิดค่าส่ง</label>
        <select id={`method-${k}`} name="method" defaultValue={z?.method ?? 'flat'} className="input"><option value="flat">คงที่ต่อออเดอร์</option><option value="weight">ตามน้ำหนัก</option></select></div>
      <div><label className="label" htmlFor={`eta-${k}`}>ระยะเวลาจัดส่ง</label><input id={`eta-${k}`} name="etaText" defaultValue={z?.etaText} className="input" placeholder="2–3 วันทำการ" /></div>
      <div><label className="label" htmlFor={`base-${k}`}>ค่าส่งเริ่มต้น (บาท)</label><input id={`base-${k}`} name="baseFee" type="number" min={0} defaultValue={z?.baseFee ?? 0} className="input" required /></div>
      <div><label className="label" htmlFor={`inc-${k}`}>รวมน้ำหนักฟรี (กก.)</label><input id={`inc-${k}`} name="includedKg" type="number" min={0} step="0.1" defaultValue={z?.includedKg ?? 0} className="input" /></div>
      <div><label className="label" htmlFor={`kg-${k}`}>กก.ละ (บาท) ส่วนที่เกิน</label><input id={`kg-${k}`} name="perKgFee" type="number" min={0} defaultValue={z?.perKgFee ?? 0} className="input" /></div>
      <div><label className="label" htmlFor={`free-${k}`}>ส่งฟรีเมื่อซื้อครบ (0 = ไม่มี)</label><input id={`free-${k}`} name="freeOver" type="number" min={0} defaultValue={z?.freeOver ?? 0} className="input" /></div>
      <div className="flex flex-wrap items-center gap-5 text-sm md:col-span-4">
        <label className="flex items-center gap-2 py-2"><input type="checkbox" name="isActive" className="h-5 w-5" defaultChecked={z?.isActive ?? true} /> เปิดใช้งาน</label>
        <label className="flex items-center gap-2 py-2"><input type="checkbox" name="isFallback" className="h-5 w-5" defaultChecked={z?.isFallback} /> ใช้เป็นโซนสำรอง (จังหวัดที่ไม่ได้จับคู่)</label>
        <div className="ml-auto flex gap-2">
          {z && <SubmitButton name="_op" value="delete" className="btn-danger" pendingText="…" confirm={`ลบโซน “${z.name}”? จังหวัดในโซนนี้จะไปใช้โซนสำรอง`}>ลบ</SubmitButton>}
          <SubmitButton name="_op" value="save" className={z ? 'btn-outline' : 'btn-primary'}>{z ? 'บันทึกโซน' : 'เพิ่มโซน'}</SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}

export default async function ShippingAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const cfg = await loadShippingConfig();
  const tProv = sp.province ?? '', tSub = Math.max(0, Number(sp.subtotal) || 0), tKg = Math.max(0, Number(sp.weight) || 0);
  const test = isProvince(tProv) ? quoteShipping({ province: tProv, subtotal: tSub, weightKg: tKg, ...cfg }) : null;
  const fallback = cfg.zones.find((z) => z.isFallback && z.isActive);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ค่าจัดส่ง & การชำระเงิน</h1>
        <p className="text-sm text-muted">ลูกค้าเลือกจังหวัดในหน้าชำระเงิน → ระบบหาโซนของจังหวัดนั้น แล้วคำนวณค่าส่งให้อัตโนมัติ (คำนวณซ้ำฝั่งเซิร์ฟเวอร์ตอนสั่งซื้อทุกครั้ง)</p>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-5" data-testid="calc">
        <div><label className="label" htmlFor="t-prov">ทดลองคำนวณ: จังหวัด</label><select id="t-prov" name="province" defaultValue={tProv} className="input"><option value="">—</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div><label className="label" htmlFor="t-sub">ยอดสินค้า (บาท)</label><input id="t-sub" name="subtotal" type="number" min={0} defaultValue={tSub || ''} className="input w-36" /></div>
        <div><label className="label" htmlFor="t-kg">น้ำหนัก (กก.)</label><input id="t-kg" name="weight" type="number" min={0} step="0.1" defaultValue={tKg || ''} className="input w-28" /></div>
        <button className="btn-outline">คำนวณ</button>
        {test && <div className="w-full rounded-lg bg-navy-50 p-3 text-sm" data-testid="calc-result">
          {test.length ? test.map((o) => <p key={o.id}>{o.label}: <b>{o.isFree ? 'ฟรี' : baht(o.fee)}</b> {o.eta && `(${o.eta})`}</p>) : <p className="text-sale">ไม่มีวิธีจัดส่งสำหรับจังหวัดนี้</p>}
        </div>}
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">โซนค่าส่ง</h2>
        {!fallback && <p className="rounded-lg bg-warning-50 p-3 text-sm text-warning">⚠ ยังไม่มีโซนสำรองที่เปิดใช้งาน — จังหวัดที่ไม่ได้จับคู่จะสั่งซื้อแบบจัดส่งไม่ได้ (รับเองได้อย่างเดียว)</p>}
        {cfg.zones.map((z) => <ZoneForm key={z.id} z={z} />)}
        <details className="rounded-2xl border border-dashed border-slate-300 p-3"><summary className="cursor-pointer font-semibold text-navy-700">+ เพิ่มโซนใหม่</summary><div className="mt-3"><ZoneForm /></div></details>
      </section>

      <ActionForm action={saveProvinceMap} className="card space-y-4 p-5">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold">จับคู่จังหวัด → โซน</h2>
            <p className="text-sm text-muted">จังหวัดที่เลือก “ใช้โซนสำรอง” จะใช้โซน: <b>{fallback?.name ?? 'ไม่มี'}</b> · จับคู่แล้ว {Object.keys(cfg.provinceZone).length}/77 จังหวัด</p>
          </div>
          <SubmitButton>บันทึกการจับคู่</SubmitButton>
        </div>
        {REGIONS.map(([region, provs]) => {
          const mapped = provs.filter((p) => cfg.provinceZone[p]).length;
          return (
            <details key={region} className="group rounded-xl border border-slate-200" open={region.startsWith('กรุงเทพ')}>
              <summary className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 font-semibold">
                <span>{region} <span className="font-normal text-muted">({provs.length} จังหวัด · จับคู่ {mapped})</span></span>
                <span aria-hidden className="transition group-open:rotate-180">▾</span>
              </summary>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {provs.map((p) => (
                  <label key={p} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5 text-sm">
                    <span>{p}</span>
                    <select name={`p:${p}`} defaultValue={cfg.provinceZone[p] ?? ''} className="min-h-9 min-w-0 max-w-[55%] rounded-md border border-slate-300 px-2 text-sm" aria-label={`โซนของ ${p}`}>
                      <option value="">ใช้โซนสำรอง</option>
                      {cfg.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </details>
          );
        })}
      </ActionForm>

      <ActionForm action={savePickup} className="card grid gap-4 p-5 md:grid-cols-2">
        <h2 className="text-xl font-bold md:col-span-2">รับเองที่โรงงาน</h2>
        <label className="flex items-center gap-2 py-2 text-sm md:col-span-2"><input type="checkbox" name="pickup_enabled" className="h-5 w-5" defaultChecked={cfg.pickup.enabled} /> เปิดให้ลูกค้าเลือก “รับเองที่โรงงาน” (ค่าส่ง 0 บาท)</label>
        <div><label className="label" htmlFor="pl">ข้อความตัวเลือก</label><input id="pl" name="pickup_label" defaultValue={cfg.pickup.label} className="input" /></div>
        <div><label className="label" htmlFor="pe">เวลาให้เข้ารับ</label><input id="pe" name="pickup_eta" defaultValue={cfg.pickup.eta} className="input" /></div>
        <h2 className="mt-2 border-t border-slate-200 pt-4 text-xl font-bold md:col-span-2">การชำระเงิน</h2>
        <label className="flex items-center gap-2 py-2 text-sm md:col-span-2"><input type="checkbox" name="prices_include_vat" className="h-5 w-5" defaultChecked={cfg.settings.prices_include_vat === '1'} /> ราคาสินค้าในเว็บ <b>รวม VAT แล้ว</b> (ไม่ติ๊ก = ราคายังไม่รวม VAT ระบบจะบวก VAT 7% ตอนชำระเงิน)</label>
        <div><label className="label" htmlFor="pp">PromptPay ID (เบอร์มือถือ/เลขผู้เสียภาษี)</label><input id="pp" name="promptpay_id" defaultValue={cfg.settings.promptpay_id} className="input" inputMode="numeric" /></div>
        <div><label className="label" htmlFor="ppn">ชื่อบัญชี PromptPay (แสดงใต้ QR)</label><input id="ppn" name="promptpay_name" defaultValue={cfg.settings.promptpay_name} className="input" placeholder="บจก. เอนเทค โพรดักส์" /></div>
        <p className="text-sm text-muted md:col-span-2">บัญชีสำหรับ “โอนผ่านธนาคาร” — เว้นว่างทั้ง 3 ช่องเพื่อปิดตัวเลือกนี้ในหน้าชำระเงิน</p>
        <div><label className="label" htmlFor="bn">ธนาคาร</label><input id="bn" name="bank_name" defaultValue={cfg.settings.bank_name} className="input" placeholder="เช่น กสิกรไทย สาขาอ้อมน้อย" /></div>
        <div><label className="label" htmlFor="ba">เลขบัญชี</label><input id="ba" name="bank_account" defaultValue={cfg.settings.bank_account} className="input" inputMode="numeric" placeholder="xxx-x-xxxxx-x" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="bh">ชื่อบัญชี</label><input id="bh" name="bank_holder" defaultValue={cfg.settings.bank_holder} className="input" placeholder="บจก. เอนเทค โพรดักส์" /></div>
        <div className="flex justify-end md:col-span-2"><SubmitButton>บันทึก</SubmitButton></div>
      </ActionForm>

      <ActionForm action={applyCompareMarkup} className="card flex flex-wrap items-end gap-3 p-5">
        <div className="w-full"><h2 className="text-xl font-bold">ราคาก่อนลด (ราคาขีดฆ่า)</h2>
          <p className="text-sm text-muted">ตั้งให้ทุกสินค้าพร้อมกัน = ราคาขาย + % ที่เลือก (ตอนนี้: {cfg.settings.compare_markup ? `+${cfg.settings.compare_markup}%` : 'ไม่แสดง'}) · ราคาก่อนลดควรเป็นราคาที่เคยขายจริง ตามหลักเกณฑ์ สคบ.</p></div>
        <div><label className="label" htmlFor="mk">เลือก</label>
          <select id="mk" name="markup" defaultValue={cfg.settings.compare_markup ?? '0'} className="input"><option value="0">ไม่แสดงราคาก่อนลด</option><option value="20">ราคาขาย +20%</option><option value="40">ราคาขาย +40%</option></select></div>
        <SubmitButton confirm="เปลี่ยนราคาก่อนลดของทุกสินค้า?">ใช้กับทุกสินค้า</SubmitButton>
      </ActionForm>

      <section className="card p-5">
        <h2 className="text-xl font-bold">อ้างอิง: ค่าขนส่งต่อเที่ยว (จาก Price List)</h2>
        <p className="mb-3 text-sm text-muted">ใช้ประกอบการตั้งค่าโซนด้านบน และเสนอราคาออเดอร์ใหญ่ที่ต้องใช้รถพิเศษ</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
          {[['ขนส่งเอกชน', '4,000–5,000'], ['รถบริษัท (In-house)', '8,000'], ['กระบะ', '2,500'], ['6 ล้อ (5 เมตร)', '5,000'], ['6 ล้อ (7 เมตร)', '6,500'], ['สิบล้อ', '8,000'], ['รถเทรลเลอร์', '25,000'], ['เครน 25 ตัน', '10,000']].map(([a, b]) => (
            <tr key={a} className="border-b border-slate-100"><td className="py-2">{a}</td><td className="py-2 text-right font-semibold">฿{b} / เที่ยว</td></tr>))}
        </tbody></table></div>
      </section>
    </div>
  );
}
