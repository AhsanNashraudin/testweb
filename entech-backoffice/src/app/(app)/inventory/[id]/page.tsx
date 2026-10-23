import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/util';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, PageHead, thDateTime } from '@/components/bo';
import { saveItemAction } from '../../actions';
import { requireUser } from '@/lib/admin';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const raw = (await params).id;
  if (raw === 'new') return { title: 'เพิ่ม SKU ใหม่' };
  const id = Number(raw);
  const [it] = Number.isInteger(id) ? await db.select({ sku: s.items.sku }).from(s.items).where(eq(s.items.id, id)) : [];
  return { title: it ? `${it.sku} สินค้า` : 'ไม่พบสินค้า' };
}
const CATS = [['water-tanks', 'ถังเก็บน้ำ'], ['septic-tanks', 'ถังบำบัดน้ำเสีย'], ['grease-traps', 'ถังดักไขมัน'], ['fiberglass-water-tanks', 'ถังน้ำไฟเบอร์กลาส'], ['fiberglass-doors', 'ประตูไฟเบอร์กลาส'], ['wall-bins', 'ถังขยะติดผนัง'], ['planters', 'กระถาง']];

export default async function ItemPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ added?: string }> }) {
  await requireUser();
  const raw = (await params).id;
  const isNew = raw === 'new';
  const added = !!(await searchParams).added;
  const id = Number(raw);
  if (!isNew && !Number.isInteger(id)) notFound();
  const [it] = isNew ? [] : await db.select().from(s.items).where(eq(s.items.id, id));
  if (!isNew && !it) notFound();
  const [bom, moves] = isNew ? [[], []] : await Promise.all([
    db.select({ name: s.materials.name, unit: s.materials.unit, qtyPer: s.bom.qtyPer, cost: s.materials.cost }).from(s.bom).innerJoin(s.materials, eq(s.materials.id, s.bom.materialId)).where(eq(s.bom.itemId, id)),
    db.select().from(s.stockMoves).where(and(eq(s.stockMoves.kind, 'item'), eq(s.stockMoves.itemId, id))).orderBy(desc(s.stockMoves.id)).limit(15),
  ]);
  const cost = bom.reduce((a, b) => a + b.qtyPer * b.cost, 0);
  const field = (name: string, label: string, def: string | number = '', type = 'text', extra: React.ComponentProps<'input'> = {}) => (
    <div><label htmlFor={name} className="label">{label}</label><input id={name} name={name} type={type} defaultValue={def} className="input" {...extra} /></div>
  );
  return (
    <div className="max-w-5xl space-y-5">
      <Link href="/inventory" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy-700">← คลังสินค้า</Link>
      <PageHead title={isNew ? 'เพิ่ม SKU ใหม่' : `${it.productName} ${it.variantName}`} sub={isNew ? 'สินค้าใหม่จะถูกสร้างบนเว็บแบบซ่อนไว้ จนแอดมินเว็บใส่รูปและรายละเอียด' : `${it.sku} · คงเหลือพร้อมขาย ${it.stock} ใบ${it.pushPending ? ' · รอส่งขึ้นเว็บ' : ''}`} />
      {added && !isNew && <p role="status" className="rounded-xl bg-success-50 p-4 text-sm text-success">✓ เพิ่ม {it.sku} แล้ว — จะส่งขึ้นเว็บ (ซ่อนไว้จนใส่รูป) ในรอบซิงค์ถัดไป · <Link href="/inventory/new" className="font-semibold underline">เพิ่ม SKU อีก</Link></p>}
      {!isNew && <div className="flex flex-wrap gap-2"><Link href={`/inventory?item=${it.id}#adj-h`} className="btn-primary">รับเข้า / ปรับยอดสินค้านี้</Link><Link href="/production#new-mo" className="btn-outline">สั่งผลิตเพิ่ม</Link></div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <ActionForm action={saveItemAction} className="card grid gap-4 p-5 sm:grid-cols-2">
          {!isNew && <input type="hidden" name="id" value={it.id} />}
          <h2 className="font-bold sm:col-span-2">ข้อมูลสินค้า & ราคา <span className="text-xs font-normal text-muted">(หลังบ้านเป็นเจ้าของข้อมูลนี้ ส่งให้เว็บอัตโนมัติ)</span></h2>
          {isNew && <>{field('sku', 'SKU *', '', 'text', { required: true, placeholder: 'CW-3000' })}{field('productCode', 'รหัสกลุ่มสินค้าบนเว็บ *', '', 'text', { required: true, placeholder: 'tank-grand-stone' })}
            <div className="sm:col-span-2"><label htmlFor="category" className="label">หมวดบนเว็บ (ใช้เมื่อเป็นสินค้าใหม่)</label><select id="category" name="category" className="input">{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div></>}
          {field('productName', 'ชื่อสินค้า *', it?.productName, 'text', { required: true })}
          {field('variantName', isNew ? 'รุ่น / ขนาด *' : 'รุ่น / ขนาด', it?.variantName, 'text', { placeholder: '1000 ลิตร', required: isNew })}
          {field('price', isNew ? 'ราคาขาย (บาท) *' : 'ราคาขาย (บาท)', it?.price ?? 0, 'number', { min: isNew ? 1 : 0 })}
          {field('weightKg', 'น้ำหนัก (กก.)', it?.weightKg ?? 0, 'number', { min: 0, step: 'any' })}
          {field('bulkPrice', 'ราคาส่ง (บาท)', it?.bulkPrice ?? 0, 'number', { min: 0 })}
          {field('bulkMinQty', 'ราคาส่งเมื่อซื้อตั้งแต่ (ใบ)', it?.bulkMinQty ?? 0, 'number', { min: 0 })}
          <p className="text-xs text-muted sm:col-span-2">ราคา 0 = “สอบถามราคา” บนเว็บ (สั่งออนไลน์ไม่ได้) · ปรับสต็อกได้ที่หน้าคลังเพื่อให้มีประวัติ</p>
          <div className="sm:col-span-2"><SubmitButton>{isNew ? 'เพิ่มสินค้า' : 'บันทึก'}</SubmitButton></div>
        </ActionForm>
        {!isNew && <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">สูตรการผลิต <span className="text-xs font-normal text-muted">(วัตถุดิบต่อ 1 ใบ · BOM)</span></h2>
            {bom.length ? <><ul className="mt-3 space-y-2 text-sm">{bom.map((b) => <li key={b.name} className="flex justify-between gap-2"><span>{b.name}</span><b>{b.qtyPer} {b.unit}</b></li>)}</ul>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm">ต้นทุนวัตถุดิบ ≈ <b>{baht(cost)}</b>/ใบ{it.price > 0 && <> · กำไรขั้นต้น <b className="text-success">{Math.round(((it.price / 1.07 - cost) / (it.price / 1.07)) * 100)}%</b></>}</p></>
              : <p className="mt-2 text-sm text-muted">ยังไม่มีสูตร (สินค้าซื้อมาขาย หรือยังไม่ได้ตั้ง)</p>}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-bold">ความเคลื่อนไหว</h2>
            {moves.length ? <ul className="space-y-2.5 text-sm">{moves.map((m) => (
              <li key={m.id} className="flex justify-between gap-2"><span><span className="block">{m.reason} {m.ref}</span><span className="text-xs text-muted">{m.by} · {thDateTime(m.at)}</span></span><b className={m.qty > 0 ? 'text-success' : ''}>{m.qty > 0 ? '+' : ''}{m.qty.toLocaleString('th-TH')}</b></li>
            ))}</ul> : <p className="text-sm text-muted">ยังไม่มี</p>}
            {it.reorderPoint > 0 && it.stock <= it.reorderPoint && <div className="mt-3"><Badge tone="bad">ต่ำกว่าจุดสั่ง ({it.reorderPoint})</Badge></div>}
          </section>
        </aside>}
      </div>
    </div>
  );
}
