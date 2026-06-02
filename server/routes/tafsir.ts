import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient } from '../gemini';
import { getLocalTafsirFallback } from '../localTafsir';

const router = Router();

const tafsirCache = new Map<string, unknown>();
const TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

router.post('/api/tafsir', async (req: Request, res: Response) => {
  const { surahId, surahName, verseRange = 'كاملة' } = req.body;

  if (!surahId || !surahName) {
    res.status(400).json({ error: 'يرجى تقديم رقم السورة واسمها لمطابقة المخطط.' });
    return;
  }

  const cacheKey = `${surahId}-${verseRange}`;
  const cached = tafsirCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    try {
      const ai = getGeminiClient();
      const prompt = `أنت عالم ومفسر إسلامي متبحر ومتخصص للغاية في منهج وكتاب "في ظلال القرآن" لسيد قطب رحمه الله.
قدم تفسيراً وتحليلاً روحياً وأدبياً رائعاً للآيات المحددة، واعتمد كلياً على أسلوب سيد قطب الأدبي الفريد ذو النبضة الواقعية الحركية والصياغة الفنية الرائعة والرحمة المتبصرة في التفاصيل.

البيانات المطلوبة:
رقم السورة: ${surahId}
اسم السورة: ${surahName}
نطاق الآيات: ${verseRange}

ركز في تفسيرك وكلامك بدقة وبلاغة على:
1. الجو العام للسورة والظلال الوجدانية والروحية التي تشيعها الآيات.
2. التصوير الفني والحركة والجمال الكوني والنفسي في النص القرآني.
3. مفاهيم توحيد الألوهية والربوبية والعبودية الكاملة لله رب العالمين وتجاوز الماديات الزائفة.
4. استخدم لغة أدبية رفيعة تنبض بالروحانية (مفاهيم مثل: النفس الإنسانية، حجب المادة، رقة الوجدان، الاستسلام لرب الأكوان، المنهج الحركي، التناسق الفني البديع).

يجب أن ترجع البيانات باللغة العربية حصراً وبتنسيق JSON مطابق للمخطط تماماً:
{
  "surahId": ${surahId},
  "surahName": "${surahName}",
  "verseRange": "${verseRange}",
  "tafsir": "نص التفسير المعمق الطويل باللغة العربية مقسم إلى فقرات رشيقة وموسعة تليق بقدسية التدبر وبلاغة الظلال",
  "coreConcept": "الفكرة المحورية وصراط الهداية في بضعة أسطر ذهبية دافئة",
  "spiritualReflection": "التدبّر المعاصر والعملي بالآيات الكريمة في واقعنا الحياتي اليوم",
  "linguisticSecrets": [
    "سر بلاغي أو فني مأخوذ من التصوير الفني داخل الآيات",
    "تحليل بياني رائع لألفاظ وقافية الآيات"
  ]
}`;

      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              surahId: { type: Type.INTEGER },
              surahName: { type: Type.STRING },
              verseRange: { type: Type.STRING },
              tafsir: { type: Type.STRING },
              coreConcept: { type: Type.STRING },
              spiritualReflection: { type: Type.STRING },
              linguisticSecrets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['surahId', 'surahName', 'verseRange', 'tafsir', 'coreConcept', 'spiritualReflection', 'linguisticSecrets']
          }
        }
      }), TIMEOUT_MS);

      const textOutput = response.text || '';
      const tafsirObj = JSON.parse(textOutput.trim());
      tafsirCache.set(cacheKey, tafsirObj);
      res.json(tafsirObj);

    } catch (apiError: unknown) {
      console.warn('Gemini API call failed or is unconfigured. Serving local exegesis database fallback:', apiError instanceof Error ? apiError.message : String(apiError));
      const fallback = getLocalTafsirFallback(surahId, surahName, verseRange);
      res.json(fallback);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    res.status(500).json({ error: 'عذراً، تَعذّر إنتاج التفسير في الوقت الراهن: ' + message });
  }
});

export default router;
