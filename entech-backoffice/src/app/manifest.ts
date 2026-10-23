import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'หลังบ้าน ENTECH', short_name: 'ENTECH หลังบ้าน', start_url: '/', display: 'standalone',
    background_color: '#f1f5f9', theme_color: '#16304f', lang: 'th',
    icons: [{ src: '/icon.png', sizes: 'any', type: 'image/png' }],
  };
}
