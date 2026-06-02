import { motion } from 'motion/react';
import { Sparkles, Bookmark as BookmarkIcon } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import type { Surah, TafsirResponse } from '../types';

interface VersesTabProps {
  isDarkMode: boolean;
  loadingTafsir: boolean;
  currentTafsir: TafsirResponse | null;
  verseRangeValue: string;
  setVerseRangeValue: (v: string) => void;
  selectedSurah: Surah;
  fetchTafsir: (surah: Surah, range: string) => void;
  toggleBookmark: (surahId: number, verseIndex?: number) => void;
  isBookmarked: (surahId: number, verseIndex?: number) => boolean;
}

export function VersesTab({
  isDarkMode, loadingTafsir, currentTafsir, verseRangeValue, setVerseRangeValue,
  selectedSurah, fetchTafsir, toggleBookmark, isBookmarked
}: VersesTabProps) {
  return (
    <motion.div
      key="verses-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className={`p-5 rounded-none border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="ayah-selection-bar">
        <div className="space-y-1 text-right">
          <h3 className="font-bold text-sm font-serif">محراب التركيز وتدبّر آية مخصصة</h3>
          <p className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
            اختر نطاقاً أو آية مفردة لدراسة &quot;ظلالها&quot; الفنية وخطوط تربيتها بشكل أمن ومكثّف
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            id="ayah-range-select"
            className={`rounded-none border px-3 py-2 text-xs font-mono select-none outline-none ${
              isDarkMode ? 'bg-[#1e1e1e] border-brand-dark-border text-white focus:border-gilded-gold' : 'bg-white border-brand-border text-brand-rich focus:border-gilded-gold'
            }`}
            value={verseRangeValue}
            onChange={(e) => {
              setVerseRangeValue(e.target.value);
              fetchTafsir(selectedSurah, e.target.value);
            }}
          >
            <option value="كاملة">عرض التفسير الإجمالى للسورة</option>
            {Array.from({ length: selectedSurah.versesCount }, (_, i) => i + 1).map(num => (
              <option key={num} value={num.toString()}>آية رقم {toArabicNumerals(num)}</option>
            ))}
          </select>
          <button
            id="refresh-tafsir-btn"
            onClick={() => fetchTafsir(selectedSurah, verseRangeValue)}
            className="px-3.5 py-2 bg-gilded-gold text-white font-mono font-bold text-xs rounded-none hover:bg-gilded-hover transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تأويل</span>
          </button>
        </div>
      </div>

      <div className={`p-8 rounded-none border text-center relative ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-[#fffdfa] border-brand-border'
      }`} id="quraniveverse-text-card">
        {selectedSurah.id !== 9 && verseRangeValue === 'كاملة' && (
          <div className="text-xl sm:text-2xl font-serif text-gilded-gold font-bold mb-6 text-center leading-loose">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </div>
        )}
        <div className="leading-widest text-[#1a1a2e] tracking-wide mb-2 text-right">
          {verseRangeValue === 'كاملة' ? (
            <div className="flex flex-wrap justify-center gap-y-4 gap-x-2 text-xl sm:text-2xl font-serif tracking-normal leading-[2.5]" style={{ direction: 'rtl' }}>
              <span className="text-gilded-gold leading-none font-mono text-xs shrink-0 self-center border border-gilded-gold/20 px-2 py-0.5 rounded-none bg-gilded-gold/5 font-bold">بداية السورة</span>
              <span className={isDarkMode ? 'text-[#F2F2F2]' : 'text-neutral-950'}>﴿ نَصُّ الْآيَةِ الْكَرِيمَةِ — يُسْتَعْرَضُ هُنَا عِنْدَ اخْتِيَارِ الْآيَةِ ﴾</span>
              <span className="text-gilded-gold font-bold font-serif mx-1">﴿{toArabicNumerals(1)}﴾</span>
              <span className={isDarkMode ? 'text-[#F2F2F2]' : 'text-neutral-950'}>﴿ وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ ﴾</span>
              <span className="text-gilded-gold font-bold font-serif mx-1">﴿{toArabicNumerals(2)}﴾</span>
              <span className="text-brand-grey text-xs inline-flex self-center font-serif mr-2">عرض المزيد بالضغط على آية واحدة...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 space-y-4">
              <span className="text-xs text-gilded-gold font-mono font-bold uppercase tracking-wider">الآية المبحوثة رقم {toArabicNumerals(parseInt(verseRangeValue))}</span>
              <p className="text-2xl sm:text-3xl font-serif text-gilded-gold leading-relaxed max-w-2xl text-center">
                ﴿ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ ذَلِكَ ذِكْرَى لِلذَّاكِرِينَ ﴾
              </p>
              <span className="text-xs text-brand-grey font-mono font-bold">﴿{toArabicNumerals(parseInt(verseRangeValue))}﴾</span>
            </div>
          )}
        </div>
        <div className="flex justify-center mt-6 border-t pt-4 border-gilded-gold/10 gap-3">
          <button
            id="bookmark-verse-btn"
            onClick={() => toggleBookmark(selectedSurah.id, verseRangeValue === 'كاملة' ? undefined : parseInt(verseRangeValue))}
            className={`text-[11px] font-mono uppercase tracking-wider px-4 py-2 border rounded-none transition-all flex items-center gap-2 ${
              isBookmarked(selectedSurah.id, verseRangeValue === 'كاملة' ? undefined : parseInt(verseRangeValue))
                ? 'border-gilded-gold text-gilded-gold bg-gilded-gold/5 font-bold'
                : isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white' : 'border-brand-border text-brand-faded hover:text-brand-rich'
            }`}
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            <span>
              {isBookmarked(selectedSurah.id, verseRangeValue === 'كاملة' ? undefined : parseInt(verseRangeValue)) ? 'IN BOOKMARKS' : 'ADD TO SIGNALS'}
            </span>
          </button>
        </div>
      </div>

      <div className={`p-6 sm:p-8 rounded-none border space-y-4 relative overflow-hidden ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="ayah-specific-tafsir-card">
        <div className="flex items-center justify-between border-b pb-4 border-gilded-gold/10 font-serif">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gilded-gold animate-pulse" />
            <h3 className="font-extrabold text-lg text-gilded-gold font-serif">
              {verseRangeValue === 'كاملة' ? 'ملخص وبيان السورة الإجمالي في الظلال' : `ظلال وتأويل الآية الكريمة [${toArabicNumerals(parseInt(verseRangeValue))}]`}
            </h3>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-none bg-gilded-gold/10 text-gilded-gold border border-gilded-gold/15 font-mono`}>
            EXEGESIS STATEMENT
          </span>
        </div>
        {loadingTafsir ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4" id="tafsir-loader-2">
            <div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold rounded-none animate-spin" />
            <span className="text-xs text-brand-grey animate-pulse font-serif">يتم استخلاص ورقة التفسير وبيان التصوير والواقع الحركي...</span>
          </div>
        ) : currentTafsir ? (
          <div className="space-y-6">
            <div className="bg-gilded-gold/5 p-4 rounded-none text-xs sm:text-sm leading-relaxed text-right border-r-4 border-gilded-gold">
              <strong className="text-gilded-gold font-sans block mb-1">الرؤية المحورية والتوجيه الحركي:</strong>
              <span className={isDarkMode ? 'text-brand-dark-active font-serif' : 'text-brand-rich font-serif'}>{currentTafsir.coreConcept}</span>
            </div>
            <div className="tafsir-text font-serif leading-loose text-justify text-[1.1rem] space-y-4" style={{ whiteSpace: 'pre-line' }}>
              <p>{currentTafsir.tafsir}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-brand-grey font-serif">
            حدث خطأ أو لا توجد ورقة تفسير متاحة لمطابقة الطلب النبيل.
          </div>
        )}
      </div>
    </motion.div>
  );
}
