import { Router, type Request, type Response } from 'express';
import { getGeminiClient } from '../gemini';

const router = Router();
const TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

router.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, selectedSurah } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'تنسيق المحادثة غير صحيح.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const cleanHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const contextualPrompt = `أنت باحث ومفسر إسلامي متبحر ومتحدث ذكي باسم زوار تطبيق "في ظلال القرآن".
تجاوب بأدب وفطنة فائقة وباللغة العربية الفصحى الجميلة لخدمة المستفسر حول معاني العقيدة وتفاسير سيد قطب وتحديداً كتابه "في ظلال القرآن".
شجع أسلوب الطمأنينة والتأمل الروحي والتصوير الفني، والابتعاد عن التشدد أو السجال المشتت.
${selectedSurah ? `السورة المحددة حالياً والمطروحة للدراسة هي سورة ${selectedSurah.arName} (${selectedSurah.name}) وبها عدد ${selectedSurah.versesCount} آيات.` : ''}
لا تتخيل معلومات فقهية مغلوطة، وركّز دائماً على المعاني القلبية والحركية والجمال الفني البليغ.`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: cleanHistory,
      config: {
        systemInstruction: contextualPrompt
      }
    }), TIMEOUT_MS);

    res.json({ reply: response.text || 'لم يتمكن الذكاء الاصطناعي من صياغة إجابة مقنعة، يرجى تكرار المحاولة.' });

  } catch (apiError: unknown) {
    console.warn('Gemini chat API is not accessible or unconfigured. Serving automated scholarly fallback reply:', apiError instanceof Error ? apiError.message : String(apiError));

    const userText = messages[messages.length - 1]?.content || '';
    let reply = `أهلاً بك يا متدبر كتاب الله العظيم وطالب ظلال القرآن الوارفة. 
يتناول كتاب "في ظلال القرآن" للأستاذ سيد قطب سورة القرآن من مدخل حيوي نابض يهدف لمخاطبة الضمير الإنساني واستثارة الوجدان الباطني للاستسلام والخضوع للخالق عز وجل.

`;
    if (userText.includes('تصوير') || userText.includes('بلاغة') || userText.includes('فني')) {
      reply += `عند سؤالك عن التصوير الفني، فهو الركيزة الكبرى للتفسير هنا. فالآيات ترسم بريشة الكلمات لوحات ناطقة بالألوان والظلال والحركة والغوص الشامل في خلجات الصدور، فتتحول الحقيقة العقلية المجردة لمشهد مرئي معايش نكاد نلمسه باليد طهراً وتعظيماً.`;
    } else if (userText.includes('حركي') || userText.includes('واقع') || userText.includes('منهج')) {
      reply += `المفهوم الحركي في الظلال يقوم على فكرة أن القرآن نزل ليقود أمة حية تقاتل وتبني، وتواجه جاهلية متحفزة، وتختبر صراعات النفوس. لهذا لا يقف التفسير عند المباحث اللغوية والهوامش الجافة، بل يربط السطور بالمعركة الإنسانية لتبديد صنمية المادة.`;
    } else {
      reply += `إن استفسارك المبارك يعيد تذكيرنا بوجوب تدبّر الآيات الكريمة والتحرر من أغلال الروتين البشري اليومي لرؤية سنن الله الكبرى التي تنظم دوران النجوم في السماء ونبضات الحق والعدل في جنبات الأرض. نسأل الله لك عمق التدبر وثبات الهداية وصراط السلام الإيماني.`;
    }

    res.json({ reply });
  }
});

export default router;
