import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SURAHS } from '@/src/data/surahs';
import { loadTafsirData } from '@/src/data/tafsir-loader';
import { getTafsirText } from '@/src/utils/tafsir-data';
import { toArabicNumerals } from '@/src/utils';
import { SurahReader } from '@/src/components/SurahReader';
import { getSiteUrl } from '@/src/lib/site-url';

export async function generateStaticParams() {
  return SURAHS.map(s => ({ id: String(s.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const surah = SURAHS.find(s => s.id === Number(id));
  if (!surah) return { title: 'غير موجود' };

  const description = `قراءة وتدبّر وتفسير سورة ${surah.arName} — ${surah.type}، ${surah.versesCount} آية في الجزء ${surah.juzNumber}، من كتاب في ظلال القرآن لسيد قطب.`;

  return {
    title: `تفسير سورة ${surah.arName}`,
    description,
    alternates: { canonical: `/surah/${surah.id}` },
    openGraph: {
      title: `تفسير سورة ${surah.arName} — في ظلال القرآن`,
      description,
      url: `${getSiteUrl()}/surah/${surah.id}`,
      type: 'website',
      locale: 'ar_AR',
    },
  };
}

export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const surah = SURAHS.find(s => s.id === Number(id));
  if (!surah) notFound();

  const data = await loadTafsirData();
  const tafsirText = getTafsirText(surah.id, data, 'كاملة');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: `سورة ${surah.arName}`,
    inLanguage: 'ar',
    genre: surah.type === 'مكية' ? 'Meccan Surah' : 'Medinan Surah',
    numberOfPages: surah.versesCount,
    isPartOf: {
      '@type': 'Book',
      name: 'في ظلال القرآن',
      author: { '@type': 'Person', name: 'سيد قطب' },
    },
    description: `تفسير سورة ${surah.arName} من في ظلال القرآن لسيد قطب`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SurahReader surah={surah} initialTafsirText={tafsirText} />
    </>
  );
}

export const dynamicParams = true;
