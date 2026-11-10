import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/site';

// Static export: generated at build time.
export const dynamic = 'force-static';

// Only the home page: the calendar and shared views are per-person and noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: 'monthly', priority: 1 }];
}
