import { motion } from 'motion/react';
import { Sparkles, Bookmark as BookmarkIcon } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import { TAFSIR_DATA } from '../data/tafsir';
import type { Surah } from '../types';

interface VersesTabProps {
  isDarkMode: boolean;
  tafsirText: string | null;
  verseRangeValue: string;
  setVerseRangeValue: (v: string) => void;
  selectedSurah: Surah;
  fetchTafsir: (surah: Surah, range: string) => void;
  toggleBookmark: (surahId: number, verseIndex?: number) => void;
  isBookmarked: (surahId: number, verseIndex?: number) => boolean;
  hasTafsir: boolean;
}

export function VersesTab({
  isDarkMode, tafsirText, verseRangeValue, setVerseRangeValue,
  selectedSurah, fetchTafsir, toggleBookmark, isBookmarked, hasTafsir
}: VersesTabProps) {
  const isSingleVerse = /^\d+$/.test(verseRangeValue);
  const currentVerseNum = isSingleVerse ? parseInt(verseRangeValue) : undefined;
  const sections = TAFSIR_DATA[selectedSurah.id] || [];

  return (
    <motion.div
      key="verses-panel"
      id="panel-verses"
      role="tabpanel"
      aria-labelledby="active-tab-verses"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {hasTafsir && (
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
              aria-label="اختيار نطاق الآيات"
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
              {sections.map((section, i) => (
                <option key={i} value={`${section.startVerse}-${section.endVerse}`}>
                  الآيات {toArabicNumerals(section.startVerse)} إلى {toArabicNumerals(section.endVerse)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
              <span className={isDarkMode ? 'text-[#F2F2F2]' : 'text-neutral-950'}>﴿ يَا أَيُّهَا الْمُنفِّقُونَ وَالَّذينَ آمَنُوا مَعَ جبهةِ الحَقِّ وَبَرَاءَةِ المُتَّقِين... ﴾</span>
              <span className="text-gilded-gold font-bold font-serif mx-1">﴿{toArabicNumerals(1)}﴾</span>
              <span className={isDarkMode ? 'text-[#F2F2F2]' : 'text-neutral-950'}>﴿ وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ ﴾</span>
              <span className="text-gilded-gold font-bold font-serif mx-1">﴿{toArabicNumerals(2)}﴾</span>
              <span className="text-brand-grey text-xs inline-flex self-center font-serif mr-2">عرض المزيد بالضغط على آية واحدة...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 space-y-4">
              {currentVerseNum ? (
                <>
                  <span className="text-xs text-gilded-gold font-mono font-bold uppercase tracking-wider">الآية المبحوثة رقم {toArabicNumerals(currentVerseNum)}</span>
                  <p className="text-2xl sm:text-3xl font-serif text-gilded-gold leading-relaxed max-w-2xl text-center">
                    ﴿ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ ذَلِكَ ذِكْرَى لِلذَّاكِرِينَ ﴾
                  </p>
                  <span className="text-xs text-brand-grey font-mono font-bold">﴿{toArabicNumerals(currentVerseNum)}﴾</span>
                </>
              ) : (
                <span className="text-xs text-gilded-gold font-mono font-bold uppercase tracking-wider">
                  الآيات {toArabicNumerals(parseInt(verseRangeValue.split('-')[0]))} - {toArabicNumerals(parseInt(verseRangeValue.split('-')[1]))}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-center mt-6 border-t pt-4 border-gilded-gold/10 gap-3">
          <button
            id="bookmark-verse-btn"
            aria-label={isBookmarked(selectedSurah.id, currentVerseNum) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            onClick={() => toggleBookmark(selectedSurah.id, currentVerseNum)}
            className={`text-[11px] font-mono uppercase tracking-wider px-4 py-2 border rounded-none transition-all flex items-center gap-2 ${
              isBookmarked(selectedSurah.id, currentVerseNum)
                ? 'border-gilded-gold text-gilded-gold bg-gilded-gold/5 font-bold'
                : isDarkMode ? 'border-brand-dark-border text-brand-dark-mute hover:text-white' : 'border-brand-border text-brand-faded hover:text-brand-rich'
            }`}
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            <span>
              {isBookmarked(selectedSurah.id, currentVerseNum) ? 'IN BOOKMARKS' : 'ADD TO SIGNALS'}
            </span>
          </button>
        </div>
      </div>

      <div className={`p-6 sm:p-8 rounded-none border space-y-4 relative overflow-hidden ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="ayah-specific-tafsir-card">
        <div className="flex items-center justify-between border-b pb-4 border-gilded-gold/10 font-serif">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gilded-gold" />
            <h3 className="font-extrabold text-lg text-gilded-gold font-serif">
              {verseRangeValue === 'كاملة' ? 'ملخص وبيان السورة الإجمالي في الظلال' : currentVerseNum ? `ظلال وتأويل الآية الكريمة [${toArabicNumerals(currentVerseNum)}]` : `ظلال الآيات [${toArabicNumerals(parseInt(verseRangeValue.split('-')[0]))}-${toArabicNumerals(parseInt(verseRangeValue.split('-')[1]))}]`}
            </h3>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-none bg-gilded-gold/10 text-gilded-gold border border-gilded-gold/15 font-mono`}>
            EXEGESIS STATEMENT
          </span>
        </div>
        {!hasTafsir ? (
          <div className="text-center py-12 text-sm text-brand-grey font-serif">
            عذراً، لم يرد تفسير هذه السورة في كتاب "في ظلال القرآن" للسيد قطب.
          </div>
        ) : tafsirText ? (
          <div className="tafsir-text font-serif leading-loose text-justify text-[1.1rem] space-y-4" style={{ whiteSpace: 'pre-line' }}>
            {tafsirText.split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-brand-grey font-serif">
            يرجى الانتظار، يجري تحميل التفسير...
          </div>
        )}
      </div>
    </motion.div>
  );
}
