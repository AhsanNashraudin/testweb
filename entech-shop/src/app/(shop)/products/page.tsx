import type { Metadata } from 'next';
import { listProducts } from '@/lib/catalog';
import { ProductGridPage } from '@/components/product-grid-page';

type SP = { searchParams: Promise<{ q?: string; sort?: string }> };

export async function generateMetadata({ searchParams }: SP): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `ค้นหา “${q.slice(0, 40)}”` : 'สินค้าทั้งหมด',
    description: 'รวมสินค้า ENTECH และ POLYTEC: ถังเก็บน้ำบนดิน/ใต้ดิน ถังบำบัดน้ำเสีย ถังดักไขมัน ประตูและกระถางไฟเบอร์กลาส ราคาจากโรงงาน สั่งออนไลน์ ส่งทั่วประเทศ',
    alternates: { canonical: '/products' },
    robots: q ? { index: false, follow: true } : undefined, // หน้าผลค้นหาไม่ควรถูกเก็บใน Google
  };
}

export default async function Products({ searchParams }: SP) {
  const { q = '', sort = '' } = await searchParams;
  const products = await listProducts({ q: q.slice(0, 60), sort });
  return <ProductGridPage title={q ? `ผลการค้นหา “${q}”` : 'สินค้าทั้งหมด'} products={products} q={q} sort={sort} crumbs={[['/', 'หน้าแรก'], ['/products', 'สินค้า']]} />;
}
