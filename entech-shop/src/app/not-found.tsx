import Link from 'next/link';
import { Header, Footer } from '@/components/site';
import { getContact } from '@/lib/content';
import { getCategories } from '@/lib/catalog';
import { LineIcon } from '@/components/line-icon';

export const metadata = { title: 'ไม่พบหน้าที่ต้องการ', robots: { index: false } };

/** หน้า 404 (รวม URL เก่าที่ไม่มีใน redirect) — มีเมนู ค้นหา และทางไปต่อครบ */
export default async function NotFound() {
  const CONTACT = await getContact();
  const cats = await getCategories();
  return (
    <>
      <Header />
      <main id="main" className="container-x py-14 text-center">
        <p className="text-6xl font-bold text-navy-700" aria-hidden>404</p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="mt-2 text-muted">หน้านี้อาจถูกย้ายจากเว็บไซต์เดิม ลองค้นหาสินค้าจากช่องค้นหาด้านบน หรือเลือกหมวดด้านล่าง</p>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {cats.map((c) => <Link key={c.id} href={`/products/${c.slug}`} className="btn-outline">{c.name}</Link>)}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">กลับหน้าแรก</Link>
          <a href={CONTACT.lineUrl} target="_blank" rel="noopener" className="btn-line"><LineIcon />สอบถามทาง LINE</a>
        </div>
      </main>
      <Footer />
    </>
  );
}
