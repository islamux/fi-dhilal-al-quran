import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import type { Surah } from '../types';

interface SectionSelectorProps {
  verseRangeValue: string;
  setVerseRangeValue: (v: string) => void;
  selectedSurah: Surah;
  fetchTafsir: (surah: Surah, range: string) => void;
}

export function SectionSelector({
  verseRangeValue, setVerseRangeValue, selectedSurah, fetchTafsir
}: SectionSelectorProps) {
  const { isDarkMode } = useTheme();

  const ranges: string[] = [
    'كاملة', '1-50', '51-100', '101-150', '151-200',
    ...(selectedSurah.versesCount > 200
      ? ['201-250', '251-300', `301-${selectedSurah.versesCount}`]
      : [])
  ];

  return (
    <div className={`border p-4 flex flex-col gap-3 ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
      <div className="flex items-center gap-2">
        <label className="text-xs font-mono tracking-wider text-gilded-gold font-bold shrink-0">
          نطاق البحث بالآيات:
        </label>
        <p className={`text-xs ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
          (اختر نطاقاً لتضييق مجال المطالعة والتدبّر)
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ranges.map(range => {
          const isActive = verseRangeValue === range;
          return (
            <button
              key={range}
              id={`range-btn-${range}`}
              onClick={() => {
                setVerseRangeValue(range);
                fetchTafsir(selectedSurah, range);
              }}
              className={`px-3 py-1.5 text-xs border transition-all font-mono ${
                isActive
                  ? 'bg-gilded-gold text-black font-bold border-gilded-gold'
                  : isDarkMode
                    ? 'bg-[#1e1e1e] border-brand-dark-border text-white focus:border-gilded-gold'
                    : 'bg-white border-brand-border text-brand-rich focus:border-gilded-gold'
              }`}
            >
              {range === 'كاملة'
                ? 'كامل السورة'
                : `${toArabicNumerals(parseInt(range.split('-')[0]))} - ${toArabicNumerals(parseInt(range.split('-')[1]))}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
