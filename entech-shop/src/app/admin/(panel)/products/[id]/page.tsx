import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { saveProduct } from '../../actions';

export const metadata = { title: 'แก้ไขสินค้า' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p] = await db.select().from(s.products).where(eq(s.products.id, id));
  if (!p) notFound();
  const vs = await db.select().from(s.variants).where(eq(s.variants.productId, id)).orderBy(asc(s.variants.sort));
  return (
    <ActionForm action={saveProduct} className="max-w-4xl space-y-5">
      <input type="hidden" name="id" value={p.id} />
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-slate-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8"><h1 className="min-w-0 truncate text-2xl font-bold">แก้ไข: {p.name}</h1><SubmitButton>บันทึก</SubmitButton></div>
      <section className="card grid gap-4 p-5">
        <div><label className="label" htmlFor="name">ชื่อสินค้า</label><input id="name" name="name" defaultValue={p.name} className="input" required /></div>
        <div><label className="label" htmlFor="shortDesc">คำโปรย</label><input id="shortDesc" name="shortDesc" defaultValue={p.shortDesc} className="input" /></div>
        <div><label className="label" htmlFor="description">รายละเอียด</label><textarea id="description" name="description" defaultValue={p.description} rows={5} className="input" /></div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2 py-2"><input type="checkbox" name="isActive" defaultChecked={p.isActive} className="h-5 w-5" /> แสดงบนหน้าเว็บ</label>
          <label className="flex items-center gap-2 py-2"><input type="checkbox" name="isFeatured" defaultChecked={p.isFeatured} className="h-5 w-5" /> สินค้าแนะนำหน้าแรก</label>
          <label className="flex items-center gap-2">ป้าย <input name="badge" defaultValue={p.badge} className="input w-32" /></label>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-bold">ตัวเลือก ราคา สต็อก น้ำหนัก</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-muted"><tr><th>ตัวเลือก / SKU</th><th>ราคาขาย</th><th>ราคาก่อนลด</th><th>ราคาส่ง</th><th>ส่งขั้นต่ำ</th><th>สต็อก</th><th>น้ำหนัก (กก.)</th></tr></thead>
          <tbody>{vs.map((v) => (
            <tr key={v.id}>
              <td className="py-2"><input type="hidden" name="variantId" value={v.id} /><input type="hidden" name={`label_${v.id}`} value={v.name} />{v.name}<br /><span className="text-xs text-muted">{v.sku}</span></td>
              <td><input aria-label={`ราคา ${v.name}`} name={`price_${v.id}`} type="number" min={0} defaultValue={v.price} className="input w-28" /></td>
              <td><input aria-label={`ราคาก่อนลด ${v.name}`} name={`compare_${v.id}`} type="number" min={0} defaultValue={v.compareAtPrice} className="input w-28" /></td>
              <td><input aria-label={`ราคาส่ง ${v.name}`} name={`bulk_${v.id}`} type="number" min={0} defaultValue={v.bulkPrice} className="input w-24" /></td>
              <td><input aria-label={`จำนวนขั้นต่ำราคาส่ง ${v.name}`} name={`bulkqty_${v.id}`} type="number" min={0} defaultValue={v.bulkMinQty} className="input w-20" /></td>
              <td><input aria-label={`สต็อก ${v.name}`} name={`stock_${v.id}`} type="number" min={0} defaultValue={v.stock} className="input w-24" /></td>
              <td><input aria-label={`น้ำหนัก ${v.name}`} name={`weight_${v.id}`} type="number" min={0} step="0.1" defaultValue={v.weightKg} className="input w-24" /></td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="mt-2 text-xs text-muted">ราคาขาย 0 = “สอบถามราคา” (ลูกค้ากดสั่งไม่ได้ แต่ทักไลน์/ขอใบเสนอราคาได้) · ราคาส่ง: ซื้อตั้งแต่จำนวนขั้นต่ำขึ้นไปใช้ราคานี้ (0 = ไม่มี) · ราคาก่อนลดใส่ 0 ถ้าไม่มีส่วนลด</p>
      </section>
      <section className="card grid gap-2 p-5">
        <h2 className="font-bold">ตารางข้อมูลจำเพาะ</h2>
        <label className="label" htmlFor="specs">บรรทัดแรก = หัวตาราง · คั่นคอลัมน์ด้วย | (เว้นว่าง = ไม่แสดง)</label>
        <textarea id="specs" name="specs" defaultValue={p.specs} rows={8} className="input font-mono text-xs" placeholder={'รุ่น | ความกว้าง (ซม.) | ความสูง (ซม.)\nCW-700 G | 77 | 190'} />
      </section>
      <section className="card grid gap-4 p-5">
        <h2 className="font-bold">SEO</h2>
        <div><label className="label" htmlFor="seoTitle">Meta Title (≤ 60 ตัวอักษร)</label><input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={p.seoTitle} placeholder={p.name} className="input" /></div>
        <div><label className="label" htmlFor="seoDesc">Meta Description (≤ 160 ตัวอักษร)</label><textarea id="seoDesc" name="seoDesc" maxLength={170} defaultValue={p.seoDesc} placeholder={p.shortDesc} rows={2} className="input" /></div>
        <p className="text-xs text-muted">URL: /product/{p.slug}</p>
      </section>
      <div className="flex justify-end"><SubmitButton>บันทึก</SubmitButton></div>
    </ActionForm>
  );
}
