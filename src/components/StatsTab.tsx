import { motion } from 'motion/react';
import { BookmarkCheck, BookOpen, Trash2, Sparkles, Clock, CheckCircle, Download, Upload } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import { localStorageBackend } from '../utils/localStorage';
import type { Bookmark, HistoryItem } from '../types';

function handleExport(): void {
  const bookmarks = localStorageBackend.get<unknown[]>('dhilal_bookmarks') ?? [];
  const history = localStorageBackend.get<unknown[]>('dhilal_history') ?? [];
  const completed = localStorageBackend.get<unknown[]>('dhilal_completed') ?? [];
  const theme = localStorageBackend.get<string>('dhilal_theme') ?? 'dark';

  const data = { bookmarks, history, completed, theme, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dhilal-user-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.bookmarks) || !Array.isArray(data.history) || !Array.isArray(data.completed) || typeof data.theme !== 'string') {
        alert('ملف غير صالح: البيانات لا تطابق التنسيق المطلوب');
        return;
      }
      localStorageBackend.set('dhilal_bookmarks', data.bookmarks);
      localStorageBackend.set('dhilal_history', data.history);
      localStorageBackend.set('dhilal_completed', data.completed);
      localStorageBackend.set('dhilal_theme', data.theme);
      window.location.reload();
    } catch {
      alert('ملف غير صالح: لا يمكن قراءة الملف');
    }
  };
  input.click();
}

interface StatsTabProps {
  completedSurahs: number[];
  bookmarks: Bookmark[];
  readingHistory: HistoryItem[];
  clearAll: () => void;
  removeBookmark: (id: string) => void;
}

export function StatsTab({ completedSurahs, bookmarks, readingHistory, clearAll, removeBookmark }: StatsTabProps) {
  const { isDarkMode } = useTheme();
  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-serif tracking-tight text-brand-rich dark:text-brand-dark-active">
          سجل المُدارسة
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-brand-grey hover:text-gilded-gold transition-colors px-3 py-1.5 border border-brand-border dark:border-brand-dark-border"
            title="تصدير البيانات"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 text-xs text-brand-grey hover:text-gilded-gold transition-colors px-3 py-1.5 border border-brand-border dark:border-brand-dark-border"
            title="استيراد البيانات"
          >
            <Upload className="w-3.5 h-3.5" />
            استيراد
          </button>
          <button
            id="clear-all-stats-btn"
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-brand-grey hover:text-red-500 transition-colors px-3 py-1.5 border border-brand-border dark:border-brand-dark-border"
            title="مسح جميع السجلات"
          >
            <Trash2 className="w-3.5 h-3.5" />
            مسح الكل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`border p-5 flex flex-col gap-2 ${isDarkMode ? 'bg-[#152e25]/20 border-emerald-500/20' : 'bg-[#eefcf5] border-emerald-500/20'}`}>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-2xl font-bold font-mono text-emerald-500">{toArabicNumerals(completedSurahs.length)}</span>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            سورة مُنجَزة (مقروءة ومُدارسة بالكامل)
          </p>
        </div>
        <div className={`border p-5 flex flex-col gap-2 ${isDarkMode ? 'bg-[#4a3915]/10 border-gilded-gold/25' : 'bg-[#fdf9ef] border-gilded-gold/20'}`}>
          <BookmarkCheck className="w-5 h-5 text-gilded-gold" />
          <span className="text-2xl font-bold font-mono text-gilded-gold">{toArabicNumerals(bookmarks.length)}</span>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            علامة مرجعية محفوظة للعودة والتدبّر
          </p>
        </div>
        <div className={`border p-5 flex flex-col gap-2 ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <BookOpen className="w-5 h-5 text-brand-grey" />
          <span className="text-2xl font-bold font-mono text-brand-grey">{toArabicNumerals(readingHistory.length)}</span>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            سورة في سجل المطالعة
          </p>
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className={`border ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border dark:border-brand-dark-border">
            <Sparkles className="w-4 h-4 text-gilded-gold" />
            <h4 className="text-sm font-bold font-sans tracking-wider text-gilded-gold uppercase">Bookmarks</h4>
          </div>
          <div className="divide-y divide-brand-border dark:divide-brand-dark-border">
            {bookmarks.map((b) => (
              <div key={b.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${
                isDarkMode ? 'bg-brand-dark-bg/60 border-brand-dark-border/40 hover:border-gilded-gold/40' : 'bg-[#FAF9F6] border-brand-border/60 hover:border-gilded-gold/40'
              }`}>
                <div className="flex items-center gap-3">
                  <BookmarkCheck className="w-4 h-4 text-gilded-gold" />
                  <div>
                    <span className="text-sm font-bold font-sans text-brand-rich dark:text-brand-dark-active">
                      سورة {toArabicNumerals(b.surahId)}
                    </span>
                    {b.verseIndex !== undefined && (
                      <span className={`text-xs mr-2 ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} font-serif`}>
                        - الآية {toArabicNumerals(b.verseIndex)}
                      </span>
                    )}
                    <div className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} font-serif`}>
                      {b.addedAt}
                    </div>
                  </div>
                </div>
                <button
                  id={`remove-bookmark-${b.id}`}
                  onClick={() => removeBookmark(b.id)}
                  className="text-brand-grey hover:text-red-500 transition-colors p-1"
                  aria-label="حذف العلامة المرجعية"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {readingHistory.length > 0 && (
        <div className={`border ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border dark:border-brand-dark-border">
            <Clock className="w-4 h-4 text-gilded-gold" />
            <h4 className="text-sm font-bold font-sans tracking-wider text-gilded-gold uppercase">Reading History</h4>
          </div>
          <div className="divide-y divide-brand-border dark:divide-brand-dark-border">
            {readingHistory.map((h) => (
              <div key={h.id} className={`px-5 py-3 ${
                isDarkMode ? 'bg-[#0E0E0E] border-[#2A2A2A]' : 'bg-[#faf9f6] border-brand-border/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold font-sans text-brand-rich dark:text-brand-dark-active">
                      {h.surahName}
                    </span>
                    <span className={`text-xs mr-2 ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} font-serif`}>
                      {h.verseIndex ? `الآية ${toArabicNumerals(h.verseIndex)}` : 'السورة كاملة'}
                    </span>
                  </div>
                  <span className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute/60' : 'text-brand-faded/60'} font-mono`}>
                    {h.viewedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
