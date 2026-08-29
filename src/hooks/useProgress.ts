import type { Surah, HistoryItem } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

const HISTORY_KEY = 'dhilal_history';
const COMPLETED_KEY = 'dhilal_completed';

export function useProgress() {
  const [readingHistory, setReadingHistory] = useLocalStorageState<HistoryItem[]>(HISTORY_KEY, []);
  const [completedSurahs, setCompletedSurahs] = useLocalStorageState<number[]>(COMPLETED_KEY, []);

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
