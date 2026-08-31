# سيناريو العرض الحي

هذا السيناريو مخصص لعرض مدته **45-60 دقيقة** أمام مهندسين سنير. لا تتعامل معه كجولة في الواجهة؛ كل خطوة هنا تثبت فرضية تقنية، ثم تربط السلوك بمكانه في الكود.

## قبل الموعد

### تجهيز سريع

1. افتح المشروع على الفرع الذي ستعرض منه، وتأكد أن ملف `src/data/tafsir.ts` موجود. هذا الملف مولّد وكبير، ولا تعِد توليده قبل العرض إلا إذا كنت متأكداً من وجود `catdoc` ومصادر `.doc`.
2. جهّز نافذتين: المتصفح وVS Code/المحرر، مع تكبير خط المحرر إلى 14 أو 16.
3. افتح `presentation/slides.html` مباشرة في المتصفح. استخدم `ArrowRight` و`ArrowLeft` للتنقل، و`O` للفهرس، و`N` لملاحظات المتحدث، و`F11` أو زر ملء الشاشة.
4. جهّز شاشة DevTools على تبويبات `Network` و`Application` و`Console`.
5. إذا كان لديك Supabase مضبوطاً في `.env.local`، جهّز عرض المزامنة الكامل. إذا لم يكن مضبوطاً، استخدم مسار «المزامنة المشروحة» في الخطوة 8 ولا تدّع نجاح رفع غير موجود.

### فحص ما قبل العرض

نفّذ الأوامر التالية قبل وصول الفريق:

```bash
pnpm run lint
pnpm test
pnpm run build
pnpm run start
```

إذا كان الخادم يعمل، اختبر:

```text
http://localhost:3000/
http://localhost:3000/surah/2
http://localhost:3000/surah/44
http://localhost:3000/api/health
```

**مهم:** الـService Worker معطل في `dev`، لذلك اختبار PWA يجب أن يكون من نسخة `build` تعمل عبر `pnpm run start`.

## خريطة الوقت

| الفترة | المقطع | الهدف |
|---|---|---|
| 0-5 د | القصة والمنتج | لماذا يوجد التطبيق؟ ولماذا تغيرت المعمارية؟ |
| 5-17 د | الديمو الحي | إثبات HTML، URL state، الحالة المحلية، البحث، وoffline |
| 17-42 د | الغوص التقني | SSG، loader، hydration، sync، النص العربي، PWA |
| 42-50 د | الاختبارات والحدود | ماذا اختبرت؟ وما الذي لم أدّعِ حله؟ |
| 50-60 د | الأسئلة | افتح الملف المطلوب وأجب من مسار البيانات |

## افتتاحية جاهزة

> «سأعرض التطبيق كمنظومة قرارات، لا كقائمة مكتبات. سأبدأ بسلوك يراه المستخدم، ثم أتتبع السلوك إلى الكود، وأختم بالمقايضات التي قبلتها والحدود التي سأصلحها إذا توسع الاستخدام.»

في أول خمس دقائق استخدم الشرائح `01-05` فقط:

1. عرّف التطبيق: قارئ عربي لتفسير «في ظلال القرآن».
2. أعط الأرقام التي لها أثر: `114` صفحة سورة، `19 MB` مادة تُحمّل عند الحاجة، `117` اختباراً.
3. اشرح أن الانتقال من Vite/Express إلى Next.js لم يكن بحثاً عن أحدث إطار؛ السبب كان روابط عامة، SEO، Route Handlers، وPWA.
4. قل الجملة الحاكمة: **الصفحة تجيب أولاً، والتفاعل يأتي فوقها، والمزامنة لا تعطل القراءة.**

## الديمو الحي

### 1. أثبت أن الصفحة عامة ومكتملة

افتح:

```text
http://localhost:3000/surah/2
```

نفّذ بصوت واضح:

1. «هذه ليست route داخل state فقط؛ هذا رابط يمكن نسخه ومشاركته.»
2. استخدم `View Page Source` أو `Ctrl+U`، وابحث عن جزء من النص العربي.
3. افتح `<title>` أو metadata إن كان ذلك أسهل، ثم اذكر أن `generateMetadata()` يبني العنوان والوصف وcanonical.
4. افتح `src/app/(reader)/surah/[id]/page.tsx` عند الأسطر `10-12` و`35-64`.


**لا تقل:** «كل الصفحة Server Component». الأدق: صفحة المسار Server Component، و`SurahReader` Client Component، والـlayout يركب shell تفاعلياً.

### 2. أثبت أن حالة التبويب في الرابط

1. انقر تبويب `الآيات` ثم لاحظ الرابط:

   ```text
   /surah/2?tab=verses
   ```

2. انسخ الرابط إلى نافذة جديدة أو أعد تحميل الصفحة.
3. جرّب `?tab=chat` ثم اعرض البحث المحلي.
4. افتح `src/components/SurahReader.tsx` عند الأسطر `29-53`.


> «السورة route state، والتبويب query state. التبويب يتحقق من `VALID_TABS`، و`router.replace` يغير الرابط دون إضافة زيارة جديدة إلى history. عند اختيار سورة من sidebar نبدأ من overview عمداً، بينما نتيجة البحث توجه إلى `?tab=verses`.»

### 3. أثبت أن الواجهة تقرأ الحالة المحلية فوراً

1. انقر bookmark للسورة أو اضغط `دراسة`/إكمال.
2. افتح تبويب الإحصاءات، وأظهر العداد أو العنصر المحفوظ.
3. افتح DevTools → `Application` → `Local Storage`.
4. أعد تحميل الصفحة، وبيّن أن الحالة عادت.


```text
src/hooks/useLocalStorageState.ts
src/utils/localStorage.ts
src/hooks/useBookmarks.ts
src/hooks/useProgress.ts
```


> «لا أقرأ localStorage أثناء render لأن الصفحة تُبنى على الخادم. أبدأ بقيمة default مشتركة، أقرأ بعد mount، ولا أكتب قبل `hydrated`. بهذا أتجنب mismatch وأتجنب الكتابة فوق البيانات القديمة بالقيمة الافتراضية.»

### شرح Hydration بالتفصيل

استخدم هذه الدقيقة إذا سأل الفريق: «ماذا يحدث بالضبط بين SSR وCSR؟»:

1. **Server render:** Next.js يبني HTML الصفحة. في هذه المرحلة لا يوجد `window` ولا `localStorage`؛ لذلك يجب أن يكون قرار العرض قابلاً للحساب من props وdefaults فقط.
2. **HTML يصل:** المتصفح يستطيع عرض النص قبل اكتمال JavaScript. هذا HTML ليس تطبيق React حياً بعد؛ هو نقطة البداية التي سيطابقها React.
3. **أول client render:** بعد تحميل JavaScript، ينفذ React نفس الشجرة بالقيم الابتدائية نفسها. Hydration تعني أن React يربط event handlers بالشجرة الموجودة، لا أن يبدأ من HTML فارغ.
4. **Effects بعد commit:** `useEffect` لا يعمل أثناء SSR. بعد أن يلتزم React بالشجرة، يقرأ التطبيق localStorage ويستعيد theme أو bookmarks، ثم يسبب state update طبيعياً.
5. **Persistence بعد الاستعادة:** effect الحفظ ينتظر `hydrated`. لو كتبنا default قبل اكتمال القراءة، قد نمسح preference القديمة ونرفع snapshot خاطئاً إلى sync layer.

النمط الذي يسبب mismatch:

```tsx
// خطأ: قد يتغير أول client render عن HTML الخادم
const [theme] = useState(
  typeof window !== 'undefined'
    ? localStorage.getItem('dhilal_theme') ?? 'dark'
    : 'dark'
);
// SSR = dark، لكن client الأول قد يكون light → mismatch
```

النمط المستخدم في المشروع:

```tsx
// نفس default أولاً، ثم القراءة بعد mount
const [value, setValue] = useState(defaultValue);
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  const stored = localStorageBackend.get(key);
  if (stored !== null) setValue(stored);
  setHydrated(true);
}, [key]);
```

ثم افتح `src/hooks/useLocalStorageState.test.ts` واذكر أن الاختبارات تثبت default قبل mount، واستعادة القيمة بعد mount، وعدم الكتابة فوق القيمة القديمة. افتح أيضاً `src/context/ThemeContext.tsx:15-26` لتبيّن أن theme يبدأ dark في SSR وأول client render ثم يستعيد preference.


### 4. أثبت البحث المحلي بلا AI

1. افتح تبويب `بحث في الظلال`.
2. استخدم أحد الاستعلامات السريعة: `التوحيد` أو `التقوى`.
3. اشرح أن النتيجة تعرض السورة، مدى الآيات، excerpt، وhighlight.
4. افتح `src/utils/search.ts` عند الأسطر `16-58`.


> «الاستعلام يقسم إلى كلمات. كل كلمة موجودة داخل section تزيد score واحداً. نأخذ مقطعاً حول أول تطابق، نرتب تنازلياً، ونرجع أول 50 نتيجة. الاسم Chat هنا اسم للتجربة، لكن التنفيذ local search وليس نموذجاً لغوياً.»



### 5. أثبت graceful degradation

افتح:

```text
http://localhost:3000/surah/44
```

ما تقوله:

> «هذه الصفحة موجودة رغم عدم وجود مادة تفسير للسورة. `SURAHS_WITH_TAFSIR` يحدد التغطية، و`OverviewTab` يعرض رسالة تحريرية مفهومة بدلاً من blank state أو فشل البناء.»




### 6. أثبت تنسيق النص والآيات

1. افتح سورة تحتوي مادة واضحة، مثل `/surah/2`.
2. انتقل إلى overview أو verses.
3. أشّر إلى اختلاف لون مقاطع الآيات عن التعليق.
4. افتح `src/utils/tafsir-format.ts` عند الأسطر `6-79`، ثم `src/components/TafsirContent.tsx`.


> «الاستخراج من Word حافظ على أسطر قصيرة غير صالحة للقراءة. `formatTafsirParagraphs` يعيد جمعها بقاعدة تجمع punctuation مع paragraph starter معروف. `splitVerseSegments` يتعرف على `«…»` أو نهاية `(digit)`، ثم يعرض المقطع بالذهبي. أبقيت هذه المعالجة في render layer لأن تعديل heuristic لا يتطلب إعادة استخراج المصدر.»


### 7. أثبت PWA وoffline بالطريقة الصحيحة

نفّذ هذا الجزء فقط من نسخة production المحلية:

```bash
pnpm run build
pnpm run start
```

في DevTools:

1. افتح `Application` → `Service Workers`، وتأكد من تسجيل worker.
2. افتح `Network`، ثم زر `Offline`.
3. أعد زيارة صفحة سبق فتحها، وبيّن أنها ما زالت متاحة.
4. افتح `src/app/sw.ts` و`next.config.ts` عند الأسطر `4-9`.


> «التنقلات و`/api/*` تستخدم NetworkFirst كي نحصل على الجديد online ونعود إلى cache offline. الملفات الثابتة يمكن تقديمها من cache. الـ19MB tafsir chunk لا يدخل precache الافتراضي بسبب الحجم؛ يصبح متاحاً offline بعد أول تحميل مناسب.»

ثم أضف:

> «أمر `--webpack` ليس تفضيلاً شكلياً؛ InjectManifest الخاص بـSerwist يعتمد على hook في webpack، وبدونه قد ينتهي build بلا `public/sw.js`.»


### 8. اعرض المزامنة دون مفاجآت

#### إذا كانت Supabase جاهزة

1. افتح DevTools → `Network`.
2. غيّر bookmark أو theme مرة واحدة.
3. انتظر 1.5 ثانية ولاحظ `PUT /api/user-data`.
4. افتح الطلب وأظهر `X-Device-Id` وbody الذي يحتوي `bookmarks/history/completed/theme`.
5. كرر تغييرين سريعين، واشرح أن debounce يجمعهما.
6. افتح `src/utils/syncBackend.ts` عند الأسطر `4-77`، ثم `src/app/api/user-data/route.ts` عند الأسطر `44-80`.


#### إذا لم تكن Supabase جاهزة

لا تحاول إخفاء ذلك. قل:

> «القراءة المحلية لا تعتمد على Supabase. في هذه البيئة سأعرض عقد الطلب ومسار الفشل فقط؛ نجاح الرفع يحتاج متغيرات البيئة والجدول. الكود يسجل الحالة pending ويعيد المحاولة، لكنه لا يستطيع اختراع backend غير مضبوط.»


1. `SYNC_DEBOUNCE_MS = 1500`.
2. `MAX_RETRIES = 3`.
3. `inFlight` لتسلسل الرفع.
4. `onConflict: 'device_id'` في Route Handler.



### جولة الكود المختصرة

إذا طلب الفريق فتح الكود بدلاً من متابعة الشرائح، استخدم هذا الترتيب:

| الترتيب | الملف | ما تثبته |
|---|---|---|
| 1 | `src/app/(reader)/surah/[id]/page.tsx` | SSG، metadata، JSON-LD، server/client boundary |
| 2 | `src/data/tafsir-loader.ts` | dynamic import وsingleton promise |
| 3 | `src/components/SurahReader.tsx` | URL state، lazy tabs، Suspense، orchestration |
| 4 | `src/hooks/useLocalStorageState.ts` | hydration-safe persistence |
| 5 | `src/utils/syncBackend.ts` | debounce، retry، serialization، pending state |
| 6 | `src/utils/search.ts` | local scoring وtop-50 cap |
| 7 | `src/utils/tafsir-format.ts` | heuristic عربي واكتشاف الآيات |
| 8 | `src/app/sw.ts` و`next.config.ts` | PWA وسبب `--webpack` |
| 9 | `src/app/api/user-data/route.ts` | header identity وupsert |
| 10 | `src/utils/*.test.ts` | السلوك الذي لا تريد كسره |

## لحظة الاختبارات

نفّذ أو اعرض آخر نتيجة محفوظة من:

```bash
pnpm test
```

قل:

> «عدد الاختبارات ليس معياراً منفرداً. التغطية موزعة على أماكن الخطر: 32 اختباراً لتنسيق النص، اختبارات scoring والـexcerpt، SSR safety للـstorage، debounce/retry للمزامنة، ومكونات navigation مع mocks صريحة. اختبارات المكونات لا تحمل 19MB corpus؛ تعزل العقدة التي تختبرها.»

إذا سُئلت عن E2E، أجب بوضوح:

> «الموجود unit وcomponent tests، وليس لدينا حالياً E2E كامل لتثبيت PWA أو رحلة offline في متصفح حقيقي. هذه فجوة معروفة ضمن خارطة الطريق.»

## الانتقال إلى الأسئلة

اختم الديمو بهذه الجملة:

> «رأيتم الآن السلوك من الخارج. يمكننا فتح أي سهم في الرسم: كيف دخل النص، كيف وصل إلى HTML، كيف صار تفاعلياً، أو كيف حُفظ. سأجيب من نقطة الدخول إلى مستهلك البيانات، ثم أذكر trade-off والاختبار.»

افتح `presentation/qa-guide.md` عند السؤال الذي يختاره الفريق، ولا تقرأ الإجابة من الشاشة؛ استخدم الملف كخريطة للمراجع فقط.

## إذا فشل شيء أثناء العرض

| الموقف | التصرف |
|---|---|
| build بطيء | اشرح أن SSG يمر على 114 مساراً وأن corpus يُقرأ مرة؛ انتقل إلى نسخة build جاهزة. |
| لا يظهر Service Worker | تحقق أنك على `pnpm run start` لا `pnpm run dev`، ثم تحقق من `public/sw.js`. |
| المزامنة 500 | اعرض request وقل إن Supabase/env غير جاهزين؛ لا تقدّم ذلك كنجاح. |
| الصفحة فارغة بعد offline | استخدم صفحة سبق تحميلها وtafsir chunk سبق طلبه؛ هذه نتيجة متوقعة وليست ضماناً لكل محتوى جديد. |
| نسيت مكان كود | استخدم قاعدة: route → hook → utility → test. لا تخمّن رقماً؛ افتح البحث في المحرر. |

## آخر دقيقة

لا تختم بعبارة «التطبيق كامل». اختم هكذا:

> «الحل الحالي مناسب لقارئ مجهول الهوية وبيانات قراءة منخفضة الحساسية. إذا أصبحت المزامنة بين أجهزة متعددة قيمة أساسية، فأول تغيير ليس لون زر؛ هو Auth وRLS وسياسة merge. وإذا أصبح حجم المحتوى عائقاً، أقسمه إلى chunks قابلة للتنزيل. أعرف أين تنتهي صلاحية كل قرار، وهذا جزء من فهم النظام.»
