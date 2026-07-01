import { useState, useEffect } from 'react';
import { SURAHS } from '../data/surahs';
import type { Surah } from '../types';
import { useBookmarks } from './useBookmarks';
import { useDataSync } from './useDataSync';
import { useProgress } from './useProgress';
import { useTafsir } from './useTafsir';
import { useSearch } from './useChat';

export function useAppState() {
  const [selectedSurah, setSelectedSurah] = useState<Surah>(SURAHS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'verses' | 'chat' | 'stats'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [juzFilter, setJuzFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'مكية' | 'مدنية'>('all');
  const [sidebarTab, setSidebarTab] = useState<'surahs' | 'juz'>('surahs');

  const { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll } = useBookmarks();
  const { readingHistory, completedSurahs, addHistoryItem, toggleComplete } = useProgress();
  const { tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir } = useTafsir();
  const { searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults } = useSearch();
  const { syncPending } = useDataSync();

  useEffect(() => {
    fetchTafsir(selectedSurah, 'كاملة');
    addHistoryItem(selectedSurah, 'كاملة');
    setVerseRangeValue('كاملة');
  }, [selectedSurah]);

  const handleNavigateToSurah = (surahId: number) => {
    const surah = SURAHS.find(s => s.id === surahId);
    if (surah) {
      setSelectedSurah(surah);
      setActiveTab('verses');
    }
  };

  return {
    selectedSurah, setSelectedSurah,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    mobileSidebarOpen, setMobileSidebarOpen,
    juzFilter, setJuzFilter,
    typeFilter, setTypeFilter,
    sidebarTab, setSidebarTab,
    bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll,
    readingHistory, completedSurahs, addHistoryItem, toggleComplete,
    tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir,
    searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults,
    syncPending,
    handleNavigateToSurah,
  };
}
