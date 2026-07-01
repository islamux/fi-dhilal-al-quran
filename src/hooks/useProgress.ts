import { useState, useEffect } from 'react';
import type { Surah, HistoryItem } from '../types';
import { localStorageBackend } from '../utils/localStorage';

const HISTORY_KEY = 'dhilal_history';
const COMPLETED_KEY = 'dhilal_completed';

export function useProgress() {
  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>(() =>
    localStorageBackend.get<HistoryItem[]>(HISTORY_KEY) ?? []
  );
  const [completedSurahs, setCompletedSurahs] = useState<number[]>(() =>
    localStorageBackend.get<number[]>(COMPLETED_KEY) ?? []
  );

  useEffect(() => {
    localStorageBackend.set(HISTORY_KEY, readingHistory);
  }, [readingHistory]);

  useEffect(() => {
    localStorageBackend.set(COMPLETED_KEY, completedSurahs);
  }, [completedSurahs]);

  const addHistoryItem = (surah: Surah, range?: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      surahId: surah.id,
      surahName: surah.arName,
      verseIndex: range && range !== 'كاملة' ? parseInt(range) : undefined,
      viewedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setReadingHistory(prev => [item, ...prev.filter(h => h.surahId !== surah.id).slice(0, 19)]);
  };

  const toggleComplete = (surahId: number) => {
    setCompletedSurahs(prev =>
      prev.includes(surahId)
        ? prev.filter(id => id !== surahId)
        : [...prev, surahId]
    );
  };

  return { readingHistory, completedSurahs, addHistoryItem, toggleComplete };
}
