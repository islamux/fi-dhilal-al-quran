export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SurahBrief {
  id: number;
  arName: string;
  name: string;
  versesCount: number;
}

interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  selectedSurah: { id: number; arName: string; name: string; versesCount: number }
): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      selectedSurah
    })
  });
  if (!res.ok) throw new Error('Chat API failed');
  return res.json();
}
