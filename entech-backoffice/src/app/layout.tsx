import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'หลังบ้าน ENTECH', template: '%s | หลังบ้าน ENTECH' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#16304f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
