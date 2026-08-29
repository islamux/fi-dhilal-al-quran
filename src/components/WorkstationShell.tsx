'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppStateContext';
import { SURAHS } from '../data/surahs';
import type { Surah } from '../types';
import { MobileOverlay } from './MobileOverlay';
import { BrandStrip } from './BrandStrip';
import { Sidebar } from './Sidebar';

function resolveSurah(id?: string | string[]): Surah {
  const n = Array.isArray(id) ? Number(id[0]) : Number(id);
  return SURAHS.find(s => s.id === n) ?? SURAHS[0];
}

export function WorkstationShell({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const selectedSurah = resolveSurah(params?.id);
  const {
    searchQuery, setSearchQuery,
    mobileSidebarOpen, setMobileSidebarOpen,
    juzFilter, setJuzFilter,
    typeFilter, setTypeFilter,
    sidebarTab, setSidebarTab,
    completedSurahs,
  } = useAppState();

  const onSelectSurah = (id: number) => {
    setMobileSidebarOpen(false);
    if (id === selectedSurah.id) return;
    router.push(`/surah/${id}`);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${
      isDarkMode ? 'bg-brand-dark-bg text-brand-dark-active' : 'bg-brand-parchment text-brand-rich'
    }`}>
      <MobileOverlay open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <BrandStrip />
      <Sidebar
        selectedSurah={selectedSurah}
        onSelectSurah={onSelectSurah}
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
      <div className="flex-1 h-full flex flex-col min-w-0">{children}</div>
    </div>
  );
}
