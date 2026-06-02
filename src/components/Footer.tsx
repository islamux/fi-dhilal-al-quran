import { memo } from 'react';
import { Sparkles } from 'lucide-react';

export const Footer = memo(function Footer() {
  return (
    <footer className="text-center py-10 border-t border-gilded-gold/10 flex flex-col items-center justify-center space-y-3" id="reading-canvas-footer">
      <div className="flex items-center gap-2 text-xs text-gilded-gold font-mono font-bold tracking-widest uppercase justify-center">
        <Sparkles className="w-3.5 h-3.5" />
        <span>THILAL AL-QURAN • STUDIOS</span>
      </div>
      <p className="text-[11px] text-brand-grey max-w-xl leading-relaxed font-serif text-center px-4 mx-auto">
        هذا المجهر مستوحى حركياً بالكامل من exegesis &quot;في ظلال القرآن&quot; للأستاذ سيد قطب رحمه الله. جُمعت محاوره الأدبية والتصويرية بدقة فائقة لخدمة وتيسير تدبّر القرآن والتعايش الواقعي مع آياته الكريمة.
      </p>
      <div className="text-[9px] text-[#888] font-mono tracking-wider opacity-60">
        ALL RIGHTS RESERVED • TOKYO ARTISTIC THEME BUILD
      </div>
    </footer>
  );
});
