import { motion } from 'motion/react';
import { CheckCircle, Bookmark as BookmarkIcon, Compass } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import { SURAHS } from '../data/surahs';
import type { Bookmark, HistoryItem } from '../types';

interface StatsTabProps {
  isDarkMode: boolean;
  completedSurahs: number[];
  bookmarks: Bookmark[];
  readingHistory: HistoryItem[];
  clearAll: () => void;
  removeBookmark: (id: string) => void;
}

export function StatsTab({ isDarkMode, completedSurahs, bookmarks, readingHistory, clearAll, removeBookmark }: StatsTabProps) {
  return (
    <motion.div
      key="stats-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-bento-grid">
        <div className={`p-5 rounded-none border text-right space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-[#152e25]/20 border-emerald-500/20' : 'bg-[#eefcf5] border-emerald-500/20'
        }`} id="bento-completed">
          <div className="absolute left-3 top-3 text-emerald-500 hover:scale-110 transition-transform">
            <CheckCircle className="w-8 h-8 opacity-40" />
          </div>
          <h4 className="text-xs text-[#22c55e] font-serif font-bold uppercase tracking-widest leading-none">سور قُرئت وتُدبرت</h4>
          <div className="text-3xl font-extrabold text-emerald-500 font-mono">
            {toArabicNumerals(completedSurahs.length)}
          </div>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            تم تأكيد المدارسة اللغوية والحركية لها كاملة
          </p>
        </div>
        <div className={`p-5 rounded-none border text-right space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-[#4a3915]/10 border-gilded-gold/25' : 'bg-[#fdf9ef] border-gilded-gold/20'
        }`} id="bento-bookmarked">
          <div className="absolute left-3 top-3 text-gilded-gold hover:scale-110 transition-transform">
            <BookmarkIcon className="w-8 h-8 opacity-40 fill-gilded-gold text-gilded-gold" />
          </div>
          <h4 className="text-xs text-gilded-gold font-serif font-bold uppercase tracking-widest leading-none">علامات مفضلة</h4>
          <div className="text-3xl font-extrabold text-gilded-gold font-mono">
            {toArabicNumerals(bookmarks.length)}
          </div>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            آيات أو مواضيع معلقة بالقلب قيد التفكر المستمر
          </p>
        </div>
        <div className={`p-5 rounded-none border text-right space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
        }`} id="bento-history">
          <div className="absolute left-3 top-3 text-gilded-gold hover:scale-110 transition-transform opacity-30">
            <Compass className="w-8 h-8" />
          </div>
          <h4 className="text-xs text-brand-grey font-serif font-bold uppercase tracking-widest leading-none">مُطالاعات نشطة</h4>
          <div className="text-3xl font-extrabold text-gilded-gold font-mono">
            {toArabicNumerals(readingHistory.length)}
          </div>
          <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} leading-tight`}>
            سجل السور والمطالعات الأخيرة التي تفاعلت معها اليوم
          </p>
        </div>
      </div>

      <div className={`p-6 rounded-none border space-y-4 ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border shadow-sm'
      }`} id="saved-bookmarks-section">
        <div className="border-b pb-3 border-gilded-gold/15 flex justify-between items-center">
          <h3 className="text-md font-bold font-serif">دفتر علامات التدبّر والمفضلة (﴿﴾)</h3>
          <button
            id="clear-all-bookmarks-btn"
            onClick={() => { if(confirm('هل تود تصفير علامات القراءة والمفضلة؟')) clearAll(); }}
            className="text-xs text-brand-grey hover:text-red-500 font-mono tracking-wider transition-colors"
          >
            CLEAR ALL
          </button>
        </div>
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="bookmarks-inner-grid">
            {bookmarks.map((bookmark) => {
              const surahMatch = SURAHS.find(s => s.id === bookmark.surahId);
              return (
                <div
                  id={`bookmark-row-${bookmark.id}`}
                  key={bookmark.id}
                  className={`p-4 rounded-none border flex items-center justify-between ${
                    isDarkMode ? 'bg-brand-dark-bg/60 border-brand-dark-border/40 hover:border-gilded-gold/40' : 'bg-[#FAF9F6] border-brand-border/60 hover:border-gilded-gold/40'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="font-bold text-sm text-gilded-gold font-serif">
                      سورة {surahMatch?.arName || 'غير معروف'}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} font-serif`}>
                      {bookmark.verseIndex !== undefined ? `الآية رقم ${toArabicNumerals(bookmark.verseIndex)}` : 'السورة بصورة إجمالية'}
                    </div>
                    <div className="text-[9px] opacity-40 font-mono">تاريخ الربط: {bookmark.addedAt}</div>
                  </div>
                  <button
                    id={`delete-bookmark-btn-${bookmark.id}`}
                    onClick={() => removeBookmark(bookmark.id)}
                    className="p-1 px-2.5 rounded-none bg-red-500/10 hover:bg-red-500 hover:text-white text-xs text-red-500 transition-all font-mono tracking-wider font-bold"
                    title="حذف العلم"
                  >
                    REMOVE
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-brand-grey font-sans flex flex-col items-center justify-center space-y-2">
            <BookmarkIcon className="w-8 h-8 opacity-20 text-gilded-gold" />
            <span>لم تقم بحفظ أي آية أو سورة في مفضلة التدبّر والظلال بعد.</span>
          </div>
        )}
      </div>

      <div className={`p-6 rounded-none border space-y-4 ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="reading-history-section">
        <h3 className="text-md font-bold font-serif border-b pb-3 border-gilded-gold/15">سجل المطالعات وبوابات الزيارة الأخيرة</h3>
        {readingHistory.length > 0 ? (
          <div className="space-y-2" id="history-items-list">
            {readingHistory.map((item, i) => (
              <div
                id={`history-row-${i}`}
                key={item.id}
                className={`p-3 rounded-none flex items-center justify-between text-xs border ${
                  isDarkMode ? 'bg-[#0E0E0E] border-[#2A2A2A]' : 'bg-[#faf9f6] border-brand-border/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-gilded-gold opacity-60" />
                  <span className="font-bold font-serif">زيارة سورة {item.surahName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-none bg-gilded-gold/10 text-gilded-gold font-mono`}>
                    {item.verseIndex !== undefined ? `الآية ${toArabicNumerals(item.verseIndex)}` : 'السورة إجمالاً'}
                  </span>
                </div>
                <span className="text-brand-grey font-mono text-[10px]">{item.viewedAt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-brand-grey font-serif">
            لم تبدأ القراءة ومطالعة exegesis السور بعد لحساب السجل.
          </div>
        )}
      </div>
    </motion.div>
  );
}
