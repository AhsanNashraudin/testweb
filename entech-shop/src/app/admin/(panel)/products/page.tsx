import Link from 'next/link';
import Image from 'next/image';
import { asc, eq, sql } from 'drizzle-orm';
import { db, schema as s } from '@/db';
import { baht } from '@/lib/format';

export const metadata = { title: 'สินค้า' };

export default async function AdminProducts() {
  const rows = await db
    .select({ id: s.products.id, name: s.products.name, image: s.products.image, active: s.products.isActive, cat: s.categories.name, min: sql<number>`min(${s.variants.price})`, stock: sql<number>`sum(${s.variants.stock})` })
    .from(s.products).innerJoin(s.categories, eq(s.categories.id, s.products.categoryId)).leftJoin(s.variants, eq(s.variants.productId, s.products.id))
    .groupBy(s.products.id).orderBy(asc(s.products.id));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">สินค้า ({rows.length})</h1>
      <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-muted"><tr><th className="p-3">สินค้า</th><th>หมวด</th><th className="text-right">ราคาเริ่ม</th><th className="text-right">สต็อกรวม</th><th className="p-3 text-right">สถานะ</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id} className="border-t border-slate-100">
            <td className="flex items-center gap-3 p-3"><Image src={p.image} alt="" width={40} height={40} className="h-10 w-10 rounded object-contain" /><Link href={`/admin/products/${p.id}`} className="font-semibold text-navy-700">{p.name}</Link></td>
            <td>{p.cat}</td><td className="text-right">{baht(p.min ?? 0)}</td>
            <td className={`text-right ${Number(p.stock) < 5 ? 'font-bold text-sale' : ''}`}>{p.stock ?? 0}</td>
            <td className="p-3 text-right"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-success-50 text-success' : 'bg-slate-100 text-muted'}`}>{p.active ? 'แสดง' : 'ซ่อน'}</span></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}
