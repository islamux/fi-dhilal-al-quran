import type { MetadataRoute } from 'next';
import { SURAHS } from '@/src/data/surahs';
import { getSiteUrl } from '@/src/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const SITE_URL = getSiteUrl();
  const surahEntries: MetadataRoute.Sitemap = SURAHS.map(s => ({
    url: `${SITE_URL}/surah/${s.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...surahEntries,
  ];
}
