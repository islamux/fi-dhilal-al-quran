import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SURAHS } from './data/surahs';
import { Surah } from './types';
import { useTheme } from './hooks/useTheme';
import { useBookmarks } from './hooks/useBookmarks';
import { useProgress } from './hooks/useProgress';
import { useTafsir } from './hooks/useTafsir';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SurahBanner } from './components/SurahBanner';
import { TabBar } from './components/TabBar';
import { OverviewTab } from './components/OverviewTab';
import { VersesTab } from './components/VersesTab';
import { ChatTab } from './components/ChatTab';
import { StatsTab } from './components/StatsTab';
import { Footer } from './components/Footer';

export default function App() {
  const [selectedSurah, setSelectedSurah] = useState<Surah>(SURAHS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'verses' | 'chat' | 'stats'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [juzFilter, setJuzFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'مكية' | 'مدنية'>('all');
  const [sidebarTab, setSidebarTab] = useState<'surahs' | 'juz'>('surahs');

  const { isDarkMode, toggleTheme } = useTheme();
  const { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll } = useBookmarks();
  const { readingHistory, completedSurahs, addHistoryItem, toggleComplete } = useProgress();
  const { loadingTafsir, currentTafsir, verseRangeValue, setVerseRangeValue, fetchTafsir } = useTafsir();
  const { chatInput, setChatInput, chatMessages, loadingChat, chatBottomRef, handleSendMessage, resetChat } = useChat();

  useEffect(() => {
    fetchTafsir(selectedSurah, 'كاملة');
    addHistoryItem(selectedSurah, 'كاملة');
    setVerseRangeValue('كاملة');
    resetChat(selectedSurah);
  }, [selectedSurah]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${
      isDarkMode ? 'bg-brand-dark-bg text-brand-dark-active' : 'bg-brand-parchment text-brand-rich'
    }`}>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black lg:hidden"
            id="mobile-overlay"
          />
        )}
      </AnimatePresence>

      <div className={`hidden xl:flex w-14 h-full border-r items-center justify-center shrink-0 ${
        isDarkMode ? 'bg-[#0B0B0B] border-brand-dark-border' : 'bg-[#FAF9F6] border-brand-border'
      }`} id="extreme-left-brand-strip">
        <div className={`rotate-[-90deg] whitespace-nowrap text-[9px] uppercase tracking-[0.55em] font-mono font-bold ${
          isDarkMode ? 'text-brand-dark-mute/50' : 'text-brand-faded/50'
        }`}>
          QUTB EXEGESIS STUDY • TAFAKKUR SESSION ١١٤
        </div>
      </div>

      <Sidebar
        isDarkMode={isDarkMode}
        selectedSurah={selectedSurah}
        setSelectedSurah={setSelectedSurah}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        juzFilter={juzFilter}
        setJuzFilter={setJuzFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        completedSurahs={completedSurahs}
      />

      <main className="flex-1 h-full flex flex-col overflow-hidden relative" id="main-reading-canvas">
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-black/10" id="progress-bar-track">
          <div
            className="h-full bg-gilded-gold transition-all duration-300 shadow-[0_0_8px_#c9a84c]"
            style={{ width: activeTab === 'overview' ? '25%' : activeTab === 'verses' ? '65%' : activeTab === 'chat' ? '90%' : '100%' }}
          />
        </div>

        <Header
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          selectedSurah={selectedSurah}
          setMobileSidebarOpen={setMobileSidebarOpen}
          toggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
          toggleComplete={toggleComplete}
          completedSurahs={completedSurahs}
        />

        <div className="flex-1 overflow-y-auto" id="reading-scroll-pane">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-8">
            <SurahBanner isDarkMode={isDarkMode} selectedSurah={selectedSurah} />
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <OverviewTab
                  isDarkMode={isDarkMode}
                  loadingTafsir={loadingTafsir}
                  currentTafsir={currentTafsir}
                  selectedSurah={selectedSurah}
                />
              )}
              {activeTab === 'verses' && (
                <VersesTab
                  isDarkMode={isDarkMode}
                  loadingTafsir={loadingTafsir}
                  currentTafsir={currentTafsir}
                  verseRangeValue={verseRangeValue}
                  setVerseRangeValue={setVerseRangeValue}
                  selectedSurah={selectedSurah}
                  fetchTafsir={fetchTafsir}
                  toggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked}
                />
              )}
              {activeTab === 'chat' && (
                <ChatTab
                  isDarkMode={isDarkMode}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatMessages={chatMessages}
                  loadingChat={loadingChat}
                  chatBottomRef={chatBottomRef}
                  handleSendMessage={handleSendMessage}
                  selectedSurah={selectedSurah}
                  resetChat={resetChat}
                />
              )}
              {activeTab === 'stats' && (
                <StatsTab
                  isDarkMode={isDarkMode}
                  completedSurahs={completedSurahs}
                  bookmarks={bookmarks}
                  readingHistory={readingHistory}
                  clearAll={clearAll}
                  removeBookmark={removeBookmark}
                />
              )}
            </AnimatePresence>

            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
