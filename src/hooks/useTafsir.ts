import { useState } from 'react';
import type { Surah } from '../types';
import { TAFSIR_DATA, SURAHS_WITH_TAFSIR } from '../data/tafsir';

export function useTafsir() {
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [verseRangeValue, setVerseRangeValue] = useState('كاملة');

  const fetchTafsir = (surah: Surah, range = 'كاملة') => {
    const surahData = TAFSIR_DATA[surah.id];
    if (!surahData) {
      setTafsirText(null);
      return;
    }
    if (range === 'كاملة') {
      setTafsirText(surahData.map(s => s.text).join('\n\n'));
      return;
    }
    const verseNum = parseInt(range);
    const matched = surahData.filter(
      s => s.startVerse <= verseNum && s.endVerse >= verseNum
    );
    setTafsirText(matched.length > 0 ? matched.map(s => s.text).join('\n\n') : null);
  };

  return {
    tafsirText,
    verseRangeValue,
    setVerseRangeValue,
    fetchTafsir,
    hasTafsir: (surahId: number) => SURAHS_WITH_TAFSIR.has(surahId),
  };
}
