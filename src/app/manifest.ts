import type { MetadataRoute } from 'next';

// Static export: the manifest is generated at build time.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your Life In Weeks',
    short_name: 'Life in Weeks',
    description: 'A printable calendar of every week of your life. Everything stays on your device.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f0e1',
    theme_color: '#f7f0e1',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
