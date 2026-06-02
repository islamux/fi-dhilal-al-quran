import { motion } from 'motion/react';
import { Search, X, Compass } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import { SURAHS, JUZ_INDEX } from '../data/surahs';
import type { Surah } from '../types';

interface SidebarProps {
  isDarkMode: boolean;
  selectedSurah: Surah;
  setSelectedSurah: (surah: Surah) => void;
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
  completedSurahs: number[];
}

export function Sidebar({
  isDarkMode, selectedSurah, setSelectedSurah, searchQuery, setSearchQuery,
  mobileSidebarOpen, setMobileSidebarOpen, juzFilter, setJuzFilter,
  typeFilter, setTypeFilter, sidebarTab, setSidebarTab, completedSurahs
}: SidebarProps) {
  const filteredSurahs = SURAHS.filter(surah => {
    const matchesSearch = surah.name.toLowerCase().includes(searchQuery.toLowerCase()) || surah.arName.includes(searchQuery);
    const matchesType = typeFilter === 'all' || surah.type === typeFilter;
    const matchesJuz = juzFilter === null || surah.juzNumber === juzFilter;
    return matchesSearch && matchesType && matchesJuz;
  });

  return (
    <aside className={`fixed lg:relative top-0 right-0 z-50 h-full w-[330px] sm:w-[350px] shrink-0 flex flex-col transition-transform lg:translate-x-0 border-l ${
      isDarkMode ? 'bg-brand-dark-surface border-brand-dark-border text-brand-dark-active' : 'bg-brand-stone border-brand-border text-brand-rich'
    } ${mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`} id="right-sidebar">
      <div className={`p-6 border-b flex items-start justify-between ${
        isDarkMode ? 'border-brand-dark-border bg-[#0B0B0B]' : 'border-brand-border bg-[#FAF9F6]'
      }`} id="sidebar-header">
        <div className="flex flex-col text-right">
          <span className="text-[9px] uppercase tracking-[0.25em] text-gilded-gold font-mono mb-1.5 leading-none font-bold">THEMATIC INDEX CATALOG</span>
          <h1 className="text-2xl font-bold tracking-tight text-brand-rich dark:text-brand-dark-active font-serif leading-none">
            فهرس <span className="italic font-normal text-gilded-gold">الظُّلال</span>
          </h1>
        </div>
        <button
          id="close-sidebar-btn"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1 rounded hover:bg-black/10 focus:outline-none text-brand-grey"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className={`flex border-b text-sm font-medium ${isDarkMode ? 'border-brand-dark-border' : 'border-brand-border'}`} id="sidebar-tabs">
        <button
          id="sidebar-tab-surahs"
          onClick={() => setSidebarTab('surahs')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            sidebarTab === 'surahs' ? 'text-gilded-gold' : isDarkMode ? 'text-brand-dark-mute hover:text-white' : 'text-brand-faded hover:text-brand-rich'
          }`}
        >
          فهرس السور
          {sidebarTab === 'surahs' && <motion.div layoutId="sidebarActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gilded-gold" />}
        </button>
        <button
          id="sidebar-tab-juz"
          onClick={() => setSidebarTab('juz')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            sidebarTab === 'juz' ? 'text-gilded-gold' : isDarkMode ? 'text-brand-dark-mute hover:text-white' : 'text-brand-faded hover:text-brand-rich'
          }`}
        >
          فهرس الأجزاء
          {sidebarTab === 'juz' && <motion.div layoutId="sidebarActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gilded-gold" />}
        </button>
      </div>

      {sidebarTab === 'surahs' && (
        <div className={`p-4 space-y-3 border-b ${
          isDarkMode ? 'border-brand-dark-border bg-[#0E0E0E]' : 'border-brand-border bg-[#FCFAF7]'
        }`} id="quick-filters-panel">
          <div className={`relative flex items-center rounded-none border px-3 py-1.5 transition-all text-sm ${
            isDarkMode ? 'bg-[#151515] border-brand-dark-border text-white' : 'bg-white border-brand-border text-brand-rich'
          }`}>
            <Search className="w-4 h-4 text-gilded-gold shrink-0 mr-1 ml-2" />
            <input
              id="search-surah-input"
              type="text"
              placeholder="ابحث عن سورة أو آية..."
              dir="rtl"
              className="bg-transparent w-full focus:outline-none placeholder-brand-grey font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button id="clear-search-btn" onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-black/10 rounded-sm">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2 text-xs" id="surah-type-toggles">
            {(['all', 'مكية', 'مدنية'] as const).map(type => (
              <button
                key={type}
                id={`filter-type-${type}`}
                onClick={() => setTypeFilter(type)}
                className={`flex-1 py-1 px-2.5 rounded-none border text-center transition-all ${
                  typeFilter === type
                    ? 'border-gilded-gold bg-gilded-gold/10 text-gilded-gold font-bold'
                    : isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white' : 'border-brand-border text-brand-faded hover:text-brand-rich'
                }`}
              >
                {type === 'all' ? 'الكل' : type === 'مكية' ? 'مكيّة' : 'مدنيّة'}
              </button>
            ))}
          </div>
          {juzFilter !== null && (
            <div className="flex items-center justify-between bg-gilded-gold/10 border border-gilded-gold/30 rounded-none px-2.5 py-1 text-xs text-gilded-gold">
              <span>تصفح الجزء: {toArabicNumerals(juzFilter)}</span>
              <button id="clear-juz-filter" onClick={() => setJuzFilter(null)} className="hover:bg-gilded-gold/20 p-0.5 rounded-none">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-0 space-y-0" id="sidebar-scrollable-content">
        {sidebarTab === 'surahs' ? (
          filteredSurahs.length > 0 ? (
            filteredSurahs.map((surah) => {
              const isSelected = selectedSurah.id === surah.id;
              const isCompleted = completedSurahs.includes(surah.id);
              return (
                <button
                  id={`surah-card-${surah.id}`}
                  key={surah.id}
                  onClick={() => { setSelectedSurah(surah); setMobileSidebarOpen(false); }}
                  className={`w-full text-right p-4 rounded-none transition-all border-b border-[#2A2A2A] flex items-center justify-between ${
                    isSelected
                      ? 'bg-gilded-gold/5 border-r-2 border-r-gilded-gold text-gilded-gold font-bold'
                      : isDarkMode ? 'bg-brand-dark-surface hover:bg-brand-dark-hover/70 text-brand-dark-active border-[#2A2A2A]' : 'bg-white hover:bg-[#FAF9F6] text-brand-rich border-brand-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-none flex items-center justify-center text-xs border font-mono ${
                      isSelected ? 'border-gilded-gold text-gilded-gold' : isDarkMode ? 'border-brand-dark-border/80 text-brand-dark-mute' : 'border-brand-border text-brand-grey'
                    }`}>
                      {toArabicNumerals(surah.id)}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5 font-sans">
                        {surah.arName}
                        {isCompleted && <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 inline-block" title="تم إنهاء تلاوتها ومُدارستها" />}
                      </div>
                      <div className={`text-[11px] font-mono tracking-tight ${
                        isSelected ? 'text-gilded-gold/80' : isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'
                      }`}>
                        {surah.type} • {toArabicNumerals(surah.versesCount)} آية
                      </div>
                    </div>
                  </div>
                  <div className="text-left font-mono text-[9px] tracking-wider uppercase opacity-40 shrink-0">
                    {surah.name}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 text-sm text-brand-grey font-sans" id="no-search-results">
              لا توجد سور تناسب محددات البحث.
            </div>
          )
        ) : (
          <div className="space-y-2 p-1" id="juz-index-list">
            {JUZ_INDEX.map((j) => (
              <button
                id={`juz-btn-${j.juz}`}
                key={j.juz}
                onClick={() => { setJuzFilter(j.juz); setSidebarTab('surahs'); }}
                className={`w-full text-right p-3 rounded-lg border transition-all ${
                  juzFilter === j.juz
                    ? 'bg-gilded-gold/15 border-gilded-gold text-gilded-gold font-bold'
                    : isDarkMode ? 'bg-brand-dark-surface hover:bg-[#20203a] border-brand-dark-border' : 'bg-white hover:bg-[#eae6de] border-brand-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{j.name}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
                      يضم {toArabicNumerals(j.surahs.length)} سور من الفهرس الممنهج
                    </div>
                  </div>
                  <Compass className="w-4 h-4 text-gilded-gold opacity-60" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 border-t text-xs ${
        isDarkMode ? 'border-brand-dark-border bg-brand-dark-bg/40' : 'border-brand-border bg-brand-stone/40'
      }`} id="sidebar-footer-stats">
        <div className="flex items-center justify-between mb-2">
          <span className={`${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>تمت قراءة ومُدارسة:</span>
          <span className="font-bold text-gilded-gold">
            {toArabicNumerals(completedSurahs.length)} / {toArabicNumerals(SURAHS.length)} سورة
          </span>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-brand-dark-border' : 'bg-brand-border'}`}>
          <div className="bg-gilded-gold h-full" style={{ width: `${(completedSurahs.length / SURAHS.length) * 105}%` }} />
        </div>
      </div>
    </aside>
  );
}
