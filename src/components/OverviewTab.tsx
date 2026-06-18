import { motion } from 'motion/react';
import { Sparkles, ListFilter } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import type { Surah } from '../types';

interface OverviewTabProps {
  isDarkMode: boolean;
  tafsirText: string | null;
  selectedSurah: Surah;
  hasTafsir: boolean;
}

export function OverviewTab({ isDarkMode, tafsirText, selectedSurah, hasTafsir }: OverviewTabProps) {
  return (
    <motion.div
      key="overview-panel"
      id="panel-overview"
      role="tabpanel"
      aria-labelledby="active-tab-overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className={`p-6 sm:p-8 rounded-none border space-y-6 ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="thematic-exegesis-overview">
        <div className="flex items-center gap-2 border-b pb-4 border-gilded-gold/20">
          <Sparkles className="w-5 h-5 text-gilded-gold" />
          <h2 className="text-xl font-bold font-serif text-gilded-gold">المحور الروحي والحركي في ظلال السورة</h2>
        </div>
        {!hasTafsir ? (
          <div className="text-center py-12 text-sm text-brand-grey font-serif">
            عذراً، لم يرد تفسير هذه السورة في كتاب "في ظلال القرآن" للسيد قطب.
          </div>
        ) : tafsirText ? (
          <div className="tafsir-text font-serif leading-loose text-[1.1rem] space-y-4 text-justify" style={{ whiteSpace: 'pre-line' }}>
            {tafsirText.split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-brand-grey font-sans">
            يرجى الانتظار، يجري تحميل التفسير...
          </div>
        )}
      </div>
      <div className={`p-6 sm:p-8 rounded-none border space-y-4 ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="thematic-points-card">
        <div className="flex items-center gap-2 border-b pb-3 border-gilded-gold/10">
          <ListFilter className="w-4 h-4 text-gilded-gold" />
          <h3 className="text-lg font-bold font-serif">منطلقات وموضوعات السورة الكبرى:</h3>
        </div>
        <ul className="space-y-3.5" id="thematic-points-list">
          {selectedSurah.thematicPoints.map((point, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed text-right items-start">
              <span className="w-6 h-6 shrink-0 rounded-none border border-gilded-gold/30 bg-gilded-gold/10 text-gilded-gold flex items-center justify-center font-bold text-xs font-mono">
                {toArabicNumerals(index + 1)}
              </span>
              <span className={isDarkMode ? 'text-[#d6d2ca] font-serif' : 'text-brand-rich font-serif'}>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
