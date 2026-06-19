import { motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import { formatTafsirParagraphs } from '../utils/tafsir-format';
import { TafsirContent } from './TafsirContent';
import type { Surah } from '../types';

interface OverviewTabProps {
  tafsirText: string | null;
  selectedSurah: Surah;
  hasTafsir: boolean;
}

export function OverviewTab({ tafsirText, selectedSurah, hasTafsir }: OverviewTabProps) {
  const { isDarkMode } = useTheme();
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {!hasTafsir ? (
        <div className={`border p-8 text-center ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <div className="text-4xl mb-4 opacity-40">📖</div>
          <p className="text-sm text-brand-grey font-serif leading-relaxed">
            لم نعثر بعد على النص الأصلي لتفسير سورة &quot;{selectedSurah.arName}&quot; في مخطوطات الظلال المتوفرة. يعكف فريق التحرير على استكمال فهرسة جميع أجزاء موسوعة الأستاذ سيد قطب.
          </p>
        </div>
      ) : !tafsirText ? (
        <div className={`border p-8 text-center ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <p className="text-sm text-brand-grey font-serif">جاري تحميل التفسير...</p>
        </div>
      ) : (
        <div className={`border p-6 md:p-8 leading-relaxed ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[9px] uppercase tracking-[0.25em] text-gilded-gold font-mono font-bold">Tafsir al-Qutb</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-gilded-gold/10 text-gilded-gold/70 border border-gilded-gold/20 font-mono font-bold">
              SURAH {toArabicNumerals(selectedSurah.id)}
            </span>
          </div>
          <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert space-y-3 font-serif text-justify text-base sm:text-lg">
            <TafsirContent
              paragraphs={formatTafsirParagraphs(tafsirText)}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
