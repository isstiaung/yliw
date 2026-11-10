import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/site';

// Static export: generated at build time.
export const dynamic = 'force-static';

// Everything may be crawled. /calendar and /view opt out of the index with a
// noindex tag instead of a Disallow here, which would stop crawlers from ever
// seeing that tag.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
