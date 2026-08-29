'use client';

import { Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppStateContext';
import { useTafsir } from '../hooks/useTafsir';
import type { Surah } from '../types';
import { Header } from './Header';
import { SurahBanner } from './SurahBanner';
import { TabBar } from './TabBar';
import { Footer } from './Footer';

const OverviewTab = lazy(() => import('./OverviewTab').then(m => ({ default: m.OverviewTab })));
const VersesTab = lazy(() => import('./VersesTab').then(m => ({ default: m.VersesTab })));
const ChatTab = lazy(() => import('./ChatTab').then(m => ({ default: m.ChatTab })));
const StatsTab = lazy(() => import('./StatsTab').then(m => ({ default: m.StatsTab })));

type TabId = 'overview' | 'verses' | 'chat' | 'stats';

const VALID_TABS: TabId[] = ['overview', 'verses', 'chat', 'stats'];

interface SurahReaderProps {
  surah: Surah;
  initialTafsirText: string | null;
}

function SurahReaderInner({ surah, initialTafsirText }: SurahReaderProps) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : 'overview';
  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') params.delete('tab');
    else params.set('tab', tab);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname);
  };

  const { tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir } = useTafsir(initialTafsirText);
  const {
    setMobileSidebarOpen,
    toggleBookmark, isBookmarked, toggleComplete, completedSurahs,
    searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults,
    bookmarks, readingHistory, clearAll, removeBookmark,
  } = useAppState();

  const handleNavigateToSurah = (surahId: number) => {
    router.push(`/surah/${surahId}?tab=verses`);
  };

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden relative" id="main-reading-canvas">
      <Header
        selectedSurah={surah}
        setMobileSidebarOpen={setMobileSidebarOpen}
        toggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        toggleComplete={toggleComplete}
        completedSurahs={completedSurahs}
      />

      <div className="flex-1 overflow-y-auto" id="reading-scroll-pane">
        <div className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-12 space-y-8">
          <SurahBanner selectedSurah={surah} />
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

          <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold animate-spin" /></div>}>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <OverviewTab
                  tafsirText={tafsirText}
                  selectedSurah={surah}
                  hasTafsir={hasTafsir(surah.id)}
                />
              )}
              {activeTab === 'verses' && (
                <VersesTab
                  tafsirText={tafsirText}
                  verseRangeValue={verseRangeValue}
                  setVerseRangeValue={setVerseRangeValue}
                  selectedSurah={surah}
                  fetchTafsir={fetchTafsir}
                  hasTafsir={hasTafsir(surah.id)}
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

export function SurahReader(props: SurahReaderProps) {
  const { isDarkMode } = useTheme();
  return (
    <Suspense fallback={<div className={`h-full ${isDarkMode ? 'bg-brand-dark-bg' : 'bg-brand-parchment'}`} />}>
      <SurahReaderInner {...props} />
    </Suspense>
  );
}
