import { useState, useRef, type FormEvent } from 'react';
import type { Surah } from '../types';
import { sendChatMessage } from '../api/chat';
import { toArabicNumerals } from '../utils';
import type { ChatMessage } from '../api/chat';

const WELCOME_MSG = 'مرحباً بك في المُدارس الذكي لتفسير "في ظلال القرآن". يمكنك سؤالي عن المحاور اللاهوتية والحركية في السورة، أو عن معاني التصوير الجمالي والفني في آياتها المباركة.';

export function useChat() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MSG }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: FormEvent, selectedSurah: Surah) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setLoadingChat(true);

    try {
      const data = await sendChatMessage(updatedMessages, selectedSurah);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً يا رعاك الله، تعذّر الاتصال بالمدرس الذكي للظلال حالياً. لكن تذكّر دائماً أن تدبر السور متيسر ومنهج سيد قطب يركز على التصوير الفني وحيوية النص.'
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const resetChat = (surah: Surah) => {
    setChatMessages([
      {
        role: 'assistant',
        content: `لقد اخترت الآن سورة ${surah.arName} (${surah.type}, عدد آياتها ${toArabicNumerals(surah.versesCount)} آية). يسرني المدارسة معك حول ظلالها الإعجازية وعمق تشريعاتها وحياكة آياتها الفنية.`
      }
    ]);
  };

  return { chatInput, setChatInput, chatMessages, loadingChat, chatBottomRef, handleSendMessage, resetChat };
}
