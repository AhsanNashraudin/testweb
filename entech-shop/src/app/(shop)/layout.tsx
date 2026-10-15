import { Header, Footer, CONTACT, TEL } from '@/components/site';
import { FloatingContact } from '@/components/nav';
import { NavProgress } from '@/components/nav-progress';

export const dynamic = 'force-dynamic';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
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
