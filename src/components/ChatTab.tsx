import { type FormEvent, type RefObject } from 'react';
import { motion } from 'motion/react';
import { Search, Send, Bookmark } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import type { SearchMatch } from '../hooks/useChat';

interface SearchTabProps {
  isDarkMode: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  results: SearchMatch[];
  searching: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  handleSearch: (query: string) => void;
  clearResults: () => void;
  onNavigateToSurah: (surahId: number) => void;
}

export function ChatTab({
  isDarkMode, searchInput, setSearchInput, results, searching,
  bottomRef, handleSearch, clearResults, onNavigateToSurah
}: SearchTabProps) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  return (
    <motion.div
      key="chat-panel"
      id="panel-chat"
      role="tabpanel"
      aria-labelledby="active-tab-chat"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className={`p-5 sm:p-6 rounded-none border flex flex-col h-[500px] overflow-hidden ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="scholarly-chat-widget">
        <div className="flex items-center justify-between border-b pb-4 border-gilded-gold/10 shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gilded-gold" />
            <div className="text-right">
              <h3 className="font-bold text-sm tracking-tight font-serif">البحث في نصوص الظلال</h3>
              <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
                ابحث عن أي موضوع أو كلمة في تفسير سيد قطب
              </p>
            </div>
          </div>
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="text-xs font-serif text-gilded-gold hover:underline transition-all opacity-80"
            >
              مسح النتائج
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4" id="chat-messages-container">
          {results.length > 0 ? (
            results.map((result, i) => (
              <button
                key={i}
                onClick={() => onNavigateToSurah(result.surahId)}
                className={`w-full text-right p-4 rounded-none border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#0E0E0E] border-[#2A2A2A] hover:border-gilded-gold/40 text-[#F2F2F2]'
                    : 'bg-brand-stone border-brand-border hover:border-gilded-gold/40 text-brand-rich'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bookmark className="w-3 h-3 text-gilded-gold" />
                  <span className="text-gilded-gold text-xs font-bold font-serif">
                    سورة {result.surahName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 ${isDarkMode ? 'bg-[#1e1e1e] text-brand-dark-mute' : 'bg-white text-brand-faded'} border font-mono`}>
                    الآيات {toArabicNumerals(result.startVerse)}-{toArabicNumerals(result.endVerse)}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed font-serif ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} line-clamp-3`}>
                  {result.excerpt}
                </p>
              </button>
            ))
          ) : searching ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold rounded-none animate-spin" />
              <span className="text-xs text-gilded-gold animate-pulse">جاري البحث في النصوص...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Search className="w-10 h-10 text-gilded-gold/30" />
              <div className="text-center">
                <p className={`text-sm font-serif mb-1 ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
                  اكتب كلمة أو موضوعاً للبحث في نصوص الظلال
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-brand-dark-mute/60' : 'text-brand-faded/60'}`}>
                  النتائج تشمل جميع السور المتوفرة
                </p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 py-2 overflow-x-auto border-t border-[#2A2A2A] whitespace-nowrap shrink-0 max-w-full" id="chat-quick-suggestions">
          <button
            onClick={() => { setSearchInput('التصوير الفني'); handleSearch('التصوير الفني'); }}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white font-serif' : 'border-brand-border text-brand-faded hover:text-brand-rich font-serif'
            }`}
          >
            التصوير الفني
          </button>
          <button
            onClick={() => { setSearchInput('الجهاد'); handleSearch('الجهاد'); }}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white font-serif' : 'border-brand-border text-brand-faded hover:text-brand-rich font-serif'
            }`}
          >
            الجهاد في سبيل الله
          </button>
          <button
            onClick={() => { setSearchInput('التوحيد'); handleSearch('التوحيد'); }}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white font-serif' : 'border-brand-border text-brand-faded hover:text-brand-rich font-serif'
            }`}
          >
            التوحيد والعبودية
          </button>
        </div>

        <form
          id="scholarly-chat-input-form"
          onSubmit={onSubmit}
          className={`flex gap-2 pt-3 border-t shrink-0 ${isDarkMode ? 'border-brand-dark-border' : 'border-brand-border'}`}
        >
          <input
            id="scholarly-chat-input-field"
            type="text"
            placeholder="ابحث عن كلمة أو موضوع..."
            aria-label="بحث في نصوص الظلال"
            dir="rtl"
            className={`flex-1 rounded-none border px-3 py-2 text-xs sm:text-sm font-sans focus:outline-none focus:border-gilded-gold ${
              isDarkMode ? 'bg-[#0E0E0E] border-[#2A2A2A] text-white' : 'bg-white border-brand-border text-brand-rich'
            }`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={searching}
          />
          <button
            id="chat-send-submit"
            type="submit"
            aria-label="بحث"
            className="px-4 py-2 bg-gilded-gold hover:bg-gilded-hover text-white rounded-none transition-all flex items-center justify-center shrink-0"
            disabled={searching || !searchInput.trim()}
          >
            <Send className="w-4 h-4 rtl-flip" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
