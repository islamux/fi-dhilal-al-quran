import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/src/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
