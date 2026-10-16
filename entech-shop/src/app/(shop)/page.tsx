import Link from 'next/link';
import Image from 'next/image';
import { getCategories, listProducts } from '@/lib/catalog';
import { listPublished } from '@/lib/articles';
import { ProductCard } from '@/components/product-card';
import type { Metadata } from 'next';
import { getContact, getHome, type SectionKey } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { WhyBand } from '@/components/why';
import { ArticleCards } from '@/components/article-list';
import { LineIcon } from '@/components/line-icon';

// เนื้อหาหน้าแรกทั้งหมดแก้ได้ที่หลังบ้าน > จัดการหน้าแรก
export async function generateMetadata(): Promise<Metadata> {
  const h = await getHome();
  return { alternates: { canonical: '/' }, ...(h.seoTitle && { title: { absolute: h.seoTitle } }), ...(h.seoDesc && { description: h.seoDesc }) };
}

export default async function Home() {
  const [h, contact] = await Promise.all([getHome(), getContact()]);
  const on = (k: SectionKey) => h.sections.find((x) => x.key === k)?.visible;
  const [cats, picks, all, arts, csr] = await Promise.all([
    on('categories') ? getCategories() : [],
    on('featured') ? listProducts({ featured: true, limit: h.featuredCount }) : [],
    on('featured') ? listProducts({ limit: h.featuredCount }) : [],
    on('articles') ? listPublished('article') : [],
    on('csr') ? listPublished('csr') : [],
  ]);
  // เติมให้ครบตามจำนวนที่ตั้งไว้ กริดจะได้ไม่มีช่องว่าง
  const featured = [...picks, ...all.filter((p) => !picks.some((x) => x.id === p.id))].slice(0, h.featuredCount);
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization', name: contact.company, alternateName: 'ENTECH Products',
    url: SITE_URL, logo: `${SITE_URL}/images/logo.png`, telephone: contact.phone, email: contact.email, foundingDate: '1994',
    contactPoint: [{ '@type': 'ContactPoint', telephone: contact.mobile, contactType: 'customer service', areaServed: 'TH', availableLanguage: 'th' }],
    address: { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'TH' },
  };
  const hero = h.hero;

  const blocks: Record<SectionKey, (title: string) => React.ReactNode> = {
    categories: (title) => cats.length > 0 && (
      <section className="container-x py-6">
        {title && <h2 className="mb-6 text-2xl font-bold text-navy-900">{title}</h2>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4 lg:grid-cols-7">
          {cats.map((c) => (
            <Link key={c.id} href={`/products/${c.slug}`} className="card group flex flex-col items-center gap-2 p-3 text-center transition hover:border-cyan-500 hover:shadow-md">
              {/* กรอบสี่เหลี่ยม + object-contain = เห็นสินค้าเต็มชิ้น ไม่ถูกตัด */}
              <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-white"><Image src={c.image} alt={c.name} fill sizes="(max-width:640px) 45vw, 160px" className="object-contain p-1 transition group-hover:scale-105" /></span>
              <span className="text-sm font-semibold leading-snug">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>
    ),
    featured: (title) => featured.length > 0 && (
      <section className="container-x py-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
          <Link href="/products" className="inline-block py-2 text-sm font-semibold text-navy-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>
    ),
    why: (title) => h.why.length > 0 && (
      <section className="container-x py-6" aria-labelledby={title ? 'h-why' : undefined}>
        <WhyBand title={title} items={h.why}>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={contact.lineUrl} target="_blank" rel="noopener" className="btn-line"><LineIcon />ปรึกษาฟรีทาง LINE</a>
            <Link href="/services#quote" className="btn bg-white text-navy-700 hover:bg-cyan-100">ขอใบเสนอราคา</Link>
          </div>
        </WhyBand>
      </section>
    ),
    articles: (title) => arts.length > 0 && (
      <section className="container-x py-6" aria-labelledby="h-arts">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="h-arts" className="text-2xl font-bold text-navy-900">{title}</h2>
          <Link href="/articles" className="inline-block py-2 text-sm font-semibold text-navy-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <ArticleCards rows={arts.slice(0, 3)} />
      </section>
    ),
    csr: (title) => csr.length > 0 && (
      <section className="container-x py-6" aria-labelledby="h-csr">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="h-csr" className="text-2xl font-bold text-navy-900">{title}</h2>
          <Link href="/csr" className="inline-block py-2 text-sm font-semibold text-navy-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <ArticleCards rows={csr.slice(0, 3)} />
      </section>
    ),
    cta: () => (h.cta.title || h.cta.desc) && (
      <section className="container-x py-6">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-navy-700 p-8 text-white md:flex-row md:items-center">
          <div className="flex-1">
            {h.cta.title && <h2 className="text-2xl font-bold">{h.cta.title}</h2>}
            {h.cta.desc && <p className="text-navy-100">{h.cta.desc}</p>}
          </div>
          {h.cta.btnLabel && h.cta.btnHref && <Link href={h.cta.btnHref} className="btn bg-white text-navy-700 hover:bg-cyan-100">{h.cta.btnLabel}</Link>}
          {h.cta.showLine && <a href={contact.lineUrl} target="_blank" rel="noopener" className="btn-line"><LineIcon />LINE {contact.line}</a>}
        </div>
      </section>
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      <section className="bg-navy-50" data-testid="hero">
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2">
          <div className={`space-y-5 ${hero.imageSide === 'left' ? 'md:order-2' : ''}`}>
            {hero.badge && <span className="inline-block rounded-full bg-cyan-700 px-3 py-1 text-sm font-semibold text-white">{hero.badge}</span>}
            <h1 className="whitespace-pre-line text-3xl font-bold leading-tight text-navy-900 md:text-4xl">{hero.title}</h1>
            {hero.lead && <p className="text-lg text-ink">{hero.lead}</p>}
            {hero.sub && <p className="text-muted">{hero.sub}</p>}
            <div className="flex flex-wrap gap-3">
              {hero.btn1Label && hero.btn1Href && <Link href={hero.btn1Href} className="btn-primary px-6">{hero.btn1Label}</Link>}
              {hero.btn2Label && hero.btn2Href && <Link href={hero.btn2Href} className="btn-outline">{hero.btn2Label}</Link>}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="(max-width:768px) 100vw, 600px" className="object-cover" />
          </div>
        </div>
      </section>
      <div className="pt-6">
        {h.sections.filter((x) => x.visible).map((x) => <div key={x.key} data-section={x.key}>{blocks[x.key](x.title)}</div>)}
      </div>
    </>
  );
}
