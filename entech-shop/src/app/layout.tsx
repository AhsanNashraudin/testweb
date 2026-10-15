import type { Metadata, Viewport } from 'next';
import { SITE_URL, DEFAULT_DESC, OG } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'ENTECH | ถังเก็บน้ำ ถังบำบัดน้ำเสีย ผู้ผลิตมาตรฐาน มอก.', template: '%s | ENTECH' },
  description: DEFAULT_DESC,
  openGraph: OG,
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#16304f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
