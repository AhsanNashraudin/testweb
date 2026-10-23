'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { recordOutputAction } from '../../actions';

const REASONS = ['รั่วซึม', 'ฟองอากาศ', 'ผิวไม่เรียบ', 'ผนังบาง', 'อื่นๆ'];

function Stepper({ label, name, value, set, tone, max = 10_000 }: { label: string; name: string; value: number; set: (n: number) => void; tone: 'ok' | 'bad'; max?: number }) {
  const clamp = (n: number) => Math.min(max, Math.max(0, n));
  const c = tone === 'ok' ? 'bg-success-50 text-success' : 'bg-danger-50 text-sale';
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <button type="button" onClick={() => set(clamp(value - 1))} disabled={value <= 0} className="grid size-16 shrink-0 place-items-center rounded-xl bg-slate-100 text-3xl font-bold active:bg-slate-300 disabled:opacity-40" aria-label={`ลด${label}`}>−</button>
        <input name={name} type="number" inputMode="numeric" min={0} max={max} value={value} onChange={(e) => set(clamp(Number(e.target.value) || 0))}
          aria-label={label} className={`num-big w-full min-w-0 bg-transparent text-center text-4xl font-bold outline-none ${tone === 'ok' ? 'text-success' : 'text-sale'}`} />
        <button type="button" onClick={() => set(clamp(value + 1))} disabled={value >= max} className={`grid size-16 shrink-0 place-items-center rounded-xl text-3xl font-bold active:brightness-90 disabled:opacity-40 ${c}`} aria-label={`เพิ่ม${label}`}>+</button>
      </div>
    </fieldset>
  );
}

export function OutputForm({ id, remaining }: { id: number; remaining: number }) {
  const [good, setGood] = useState(0); // เริ่มที่ 0 กันบันทึกเกินโดยไม่ตั้งใจ
  const [reject, setReject] = useState(0);
  const router = useRouter();
  return (
    <ActionForm action={recordOutputAction} onSuccess={() => { setGood(0); setReject(0); router.refresh(); }} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <Stepper label={`ผ่านทดสอบรั่วซึม (ใบ) · เหลือ ${remaining}`} name="good" value={good} set={setGood} tone="ok" max={remaining} />
      <Stepper label="ไม่ผ่าน / ต้องซ่อม (ใบ)" name="reject" value={reject} set={setReject} tone="bad" />
      {reject > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">สาเหตุที่ไม่ผ่าน</legend>
          <div className="flex flex-wrap gap-2">{REASONS.map((r, i) => (
            <label key={r} className="cursor-pointer">
              <input type="radio" name="reason" value={r} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium peer-checked:border-sale peer-checked:bg-danger-50 peer-checked:text-sale peer-focus-visible:outline-2 peer-focus-visible:outline-cyan-600">{r}</span>
            </label>
          ))}</div>
        </fieldset>
      )}
      <SubmitButton className="btn-primary min-h-16 w-full text-lg" disabled={good + reject === 0}>บันทึก {good + reject} ใบ</SubmitButton>
      {good + reject === 0 && <p className="text-center text-sm text-muted">กด + เพื่อใส่จำนวนก่อนบันทึก</p>}
    </ActionForm>
  );
}
