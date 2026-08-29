'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Bookmark, HistoryItem, Surah } from '../types';
import type { SearchMatch } from '../utils/search';
import { useBookmarks } from '../hooks/useBookmarks';
import { useProgress } from '../hooks/useProgress';
import { useSearch } from '../hooks/useChat';
import { useDataSync } from '../hooks/useDataSync';

interface AppStateValue {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  juzFilter: number | null;
  setJuzFilter: (v: number | null) => void;
  typeFilter: 'all' | 'مكية' | 'مدنية';
  setTypeFilter: (v: 'all' | 'مكية' | 'مدنية') => void;
  sidebarTab: 'surahs' | 'juz';
  setSidebarTab: (v: 'surahs' | 'juz') => void;
  bookmarks: Bookmark[];
  toggleBookmark: (surahId: number, verseIndex?: number) => void;
  isBookmarked: (surahId: number, verseIndex?: number) => boolean;
  removeBookmark: (id: string) => void;
  clearAll: () => void;
  readingHistory: HistoryItem[];
  completedSurahs: number[];
  addHistoryItem: (surah: Surah, range?: string) => void;
  toggleComplete: (surahId: number) => void;
  searchInput: string;
  setSearchInput: (v: string) => void;
  results: SearchMatch[];
  searching: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  handleSearch: (query: string) => void;
  clearResults: () => void;
  syncPending: boolean;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [juzFilter, setJuzFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'مكية' | 'مدنية'>('all');
  const [sidebarTab, setSidebarTab] = useState<'surahs' | 'juz'>('surahs');

  const { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll } = useBookmarks();
  const { readingHistory, completedSurahs, addHistoryItem, toggleComplete } = useProgress();
  const { searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults } = useSearch();
  const { syncPending } = useDataSync();

  const value: AppStateValue = {
    searchQuery, setSearchQuery,
    mobileSidebarOpen, setMobileSidebarOpen,
    juzFilter, setJuzFilter,
    typeFilter, setTypeFilter,
    sidebarTab, setSidebarTab,
    bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll,
    readingHistory, completedSurahs, addHistoryItem, toggleComplete,
    searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults,
    syncPending,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
