import { motion } from 'motion/react';
import { Sparkles, Send } from 'lucide-react';
import { type FormEvent, type RefObject } from 'react';
import type { Surah } from '../types';
import type { ChatMessage } from '../api/chat';

interface ChatTabProps {
  isDarkMode: boolean;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatMessages: ChatMessage[];
  loadingChat: boolean;
  chatBottomRef: RefObject<HTMLDivElement | null>;
  handleSendMessage: (e: FormEvent, selectedSurah: Surah) => void;
  selectedSurah: Surah;
  resetChat: (surah: Surah) => void;
}

export function ChatTab({
  isDarkMode, chatInput, setChatInput, chatMessages, loadingChat,
  chatBottomRef, handleSendMessage, selectedSurah, resetChat
}: ChatTabProps) {
  return (
    <motion.div
      key="chat-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className={`p-5 sm:p-6 rounded-none border flex flex-col h-[500px] overflow-hidden ${
        isDarkMode ? 'bg-[#151515] border-brand-dark-border' : 'bg-white border-brand-border'
      }`} id="scholarly-chat-widget">
        <div className="flex items-center justify-between border-b pb-4 border-gilded-gold/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gilded-gold animate-bounce" />
            <div className="text-right">
              <h3 className="font-bold text-sm tracking-tight font-serif">مدارس ومفسّر تفسير &quot;في ظلال القرآن&quot;</h3>
              <p className={`text-[10px] ${isDarkMode ? 'text-brand-dark-mute' : 'text-brand-faded'}`}>
                اسأله عن محاور سورة {selectedSurah.arName} ومفهوم التصوير والجهاد الروحي فيها
              </p>
            </div>
          </div>
          <button
            id="reset-chat-btn"
            onClick={() => resetChat(selectedSurah)}
            className="text-xs font-serif text-gilded-gold hover:underline transition-all opacity-80"
          >
            بدء محاورة جديدة
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-4" id="chat-messages-container">
          {chatMessages.map((msg, i) => (
            <div
               id={`chat-msg-row-${i}`}
              key={i}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'mr-auto items-end flex-row-reverse' : 'ml-auto'
              }`}
            >
              <div className={`w-7 h-7 rounded-none shrink-0 flex items-center justify-center text-[10px] font-bold font-mono ${
                msg.role === 'user'
                  ? 'bg-gilded-gold/15 text-gilded-gold border border-gilded-gold/30'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              }`}>
                {msg.role === 'user' ? 'USER' : 'QUTB'}
              </div>
              <div className={`p-4 rounded-none text-xs sm:text-sm leading-relaxed text-right ${
                msg.role === 'user'
                  ? 'bg-gilded-gold text-white font-serif'
                  : isDarkMode
                    ? 'bg-[#0E0E0E] text-[#F2F2F2] border border-[#2A2A2A] font-serif'
                    : 'bg-brand-stone text-brand-rich border border-brand-border font-serif'
              }`} style={{ whiteSpace: 'pre-line' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex gap-3 max-w-[80%] items-start ml-auto" id="chat-loading-row">
              <div className="w-7 h-7 rounded-none shrink-0 flex items-center justify-center text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-500 border animate-pulse">
                QUTB
              </div>
              <div className={`p-4 rounded-none text-xs leading-relaxed ${isDarkMode ? 'bg-[#0E0E0E]' : 'bg-brand-stone'}`}>
                <div className="flex gap-1.5 items-center justify-end">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-emerald-500/85 mr-1 font-serif">يستخلص المدارس الجواب...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        <div className="flex gap-2 py-2 overflow-x-auto border-t border-[#2A2A2A] whitespace-nowrap shrink-0 max-w-full" id="chat-quick-suggestions">
          <button
            id="chat-suggest-btn-1"
            onClick={() => setChatInput(`ما هي أبرز دلالات ومعاني التصوير الفني والجمالي في سورة ${selectedSurah.arName}؟`)}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute bg-[#18182a]/50 hover:bg-[#20203a] hover:text-white font-serif' : 'border-brand-border text-brand-faded bg-white hover:bg-brand-stone hover:text-brand-rich font-serif'
            }`}
          >
            ما هو التصوير الفني بالسورة؟
          </button>
          <button
            id="chat-suggest-btn-2"
            onClick={() => setChatInput(`وضح المفهوم والمنهج الحركي لعقيدة المسلمين في ظلال سورة ${selectedSurah.arName}، وكيف يستجيب قلبي له؟`)}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute bg-[#18182a]/50 hover:bg-[#20203a] hover:text-white font-serif' : 'border-brand-border text-brand-faded bg-white hover:bg-brand-stone hover:text-brand-rich font-serif'
            }`}
          >
            ما هو المفهوم الحركي بالسورة؟
          </button>
          <button
            id="chat-suggest-btn-3"
            onClick={() => setChatInput(`اشرح قصة الأنبياء والمغزى التربوي الشامل المطروح في كتاب "في ظلال القرآن" لهذه السورة المباركة.`)}
            className={`text-[10px] px-2.5 py-1 border rounded-none transition-colors shrink-0 ${
              isDarkMode ? 'border-brand-dark-border text-brand-dark-mute bg-[#18182a]/50 hover:bg-[#20203a] hover:text-white font-serif' : 'border-brand-border text-brand-faded bg-white hover:bg-brand-stone hover:text-brand-rich font-serif'
            }`}
          >
            قصص الأنبياء والتربية بالظلال
          </button>
        </div>
        <form
          id="scholarly-chat-input-form"
          onSubmit={(e) => handleSendMessage(e, selectedSurah)}
          className={`flex gap-2 pt-3 border-t shrink-0 ${isDarkMode ? 'border-brand-dark-border' : 'border-brand-border'}`}
        >
          <input
            id="scholarly-chat-input-field"
            type="text"
            placeholder="اطرح سؤالاً فكرياً أو عقدياً حول الآيات وتأويلها..."
            dir="rtl"
            className={`flex-1 rounded-none border px-3 py-2 text-xs sm:text-sm font-sans focus:outline-none focus:border-gilded-gold ${
              isDarkMode ? 'bg-[#0E0E0E] border-[#2A2A2A] text-white' : 'bg-white border-brand-border text-brand-rich'
            }`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loadingChat}
          />
          <button
            id="chat-send-submit"
            type="submit"
            className="px-4 py-2 bg-gilded-gold hover:bg-gilded-hover text-white rounded-none transition-all flex items-center justify-center shrink-0"
            disabled={loadingChat || !chatInput.trim()}
          >
            <Send className="w-4 h-4 rtl-flip" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
