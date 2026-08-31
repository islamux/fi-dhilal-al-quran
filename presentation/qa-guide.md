# دليل الأسئلة والأجوبة

هذا الدليل ليس نصاً للحفظ. استخدمه لتدريب نفسك على طريقة ثابتة:

1. ابدأ بالمشكلة التي يحلها القرار.
2. سمِّ نقطة الدخول في الكود.
3. تتبع البيانات إلى المستهلك.
4. اذكر المقايضة أو الحد المعروف.
5. اختم باختبار أو تحسين تالٍ.

المراجع أدناه مبنية على النسخة الحالية من المشروع. يبقى `docs/SENIOR_INTERVIEW_QUESTIONS.md` مرجعاً أوسع للتدريب على 105 سؤالاً.

## المعمارية وNext.js

### 1. لماذا انتقلتم من Vite + Express إلى Next.js 16؟

**إجابة قصيرة:** لأن فرضية المنتج تغيرت من أداة قراءة داخلية إلى موقع عام. احتجنا URL لكل سورة، SEO للنص العربي، backend موحداً، وPWA. App Router جمع SSG وMetadata وRoute Handlers والـlayouts في مسار واحد بدلاً من تكرار Express وserverless.

**افتح:** `src/app/(reader)/surah/[id]/page.tsx` و`src/app/api/` و`docs/app-lifecycle.md`.

**المقايضة:** أصبح لدينا server/client boundary وقيود hydration يجب فهمها، بدلاً من بساطة SPA الأولية.

### 2. كيف تُبنى صفحات السور؟

**إجابة قصيرة:** `generateStaticParams()` يعيد 114 رقماً. أثناء build تُقرأ `params` كـPromise، يُبحث عن السورة، يُحمّل corpus، ثم يختار `getTafsirText()` نص السورة ويرسله إلى `SurahReader`. `generateMetadata()` يبني العنوان والوصف وcanonical، وJSON-LD يصف السورة.

**افتح:** `src/app/(reader)/surah/[id]/page.tsx:10-69`.

**نقطة دقيقة:** `dynamicParams = true` يسمح بمسارات غير موجودة، لكن `notFound()` يمنع عرض سورة غير معروفة.

### 3. إذا كان corpus بحجم 19MB، لماذا لا تصبح كل صفحة ضخمة؟

**إجابة قصيرة:** build يقرأ الملف مرة عبر loader مشترك، ثم يضمّن فقط نص السورة الحالية في HTML. أما الملف الكامل فيبقى dynamic import داخل chunk منفصل للبحث والمدى. لذلك HTML مناسب لـSEO، والـmain bundle لا يدفع كل المحتوى لأول زيارة.

**افتح:** `src/data/tafsir-loader.ts` و`src/app/(reader)/surah/[id]/page.tsx:40-64`.

### 4. ما فائدة singleton promise في `tafsir-loader`؟

**إجابة قصيرة:** المتغير `dataPromise` يجعل الطلب الأول ينشئ import واحداً، وكل مستهلك لاحق ينتظر نفس الـPromise. عند الفشل يُعاد إلى `null` حتى توجد محاولة جديدة، فلا تعلق المنظومة على Promise فاشل إلى الأبد.

**افتح:** `src/data/tafsir-loader.ts:3-13`.

### 5. ماذا وحّدت Route Handlers؟

**إجابة قصيرة:** نفس ملفات `route.ts` تخدم dev وproduction وVercel. لم يعد هناك `server.ts` و`api/index.ts` يجب إبقاؤهما متطابقين. سطح API صغير: health، user-data GET/PUT، export، import.

**افتح:** `src/app/api/health/route.ts` و`src/app/api/user-data/route.ts`.

**المقايضة:** أستخدم Web APIs الخاصة بـNext بدلاً من middleware ecosystem الخاص بـExpress، وهو مناسب لهذا السطح المحدود.

### 6. لماذا التبويبات في query string وليست `useState`؟

**إجابة قصيرة:** السورة route state في `/surah/2` والتبويب shareable state في `?tab=verses`. يمكن نسخ الرابط وإعادة فتحه، مع التحقق من `VALID_TABS`. `router.replace` يغير التبويب دون إضافة entry لكل نقرة في history.

**افتح:** `src/components/SurahReader.tsx:29-53`.

### 7. ما حدود Server Component وClient Component هنا؟

**إجابة قصيرة:** صفحة السورة Server Component لأنها تبني metadata وتقرأ corpus أثناء SSG. `SurahReader` Client Component لأنه يحتاج router وsearch params وhooks وتفاعلاً. `(reader)/layout.tsx` يركب provider والـshell حول التجربة.

**افتح:** `src/app/(reader)/layout.tsx` و`src/components/SurahReader.tsx:1-8`.

### 8. كيف يمنع التطبيق hydration mismatch مع localStorage؟

**إجابة قصيرة:** لا نقرأ localStorage أثناء render. يبدأ SSR وأول render من `defaultValue`، ثم يقرأ `useEffect` القيمة بعد mount ويضع `hydrated = true`. effect الحفظ لا يعمل إلا بعد hydration، فلا يمسح القيمة المحفوظة بالقيمة الافتراضية.

**افتح:** `src/hooks/useLocalStorageState.ts:4-23`.

**التسلسل الزمني الدقيق:**

1. في SSR لا يوجد `window`، فيُنتج الخادم الشجرة من `defaultValue` فقط.
2. يصل HTML إلى المتصفح، فيعرضه المتصفح قبل اكتمال JavaScript.
3. ينفذ React أول client render بالقيمة الابتدائية نفسها، ثم يعمل Hydration على ربط الأحداث بالشجرة الموجودة.
4. بعد commit يعمل `useEffect`، فيقرأ localStorage ويستعيد القيمة، ثم يحدث state update ثانٍ مشروع.
5. effect الحفظ ينتظر `hydrated`، لذلك لا يكتب default فوق القيمة المستعادة ولا يرسل snapshot خاطئاً إلى sync.

**مثال الخطأ:** حتى استخدام `typeof window !== 'undefined'` داخل initial state قد ينتج `dark` على الخادم و`light` في أول client render. الحارس يمنع crash، لكنه لا يضمن تطابق markup؛ لهذا تؤجل القراءة كلها إلى effect.

**تطبيق theme:** `ThemeContext` يبدأ `isDarkMode` بقيمة `true`، ثم يقرأ `dhilal_theme` في `useEffect`، ويؤجل الحفظ إلى ما بعد `hydrated` في `src/context/ThemeContext.tsx:15-26`.

**الثمن:** تظهر بعض الحالة بعد mount، وهذا مقبول مقابل HTML متسق.

### 9. لماذا استخدمتم Context مع عدة hooks؟


**إجابة قصيرة:** `AppStateProvider` يركب `useBookmarks` و`useProgress` و`useSearch` و`useDataSync`، ثم يعرّض عقدة واحدة عبر `useAppState()`. هذا يمنع تمرير عشرات props بين shell والتبويبات ويجعل الحالة تعبر navigation داخل route group.

**افتح:** `src/context/AppStateContext.tsx`.

**المقايضة:** قيمة Context الجديدة قد تعيد render مستهلكين كثيرين؛ إذا كبر التطبيق يمكن تقسيم contexts أو اعتماد selectors بعد القياس.


### 10. لماذا كل تبويب `lazy`؟

**إجابة قصيرة:** Overview وVerses وChat وStats ليست كلها مطلوبة في أول رسم. `React.lazy` مع `Suspense` يقسم الكود ويجعل التبويب حد تحميل واضحاً، و`AnimatePresence` يتولى الانتقال البصري.

**افتح:** `src/components/SurahReader.tsx:15-18` و`71-112`.

## المادة والنص العربي

### 11. كيف يتحول Word إلى `TAFSIR_DATA`؟

**إجابة قصيرة:** السكربت يستدعي `catdoc -d utf-8` على 22 ملفاً، يلتقط headers التي تحدد السورة ومدى الآيات، يستبعد page refs وheaders والفهارس والفواصل، ثم يزيل التكرار حسب `surahId + startVerse + endVerse`. الناتج typed TypeScript، ومعه Set للسور المغطاة.

**افتح:** `scripts/extract-tafsir.ts` و`src/types.ts`.

### 12. ما شكل عقدة بيانات التفسير؟

**إجابة قصيرة:** `TAFSIR_DATA` من نوع `Record<number, TafsirSection[]>`، وكل section يحتوي `startVerse` و`endVerse` و`text`. `getTafsirText()` إما يجمع كل المقاطع أو يعيد المقاطع التي تتقاطع مع range مطلوب.

**افتح:** `src/types.ts` و`src/utils/tafsir-data.ts`.

### 13. لماذا تنسيق الفقرات في render layer؟

**إجابة قصيرة:** المشكلة في النص المستخرج هي hard-wrapped lines قصيرة، وليست فساداً في المصدر. إبقاء heuristic في `tafsir-format.ts` يسمح بتعديل قواعد بداية الفقرة وإعادة اختبارها دون تشغيل extraction على 22 ملفاً من جديد.

**افتح:** `src/utils/tafsir-format.ts:37-79` و`sessions/2026-06-19-tafsir-formatting.md`.

**المقايضة:** هناك تكلفة regex أثناء العرض، وقد نحتاج memoization بعد قياس فعلي.

### 14. كيف تميزون الآية عن التعليق؟

**إجابة قصيرة:** `splitVerseSegments()` يقسم على مقاطع `«…»` ويعاملها كآيات، ثم يبحث في الأجزاء الأخرى عن نهاية `(digit)`. `TafsirContent` يضع segment الآية داخل span بلون `text-gilded-gold` ويترك التعليق بلون القراءة.

**افتح:** `src/utils/tafsir-format.ts:6-35` و`src/components/TafsirContent.tsx`.

**الحد:** هذا heuristic مبني على شكل المصدر؛ لو تغيرت علامات النص يجب توسيع الاختبارات والقواعد.


### 15. كيف يعمل البحث؟ وهل يوجد AI؟

**إجابة قصيرة:** لا يوجد AI ولا API للبحث. بعد تحميل corpus، يقسم `searchTafsir()` query إلى كلمات، يمنح section نقطة لكل كلمة موجودة، يأخذ excerpt حول أول match، يرتب حسب score، ويقص النتائج إلى 50. `HighlightedText` يتولى إبراز الكلمات في الواجهة.

**افتح:** `src/utils/search.ts:16-58` و`src/utils/highlight.ts`.

**المقايضة:** المسح الخطي هو التنفيذ الحالي داخل المتصفح، لكنه ليس محرك full-text index مناسباً لـcorpus أكبر بكثير؛ عند التوسع نحتاج فهرساً أو معالجة مسبقة.



### 16. ما دور `localStorageBackend` غير التخزين؟

**إجابة قصيرة:** هو abstraction يحمي من SSR، يحول JSON، ويعرض `onChange` pub/sub. بذلك تستطيع طبقة المزامنة مراقبة تغييرات hooks دون ربط React مباشرة بـAPI.

**افتح:** `src/utils/localStorage.ts` و`src/hooks/useDataSync.ts`.


### 17. كيف تمنعون PUT مع كل نقرة؟

**إجابة قصيرة:** كل تغيير يستدعي `notifyChange()`، التي تلغي timer السابق وتنتظر 1500ms بعد آخر تغيير. بعدها تقرأ snapshot موحداً من localStorage وترسل PUT.

**افتح:** `src/utils/syncBackend.ts:4-77`.


### 18. كيف تعمل retry وماذا يحدث عند upload متزامن؟

**إجابة قصيرة:** `putUserData()` يحاول ثلاث مرات، وبين المحاولات ينتظر `2^attempt * 1000`، أي تقريباً ثانية ثم ثانيتين. `inFlight` يجعل عملية sync التالية تنتظر السابقة بدلاً من تشغيل PUTين متداخلين داخل نفس الصفحة. عند الفشل تبقى `dhilal_sync_pending` true.

**افتح:** `src/utils/syncBackend.ts:9-36` و`58-77`.


### 19. ما سياسة التعارض بين جهازين؟

**إجابة قصيرة:** السياسة الحالية last-write-wins على snapshot كامل. `initFromServer()` يكتب بيانات الخادم فوق localStorage عند البدء، وPUT يستخدم upsert للصف كله. جهازان offline قد يضيفان bookmarks مختلفة ثم يخسر أحدهما عند آخر رفع.

**افتح:** `src/utils/syncBackend.ts:80-96` و`src/app/api/user-data/route.ts:59-74`.

**التحسين:** merge حسب bookmark/completion أو versioned conflict protocol، وليس مجرد رفع الصف كله.


### 20. هل `X-Device-Id` authentication؟

**إجابة قصيرة:** لا. هو anonymous device key يولده `crypto.randomUUID()` ويحفظه المتصفح. مناسب لملاحظات قراءة منخفضة الحساسية، لكنه قابل للتزوير، وفقدان localStorage يعني هوية جديدة، ولا توجد استعادة حساب أو دمج أجهزة.

**افتح:** `src/hooks/useDeviceId.ts` و`src/utils/syncBackend.ts:15-25`.


### 21. ماذا يحدث لأول زيارة إلى API؟

**إجابة قصيرة:** Route Handler يرفض الطلب إذا لم يوجد header. مع header يبحث عن `device_id` عبر `maybeSingle()`، وإذا لم يجد صفاً ينشئه. PUT يستخدم `upsert` مع `onConflict: 'device_id'`.

**افتح:** `src/app/api/user-data/route.ts:4-40` و`44-87`.


### 22. لماذا JSONB وبدون حسابات حالياً؟

**إجابة قصيرة:** البيانات صغيرة ومحدودة: bookmarks وhistory وcompleted وtheme، لذا JSONB يبقي snapshot بسيطاً ويزيل احتكاك التسجيل من تجربة قراءة شخصية. لكن هذا ليس نموذجاً مناسباً لعلاقات واستعلامات غنية أو بيانات حساسة.

**افتح:** `supabase/migrations/20260701_create_user_data.sql`.

**الحد الأمني:** لا توجد RLS؛ الحماية الحالية تعتمد على بقاء service-role server-side وعلى header قابل للتزوير. التوسع يتطلب Auth وRLS.


### 23. كيف تتعاملون مع السور التي لا توجد لها مادة؟

**إجابة قصيرة:** `SURAHS_WITH_TAFSIR` Set يعطي فحصاً سريعاً، وتبقى صفحة السورة موجودة كي لا تتشوه خريطة الروابط. `OverviewTab` يعرض رسالة graceful بدلاً من blank state مضلل. السور الحالية هي 44 و50 و76 و89.

**افتح:** `src/data/tafsir-meta.ts` و`src/hooks/useTafsir.ts` و`src/components/OverviewTab.tsx`.



### 24. ما استراتيجية cache في PWA؟

**إجابة قصيرة:** `src/app/sw.ts` ينشئ Serwist مع precache manifest و`defaultCache`. التنقلات و`/api/*` تستخدم NetworkFirst للحصول على الجديد online مع fallback offline، والملفات الثابتة يمكن تقديمها من cache. الـService Worker معطل في dev ومفعل في production build.

**افتح:** `src/app/sw.ts` و`next.config.ts:4-9`.


### 25. لماذا `--webpack` إلزامي؟

**إجابة قصيرة:** `@serwist/next` يحقن service worker عبر webpack `InjectManifest`. لذلك scripts `dev` و`build` مثبتة على `--webpack`; استخدام Turbopack قد يبني Next دون تنفيذ hook وإخراج `public/sw.js`.

**افتح:** `package.json:6-13` و`next.config.ts:4-9`.


### 26. لماذا لا يدخل chunk التفسير 19MB في precache؟

**إجابة قصيرة:** حجم chunk أكبر من حد precache الافتراضي. هذا يقلل حجم تثبيت PWA وتحديثاته، لكنه يعني أن أول تحميل للمادة يحتاج شبكة. بعد التحميل يمكن أن يدخل runtime cache. الحل الأفضل عند الحاجة هو تقسيم المادة إلى chunks لكل سورة/جزء أو زر تنزيل صريح.

**افتح:** `src/data/tafsir-loader.ts` و`src/app/sw.ts`، ثم اعترف بأنه trade-off مقصود لا offline كامل.


### 27. ما الطبقات الأمنية الموجودة؟

**إجابة قصيرة:** service-role key لا يخرج من server module، وRoute Handlers تتحقق من وجود header ومن إمكانية قراءة JSON، وproduction يرسل CSP وX-Frame-Options وnosniff وReferrer-Policy وPermissions-Policy. React يهرب نص التفسير لأنه يمر كـchildren.

**افتح:** `src/lib/supabase.ts` و`next.config.ts:11-46`.

**ما ينقص:** Auth وRLS وschema validation أعمق وlimits للـimport إذا أصبحت البيانات حساسة أو عامة.


### 28. هل `dangerouslySetInnerHTML` خطر هنا؟

**إجابة قصيرة:** الاستخدام الوحيد في JSON-LD. الـpayload مبني server-side من metadata ثابتة في `SURAHS` ويمر عبر `JSON.stringify`، وليس من إدخال مستخدم. نص التفسير لا يستخدم هذا sink بل React children التي تُهرب تلقائياً.

**افتح:** `src/app/(reader)/surah/[id]/page.tsx:43-64`، وابحث عن الاستخدامات الأخرى للتأكد من عدم وجود sink إضافي.



### 29. ماذا تثبت الاختبارات؟

**إجابة قصيرة:** هناك 117 اختباراً عبر 13 ملفاً. المخاطر الرئيسية مغطاة: heuristic الفقرات والآيات، scoring والـexcerpt، SSR safety للـstorage، debounce/retry وinitFromServer، highlighting، range filtering، وnavigation mocks.

**افتح:** `pnpm test` ثم `src/utils/tafsir-format.test.ts` و`src/utils/syncBackend.test.ts` و`src/components/SurahReader.test.tsx`.


### 30. ما الذي لا تثبته هذه الاختبارات؟

**إجابة قصيرة:** هي unit وcomponent tests، وليست E2E كاملاً لمتصفح حقيقي. لا يوجد اختبار شامل لتثبيت PWA، offline navigation، service worker lifecycle، أو تعارض جهازين حقيقيين. هذه فجوات يجب ذكرها لا تغطيتها بادعاء عام عن عدد الاختبارات.

**افتح:** `docs/TESTING.md`.


### 31. ما أول تحسين أداء ستنفذه؟

**إجابة قصيرة:** أقيس أولاً. المرشحان الواضحان هما تقسيم corpus إلى chunks أصغر كي يتحسن offline الأولي، وmemoization لنتيجة `formatTafsirParagraphs(tafsirText)` إذا أثبت profiling أن إعادة التنسيق مكلفة. لا أضيف `useMemo` لمجرد الشعور.

**افتح:** `src/components/TafsirDisplay.tsx` و`src/utils/tafsir-format.ts`.


### 32. كيف توسع النظام لو أصبح multi-device مهماً؟

**إجابة قصيرة:** أبدأ Auth حقيقياً وRLS على `auth.uid()`، ثم أغير نموذج المزامنة من whole-row snapshot إلى عناصر versioned يمكن دمجها. بعد ذلك أضيف E2E لتعارض offline، وأقيس تحميل المادة قبل تقرير استراتيجية precache.

**الترتيب مهم:** أصلح فقد البيانات وحدود الثقة قبل صقل animations أو إضافة ميزات سطحية.

## عبارات يجب تجنبها

| لا تقل | قل بدلاً منها |
|---|---|
| التطبيق offline بالكامل | الصفحات والموارد التي زُيِرت يمكن أن تعمل offline؛ أول chunk كبير له trade-off. |
| UUID يحمي المستخدم | UUID يعرّف جهازاً مجهولاً، وليس authentication. |
| لدينا 117 اختباراً إذن كل شيء مضمون | لدينا 117 اختباراً تغطي عقوداً محددة، وما زالت E2E وconflict resolution فجوات. |
| Next.js حل كل المشاكل | Next.js حل routing/SSG/API integration، وأضاف مسؤوليات hydration وserver/client boundaries. |
| Chat يستخدم الذكاء الاصطناعي | ChatTab واجهة بحث محلي scored على corpus الموجود في الذاكرة. |
| لا توجد مشاكل أمنية | secrets server-only وheaders موجودة، لكن لا توجد RLS والـdevice key قابل للتزوير. |

## إذا لم تعرف الإجابة فوراً

استخدم هذه الصيغة بدلاً من التخمين:

> «سأحدد نقطة الدخول أولاً. أعتقد أن السلوك يبدأ من [الصفحة/الهوك/الـroute]، ثم ينتقل إلى [الـutility/context]، والمستهلك النهائي هو [المكوّن/API]. سأتحقق من السطر قبل أن أجزم بتفصيل التنفيذ.»

هذا ليس تهرباً؛ هو نفس أسلوب debugging القابل للتكرار، ويثبت أنك تفهم طريقة الوصول إلى الإجابة لا مجرد حفظ إجابات جاهزة.
