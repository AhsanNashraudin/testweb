import { getCategories } from '@/lib/catalog';
import { DEFAULT_HOME, getHome } from '@/lib/content';
import { HomeEditor } from './home-editor';
import { requireAdmin } from '@/lib/admin';

export const metadata = { title: 'จัดการหน้าแรก' };

export default async function AdminHome() {
  await requireAdmin();
  const [home, cats] = await Promise.all([getHome(), getCategories()]);
  // ตัวเลือกลิงก์สำเร็จรูป ให้เลือกแทนการพิมพ์เอง
  const links: [string, string][] = [
    ['/products', 'สินค้าทั้งหมด'], ...cats.map((c): [string, string] => [`/products/${c.slug}`, `หมวด: ${c.name}`]),
    ['/services#quote', 'ขอใบเสนอราคา'], ['/contact', 'ติดต่อเรา'], ['/about', 'เกี่ยวกับเรา'], ['/articles', 'บทความ'], ['/faq', 'คำถามที่พบบ่อย'],
  ];
  return <HomeEditor initial={home} defaults={DEFAULT_HOME} links={links} />;
}
