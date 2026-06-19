import { memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import type { Surah } from '../types';

interface SurahBannerProps {
  selectedSurah: Surah;
}

export const SurahBanner = memo(function SurahBanner({ selectedSurah }: SurahBannerProps) {
  const { isDarkMode } = useTheme();
  return (
    <div className={`border p-5 md:p-6 rounded-none flex items-center justify-between ${
      isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
    }`} id="surah-hero-banner">
      <div className="flex flex-col text-left gap-0.5">
        <span className="text-[9px] uppercase tracking-[0.25em] text-gilded-gold font-mono mb-1 font-bold">
          Surah {selectedSurah.id} · Juz {selectedSurah.juzNumber}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight text-brand-rich dark:text-brand-dark-active">
          {selectedSurah.arName}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] px-2 py-0.5 bg-gilded-gold/10 text-gilded-gold border border-gilded-gold/20 font-mono font-bold">
            {selectedSurah.type === 'مكية' ? 'MACAN REVELATION' : 'MEDINAN REVELATION'}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-brand-grey/10 text-brand-grey border border-brand-grey/20 font-mono font-bold">
            {toArabicNumerals(selectedSurah.versesCount)} VERSE{selectedSurah.versesCount !== 1 ? 'S' : ''}
          </span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-center">
        <div className={`text-3xl font-serif leading-none tracking-wide ${isDarkMode ? 'text-brand-dark-mute/20' : 'text-brand-faded/15'}`}>
          {selectedSurah.name}
        </div>
        {selectedSurah.id !== 9 && selectedSurah.id !== 1 && (
          <div className="text-[8px] mt-1 font-mono tracking-[0.3em] text-gilded-gold/50 font-bold">
            BISMILLAH AL-RAHMAN AL-RAHEEM
          </div>
        )}
      </div>
    </div>
  );
});
