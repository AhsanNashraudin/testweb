'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cart, useCart } from './cart-store';
import { usePreview } from './use-preview';
import { Row, ErrorBox } from './cart-view';
import { Field, focusFirstError } from './field';
import { PROVINCES } from '@/lib/provinces';
import { baht } from '@/lib/format';
import { vatOf } from '@/lib/pricing';

type Form = { name: string; phone: string; email: string; address: string; province: string; postcode: string; taxName: string; taxId: string; taxBranch: string; taxAddress: string; note: string; paymentMethod: 'promptpay' | 'transfer' };
const EMPTY: Form = { name: '', phone: '', email: '', address: '', province: '', postcode: '', taxName: '', taxId: '', taxBranch: '', taxAddress: '', note: '', paymentMethod: 'promptpay' };

export function CheckoutForm({ pickupAddress }: { pickupAddress: string }) {
  const router = useRouter();
  const items = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [errTick, setErrTick] = useState(0);
  // focus หลัง React วาด error เสร็จแล้วเท่านั้น
  useEffect(() => { if (errTick) focusFirstError(formRef.current); }, [errTick]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [f, setF] = useState<Form>(EMPTY);
  const [wantTax, setWantTax] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [ship, setShip] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { data, fresh, loading, error, retry } = usePreview(items, f.province, appliedCoupon);

  // ใช้ค่าส่งเฉพาะที่คำนวณจากจังหวัดปัจจุบันเท่านั้น (กันแสดงค่าส่งของจังหวัดก่อนหน้า)
  const options = useMemo(() => (fresh && data ? data.shippingOptions : []), [fresh, data]);
  useEffect(() => {
    if (!fresh) return;
    if (!options.find((o) => o.id === ship)) setShip(options[0]?.id ?? '');
  }, [options, ship, fresh]);
  // ถ้ายังไม่เปิดรับโอน ให้กลับไปใช้ PromptPay
  useEffect(() => { if (data && !data.transferEnabled && f.paymentMethod === 'transfer') setF((x) => ({ ...x, paymentMethod: 'promptpay' })); }, [data, f.paymentMethod]);

  const clearErr = (...keys: string[]) => setErrs((e) => (keys.some((k) => e[k]) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k) && k !== '_')) : e));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    clearErr(k, ...(k === 'province' ? ['shippingOptionId'] : []));
  };
  const chosen = options.find((o) => o.id === ship);
  const isPickup = ship === 'pickup';
  const beforeVat = data ? data.subtotal - data.discount + (chosen?.fee ?? 0) : 0;
  const vat = data ? vatOf(beforeVat, data.pricesIncludeVat) : 0; // คำนวณแบบเดียวกับเซิร์ฟเวอร์
  const total = beforeVat + vat;
  const blocked = !!data?.hasErrors || !!error || (loading && !fresh);
  const reason = data?.hasErrors ? 'ปรับรายการสินค้า/โค้ดส่วนลดที่มีปัญหาก่อน' : error ? 'ยังคำนวณยอดล่าสุดไม่ได้' : loading && !fresh ? 'กำลังคำนวณยอด…' : !f.province ? 'เลือกจังหวัดเพื่อคำนวณค่าส่ง' : '';

  if (!hydrated) return <p className="py-20 text-center text-muted">กำลังโหลด…</p>;
  if (!items.length) return <div className="card p-12 text-center"><p className="mb-4">ตะกร้าว่าง</p><Link href="/products" className="btn-primary">เลือกซื้อสินค้า</Link></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || blocked) return;
    setSubmitting(true); setErrs({});
    try {
      const r = await fetch('/api/orders', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, wantTax, items, couponCode: appliedCoupon, shippingOptionId: ship }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const fields: Record<string, string> = j.fields ?? {};
        const n = Object.keys(fields).filter((k) => k !== 'items').length;
        setErrs({ ...fields, _: n ? `กรุณาตรวจสอบข้อมูล ${n} ช่องที่มีกรอบสีแดง` : (j.error ?? 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่') });
        if (fields.items) retry(); // สต็อก/ราคาเปลี่ยน → ดึงยอดล่าสุด
        setErrTick((t) => t + 1);
        return;
      }
      cart.clear();
      router.push(`/order/${j.code}?k=${j.key}`);
    } catch {
      setErrs({ _: 'เชื่อมต่อไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitBtn = (label: string, cls = '') => (
    <button className={`btn-primary py-3 ${cls}`} disabled={submitting || blocked} aria-describedby="submit-note">
      {submitting ? 'กำลังสั่งซื้อ…' : label}
    </button>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-8 pb-24 lg:grid-cols-[1fr_400px] lg:pb-0 [&>*]:min-w-0">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-xl font-bold text-navy-900">1. ข้อมูลผู้ติดต่อ</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="name" label="ชื่อ-นามสกุล *" err={errs.name}><input className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
            <Field id="phone" label="เบอร์โทรศัพท์ *" err={errs.phone}><input type="tel" className="input" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" /></Field>
          </div>
          <Field id="email" label="อีเมล *" err={errs.email} hint="ใช้ส่งรายละเอียดคำสั่งซื้อ และค้นหาคำสั่งซื้อภายหลัง"><input type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" spellCheck={false} /></Field>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-xl font-bold text-navy-900">2. จังหวัดและวิธีจัดส่ง</h2>
          <Field id="province" label="จังหวัด * (ค่าส่งคำนวณอัตโนมัติ)" err={errs.province ?? (fresh ? data?.provinceError : undefined)}>
            <select className="input" value={f.province} onChange={set('province')} autoComplete="address-level1">
              <option value="">— เลือกจังหวัด —</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          {f.province && (
            <div className="space-y-2" role="radiogroup" aria-label="วิธีจัดส่ง" aria-busy={loading}>
              {error ? <ErrorBox msg={error} retry={retry} /> : !fresh ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-muted" role="status">กำลังคำนวณค่าส่งสำหรับ {f.province}…</p>
              ) : options.map((o) => (
                <label key={o.id} data-testid="ship-option" className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-cyan-500/40 ${ship === o.id ? 'border-2 border-cyan-600 bg-cyan-100' : 'border-slate-200 hover:border-slate-400'}`}>
                  <input type="radio" name="ship" value={o.id} checked={ship === o.id} onChange={() => { setShip(o.id); clearErr('shippingOptionId', 'address', 'postcode'); }} className="h-5 w-5 accent-navy-700" />
                  <span className="flex-1"><span className="block font-semibold">{o.label}</span><span className="text-sm text-muted">{o.eta}</span></span>
                  <span className="font-bold text-navy-700" data-testid="ship-fee">{o.isFree ? 'ฟรี' : baht(o.fee)}</span>
                </label>
              ))}
              {errs.shippingOptionId && <p className="err" role="alert">{errs.shippingOptionId}</p>}
            </div>
          )}
          {isPickup ? (
            <p className="rounded-xl bg-navy-50 p-4 text-sm" data-testid="pickup-info">📍 รับสินค้าที่: {pickupAddress} — ทีมงานจะโทรนัดวันรับหลังยืนยันการชำระเงิน</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <Field id="address" label="ที่อยู่จัดส่ง *" err={errs.address}><input className="input" value={f.address} onChange={set('address')} placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ" autoComplete="street-address" /></Field>
              <Field id="postcode" label="รหัสไปรษณีย์ *" err={errs.postcode}><input className="input" value={f.postcode} onChange={set('postcode')} inputMode="numeric" maxLength={5} autoComplete="postal-code" /></Field>
            </div>
          )}
          <label className="flex items-center gap-3 py-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-navy-700" checked={wantTax} onChange={(e) => { setWantTax(e.target.checked); clearErr('taxName', 'taxId', 'taxAddress'); }} /> ต้องการใบกำกับภาษีเต็มรูป (นิติบุคคล)</label>
          {wantTax && (
            <div className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
              <Field id="taxName" label="ชื่อบริษัท / ผู้เสียภาษี *" err={errs.taxName}><input className="input" value={f.taxName} onChange={set('taxName')} autoComplete="organization" /></Field>
              <Field id="taxId" label="เลขประจำตัวผู้เสียภาษี (13 หลัก) *" err={errs.taxId}><input className="input" value={f.taxId} onChange={set('taxId')} inputMode="numeric" maxLength={13} autoComplete="off" spellCheck={false} /></Field>
              <Field id="taxBranch" label="สาขา" hint="เว้นว่าง = สำนักงานใหญ่"><input className="input" value={f.taxBranch} onChange={set('taxBranch')} placeholder="สำนักงานใหญ่" /></Field>
              <Field id="taxAddress" label="ที่อยู่สำหรับออกใบกำกับภาษี *" err={errs.taxAddress} className="md:col-span-2">
                <textarea className="input" rows={2} value={f.taxAddress} onChange={set('taxAddress')} />
              </Field>
              {!isPickup && f.address && <button type="button" className="btn-outline md:col-span-2 md:justify-self-start" onClick={() => { setF({ ...f, taxAddress: `${f.address} จ.${f.province} ${f.postcode}`.trim() }); clearErr('taxAddress'); }}>ใช้ที่อยู่เดียวกับที่อยู่จัดส่ง</button>}
            </div>
          )}
          <Field id="note" label="หมายเหตุถึงร้านค้า" err={errs.note}><textarea className="input" rows={2} value={f.note} onChange={set('note')} /></Field>
        </section>

        <section className="card space-y-3 p-6">
          <h2 className="text-xl font-bold text-navy-900">3. วิธีชำระเงิน</h2>
          {([['promptpay', 'PromptPay QR (สแกนจ่ายทันที)'], ['transfer', 'โอนผ่านบัญชีธนาคาร (แนบสลิปภายหลัง)']] as const).map(([v, l]) => {
            const off = v === 'transfer' && data && !data.transferEnabled;
            return (
              <label key={v} className={`flex items-center gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-cyan-500/40 ${off ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${f.paymentMethod === v ? 'border-2 border-cyan-600 bg-cyan-100' : 'border-slate-200'}`}>
                <input type="radio" name="pay" className="h-5 w-5 accent-navy-700" disabled={!!off} checked={f.paymentMethod === v} onChange={() => setF({ ...f, paymentMethod: v })} /> {l}{off && <span className="text-sm text-muted">— ยังไม่เปิดให้บริการ</span>}
              </label>
            );
          })}
          {errs.paymentMethod && <p className="err" role="alert">{errs.paymentMethod}</p>}
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-40" aria-label="สรุปคำสั่งซื้อ">
        <h2 className="text-xl font-bold text-navy-900">รายการสั่งซื้อ</h2>
        {!data && loading && <div className="space-y-2" role="status" aria-label="กำลังโหลด">{[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-slate-200" />)}</div>}
        {data?.lines.map((l) => (
          <div key={l.variantId} className="flex justify-between gap-3 text-sm">
            <span>{l.productName} <span className="text-muted">({l.variantName}) ×{l.qty}</span>{l.error && <span className="err block">{l.error} — <Link href="/cart" className="underline">แก้ในตะกร้า</Link></span>}</span>
            <span className="shrink-0">{baht(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        <hr className="border-slate-200" />
        <div className="flex gap-2">
          <input aria-label="โค้ดส่วนลด" className="input" placeholder="กรอกโค้ดส่วนลด…" autoComplete="off" spellCheck={false} autoCapitalize="characters" value={coupon} onChange={(e) => setCoupon(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAppliedCoupon(coupon.trim().toUpperCase()); } }} />
          <button type="button" className="btn-outline" onClick={() => setAppliedCoupon(coupon.trim().toUpperCase())}>ใช้</button>
        </div>
        {data?.couponError && appliedCoupon && <p className="err" data-testid="coupon-error" role="alert">{data.couponError} <button type="button" className="underline" onClick={() => { setAppliedCoupon(''); setCoupon(''); }}>ยกเลิกโค้ด</button></p>}
        {data && <>
          <Row a="ยอดรวมสินค้า" b={baht(data.subtotal)} />
          {data.discount > 0 && <Row a={`ส่วนลด (${appliedCoupon})`} b={`-${baht(data.discount)}`} cls="text-sale" />}
          <Row a="ค่าจัดส่ง" b={chosen ? (chosen.isFree ? 'ฟรี' : baht(chosen.fee)) : f.province ? '—' : 'เลือกจังหวัด'} />
          {vat > 0 && <Row a="VAT 7%" b={baht(vat)} />}
          <div data-testid="total" aria-live="polite"><Row a="ยอดชำระทั้งหมด" b={baht(total)} strong /></div>
          <p className="text-xs text-muted">{data.pricesIncludeVat ? 'ราคารวมภาษีมูลค่าเพิ่ม 7% แล้ว' : 'ราคาสินค้ายังไม่รวม VAT — บวก VAT 7% ในยอดชำระแล้ว'}</p>
        </>}
        {errs._ && <p className="err" role="alert" data-testid="form-error">{errs.items ? errs.items : errs._}</p>}
        {submitBtn('ยืนยันคำสั่งซื้อ', 'w-full')}
        <p id="submit-note" className="text-center text-xs text-muted">{reason || <>การกดยืนยันถือว่ายอมรับ<a href="/terms" target="_blank" className="underline">เงื่อนไขการสั่งซื้อ</a>และ<a href="/privacy" target="_blank" className="underline">นโยบายความเป็นส่วนตัว</a> (PDPA)</>}</p>
      </aside>

      {/* แถบยอดรวมติดขอบล่างบนมือถือ */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,.06)] lg:hidden">
        <div className="flex-1"><p className="text-xs text-muted">ยอดชำระ{chosen ? '' : ' (ยังไม่รวมค่าส่ง)'}</p><p className="text-lg font-bold text-navy-700">{data ? baht(total) : '…'}</p></div>
        {submitBtn('สั่งซื้อเลย')}
      </div>
    </form>
  );
}
