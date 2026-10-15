import Link from 'next/link';
import Image from 'next/image';
import { getCategories, listProducts } from '@/lib/catalog';
import { listPublished } from '@/lib/articles';
import { ProductCard } from '@/components/product-card';
import type { Metadata } from 'next';
import { CONTACT } from '@/components/site';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [cats, picks, all, arts] = await Promise.all([getCategories(), listProducts({ featured: true, limit: 8 }), listProducts({ limit: 8 }), listPublished()]);
  // เติมให้ครบ 8 ชิ้น กริดจะได้ไม่มีช่องว่าง
  const featured = [...picks, ...all.filter((p) => !picks.some((x) => x.id === p.id))].slice(0, 8);
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'บริษัท เอนเทค โพรดักส์ จำกัด', alternateName: 'ENTECH Products',
    url: SITE_URL, logo: `${SITE_URL}/images/logo.png`, telephone: '+66-2-813-0971', email: CONTACT.email, foundingDate: '1994',
    contactPoint: [{ '@type': 'ContactPoint', telephone: '+66-63-206-1000', contactType: 'customer service', areaServed: 'TH', availableLanguage: 'th' }],
    address: { '@type': 'PostalAddress', streetAddress: '10/6 หมู่ 9 ซ.สุขาภิบาล 2 ถ.พุทธมณฑลสาย 4', addressLocality: 'กระทุ่มแบน', addressRegion: 'สมุทรสาคร', postalCode: '74130', addressCountry: 'TH' },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      <section className="bg-navy-50">
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-cyan-700 px-3 py-1 text-sm font-semibold text-white">ผู้ผลิตโดยตรง ตั้งแต่ปี 2537</span>
            <h1 className="text-3xl font-bold leading-tight text-navy-900 md:text-4xl">ถังเก็บน้ำ & ถังบำบัดน้ำเสีย<br />คุณภาพมาตรฐาน มอก.</h1>
            <p className="text-lg text-ink">ผู้ผลิตโดยตรงสำหรับบ้าน ร้านอาหาร และโครงการ — สั่งออนไลน์ได้ทันที ค่าส่งคำนวณอัตโนมัติ ส่งทั่วประเทศ หรือรับเองที่โรงงาน</p>
            <p className="text-muted">ผลิตจาก PE และไฟเบอร์กลาส (FRP) แบรนด์ ENTECH และ POLYTEC ปลอดภัยสำหรับน้ำดื่ม ไร้สนิม</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary px-6">เลือกซื้อสินค้า</Link>
              <Link href="/services#quote" className="btn-outline">ขอใบเสนอราคา</Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src="/images/products/cat_tank.jpg" alt="ถังเก็บน้ำ ENTECH ที่โรงงาน" fill priority sizes="(max-width:768px) 100vw, 600px" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="mb-6 text-2xl font-bold text-navy-900">หมวดหมู่สินค้า</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {cats.map((c) => (
            <Link key={c.id} href={`/products/${c.slug}`} className="card flex flex-col items-center gap-3 p-4 text-center hover:shadow-md">
              <span className="relative h-24 w-24 overflow-hidden rounded-full bg-navy-50"><Image src={c.image} alt={c.name} fill sizes="96px" className="object-cover" /></span>
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-navy-900">สินค้าแนะนำ</h2>
          <Link href="/products" className="inline-block py-2 text-sm font-semibold text-navy-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="container-x pb-12" aria-labelledby="h-why">
        <h2 id="h-why" className="mb-6 text-2xl font-bold text-navy-900">ทำไมต้อง ENTECH</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['ผู้ผลิตโดยตรง', 'ออกแบบและผลิตเองตั้งแต่ปี 2537 ราคาจากโรงงาน'], ['มาตรฐาน มอก.', 'ถัง PE และไฟเบอร์กลาสได้รับมาตรฐานผลิตภัณฑ์อุตสาหกรรม'], ['รับประกันสูงสุด 20 ปี', 'ถังเก็บน้ำรุ่น GRAND STONE และ NATURAL DESIGN'], ['ทีมวิศวกร', 'ออกแบบและก่อสร้างระบบบำบัดน้ำเสียสำหรับชุมชนและโรงงาน']].map(([t, d]) => (
            <li key={t} className="card p-5"><p className="font-bold text-navy-900">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></li>
          ))}
        </ul>
      </section>

      {arts.length > 0 && (
        <section className="container-x pb-12" aria-labelledby="h-arts">
          <div className="mb-6 flex items-end justify-between">
            <h2 id="h-arts" className="text-2xl font-bold text-navy-900">บทความและข่าวสาร</h2>
            <Link href="/articles" className="inline-block py-2 text-sm font-semibold text-navy-700 hover:underline">ดูทั้งหมด →</Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {arts.slice(0, 3).map((a) => (
              <li key={a.id}><Link href={`/articles/${a.slug}`} className="card block h-full p-5 hover:shadow-md"><p className="font-bold text-navy-900">{a.title}</p>{a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-navy-700 p-8 text-white md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">ต้องการระบบบำบัดน้ำเสียสำหรับโครงการ?</h2>
            <p className="text-navy-100">ทีมวิศวกรพร้อมออกแบบ ผลิต และติดตั้ง — ประเมินราคาฟรี</p>
          </div>
          <Link href="/services#quote" className="btn bg-white text-navy-700 hover:bg-cyan-100">ขอใบเสนอราคา</Link>
          <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="btn-line">LINE {CONTACT.line}</a>
        </div>
      </section>
    </>
  );
}
