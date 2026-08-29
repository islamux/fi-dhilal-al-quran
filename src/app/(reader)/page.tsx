import type { Metadata } from 'next';
import { SURAHS } from '@/src/data/surahs';
import { loadTafsirData } from '@/src/data/tafsir-loader';
import { getTafsirText } from '@/src/utils/tafsir-data';
import { SurahReader } from '@/src/components/SurahReader';

export const metadata: Metadata = {
  title: 'في ظلال القرآن',
  description: 'خلوة التدبّر والتفسير الأدبي — في ظلال القرآن لسيد قطب.',
  alternates: { canonical: '/' },
};

export default async function ReaderHome() {
  const firstSurah = SURAHS[0];
  const data = await loadTafsirData();
  const tafsirText = getTafsirText(firstSurah.id, data, 'كاملة');
  return <SurahReader surah={firstSurah} initialTafsirText={tafsirText} />;
}
