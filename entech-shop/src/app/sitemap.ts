import { SITE_URL } from '@/lib/site';
import type { MetadataRoute } from 'next';
import { getCategories, listProducts } from '@/lib/catalog';
import { listPublished } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = SITE_URL;
  const [cats, prods, arts] = await Promise.all([getCategories(), listProducts({ limit: 1000 }), listPublished()]);
  return [
    ...['', '/products', '/services', '/about', '/contact', '/articles', '/csr', '/faq', '/terms', '/privacy'].map((p) => ({ url: site + p, changeFrequency: 'weekly' as const, priority: p ? 0.7 : 1 })),
    ...cats.map((c) => ({ url: `${site}/products/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...arts.map((a) => ({ url: `${site}/articles/${a.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...prods.map((p) => ({ url: `${site}/product/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.9 })),
  ];
}
