import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient } from '../gemini';
import { getLocalTafsirFallback } from '../localTafsir';

const router = Router();

router.post('/api/tafsir', async (req: Request, res: Response) => {
  const { surahId, surahName, verseRange = 'كاملة' } = req.body;

  if (!surahId || !surahName) {
    res.status(400).json({ error: 'يرجى تقديم رقم السورة واسمها لمطابقة المخطط.' });
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

      const response = await ai.models.generateContent({
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
      });

      const textOutput = response.text || '';
      const tafsirObj = JSON.parse(textOutput.trim());
      res.json(tafsirObj);

    } catch (apiError: any) {
      console.warn('Gemini API call failed or is unconfigured. Serving local exegesis database fallback:', apiError.message);
      const fallback = getLocalTafsirFallback(surahId, surahName, verseRange);
      res.json(fallback);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'عذراً، تَعذّر إنتاج التفسير في الوقت الراهن: ' + error.message });
  }
});

export default router;
