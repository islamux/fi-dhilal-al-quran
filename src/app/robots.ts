import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL || 'https://fi-dhilal-al-quran.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
