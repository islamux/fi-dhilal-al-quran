import { useTheme } from '../hooks/useTheme';
import { toArabicNumerals } from '../utils';
import { formatTafsirParagraphs } from '../utils/tafsir-format';
import { TafsirContent } from './TafsirContent';

interface TafsirDisplayProps {
  tafsirText: string;
  verseRangeValue: string;
}

export function TafsirDisplay({ tafsirText, verseRangeValue }: TafsirDisplayProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`border p-6 md:p-8 leading-relaxed mt-6 ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-[#fffdfa] border-brand-border'}`}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[9px] uppercase tracking-[0.25em] text-gilded-gold font-mono font-bold">
          Tafsir al-Qutb
        </span>
        <span className="text-[8px] px-1.5 py-0.5 bg-gilded-gold/10 text-gilded-gold/70 border border-gilded-gold/20 font-mono font-bold">
          AYAH {toArabicNumerals(parseInt(verseRangeValue.split('-')[0] || '0'))}+
        </span>
      </div>
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert space-y-3 font-serif text-justify text-base sm:text-lg">
        <TafsirContent
          paragraphs={formatTafsirParagraphs(tafsirText)}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
