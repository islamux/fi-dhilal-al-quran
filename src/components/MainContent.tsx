import { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import type { Surah } from '../types';
import type { SearchMatch } from '../utils/search';
import type { Bookmark, HistoryItem } from '../types';
import { Header } from './Header';
import { SurahBanner } from './SurahBanner';
import { TabBar } from './TabBar';
import { Footer } from './Footer';

const OverviewTab = lazy(() => import('./OverviewTab').then(m => ({ default: m.OverviewTab })));
const VersesTab = lazy(() => import('./VersesTab').then(m => ({ default: m.VersesTab })));
const ChatTab = lazy(() => import('./ChatTab').then(m => ({ default: m.ChatTab })));
const StatsTab = lazy(() => import('./StatsTab').then(m => ({ default: m.StatsTab })));

interface MainContentProps {
  selectedSurah: Surah;
  activeTab: 'overview' | 'verses' | 'chat' | 'stats';
  setActiveTab: (tab: 'overview' | 'verses' | 'chat' | 'stats') => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  toggleBookmark: (surahId: number, verseIndex?: number) => void;
  isBookmarked: (surahId: number, verseIndex?: number) => boolean;
  toggleComplete: (surahId: number) => void;
  completedSurahs: number[];
  tafsirText: string | null;
  verseRangeValue: string;
  setVerseRangeValue: (v: string) => void;
  fetchTafsir: (surah: Surah, range: string) => void;
  hasTafsir: (surahId: number) => boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  results: SearchMatch[];
  searching: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  handleSearch: (query: string) => void;
  clearResults: () => void;
  handleNavigateToSurah: (surahId: number) => void;
  bookmarks: Bookmark[];
  readingHistory: HistoryItem[];
  clearAll: () => void;
  removeBookmark: (id: string) => void;
}

export function MainContent(props: MainContentProps) {
  const { isDarkMode } = useTheme();
  const {
    selectedSurah, activeTab, setActiveTab, setMobileSidebarOpen,
    toggleBookmark, isBookmarked, toggleComplete, completedSurahs,
    tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir,
    searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults,
    handleNavigateToSurah, bookmarks, readingHistory, clearAll, removeBookmark,
  } = props;

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden relative" id="main-reading-canvas">
      <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-black/10" id="progress-bar-track">
        <div
          className="h-full bg-gilded-gold transition-all duration-300 shadow-[0_0_8px_#c9a84c]"
          style={{ width: activeTab === 'overview' ? '25%' : activeTab === 'verses' ? '65%' : activeTab === 'chat' ? '90%' : '100%' }}
        />
      </div>

      <Header
        selectedSurah={selectedSurah}
        setMobileSidebarOpen={setMobileSidebarOpen}
        toggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        toggleComplete={toggleComplete}
        completedSurahs={completedSurahs}
      />

      <div className="flex-1 overflow-y-auto" id="reading-scroll-pane">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-8">
          <SurahBanner selectedSurah={selectedSurah} />
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

          <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold animate-spin" /></div>}>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <OverviewTab
                  tafsirText={tafsirText}
                  selectedSurah={selectedSurah}
                  hasTafsir={hasTafsir(selectedSurah.id)}
                />
              )}
              {activeTab === 'verses' && (
                <VersesTab
                  tafsirText={tafsirText}
                  verseRangeValue={verseRangeValue}
                  setVerseRangeValue={setVerseRangeValue}
                  selectedSurah={selectedSurah}
                  fetchTafsir={fetchTafsir}
                  hasTafsir={hasTafsir(selectedSurah.id)}
                />
              )}
              {activeTab === 'chat' && (
                <ChatTab
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  results={results}
                  searching={searching}
                  bottomRef={bottomRef}
                  handleSearch={handleSearch}
                  clearResults={clearResults}
                  onNavigateToSurah={handleNavigateToSurah}
                />
              )}
              {activeTab === 'stats' && (
                <StatsTab
                  completedSurahs={completedSurahs}
                  bookmarks={bookmarks}
                  readingHistory={readingHistory}
                  clearAll={clearAll}
                  removeBookmark={removeBookmark}
                />
              )}
            </AnimatePresence>
          </Suspense>

          <Footer />
        </div>
      </div>
    </main>
  );
}
