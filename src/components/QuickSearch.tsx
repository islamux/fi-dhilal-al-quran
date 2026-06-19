import { useTheme } from '../hooks/useTheme';

interface QuickSearchProps {
  onSelect: (query: string) => void;
}

const QUERIES = ['التوحيد', 'الربا', 'الجهاد', 'النفس', 'الإيمان', 'الموت', 'السماء', 'النار', 'التقوى', 'الصبر'];

export function QuickSearch({ onSelect }: QuickSearchProps) {
  const { isDarkMode } = useTheme();

  return (
    <div>
      <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
        أو اختر من الاستعلامات السريعة الآتية:
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {QUERIES.map(q => (
          <button
            key={q}
            type="button"
            id={`quick-search-${q}`}
            aria-label={`ابحث عن: ${q}`}
            onClick={() => onSelect(q)}
            className={`text-[11px] px-2.5 py-1 border transition-all ${
              isDarkMode
                ? 'border-brand-dark-border text-brand-dark-mute hover:text-white font-serif'
                : 'border-brand-border text-brand-faded hover:text-brand-rich font-serif'
            }`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
