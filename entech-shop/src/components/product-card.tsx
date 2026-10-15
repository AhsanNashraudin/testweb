import Link from 'next/link';
import Image from 'next/image';
import { baht } from '@/lib/format';
import type { ProductCardData } from '@/lib/catalog';

export function ProductCard({ p }: { p: ProductCardData }) {
  const out = p.minPrice > 0 && Number(p.totalStock) <= 0;
  const off = p.minCompare > p.minPrice ? Math.round((1 - p.minPrice / p.minCompare) * 100) : 0;
  return (
    <Link href={`/product/${p.slug}`} data-testid="product-card" className="card group flex flex-col overflow-hidden transition hover:shadow-lg">
      <div className="relative aspect-[9/8] border-b border-slate-100 bg-white">
        <Image src={p.image} alt={p.name} fill sizes="(max-width:768px) 50vw, 280px" className="object-contain p-2 transition group-hover:scale-105" />
        {p.badge && <span className="absolute left-3 top-3 rounded-full bg-navy-700 px-2.5 py-0.5 text-xs font-semibold text-white">{p.badge}</span>}
        {out ? <span className="absolute right-3 top-3 rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-white">สินค้าหมด</span>
          : off > 0 && <span className="absolute right-3 top-3 rounded-full bg-sale px-2.5 py-0.5 text-sm font-bold text-white" aria-label={`ลด ${off}%`}>-{off}%</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold tracking-wider text-cyan-700">{p.brand}</span>
        <h3 className="line-clamp-2 font-semibold">{p.name}</h3>
        <p className="line-clamp-1 text-sm text-muted">{p.shortDesc}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          {p.minPrice > 0 ? <>
            {p.variantCount > 1 && <span className="text-xs text-muted">เริ่ม</span>}
            <span className="text-xl font-bold text-navy-700">{baht(p.minPrice)}</span>
            {p.minCompare > p.minPrice && <span className="text-sm text-muted line-through">{baht(p.minCompare)}</span>}
          </> : <span className="text-lg font-bold text-navy-700">สอบถามราคา</span>}
        </div>
      </div>
    </Link>
  );
}
