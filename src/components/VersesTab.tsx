import { motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';
import { SectionSelector } from './SectionSelector';
import { TafsirDisplay } from './TafsirDisplay';
import type { Surah } from '../types';

interface VersesTabProps {
  tafsirText: string | null;
  verseRangeValue: string;
  setVerseRangeValue: (v: string) => void;
  selectedSurah: Surah;
  fetchTafsir: (surah: Surah, range: string) => void;
  hasTafsir: boolean;
}

export function VersesTab({
  tafsirText, verseRangeValue, setVerseRangeValue,
  selectedSurah, fetchTafsir, hasTafsir
}: VersesTabProps) {
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      key="verses"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {!hasTafsir ? (
        <div className={`border p-8 text-center ${isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'}`}>
          <div className="text-4xl mb-4 opacity-40">📖</div>
          <p className="text-sm text-brand-grey font-serif leading-relaxed">
            لم نعثر بعد على النص الأصلي لتفسير سورة &quot;{selectedSurah.arName}&quot; في مخطوطات الظلال المتوفرة.
          </p>
        </div>
      ) : (
        <>
          <SectionSelector
            verseRangeValue={verseRangeValue}
            setVerseRangeValue={setVerseRangeValue}
            selectedSurah={selectedSurah}
            fetchTafsir={fetchTafsir}
          />
          {tafsirText && (
            <TafsirDisplay
              tafsirText={tafsirText}
              verseRangeValue={verseRangeValue}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
