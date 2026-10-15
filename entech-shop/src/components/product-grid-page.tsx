import Link from 'next/link';
import { ProductCard } from './product-card';
import type { ProductCardData } from '@/lib/catalog';

const SORTS = [['', 'แนะนำ'], ['price_asc', 'ราคาต่ำ → สูง'], ['price_desc', 'ราคาสูง → ต่ำ'], ['new', 'สินค้าใหม่']];

export function ProductGridPage({ title, description, products, q, sort, crumbs }: {
  title: string; description?: string; products: ProductCardData[]; q?: string; sort?: string; crumbs: [string, string][];
}) {
  return (
    <div className="container-x py-8">
      <nav className="mb-3 text-sm text-muted" aria-label="breadcrumb">
        {crumbs.map(([h, l], i) => <span key={h}>{i > 0 && ' › '}<Link href={h} className="inline-block py-2 hover:text-navy-700 hover:underline">{l}</Link></span>)}
      </nav>
      <h1 className="text-3xl font-bold text-navy-900">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-muted">{description}</p>}
      <form className="my-6 flex flex-wrap items-center gap-3 rounded-xl bg-navy-50 p-3">
        <input name="q" type="search" defaultValue={q} placeholder="ค้นหาในหมวดนี้" aria-label="ค้นหาในหมวดนี้" className="input max-w-xs" />
        <select name="sort" defaultValue={sort} className="input max-w-[200px]" aria-label="เรียงตาม">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-outline">กรอง</button>
        <span className="ml-auto text-sm text-muted">พบ {products.length} รายการ</span>
      </form>
      {products.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="card space-y-4 p-10 text-center">
          <p className="text-lg font-semibold">{q ? `ไม่พบสินค้าที่ตรงกับ “${q}”` : 'หมวดนี้ยังไม่มีสินค้าวางขายออนไลน์'}</p>
          <p className="text-muted">{q ? 'ลองใช้คำที่สั้นลง เช่น “ถังเก็บน้ำ” หรือ “1000” หรือสอบถามทีมงานได้เลย' : 'สอบถามสินค้าหรือขอใบเสนอราคากับทีมงานได้เลย'}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {q && <Link href="?" className="btn-outline">ล้างคำค้นหา</Link>}
            <Link href="/products" className="btn-outline">ดูสินค้าทั้งหมด</Link>
            <Link href="/services#quote" className="btn-primary">ขอใบเสนอราคา</Link>
          </div>
        </div>
      )}
    </div>
  );
}
