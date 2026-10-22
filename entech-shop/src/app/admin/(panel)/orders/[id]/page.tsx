import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/format';
import { STATUS_TH } from '@/lib/status';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { StatusBadge } from '@/components/status-badge';
import { updateOrderStatus } from '../../actions';
import { requireAdmin } from '@/lib/admin';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const [o] = await db.select({ code: s.orders.code }).from(s.orders).where(eq(s.orders.id, Number((await params).id) || 0));
  return { title: o ? `คำสั่งซื้อ ${o.code}` : 'ไม่พบคำสั่งซื้อ' };
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) notFound();
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id));
  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold">คำสั่งซื้อ {o.code} <StatusBadge status={o.status} /></h1>
      <ActionForm action={updateOrderStatus} className="card grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end" confirm={{ field: 'status', value: 'cancelled', message: 'ยืนยันยกเลิกคำสั่งซื้อนี้? ระบบจะคืนสต็อกสินค้าอัตโนมัติ' }}>
        <input type="hidden" name="id" value={o.id} />
        <div><label htmlFor="status" className="label">สถานะ</label>
          <select id="status" name="status" defaultValue={o.status} className="input">{Object.entries(STATUS_TH).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label htmlFor="carrier" className="label">ขนส่ง</label><input id="carrier" name="carrier" defaultValue={o.carrier} maxLength={80} placeholder="เช่น Kerry, รถบริษัท" className="input" /></div>
        <div><label htmlFor="trackingNo" className="label">เลขพัสดุ</label><input id="trackingNo" name="trackingNo" defaultValue={o.trackingNo} maxLength={80} className="input" /></div>
        <div><label htmlFor="trackingUrl" className="label">ลิงก์ติดตาม (https://)</label><input id="trackingUrl" name="trackingUrl" type="url" defaultValue={o.trackingUrl} maxLength={500} className="input" /></div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-4">
          <SubmitButton>บันทึก</SubmitButton>
          <span className="text-xs text-muted">* เปลี่ยนเป็น “ยกเลิก” ระบบจะคืนสต็อกอัตโนมัติ · ระบบสต็อกอัปเดตช่องเหล่านี้ผ่าน API ได้</span>
        </div>
      </ActionForm>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card space-y-1 p-5 text-sm">
          <h2 className="mb-2 font-bold">ลูกค้า</h2>
          <p>{o.name} · <a className="text-navy-700 underline" href={`tel:${o.phone}`}>{o.phone}</a></p><p><a className="text-navy-700 underline" href={`mailto:${o.email}`}>{o.email}</a></p>
          <p>{o.shippingOption === 'pickup' ? 'รับเองที่โรงงาน' : `${o.address} จ.${o.province} ${o.postcode}`}</p>
          {o.taxId && <p className="pt-2"><b>ใบกำกับภาษี:</b> {o.taxName} · เลข {o.taxId} · {o.taxBranch || 'สำนักงานใหญ่'}<br />{o.taxAddress}</p>}
          {o.note && <p className="pt-2">หมายเหตุ: {o.note}</p>}
        </div>
        <div className="card space-y-1 p-5 text-sm">
          <h2 className="mb-2 font-bold">การชำระเงิน & จัดส่ง</h2>
          <p>วิธีชำระ: {o.paymentMethod === 'promptpay' ? 'PromptPay' : 'โอนธนาคาร'}</p>
          <p>{o.shippingLabel} · น้ำหนักรวม {o.weightKg} กก.</p>
        </div>
      </div>
      <div className="card overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-left"><tr><th className="p-3">สินค้า</th><th>SKU</th><th className="text-right">ราคา</th><th className="text-right">จำนวน</th><th className="p-3 text-right">รวม</th></tr></thead>
        <tbody>
          {items.map((i) => <tr key={i.id} className="border-t border-slate-100"><td className="p-3">{i.productName} ({i.variantName})</td><td>{i.sku}</td><td className="text-right">{baht(i.unitPrice)}</td><td className="text-right">{i.qty}</td><td className="p-3 text-right">{baht(i.unitPrice * i.qty)}</td></tr>)}
          <tr className="border-t"><td className="p-3" colSpan={4}>ยอดรวมสินค้า</td><td className="p-3 text-right">{baht(o.subtotal)}</td></tr>
          {o.discount > 0 && <tr><td className="px-3" colSpan={4}>ส่วนลด {o.couponCode}</td><td className="px-3 text-right">-{baht(o.discount)}</td></tr>}
          <tr><td className="px-3" colSpan={4}>ค่าจัดส่ง ({o.shippingLabel})</td><td className="px-3 text-right">{o.shippingFee ? baht(o.shippingFee) : 'ฟรี'}</td></tr>
          {o.vat > 0 && <tr><td className="px-3" colSpan={4}>VAT 7%</td><td className="px-3 text-right">{baht(o.vat)}</td></tr>}
          <tr className="font-bold"><td className="p-3" colSpan={4}>ยอดชำระ</td><td className="p-3 text-right">{baht(o.total)}</td></tr>
        </tbody>
      </table></div>
    </div>
  );
}
