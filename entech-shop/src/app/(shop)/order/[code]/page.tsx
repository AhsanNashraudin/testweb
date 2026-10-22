import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import { db, schema as s } from '@/db';
import { getSettings } from '@/lib/settings';
import { baht } from '@/lib/format';
import { getContact } from '@/lib/content';
import { StatusBadge } from '@/components/status-badge';
import { FocusOnMount } from '@/components/focus-on-mount';
import { LineIcon } from '@/components/line-icon';
import { RESERVE_HOURS } from '@/lib/orders';

export const metadata: Metadata = { title: 'คำสั่งซื้อของคุณ', robots: { index: false } };

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ k?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const [CONTACT, { code }, { k }, st] = await Promise.all([getContact(), params, searchParams, getSettings()]);
  const TEL = CONTACT.tel;
  if (!k) notFound();
  const [o] = await db.select().from(s.orders).where(and(eq(s.orders.code, code), eq(s.orders.accessKey, k)));
  if (!o) notFound();
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
  const qr = o.paymentMethod === 'promptpay' && o.status === 'pending_payment' && st.promptpay_id
    ? await QRCode.toDataURL(generatePayload(st.promptpay_id, { amount: o.total }), { margin: 1, width: 260 })
    : null;

  return (
    <div className="container-x max-w-3xl py-10">
      <div className="card space-y-6 p-8">
        <div className="text-center">
          <FocusOnMount id="order-title" />
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-3xl text-success" aria-hidden>✓</div>
          <h1 id="order-title" tabIndex={-1} className="text-3xl font-bold text-navy-900 outline-none">ขอบคุณสำหรับคำสั่งซื้อ!</h1>
          <p className="mt-2 text-muted">หมายเลขคำสั่งซื้อ <b data-testid="order-code" className="text-ink">{o.code}</b> · <StatusBadge status={o.status} /></p>
          <p className="mt-1 text-sm text-muted">ดูหน้านี้อีกครั้งได้ที่ <Link href="/order/lookup" className="font-semibold text-navy-700 underline">ตรวจสอบคำสั่งซื้อ</Link> ด้วยเลขคำสั่งซื้อ + เบอร์โทร</p>
          {o.status === 'pending_payment' && <p className="mt-2 text-sm font-medium text-warning" data-testid="reserve-note">กรุณาชำระภายใน {RESERVE_HOURS} ชั่วโมง มิฉะนั้นระบบจะยกเลิกคำสั่งซื้อและคืนสินค้าให้ลูกค้ารายอื่นอัตโนมัติ</p>}
        </div>
        {qr && (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-navy-50 p-6 md:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="PromptPay QR" width={200} height={200} className="rounded-lg bg-white p-2" />
            <div>
              <p className="font-semibold">1. สแกน PromptPay เพื่อชำระเงิน</p>
              <p className="text-4xl font-bold text-navy-700" data-testid="order-total">{baht(o.total)}</p>
              {st.promptpay_name && <p className="text-sm">ชื่อบัญชี: <b>{st.promptpay_name}</b></p>}
              <p className="text-sm text-muted">2. ส่งสลิปทาง LINE {CONTACT.line} พร้อมเลขคำสั่งซื้อ {o.code}<br />3. ทีมงานยืนยันและจัดส่งตามวิธีที่เลือก</p>
            </div>
          </div>
        )}
        {o.paymentMethod === 'transfer' && o.status === 'pending_payment' && (
          <div className="space-y-2 rounded-2xl bg-navy-50 p-6" data-testid="bank-info">
            <p className="font-semibold">1. โอนเงิน <span className="text-2xl text-navy-700">{baht(o.total)}</span> เข้าบัญชี</p>
            {st.bank_account ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl bg-white p-4 text-sm">
                <dt className="text-muted">ธนาคาร</dt><dd className="font-semibold">{st.bank_name}</dd>
                <dt className="text-muted">เลขบัญชี</dt><dd className="font-mono text-lg font-bold tracking-wide">{st.bank_account}</dd>
                <dt className="text-muted">ชื่อบัญชี</dt><dd className="font-semibold">{st.bank_holder}</dd>
              </dl>
            ) : (
              <p className="text-sm">กรุณาติดต่อทีมงานทาง LINE {CONTACT.line} หรือโทร {CONTACT.mobile} เพื่อรับเลขบัญชี</p>
            )}
            <p className="text-sm text-muted">2. ส่งสลิปทาง LINE {CONTACT.line} พร้อมเลขคำสั่งซื้อ {o.code}</p>
          </div>
        )}
        <table className="w-full text-sm">
          <tbody>
            {items.map((i) => <tr key={i.id} className="border-b border-slate-100"><td className="py-2">{i.productName} <span className="text-muted">({i.variantName}) ×{i.qty}</span></td><td className="text-right">{baht(i.unitPrice * i.qty)}</td></tr>)}
            <tr><td className="pt-3">ยอดรวมสินค้า</td><td className="pt-3 text-right">{baht(o.subtotal)}</td></tr>
            {o.discount > 0 && <tr><td>ส่วนลด ({o.couponCode})</td><td className="text-right text-sale">-{baht(o.discount)}</td></tr>}
            <tr><td>{o.shippingLabel}</td><td className="text-right" data-testid="order-shipping">{o.shippingFee ? baht(o.shippingFee) : 'ฟรี'}</td></tr>
            {o.vat > 0 && <tr><td>VAT 7%</td><td className="text-right" data-testid="order-vat">{baht(o.vat)}</td></tr>}
            <tr className="text-lg font-bold"><td className="pt-2">ยอดชำระทั้งหมด</td><td className="pt-2 text-right">{baht(o.total)}</td></tr>
          </tbody>
        </table>
        {(o.trackingNo || o.carrier) && (
          <div data-testid="tracking" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-cyan-100/60 p-4 text-sm ring-1 ring-cyan-500/30">
            <b className="text-navy-900">ติดตามพัสดุ</b>
            {o.carrier && <span>ขนส่ง: <b>{o.carrier}</b></span>}
            {o.trackingNo && <span>เลขพัสดุ: <b className="font-mono tracking-wide">{o.trackingNo}</b></span>}
            {/^https:\/\//.test(o.trackingUrl) && <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline">ติดตามสถานะ →</a>}
          </div>
        )}
        <div className="grid gap-1 rounded-xl border border-slate-200 p-4 text-sm">
          <p><b>ผู้รับ:</b> {o.name} · {o.phone}</p>
          {o.shippingOption !== 'pickup' ? <p><b>ที่อยู่จัดส่ง:</b> {o.address} จ.{o.province} {o.postcode}</p> : (
            <p data-testid="pickup-info"><b>รับสินค้าที่โรงงาน:</b> {CONTACT.address} · {CONTACT.hours} · โทร <a href={TEL.main} className="text-navy-700 underline">{CONTACT.phone}</a> · <a href={CONTACT.mapUrl} target="_blank" rel="noopener" className="font-semibold text-navy-700 underline">เปิดแผนที่</a><br /><span className="text-muted">ทีมงานจะโทรนัดวันรับหลังยืนยันการชำระเงิน</span></p>
          )}
          {o.taxId && <p><b>ใบกำกับภาษี:</b> {o.taxName} · เลขผู้เสียภาษี {o.taxId} · {o.taxBranch || 'สำนักงานใหญ่'}<br />{o.taxAddress}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="btn-line"><LineIcon />ส่งสลิปทาง LINE</a>
          <Link href="/products" className="btn-outline">เลือกซื้อสินค้าต่อ</Link>
        </div>
      </div>
    </div>
  );
}
