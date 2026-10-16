import { SITE_URL, OG } from '@/lib/site';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, relatedProducts } from '@/lib/catalog';
import { AddToCart } from '@/components/add-to-cart';
import { ProductCard } from '@/components/product-card';
import { getContact, getHome } from '@/lib/content';
import { WhyCard } from '@/components/why';
import { getSettings } from '@/lib/settings';
import { baht, parseSpecs } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getProduct((await params).slug);
  if (!d) return {};
  const p = d.product;
  // คำอธิบายสำหรับ Google: ใช้ SEO ที่ตั้งไว้ก่อน ไม่งั้นต่อคำโปรย+รายละเอียดให้ยาวพอ (≤155 ตัว)
  const description = p.seoDesc || [p.shortDesc, p.description].filter(Boolean).join(' — ').slice(0, 155);
  return {
    title: p.seoTitle || p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { ...OG, title: p.seoTitle || p.name, description, images: [{ url: p.image, alt: p.name }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [CONTACT, home, d, st] = await Promise.all([getContact(), getHome(), getProduct(slug), getSettings()]);
  if (!d || !d.variants.length) notFound();
  const { product: p, category: c, variants } = d;
  const related = await relatedProducts(c.id, p.id);
  const vatIncluded = st.prices_include_vat === '1';
  const priced = variants.filter((v) => v.price > 0);
  const hasBulk = priced.some((v) => v.bulkPrice > 0);
  const specs = parseSpecs(p.specs);
  const site = SITE_URL;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: [site + p.image], description: p.description, sku: variants[0].sku,
    brand: { '@type': 'Brand', name: p.brand },
    offers: priced.map((v) => ({ '@type': 'Offer', sku: v.sku, name: v.name, price: v.price, priceCurrency: 'THB', availability: `https://schema.org/${v.stock > 0 ? 'InStock' : 'OutOfStock'}`, url: `${site}/product/${p.slug}` })),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['หน้าแรก', site], [c.name, `${site}/products/${c.slug}`], [p.name, `${site}/product/${p.slug}`]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  };
  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, '\\u003c') }} />
      <nav className="mb-2 text-sm text-muted" aria-label="breadcrumb">
        <Link href="/" className="inline-block py-2 hover:underline">หน้าแรก</Link> › <Link href={`/products/${c.slug}`} className="inline-block py-2 hover:underline">{c.name}</Link> › <span className="text-ink">{p.name}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2 [&>*]:min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <Image src={p.image} alt={p.name} fill priority sizes="(max-width:768px) 100vw, 580px" className="object-contain p-4" />
          {p.badge && <span className="absolute left-4 top-4 rounded-full bg-navy-700 px-3 py-1 text-xs font-semibold text-white">{p.badge}</span>}
        </div>
        <div className="space-y-5">
          <p className="text-xs font-semibold tracking-widest text-cyan-700">{p.brand}</p>
          <h1 className="text-3xl font-bold text-navy-900">{p.name}</h1>
          <p className="text-muted">{p.shortDesc}</p>
          <AddToCart vatIncluded={vatIncluded} lineUrl={CONTACT.lineUrl} quoteHref={`/services?product=${encodeURIComponent(p.name)}#quote`}
            variants={variants.map(({ id, name, price, compareAtPrice, stock, bulkPrice, bulkMinQty }) => ({ id, name, price, compareAtPrice, stock, bulkPrice, bulkMinQty }))} />
          <ul className="space-y-1 rounded-2xl border border-slate-200 p-4 text-sm">
            <li>🚚 ค่าส่งคำนวณอัตโนมัติตามจังหวัดในขั้นตอนชำระเงิน หรือรับเองที่โรงงานฟรี</li>
            <li>🏅 ผู้ผลิตโดยตรงตั้งแต่ปี 2537 · ผลิตภัณฑ์ได้รับมาตรฐาน มอก.</li>
            <li>💬 สั่งจำนวนมาก/ต้องการราคาโครงการ: <Link href={`/services?product=${encodeURIComponent(p.name)}#quote`} className="inline-block py-1 font-semibold text-navy-700 underline">ขอใบเสนอราคาสินค้านี้</Link> หรือ LINE <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="inline-block py-1 font-semibold text-navy-700 underline">{CONTACT.line}</a></li>
          </ul>
        </div>
      </div>
      <section className="mt-12 grid items-start gap-8 md:grid-cols-3 [&>*]:min-w-0">
        <div className="card p-6 md:col-span-2">
          <h2 className="mb-3 text-xl font-bold">รายละเอียดสินค้า</h2>
          <p className="whitespace-pre-line leading-relaxed text-ink">{p.description}</p>
          {priced.length > 0 && <>
            <h3 className="mb-2 mt-6 font-bold">ราคา{vatIncluded ? ' (รวม VAT)' : ' (ยังไม่รวม VAT 7%)'}</h3>
            <div className="overflow-x-auto"><table className="w-full min-w-[420px] overflow-hidden rounded-lg text-sm" data-testid="price-table">
              <thead className="bg-navy-700 text-left text-white"><tr><th className="p-2.5">ตัวเลือก</th><th>รหัส</th><th className="text-right">ราคา/ชิ้น</th>{hasBulk && <th className="p-2.5 text-right">ราคาส่ง</th>}</tr></thead>
              <tbody>{priced.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="p-2.5">{v.name}</td><td className="whitespace-nowrap">{v.sku}</td><td className="whitespace-nowrap text-right">{baht(v.price)}</td>
                  {hasBulk && <td className="p-2.5 text-right">{v.bulkPrice ? `${baht(v.bulkPrice)} (${v.bulkMinQty}+ ชิ้น)` : '—'}</td>}
                </tr>))}</tbody>
            </table></div>
          </>}
          {specs && <>
            <h3 className="mb-2 mt-6 font-bold">ข้อมูลจำเพาะ</h3>
            <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm" data-testid="specs">
              <thead className="bg-navy-50 text-left"><tr>{specs.head.map((h) => <th key={h} className="p-2.5">{h}</th>)}</tr></thead>
              <tbody>{specs.rows.map((r, i) => <tr key={i} className="border-b border-slate-100">{r.map((c, j) => <td key={j} className="whitespace-nowrap p-2.5">{c}</td>)}</tr>)}</tbody>
            </table></div>
          </>}
        </div>
        <WhyCard title={home.sections.find((x) => x.key === 'why')?.title || 'ทำไมต้อง ENTECH'} items={home.why.slice(0, 5)} lineUrl={CONTACT.lineUrl} />
      </section>
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-navy-900">สินค้าที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
