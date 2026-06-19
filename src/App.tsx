import { useTheme } from './hooks/useTheme';
import { useAppState } from './hooks/useAppState';
import { MobileOverlay } from './components/MobileOverlay';
import { BrandStrip } from './components/BrandStrip';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';

export default function App() {
  const { isDarkMode } = useTheme();
  const {
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
    handleNavigateToSurah,
  } = useAppState();

  return (
    <div className={`flex h-screen w-full overflow-hidden ${
      isDarkMode ? 'bg-brand-dark-bg text-brand-dark-active' : 'bg-brand-parchment text-brand-rich'
    }`}>
      <MobileOverlay open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <BrandStrip />
      <Sidebar
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
      <MainContent
        selectedSurah={selectedSurah}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        toggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        toggleComplete={toggleComplete}
        completedSurahs={completedSurahs}
        tafsirText={tafsirText}
        verseRangeValue={verseRangeValue}
        setVerseRangeValue={setVerseRangeValue}
        fetchTafsir={fetchTafsir}
        hasTafsir={hasTafsir}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        results={results}
        searching={searching}
        bottomRef={bottomRef}
        handleSearch={handleSearch}
        clearResults={clearResults}
        handleNavigateToSurah={handleNavigateToSurah}
        bookmarks={bookmarks}
        readingHistory={readingHistory}
        clearAll={clearAll}
        removeBookmark={removeBookmark}
      />
    </div>
  );
}
