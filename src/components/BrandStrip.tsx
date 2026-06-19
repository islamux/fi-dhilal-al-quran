import { useTheme } from '../context/ThemeContext';

export function BrandStrip() {
  const { isDarkMode } = useTheme();
  return (
    <div className={`hidden xl:flex w-14 h-full border-r items-center justify-center shrink-0 ${
      isDarkMode ? 'bg-[#0B0B0B] border-brand-dark-border' : 'bg-[#FAF9F6] border-brand-border'
    }`} id="extreme-left-brand-strip">
      <div className={`rotate-[-90deg] whitespace-nowrap text-[9px] uppercase tracking-[0.55em] font-mono font-bold ${
        isDarkMode ? 'text-brand-dark-mute/50' : 'text-brand-faded/50'
      }`}>
        QUTB EXEGESIS STUDY • TAFAKKUR SESSION ١١٤
      </div>
    </div>
  );
}
