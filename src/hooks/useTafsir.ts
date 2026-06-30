import { useState } from 'react';
import type { Surah } from '../types';
import { TAFSIR_DATA, SURAHS_WITH_TAFSIR } from '../data/tafsir';
import { getTafsirText } from '../utils/tafsir-data';

export function useTafsir() {
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [verseRangeValue, setVerseRangeValue] = useState('كاملة');

  const fetchTafsir = (surah: Surah, range = 'كاملة') => {
    setTafsirText(getTafsirText(surah.id, TAFSIR_DATA, range));
  };

  return {
    tafsirText,
    verseRangeValue,
    setVerseRangeValue,
    fetchTafsir,
    hasTafsir: (surahId: number) => SURAHS_WITH_TAFSIR.has(surahId),
  };
}
