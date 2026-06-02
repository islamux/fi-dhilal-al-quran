import { Compass, BookOpen, MessageSquare, Award } from 'lucide-react';
import { type ReactNode } from 'react';

interface TabBarProps {
  activeTab: 'overview' | 'verses' | 'chat' | 'stats';
  setActiveTab: (tab: 'overview' | 'verses' | 'chat' | 'stats') => void;
  isDarkMode: boolean;
}

export function TabBar({ activeTab, setActiveTab, isDarkMode }: TabBarProps) {
  const tabs: { id: string; tab: typeof activeTab; icon: ReactNode; label: string; extraClass: string; panelId: string }[] = [
    { id: 'active-tab-overview', tab: 'overview', icon: <Compass className="w-3.5 h-3.5" />, label: 'الظلال والمحور العام', extraClass: '', panelId: 'panel-overview' },
    { id: 'active-tab-verses', tab: 'verses', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'الآيات والتفسير الأدبي', extraClass: 'border-r border-l', panelId: 'panel-verses' },
    { id: 'active-tab-chat', tab: 'chat', icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'المُدارس والباحث الذكي', extraClass: 'border-l', panelId: 'panel-chat' },
    { id: 'active-tab-stats', tab: 'stats', icon: <Award className="w-3.5 h-3.5" />, label: 'الختمة والإحصاء', extraClass: '', panelId: 'panel-stats' },
  ];

  return (
    <div
      role="tablist"
      aria-label="أقسام العرض"
      className={`rounded-none border flex text-xs font-mono font-bold ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-[#FAF9F6] border-brand-border'
      }`} id="canvas-tab-bar"
    >
      {tabs.map(({ id, tab, icon, label, extraClass, panelId }) => (
        <button
          key={tab}
          id={id}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={panelId}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-3.5 px-3 rounded-none flex items-center justify-center gap-2 transition-all font-sans relative ${extraClass} ${
            activeTab === tab
              ? 'bg-gilded-gold text-white font-bold'
              : isDarkMode
                ? 'text-brand-dark-mute hover:text-white hover:bg-brand-dark-hover/50'
                : 'text-brand-faded hover:text-brand-rich hover:bg-brand-stone/50'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
