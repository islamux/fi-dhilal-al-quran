import type { MetadataRoute } from 'next';
import { SURAHS } from '@/src/data/surahs';

const SITE_URL = process.env.SITE_URL || 'https://fi-dhilal-al-quran.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
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
