import { Menu, Sun, Moon, Bookmark as BookmarkIcon, CircleCheck } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import type { Surah } from '../types';

interface HeaderProps {
  selectedSurah: Surah;
  setMobileSidebarOpen: (v: boolean) => void;
  toggleBookmark: (surahId: number) => void;
  isBookmarked: (surahId: number) => boolean;
  toggleComplete: (surahId: number) => void;
  completedSurahs: number[];
}

export function Header({
  selectedSurah, setMobileSidebarOpen,
  toggleBookmark, isBookmarked, toggleComplete, completedSurahs
}: HeaderProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <header className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between z-30 transition-all ${
      isDarkMode ? 'bg-[#0E0E0E]/80 border-brand-dark-border backdrop-blur-md' : 'bg-brand-parchment/80 border-brand-border backdrop-blur-md'
    }`} id="canvas-header">
      <div className="flex items-center gap-4">
        <button
          id="hamburger-menu-btn"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-none border border-brand-border dark:border-brand-dark-border transition-colors hover:bg-black/5"
          aria-label="بوابة السور"
        >
          <Menu className="w-5 h-5 text-gilded-gold" />
        </button>
        <div className="flex flex-col text-right">
          <h2 className="text-xl sm:text-2xl font-bold font-serif leading-none tracking-tight text-brand-rich dark:text-brand-dark-active">
            فِي ظِلَالِ <span className="italic font-normal text-gilded-gold font-serif">الْقُرْآن</span>
          </h2>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-none bg-gilded-gold/10 text-gilded-gold border border-gilded-gold/20 font-mono font-bold shrink-0 hidden sm:inline-block">
          PART {toArabicNumerals(selectedSurah.juzNumber)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className={`p-2 rounded-none border transition-all ${
            isDarkMode ? 'border-brand-dark-border text-gilded-gold hover:bg-[#151515]' : 'border-brand-border text-brand-rich hover:bg-brand-stone'
          }`}
          title={isDarkMode ? 'التحول للمطالعة النهارية' : 'التحول للمطالعة الليلية'}
          aria-label={isDarkMode ? 'التحول للوضع النهاري' : 'التحول للوضع الليلي'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          id="quick-bookmark-btn"
          onClick={() => toggleBookmark(selectedSurah.id)}
          className={`p-2 rounded-none border transition-all flex items-center gap-1.5 ${
            isBookmarked(selectedSurah.id)
              ? 'border-gilded-gold text-gilded-gold bg-gilded-gold/5'
              : isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:bg-brand-dark-surface hover:text-white' : 'border-brand-border text-brand-faded hover:bg-brand-stone hover:text-brand-rich'
          }`}
          title={isBookmarked(selectedSurah.id) ? 'حذف هذه السورة من المفضلة' : 'حفظ السورة في علامات وتدبّر المفضلة'}
          aria-label={isBookmarked(selectedSurah.id) ? 'حذف السورة من المفضلة' : 'حفظ السورة في المفضلة'}
        >
          <BookmarkIcon className={`w-4 h-4 ${isBookmarked(selectedSurah.id) ? 'fill-gilded-gold text-gilded-gold' : ''}`} />
          <span className="text-[11px] font-mono uppercase tracking-wider hidden md:inline">Mark Surah</span>
        </button>
        <button
          id="toggle-completion-btn"
          onClick={() => toggleComplete(selectedSurah.id)}
          className={`p-2 rounded-none border transition-all flex items-center gap-1.5 ${
            completedSurahs.includes(selectedSurah.id)
              ? 'border-emerald-600 text-emerald-500 bg-emerald-500/5 font-bold'
              : isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:bg-brand-dark-surface' : 'border-brand-border text-brand-faded hover:bg-brand-stone'
          }`}
          aria-label={completedSurahs.includes(selectedSurah.id) ? 'تمت المدارسة' : 'تأكيد المدارسة'}
        >
          <CircleCheck className="w-4 h-4" />
          <span className="text-[11px] font-mono uppercase tracking-wider hidden md:inline">
            {completedSurahs.includes(selectedSurah.id) ? 'Finished' : 'Mark Study'}
          </span>
        </button>
      </div>
    </header>
  );
}
