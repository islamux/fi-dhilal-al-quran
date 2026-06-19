import { useState, useEffect } from 'react';
import type { Surah, HistoryItem } from '../types';
import { localStorageBackend, type StorageBackend } from '../utils/localStorage';

const HISTORY_KEY = 'thilal_history';
const COMPLETED_KEY = 'thilal_completed';

export function useProgress(storage: StorageBackend = localStorageBackend) {
  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>(() =>
    storage.get<HistoryItem[]>(HISTORY_KEY) ?? []
  );
  const [completedSurahs, setCompletedSurahs] = useState<number[]>(() =>
    storage.get<number[]>(COMPLETED_KEY) ?? []
  );

  useEffect(() => {
    storage.set(HISTORY_KEY, readingHistory);
  }, [readingHistory, storage]);

  useEffect(() => {
    storage.set(COMPLETED_KEY, completedSurahs);
  }, [completedSurahs, storage]);

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
