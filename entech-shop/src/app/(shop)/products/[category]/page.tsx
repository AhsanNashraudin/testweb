import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, listProducts } from '@/lib/catalog';
import { ProductGridPage } from '@/components/product-grid-page';

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; sort?: string }> };
const find = async (slug: string) => (await getCategories()).find((c) => c.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await find((await params).category);
  return c ? { title: c.name, description: c.description, alternates: { canonical: `/products/${c.slug}` } } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const c = await find((await params).category);
  if (!c) notFound();
  const { q = '', sort = '' } = await searchParams;
  const products = await listProducts({ categoryId: c.id, q: q.slice(0, 60), sort });
  return <ProductGridPage title={c.name} description={c.description} products={products} q={q} sort={sort} crumbs={[['/', 'หน้าแรก'], ['/products', 'สินค้า'], [`/products/${c.slug}`, c.name]]} />;
}
