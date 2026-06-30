import { useState } from 'react';
import type { Surah } from '../types';
import { SURAHS_WITH_TAFSIR } from '../data/tafsir-meta';
import { loadTafsirData } from '../data/tafsir-loader';
import { getTafsirText } from '../utils/tafsir-data';

export function useTafsir() {
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [verseRangeValue, setVerseRangeValue] = useState('كاملة');

  const fetchTafsir = async (surah: Surah, range = 'كاملة') => {
    setTafsirText(null);
    const data = await loadTafsirData();
    setTafsirText(getTafsirText(surah.id, data, range));
  };

  return {
    tafsirText,
    verseRangeValue,
    setVerseRangeValue,
    fetchTafsir,
    hasTafsir: (surahId: number) => SURAHS_WITH_TAFSIR.has(surahId),
  };
}
