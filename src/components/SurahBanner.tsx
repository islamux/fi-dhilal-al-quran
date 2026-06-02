import { toArabicNumerals } from '../utils';
import type { Surah } from '../types';

interface SurahBannerProps {
  isDarkMode: boolean;
  selectedSurah: Surah;
}

export function SurahBanner({ isDarkMode, selectedSurah }: SurahBannerProps) {
  return (
    <div className={`p-6 sm:p-8 rounded-none border relative overflow-hidden transition-all text-right ${
      isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
    }`} id="surah-banner-card">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-8xl font-serif text-gilded-gold/5 pointer-events-none select-none font-bold">
        {selectedSurah.name.substring(0, 3)}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#F27D26] leading-none font-bold">PORTFOLIO EXEGESIS</span>
            <span className="text-[10px] px-2 py-0.5 rounded-none font-mono text-white bg-gilded-gold leading-none font-bold">
              SURA {toArabicNumerals(selectedSurah.id)}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gilded-gold font-serif mb-2">سُورة {selectedSurah.arName}</h1>
          <p className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'} max-w-xl leading-relaxed`}>
             {selectedSurah.shortOverview}
          </p>
        </div>
        <div className="self-end sm:self-center shrink-0 flex flex-row sm:flex-col items-end gap-3 text-right bg-gilded-gold/5 px-4 py-3 rounded-none border border-gilded-gold/20">
          <div className="text-xs">
            <span className="opacity-65 ml-1">تنزيلها:</span>
            <strong className="text-gilded-gold font-sans">{selectedSurah.type}</strong>
          </div>
          <div className="text-xs">
            <span className="opacity-65 ml-1">عدد آياتها:</span>
            <strong className="text-gilded-gold font-sans">{toArabicNumerals(selectedSurah.versesCount)} آية</strong>
          </div>
          <div className="text-xs">
            <span className="opacity-65 ml-1">نظام الترابط:</span>
            <strong className="text-gilded-gold font-sans">الجزء {toArabicNumerals(selectedSurah.juzNumber)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
