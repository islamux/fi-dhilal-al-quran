import { useState, useEffect } from 'react';
import type { Surah, HistoryItem } from '../types';

const HISTORY_KEY = 'thilal_history';
const COMPLETED_KEY = 'thilal_completed';

export function useProgress() {
  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>([]);
  const [completedSurahs, setCompletedSurahs] = useState<number[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) setReadingHistory(JSON.parse(savedHistory));
    const savedCompleted = localStorage.getItem(COMPLETED_KEY);
    if (savedCompleted) setCompletedSurahs(JSON.parse(savedCompleted));
  }, []);

  const addHistoryItem = (surah: Surah, range?: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      surahId: surah.id,
      surahName: surah.arName,
      verseIndex: range && range !== 'كاملة' ? parseInt(range) : undefined,
      viewedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [item, ...readingHistory.filter(h => h.surahId !== surah.id).slice(0, 19)];
    setReadingHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const toggleComplete = (surahId: number) => {
    let next: number[];
    if (completedSurahs.includes(surahId)) {
      next = completedSurahs.filter(id => id !== surahId);
    } else {
      next = [...completedSurahs, surahId];
    }
    setCompletedSurahs(next);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(next));
  };

  return { readingHistory, completedSurahs, addHistoryItem, toggleComplete };
}
