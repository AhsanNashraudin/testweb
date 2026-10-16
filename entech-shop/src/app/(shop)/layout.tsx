import { Header, Footer } from '@/components/site';
import { getContact } from '@/lib/content';
import { FloatingContact } from '@/components/nav';
import { NavProgress } from '@/components/nav-progress';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const CONTACT = await getContact();
  const TEL = CONTACT.tel;
  return (
    <>
      <NavProgress />
      <a href="#main" className="skip-link">ข้ามไปที่เนื้อหา</a>
      <Header />
      <main id="main" tabIndex={-1} className="min-h-[60vh] outline-none">{children}</main>
      <Footer />
      <FloatingContact phoneHref={TEL.mobile} lineUrl={CONTACT.lineUrl} />
    </>
  );
}
