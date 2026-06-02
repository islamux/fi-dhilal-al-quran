import { motion } from 'motion/react';
import { Sparkles, ListFilter, Compass } from 'lucide-react';
import { toArabicNumerals } from '../utils';
import type { Surah, TafsirResponse } from '../types';

interface OverviewTabProps {
  isDarkMode: boolean;
  loadingTafsir: boolean;
  currentTafsir: TafsirResponse | null;
  selectedSurah: Surah;
}

export function OverviewTab({ isDarkMode, loadingTafsir, currentTafsir, selectedSurah }: OverviewTabProps) {
  return (
    <motion.div
      key="overview-panel"
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
        {loadingTafsir ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4" id="tafsir-loader">
            <div className="w-8 h-8 border-2 border-gilded-gold/20 border-t-gilded-gold rounded-none animate-spin" />
            <span className="text-xs text-gilded-gold animate-pulse">يتم مدارسة الظلال وتوليد المعاني البليغة وتنسيقها...</span>
          </div>
        ) : currentTafsir ? (
          <div className="space-y-6">
            <div className="bg-gilded-gold/5 border-r-4 border-gilded-gold p-4 rounded-none text-sm leading-relaxed text-right">
              <h3 className="font-bold text-gilded-gold mb-1 font-sans">عقْد التوجيه وصراط الهداية:</h3>
              <p className={isDarkMode ? 'text-brand-dark-active font-serif' : 'text-brand-rich font-serif font-medium'}>
                {currentTafsir.coreConcept}
              </p>
            </div>
            <div className="tafsir-text font-serif leading-loose text-[1.1rem] space-y-4 text-justify" style={{ whiteSpace: 'pre-line' }}>
              <p>{currentTafsir.tafsir}</p>
            </div>
            <div className="bg-emerald-500/5 border-r-4 border-emerald-500 p-4 rounded-none text-sm leading-relaxed text-right">
              <h3 className="font-bold text-emerald-500 mb-1 font-sans">تدبّر معاصر (الواقع الحركي واليومي):</h3>
              <p className={isDarkMode ? 'text-brand-dark-active font-serif' : 'text-brand-rich font-serif'}>
                {currentTafsir.spiritualReflection}
              </p>
            </div>
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
      {!loadingTafsir && currentTafsir?.linguisticSecrets && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="linguistic-secrets-grid">
          {currentTafsir.linguisticSecrets.map((secret, index) => (
            <div
              id={`ling-secret-${index}`}
              key={index}
              className={`p-5 rounded-none border flex gap-3 ${
                isDarkMode ? 'bg-[#151515]/80 border-brand-dark-border/60' : 'bg-[#faf6ee] border-brand-border/80'
              }`}
            >
              <Compass className="w-5 h-5 text-gilded-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gilded-gold mb-1 font-mono">أسرار التصوير الفني والبياني {toArabicNumerals(index + 1)}</h4>
                <p className={`text-xs leading-relaxed font-serif ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>{secret}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
