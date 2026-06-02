import { useState } from 'react';
import type { Surah, TafsirResponse } from '../types';
import { fetchTafsir as apiFetchTafsir } from '../api/tafsir';

export function useTafsir() {
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [currentTafsir, setCurrentTafsir] = useState<TafsirResponse | null>(null);
  const [verseRangeValue, setVerseRangeValue] = useState('كاملة');

  const fetchTafsir = async (surah: Surah, range = 'كاملة') => {
    setLoadingTafsir(true);
    try {
      const data = await apiFetchTafsir(surah, range);
      setCurrentTafsir(data);
      return data;
    } finally {
      setLoadingTafsir(false);
    }
  };

  return { loadingTafsir, currentTafsir, verseRangeValue, setVerseRangeValue, fetchTafsir };
}
