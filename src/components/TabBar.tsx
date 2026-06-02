import { Compass, BookOpen, MessageSquare, Award } from 'lucide-react';
import { type ReactNode } from 'react';

interface TabBarProps {
  activeTab: 'overview' | 'verses' | 'chat' | 'stats';
  setActiveTab: (tab: 'overview' | 'verses' | 'chat' | 'stats') => void;
  isDarkMode: boolean;
}

export function TabBar({ activeTab, setActiveTab, isDarkMode }: TabBarProps) {
  const tabBtn = (id: string, tab: typeof activeTab, icon: ReactNode, label: string, extraClass = '') => (
    <button
      id={id}
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
  );

  return (
    <div className={`rounded-none border flex text-xs font-mono font-bold ${
      isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-[#FAF9F6] border-brand-border'
    }`} id="canvas-tab-bar">
      {tabBtn('active-tab-overview', 'overview', <Compass className="w-3.5 h-3.5" />, 'الظلال والمحور العام')}
      {tabBtn('active-tab-verses', 'verses', <BookOpen className="w-3.5 h-3.5" />, 'الآيات والتفسير الأدبي', 'border-r border-l')}
      {tabBtn('active-tab-chat', 'chat', <MessageSquare className="w-3.5 h-3.5" />, 'المُدارس والباحث الذكي', 'border-l')}
      {tabBtn('active-tab-stats', 'stats', <Award className="w-3.5 h-3.5" />, 'الختمة والإحصاء')}
    </div>
  );
}
