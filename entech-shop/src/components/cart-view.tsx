'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cart, useCart } from './cart-store';
import { usePreview } from './use-preview';
import { baht } from '@/lib/format';

export function CartView() {
  const items = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { data, fresh, loading, error, retry } = usePreview(items);

  // ลบสินค้าที่ถูกปิดขาย/ลบไปแล้วออกจากตะกร้า
  useEffect(() => { if (data && fresh && !loading) cart.keepOnly(data.lines.map((l) => l.variantId)); }, [data, fresh, loading]);

  if (!hydrated || (loading && !data)) return <p className="py-20 text-center text-muted">กำลังโหลดตะกร้า…</p>;
  if (!items.length) return (
    <div className="card p-12 text-center">
      <p className="mb-4 text-lg">ตะกร้าของคุณยังว่างอยู่</p>
      <Link href="/products" className="btn-primary">เลือกซื้อสินค้า</Link>
    </div>
  );
  if (!data) return <ErrorBox msg={error} retry={retry} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {error && <ErrorBox msg={error} retry={retry} />}
        {data.lines.map((l) => {
          const max = Math.min(99, l.stock);
          return (
            <div key={l.variantId} data-testid="cart-line" className="card flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white sm:h-20 sm:w-20"><Image src={l.image} alt="" fill sizes="80px" className="object-contain" /></div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${l.slug}`} className="font-semibold hover:text-navy-700 hover:underline">{l.productName}</Link>
                <p className="text-sm text-muted">{l.variantName} · {baht(l.unitPrice)}{l.unitPrice < l.listPrice && <span className="ml-1 font-semibold text-success">(ราคาส่ง)</span>}</p>
                {l.bulkPrice > 0 && l.qty < l.bulkMinQty && <p className="text-xs text-navy-700" data-testid="bulk-hint">เพิ่มอีก {l.bulkMinQty - l.qty} ชิ้น ได้ราคาส่งชิ้นละ {baht(l.bulkPrice)}</p>}
                {l.error && <p className="err">{l.error}</p>}
              </div>
              <div className="order-last flex w-full items-center justify-between gap-3 sm:order-none sm:w-auto">
                <div>
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button className="h-11 w-11 text-lg disabled:opacity-40" aria-label={`ลดจำนวน ${l.productName}`} disabled={l.qty <= 1} onClick={() => cart.set(l.variantId, l.qty - 1)}>−</button>
                    <span data-testid="qty" className="w-8 text-center" aria-live="polite">{l.qty}</span>
                    <button className="h-11 w-11 text-lg disabled:opacity-40" aria-label={`เพิ่มจำนวน ${l.productName}`} disabled={l.qty >= max} onClick={() => cart.set(l.variantId, l.qty + 1)}>+</button>
                  </div>
                  {l.stock > 0 && l.qty >= max && <p className="mt-1 text-xs text-muted">สูงสุด {max} ชิ้น</p>}
                </div>
                <span className="text-right font-bold text-navy-700 sm:w-24">{baht(l.unitPrice * l.qty)}</span>
              </div>
              <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-50 hover:text-sale" aria-label={`ลบ ${l.productName} ออกจากตะกร้า`} onClick={() => cart.remove(l.variantId)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
              </button>
            </div>
          );
        })}
      </div>
      <aside className="card h-fit space-y-3 p-6">
        <h2 className="text-xl font-bold">สรุปคำสั่งซื้อ</h2>
        <Row a="ยอดรวมสินค้า" b={baht(data.subtotal)} />
        <p className="text-xs text-muted">{data.pricesIncludeVat ? 'ราคารวม VAT แล้ว' : 'ยังไม่รวม VAT 7% (คำนวณในหน้าชำระเงิน)'}</p>
        <p className="rounded-lg bg-navy-50 p-3 text-sm text-muted">ค่าส่งคำนวณอัตโนมัติตามจังหวัดในหน้าชำระเงิน</p>
        {data.hasErrors || !fresh ? (
          <p className="err">{fresh ? 'กรุณาปรับจำนวนสินค้าที่สต็อกไม่พอก่อนชำระเงิน' : loading ? 'กำลังคำนวณยอด…' : 'ยังคำนวณยอดล่าสุดไม่ได้ กรุณากด “ลองใหม่”'}</p>
        ) : (
          <Link href="/checkout" className="btn-primary w-full">ดำเนินการชำระเงิน</Link>
        )}
        <Link href="/products" className="btn-outline w-full">เลือกซื้อสินค้าต่อ</Link>
      </aside>
    </div>
  );
}

export function ErrorBox({ msg, retry }: { msg: string; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-50 p-4 text-sm text-sale">
      <span className="flex-1">{msg}</span>
      <button type="button" className="btn-outline" onClick={retry}>ลองใหม่</button>
    </div>
  );
}

export const Row = ({ a, b, strong, cls = '' }: { a: string; b: string; strong?: boolean; cls?: string }) => (
  <div className={`flex justify-between ${strong ? 'text-lg font-bold' : 'text-sm'} ${cls}`}><span>{a}</span><span>{b}</span></div>
);
