import { useTheme } from '../hooks/useTheme';

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  const { isDarkMode } = useTheme();
  const tabs = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'verses', label: 'استعراض الآيَات' },
    { key: 'chat', label: 'بحث في الظلال' },
    { key: 'stats', label: 'سجل المُدارسة' },
  ] as const;

  return (
    <div className={`flex border-b ${isDarkMode ? 'border-brand-dark-border' : 'border-brand-border'}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          id={`tab-${tab.key}`}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 py-3.5 text-center text-sm font-sans tracking-wider relative transition-all ${
            activeTab === tab.key
              ? 'text-gilded-gold font-bold'
              : isDarkMode ? 'text-brand-dark-mute hover:text-white' : 'text-brand-faded hover:text-brand-rich'
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gilded-gold shadow-[0_0_6px_#c9a84c]" />
          )}
        </button>
      ))}
    </div>
  );
}
