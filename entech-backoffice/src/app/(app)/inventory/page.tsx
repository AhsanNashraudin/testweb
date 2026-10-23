import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { reservedByItem } from '@/lib/backoffice';
import { baht } from '@/lib/util';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { Badge, Empty, PageHead, Stat, Tabs, thDateTime } from '@/components/bo';
import { adjustStockAction, setReorderAction } from '../actions';
import { requireUser } from '@/lib/admin';

export const metadata = { title: 'คลังสินค้า' };
type SP = Promise<{ tab?: string; f?: string; q?: string; page?: string; item?: string }>;
const PER = 25;

function Level({ stock, rp }: { stock: number; rp: number }) {
  const pct = rp ? Math.min(100, (stock / (rp * 2)) * 100) : 100;
  return (
    <div className="w-24"><div className="h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${stock <= 0 ? 'bg-sale' : stock <= rp ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.max(3, pct)}%` }} /></div>
      <p className="mt-1 text-xs text-muted">{rp ? `จุดสั่ง ${rp.toLocaleString('th-TH')}` : 'ยังไม่ตั้งจุดสั่ง'}</p></div>
  );
}
const statusOf = (stock: number, reserved: number, rp: number) =>
  stock <= 0 && reserved ? <Badge tone="warn">จองหมดแล้ว</Badge> : stock <= 0 ? <Badge tone="bad">หมด</Badge> : rp && stock <= rp ? <Badge tone="warn">ต่ำกว่าจุดสั่ง</Badge> : <Badge tone="ok">ปกติ</Badge>;

export default async function Inventory({ searchParams }: { searchParams: SP }) {
  await requireUser();
  const { tab = 'product', f = '', q = '', page = '1', item } = await searchParams;
  const [variants, materials, reserved, moves, [{ openMO }]] = await Promise.all([
    db.select({ id: s.items.id, sku: s.items.sku, v: s.items.variantName, name: s.items.productName, stock: s.items.stock, rp: s.items.reorderPoint, price: s.items.price, pending: s.items.pushPending })
      .from(s.items).orderBy(s.items.category, s.items.productName, s.items.sku),
    db.select().from(s.materials).orderBy(s.materials.sku),
    reservedByItem(),
    db.select().from(s.stockMoves).orderBy(desc(s.stockMoves.id)).limit(12),
    db.select({ openMO: sql<number>`count(*)` }).from(s.productionOrders).where(sql`${s.productionOrders.status} in ('waiting','queued','in_progress','qc')`),
  ]);
  const vName = new Map(variants.map((v) => [v.id, `${v.name} ${v.v}`]));
  const mName = new Map(materials.map((m) => [m.id, m]));
  const qq = q.trim().toLowerCase();
  const list = variants.filter((v) => (!qq || `${v.sku} ${v.name} ${v.v}`.toLowerCase().includes(qq)) && (f !== 'low' || (v.rp > 0 && v.stock <= v.rp) || v.stock <= 0));
  const pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(pages, Math.max(1, Number(page) || 1));
  const shown = list.slice((pg - 1) * PER, pg * PER);
  const value = variants.reduce((a, v) => a + Math.max(0, v.stock) * v.price, 0) + materials.reduce((a, m) => a + m.stock * m.cost, 0);
  const totalReserved = [...reserved.values()].reduce((a, b) => a + b, 0);
  const low = variants.filter((v) => v.rp > 0 && v.stock <= v.rp).length + materials.filter((m) => m.stock <= m.reorderPoint).length;
  const href = (p: Record<string, string>) => '/inventory?' + new URLSearchParams({ tab, ...(f && { f }), ...(q && { q }), ...p }).toString(); // ไม่พก page = กลับหน้าแรกเมื่อเปลี่ยนตัวกรอง

  return (
    <div className="space-y-6">
      <PageHead title="คลังสินค้า" sub="ถังสำเร็จรูปและวัตถุดิบ · ยอดพร้อมขายใช้ร่วมกับเว็บไซต์และทีมเซลล์">
        <a href="#adj-h" className="btn-primary">รับเข้า / ปรับยอด</a><Link href="/inventory/new" className="btn-outline">+ เพิ่ม SKU</Link><Link href="/production#new-mo" className="btn-outline">สั่งผลิตเพิ่ม</Link>
      </PageHead>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="มูลค่าสต็อก (โดยประมาณ)" value={baht(value)} note="ถังคิดราคาขาย · วัตถุดิบคิดต้นทุน" />
        <Stat label="รายการสินค้า" value={`${variants.length} รุ่น`} note={`วัตถุดิบ ${materials.length} รายการ`} />
        <Stat label="จองไว้ให้ออเดอร์" value={`${totalReserved} ใบ`} note={`กำลังผลิต ${openMO} ใบสั่งผลิต`} />
        <Stat label="ต่ำกว่าจุดสั่ง" value={`${low} รายการ`} tone={low ? 'warn' : 'ok'} note={low ? 'สั่งผลิตหรือสั่งซื้อเพิ่ม' : 'สต็อกเพียงพอ'} href={href({ tab: 'product', f: 'low' })} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs current={tab} items={[{ key: 'product', label: 'ถังสำเร็จรูป', href: href({ tab: 'product' }) }, { key: 'material', label: 'วัตถุดิบ', href: href({ tab: 'material' }) }]} />
        {tab === 'product' && <form className="flex w-full flex-wrap gap-2 sm:w-auto" role="search"><input type="hidden" name="tab" value="product" />{f && <input type="hidden" name="f" value={f} />}<input name="q" defaultValue={q} aria-label="ค้นหาสินค้า" placeholder="ค้นหา SKU หรือชื่อสินค้า" className="input min-w-0 flex-1 sm:w-64 sm:flex-none" /><button className="btn-outline">ค้นหา</button></form>}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <div className="card overflow-x-auto">
          {tab === 'material' ? (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">วัตถุดิบ</th><th className="text-right">คงเหลือ</th><th className="pl-6">ระดับ</th><th>สถานะ</th><th className="p-3">จุดสั่ง</th></tr></thead>
              <tbody>{materials.map((m) => (
                <tr key={m.id} className="border-t border-slate-100"><td className="p-3"><span className="font-medium">{m.name}</span><span className="block text-xs text-muted">{m.sku} · ต้นทุน {m.cost} บาท/{m.unit}</span></td>
                  <td className="text-right font-semibold">{m.stock.toLocaleString('th-TH')} {m.unit}</td><td className="pl-6"><Level stock={m.stock} rp={m.reorderPoint} /></td><td>{statusOf(m.stock, 0, m.reorderPoint)}</td>
                  <td className="p-3"><ActionForm action={setReorderAction} className="flex gap-1.5"><input type="hidden" name="kind" value="material" /><input type="hidden" name="itemId" value={m.id} /><input name="reorderPoint" type="number" min={0} step="any" defaultValue={m.reorderPoint} aria-label={`จุดสั่ง ${m.name}`} className="input w-24" /><SubmitButton className="btn-outline px-3" pendingText="…">บันทึก</SubmitButton></ActionForm></td></tr>
              ))}</tbody>
            </table>
          ) : list.length ? (
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">สินค้า</th><th className="text-right">คงเหลือจริง</th><th className="text-right">จองแล้ว</th><th className="text-right">พร้อมขาย</th><th className="pl-4">ระดับ</th><th className="p-3">สถานะ</th></tr></thead>
              <tbody>{shown.map((v) => {
                const r = reserved.get(v.id) ?? 0;
                return (
                  <tr key={v.id} className="border-t border-slate-100" data-testid="stock-row"><td className="p-3"><Link href={`/inventory/${v.id}`} className="font-medium text-navy-700 hover:underline">{v.name} {v.v}</Link><span className="block text-xs text-muted">{v.sku}{v.pending && ' · รอส่งขึ้นเว็บ'}</span></td>
                    <td className="text-right">{(Math.max(0, v.stock) + r).toLocaleString('th-TH')}</td><td className="text-right text-muted">{r}</td>
                    <td className={`text-right font-bold ${v.stock <= 0 ? 'text-sale' : ''}`}>{Math.max(0, v.stock)}</td><td className="pl-4"><Level stock={v.stock} rp={v.rp} /></td><td className="p-3">{statusOf(v.stock, r, v.rp)}</td></tr>
                );
              })}</tbody>
            </table>
          ) : <Empty>ไม่พบสินค้าตามตัวกรอง · <Link href="/inventory" className="text-navy-700 underline">ดูทั้งหมด</Link></Empty>}
          {tab === 'product' && pages > 1 && (
            <nav aria-label="หน้า" className="flex items-center justify-between gap-2 border-t border-slate-100 p-3 text-sm">
              <span className="text-muted">แสดง {(pg - 1) * PER + 1}–{Math.min(pg * PER, list.length)} จาก {list.length} รุ่น</span>
              <span className="flex gap-2">{pg > 1 && <Link href={href({ page: String(pg - 1) })} className="btn-outline px-4">ก่อนหน้า</Link>}{pg < pages && <Link href={href({ page: String(pg + 1) })} className="btn-outline px-4">ถัดไป</Link>}</span>
            </nav>
          )}
          {tab === 'product' && <p className="border-t border-slate-100 p-3 text-xs text-muted">“พร้อมขาย” = คงเหลือจริง − จองแล้ว · ตัวเลขนี้ส่งขึ้นเว็บไซต์ทุกรอบซิงค์ (5 นาที) · คลิกชื่อสินค้าเพื่อแก้ราคา · ตั้งจุดสั่งรายรุ่นได้ที่แผงด้านขวา</p>}
        </div>

        <aside className="space-y-5">
          <section className="card scroll-mt-4 p-5" aria-labelledby="adj-h" id="adjust">
            <h2 id="adj-h" className="scroll-mt-4 font-bold">รับเข้า / ปรับยอด</h2>
            <p className="mb-3 text-xs text-muted">ใส่จำนวนติดลบเพื่อตัดออก ทุกครั้งบันทึกเหตุผลและเอกสารอ้างอิง</p>
            <ActionForm action={adjustStockAction} resetOnSuccess={["itemId", "kind"]} className="space-y-3">
              <input type="hidden" name="kind" value={tab === 'material' ? 'material' : 'item'} />
              <div><label htmlFor="item" className="label">{tab === 'material' ? 'วัตถุดิบ' : 'สินค้า'}</label>
                <select id="item" name="itemId" className="input" defaultValue={item ?? (tab !== "material" && list.length === 1 ? String(list[0].id) : undefined)}>{tab === 'material' ? materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>) : variants.map((v) => <option key={v.id} value={v.id}>{v.sku} · {v.name} {v.v}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="delta" className="label">จำนวน (+/−)</label><input id="delta" name="delta" type="number" step="any" min={-100000} max={100000} required placeholder="+20" className="input" /></div>
                <div><label htmlFor="ref" className="label">เลขเอกสาร</label><input id="ref" name="ref" maxLength={60} placeholder="PO-6910-0021" className="input" /></div>
              </div>
              <div><label htmlFor="reason" className="label">เหตุผล</label><input id="reason" name="reason" list="reasons" required maxLength={80} className="input" />
                <datalist id="reasons"><option value="รับจากผู้ขาย" /><option value="ตรวจนับ" /><option value="ชำรุด/เสียหาย" /><option value="คืนจากลูกค้า" /><option value="โอนย้ายคลัง" /></datalist></div>
              <SubmitButton className="btn-primary w-full">บันทึก</SubmitButton>
            </ActionForm>
            {tab === 'product' && (
              <ActionForm action={setReorderAction} className="mt-4 grid grid-cols-[1fr_auto] items-end gap-2 border-t border-slate-100 pt-4">
                <input type="hidden" name="kind" value="item" />
                <div><label htmlFor="rp-item" className="label">ตั้งจุดสั่งผลิต</label><select id="rp-item" name="itemId" className="input">{variants.map((v) => <option key={v.id} value={v.id}>{v.sku} (ตอนนี้ {v.rp})</option>)}</select></div>
                <input name="reorderPoint" type="number" min={0} required aria-label="จุดสั่งผลิต (ใบ)" placeholder="ใบ" className="input w-20" />
                <SubmitButton className="btn-outline col-span-2">บันทึกจุดสั่ง</SubmitButton>
              </ActionForm>
            )}
          </section>
          <section className="card p-5" aria-labelledby="mv-h">
            <h2 id="mv-h" className="font-bold">ความเคลื่อนไหวล่าสุด</h2><p className="mb-3 text-xs text-muted">ทุกการเข้า-ออกมีเอกสารอ้างอิง</p>
            {moves.length ? <ul className="space-y-3 text-sm">{moves.map((m) => {
              const mat = m.kind === 'material' ? mName.get(m.itemId) : undefined;
              return (
                <li key={m.id} className="flex justify-between gap-3"><span><span className="block font-medium">{m.reason}{m.ref && ` ${m.ref}`}</span><span className="text-xs text-muted">{mat ? mat.name : vName.get(m.itemId)} · {m.by} · {thDateTime(m.at)}</span></span>
                  <b className={`whitespace-nowrap ${m.qty > 0 ? 'text-success' : 'text-ink'}`}>{m.qty > 0 ? '+' : m.qty < 0 ? '−' : ''}{Math.abs(m.qty).toLocaleString('th-TH')}{mat ? ` ${mat.unit}` : ''}</b></li>
              );
            })}</ul> : <p className="text-sm text-muted">ยังไม่มีความเคลื่อนไหว เริ่มจากรับสินค้าเข้าหรือเริ่มผลิต</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
