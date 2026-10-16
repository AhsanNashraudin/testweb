import type { NextConfig } from 'next';

// URL ของเว็บเดิม (ReadyPlanet) → URL ใหม่ (301) เพื่อรักษาอันดับ Google
const OLD: [string, string][] = [
  ['16507193', '/products/water-tanks'], ['16498970', '/products/fiberglass-water-tanks'], ['16492681', '/products/septic-tanks'],
  ['16498972', '/products/grease-traps'], ['16492683', '/products/fiberglass-doors'], ['16498973', '/products/wall-bins'],
  ['17302323', '/products/planters'], ['16492427', '/product/amazon-timber'], ['16492551', '/product/amazon-sofa'],
  ['16492630', '/product/amazon-garden-funs'], ['16492687', '/product/florist-meesap'], ['16546770', '/product/grand-stone'],
  ['16546771', '/product/natural-design'], ['16546781', '/product/polytec-underground-tank'], ['16498966', '/product/polytec-septic-tank'],
  ['16498968', '/product/entech-nano'], ['17458363', '/product/fiberglass-septic-tank'], ['16507206', '/product/fiberglass-septic-tank'],
  ['16507199', '/product/fiberglass-water-tank'], ['17420668', '/product/grease-trap-under-sink'],
  ['16464237', '/about'], ['17310427', '/about'], ['16533552', '/about'], ['16499042', '/contact'],
];

const config: NextConfig = {
  poweredByHeader: false,
  // อัปโหลดรูปจากหลังบ้าน (ย่อในเบราว์เซอร์แล้ว ปกติไม่กี่ร้อย KB)
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async redirects() {
    return [
      ...OLD.map(([id, destination]) => ({ source: `/${id}/:slug*`, destination, permanent: true })),
      { source: '/tag/:tag*', destination: '/products', permanent: true },
      ...['/index.php', '/index.html', '/home'].map((source) => ({ source, destination: '/', permanent: true })),
      // หน้าอื่นของเว็บเดิม (รหัส 8 หลัก) ที่ไม่ได้จับคู่ไว้ → หน้าสินค้าทั้งหมด แทนที่จะเป็น 404
      { source: '/:id(\\d{8})/:slug*', destination: '/products', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }];
  },
};
export default config;
