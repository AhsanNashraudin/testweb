'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cart } from './cart-store';
import { baht } from '@/lib/format';

type V = { id: number; name: string; price: number; compareAtPrice: number; stock: number; bulkPrice: number; bulkMinQty: number };

export function AddToCart({ variants, vatIncluded, lineUrl, quoteHref }: { variants: V[]; vatIncluded: boolean; lineUrl: string; quoteHref: string }) {
  const router = useRouter();
  const firstInStock = variants.find((v) => v.stock > 0 || v.price <= 0) ?? variants[0];
  const [vid, setVid] = useState(firstInStock.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [capped, setCapped] = useState(false);
  const v = variants.find((x) => x.id === vid)!;
  const max = Math.min(99, v.stock);
  const quote = v.price <= 0; // สินค้าสอบถามราคา
  const out = !quote && v.stock <= 0;
  const bulk = v.bulkPrice > 0 && v.bulkMinQty > 0;
  const unit = bulk && qty >= v.bulkMinQty ? v.bulkPrice : v.price;
  const clamp = (n: number) => Math.max(1, Math.min(max || 1, Number.isFinite(n) ? Math.floor(n) : 1));

  const add = (go?: boolean) => {
    cart.add(v.id, qty);
    if (go) router.push('/cart');
    else { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-2xl bg-navy-50 p-5">
        {quote ? (
          <p data-testid="price" className="text-3xl font-bold text-navy-700">สอบถามราคา</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span data-testid="price" className="text-4xl font-bold text-navy-700">{baht(unit)}</span>
            {v.compareAtPrice > unit && <>
              <span className="text-lg text-muted line-through" aria-label="ราคาก่อนลด">{baht(v.compareAtPrice)}</span>
              <span className="rounded-full bg-sale px-2.5 py-0.5 text-sm font-bold text-white" data-testid="save">ประหยัด {baht(v.compareAtPrice - unit)} (-{Math.round((1 - unit / v.compareAtPrice) * 100)}%)</span>
            </>}
            <span className="ml-auto text-sm text-muted">{vatIncluded ? 'ราคารวม VAT' : 'ราคายังไม่รวม VAT 7%'}</span>
          </div>
        )}
        {bulk && !quote && (
          <p className={`rounded-lg px-3 py-2 text-sm ${qty >= v.bulkMinQty ? 'bg-success-50 font-semibold text-success' : 'bg-white text-ink'}`} data-testid="bulk">
            {qty >= v.bulkMinQty ? `✓ ได้ราคาส่ง ${v.bulkMinQty} ชิ้นขึ้นไป ชิ้นละ ${baht(v.bulkPrice)}` : `ซื้อ ${v.bulkMinQty} ชิ้นขึ้นไป เหลือชิ้นละ ${baht(v.bulkPrice)} (ประหยัด ${baht(v.price - v.bulkPrice)}/ชิ้น)`}
          </p>
        )}
      </div>
      {variants.length > 1 && (
        <fieldset>
          <legend className="label">ตัวเลือก</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button key={x.id} type="button" onClick={() => { setVid(x.id); setQty(1); setCapped(false); }} aria-pressed={x.id === vid}
                className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold ${x.id === vid ? 'border-2 border-cyan-600 bg-cyan-100 text-navy-700' : 'border-slate-300'} ${x.price > 0 && x.stock <= 0 ? 'opacity-50' : ''}`}>
                {x.name}{x.price > 0 && x.stock <= 0 && ' (หมด)'}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <p className={`text-sm ${out ? 'text-sale' : 'text-success'}`}>{quote ? 'สินค้าสั่งผลิต/ราคาตามสเปก — แจ้งรุ่นและจำนวน ทีมขายตอบกลับภายในวันทำการ' : out ? 'สินค้าหมดชั่วคราว — สอบถามรอบผลิตถัดไปทาง LINE หรือขอใบเสนอราคา' : `มีสินค้า ${v.stock} ชิ้น`}</p>
      {quote ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={lineUrl} target="_blank" rel="noopener" className="btn-line py-3">สอบถามราคาทาง LINE</a>
          <a href={quoteHref} className="btn-primary py-3">ขอใบเสนอราคา</a>
        </div>
      ) : <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-300">
          <button type="button" className="h-11 w-11 rounded-l-lg text-lg disabled:opacity-40" onClick={() => setQty((q) => clamp(q - 1))} aria-label="ลดจำนวน" disabled={out || qty <= 1}>−</button>
          <input aria-label="จำนวน" inputMode="numeric" className="h-11 w-12 text-center focus-visible:outline-2 focus-visible:outline-cyan-600" value={qty} disabled={out}
            onChange={(e) => { const n = parseInt(e.target.value, 10); setCapped(n > max); setQty(clamp(n)); }} aria-describedby="qty-note" />
          <button type="button" className="h-11 w-11 rounded-r-lg text-lg disabled:opacity-40" onClick={() => setQty((q) => clamp(q + 1))} aria-label="เพิ่มจำนวน" disabled={out || qty >= max}>+</button>
        </div>
        <button type="button" className="btn-outline flex-1" disabled={out} onClick={() => add()}>{added ? '✓ เพิ่มแล้ว' : 'เพิ่มลงตะกร้า'}</button>
        <button type="button" className="btn-primary flex-1" disabled={out} onClick={() => add(true)}>ซื้อเลย</button>
      </div>
      </>}
      {!quote && <a href={lineUrl} target="_blank" rel="noopener" className="btn w-full border-[1.5px] border-line bg-white text-line hover:bg-success-50">💬 ติดต่อฝ่ายขายทาง LINE OA (สั่งจำนวนมาก / ต่อรองราคา)</a>}
      <p id="qty-note" className="text-xs text-muted" aria-live="polite">{!quote && (capped || (!out && qty >= max)) ? `สั่งได้สูงสุด ${max} ชิ้นต่อรายการ (ตามสต็อก) — ต้องการมากกว่านี้ ขอใบเสนอราคาได้` : ''}</p>
    </div>
  );
}
