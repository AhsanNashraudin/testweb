'use client';
import { useEffect, useRef, useState } from 'react';
import { PROVINCES } from '@/lib/provinces';
import { Field, focusFirstError } from './field';

export function QuoteForm({ topics, source = '', defaultDetail = '' }: { topics: string[]; source?: string; defaultDetail?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const ref = useRef<HTMLFormElement>(null);
  const [errTick, setErrTick] = useState(0);
  // focus หลัง React วาด error เสร็จแล้วเท่านั้น (กัน focus ก่อน aria-invalid ถูกใส่)
  useEffect(() => { if (errTick) focusFirstError(ref.current); }, [errTick]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch('/api/quotes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (r?.ok) return setState('done');
    const j = r ? await r.json().catch(() => ({})) : {};
    const fields = j.fields ?? {};
    setErrs({ ...fields, _: !r ? 'เชื่อมต่อไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่' : Object.keys(fields).length ? `กรุณาตรวจสอบข้อมูล ${Object.keys(fields).length} ช่อง` : 'ส่งไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อทาง LINE' });
    setState('idle');
    setErrTick((t) => t + 1);
  }
  // ล้าง error ของช่องที่กำลังแก้
  const clear = (e: React.FormEvent<HTMLFormElement>) => {
    const n = (e.target as HTMLInputElement).name;
    if (errs[n]) setErrs((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== n && k !== '_')));
  };
  if (state === 'done') return <div className="card p-8 text-center" role="status"><p className="text-xl font-bold text-success">✓ ได้รับข้อมูลแล้ว</p><p className="text-muted">ทีมงานจะติดต่อกลับภายใน 1 วันทำการ</p></div>;
  return (
    <form ref={ref} onSubmit={submit} onInput={clear} noValidate className="card grid gap-4 p-6 md:grid-cols-2">
      <Field id="q-name" label="ชื่อ-นามสกุล *" err={errs.name}><input name="name" className="input" autoComplete="name" /></Field>
      <Field id="q-company" label="บริษัท / หน่วยงาน"><input name="company" className="input" autoComplete="organization" /></Field>
      <Field id="q-phone" label="เบอร์โทรศัพท์ *" err={errs.phone}><input name="phone" className="input" inputMode="tel" autoComplete="tel" /></Field>
      <Field id="q-email" label="อีเมล" err={errs.email}><input name="email" type="email" className="input" autoComplete="email" /></Field>
      <Field id="q-topic" label="หัวข้อ *" err={errs.topic}><select name="topic" className="input">{topics.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field id="q-province" label="จังหวัดหน้างาน"><select name="province" className="input"><option value="">—</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field id="q-detail" label="รายละเอียด" className="md:col-span-2"><textarea name="detail" rows={4} className="input" defaultValue={defaultDetail} placeholder="ปริมาณน้ำเสีย/จำนวนผู้ใช้งาน ขนาดพื้นที่ ระยะเวลาที่ต้องการ" /></Field>
      <input type="hidden" name="source" value={source} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {errs._ && <p className="err md:col-span-2" role="alert">{errs._}</p>}
      <button className="btn-primary md:col-span-2" disabled={state === 'sending'}>{state === 'sending' ? 'กำลังส่ง…' : 'ส่งข้อมูล'}</button>
      <p className="text-xs text-muted md:col-span-2">เมื่อส่งข้อมูล ถือว่าท่านยอมรับ<a href="/privacy" target="_blank" className="underline">นโยบายความเป็นส่วนตัว</a> (PDPA) และยินยอมให้ติดต่อกลับ</p>
    </form>
  );
}
