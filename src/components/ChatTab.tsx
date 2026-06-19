import { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import { QuickSearch } from './QuickSearch';
import { HighlightedText } from './HighlightedText';
import type { SearchMatch } from '../utils/search';

interface SearchTabProps {
  searchInput: string;
  setSearchInput: (v: string) => void;
  results: SearchMatch[];
  searching: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  handleSearch: (query: string) => void;
  clearResults: () => void;
  onNavigateToSurah: (surahId: number) => void;
}

export function ChatTab({
  searchInput, setSearchInput, results, searching,
  bottomRef, handleSearch, clearResults, onNavigateToSurah
}: SearchTabProps) {
  const { isDarkMode } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  }, [handleSearch, searchInput]);

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className={`relative flex items-center border px-4 py-3 transition-all ${
          isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
        }`}>
          <Search className="w-5 h-5 text-gilded-gold shrink-0 ml-3" />
          <input
            ref={inputRef}
            id="tafsir-search-input"
            type="text"
            placeholder="ابحث في كامل موسوعة في ظلال القرآن..."
            aria-label="ابحث في كامل الموسوعة"
            dir="rtl"
            className="bg-transparent w-full focus:outline-none placeholder-brand-grey font-sans"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" id="clear-input-btn" aria-label="مسح" onClick={() => { setSearchInput(''); clearResults(); }} className="p-1 hover:bg-black/10">
              <X className="w-4 h-4 text-brand-grey" />
            </button>
          )}
          <button
            type="submit"
            id="search-submit-btn"
            className={`px-4 py-1.5 text-xs font-bold border transition-all ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white' : 'border-brand-border text-brand-faded hover:text-brand-rich'
            }`}
          >
            بحث
          </button>
        </div>

        {!results.length && !searching && !searchInput && (
          <QuickSearch onSelect={(q) => { setSearchInput(q); handleSearch(q); }} />
        )}
      </form>

      <div className="mt-6 space-y-3" ref={bottomRef}>
        {searching && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold animate-spin" />
          </div>
        )}

        {!searching && results.length === 0 && searchInput && (
          <div className="border p-8 text-center text-sm text-brand-grey font-serif">
            لا توجد نتائج تطابق استعلامك: &quot;{searchInput}&quot;
          </div>
        )}

        {results.slice(0, 50).map((match, i) => (
          <div
            key={`${match.surahId}-${match.startVerse}-${i}`}
            id={`search-result-${i}`}
            className={`border p-4 transition-all ${
              isDarkMode ? 'bg-[#0E0E0E] border-[#2A2A2A]' : 'bg-white border-brand-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                id={`navigate-from-result-${i}`}
                onClick={() => onNavigateToSurah(match.surahId)}
                className="flex items-center gap-1 text-gilded-gold hover:underline text-xs font-mono font-bold"
              >
                <ArrowLeft className="w-3 h-3" />
                {match.surahName} ({toArabicNumerals(match.surahId)})
              </button>
              <span className={`text-[10px] px-1.5 py-0.5 ${isDarkMode ? 'bg-[#1e1e1e] text-brand-dark-mute' : 'bg-white text-brand-faded'} border font-mono`}>
                {toArabicNumerals(match.startVerse)}{match.endVerse !== match.startVerse ? ` - ${toArabicNumerals(match.endVerse)}` : ''}
              </span>
            </div>
            <div className={`text-xs leading-relaxed font-serif line-clamp-3 ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
              <HighlightedText text={match.excerpt} query={searchInput} />
            </div>
          </div>
        ))}

        {results.length > 50 && (
          <p className={`text-sm font-serif mb-1 ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
            ... و{toArabicNumerals(results.length - 50)} نتيجة أخرى. استفسارك أكثر دقة لعرض نتائج أدق.
          </p>
        )}

        {!searching && results.length > 0 && (
          <p className={`text-xs ${isDarkMode ? 'text-brand-dark-mute/60' : 'text-brand-faded/60'}`}>
            تم العثور على {toArabicNumerals(results.length)} نتيجة — مستخرجة من {toArabicNumerals(new Set(results.map(r => r.surahId)).size)} سورة
          </p>
        )}
      </div>
    </motion.div>
  );
}
