# Senior Engineering Interview: Fi Dhilal al-Quran (في ظلال القرآن)

> **Format:** 4 rounds × 25 questions = 100 + 5 bonus = 105 total
> **Target:** Mid→Senior candidate
> **Style:** FAANG/Big Tech — behavioral, architectural depth, system design, debugging, and coding
> **Project:** Arabic-RTL offline-first PWA for reading Sayyid Qutb's tafsir — **Next.js 16 (App Router) + React 19 + TypeScript 6 + Tailwind v4 + @serwist/next PWA + Supabase**, SSG ×114 surah pages, ~19 MB lazy-loaded tafsir data, anonymous device-keyed cloud sync
> **Note:** Rounds 2 & 3 are framed to this stack: "React, Next.js & App Router Deep Dive" and "TypeScript, Data, Backend & Build Pipeline." The app **migrated from a Vite+Express SPA to Next.js 16** — every question below reflects the current App Router implementation.

---

## Round 1: Architecture & System Design (25 questions)

### Q1. Why did the app migrate from Vite+Express SPA to Next.js 16? What drove the change?

**A:** The old stack (Vite + Express + SPA tabs) was chosen when the app was a private local-first tool — no public URLs, no SEO, tab-based `useState` navigation. That premise collapsed once the app needed to be **shareable and findable**: (1) **Per-surah public URLs** — `/surah/{id}` is a deep link anyone can share/bookmark; (2) **SEO** — Google indexes each surah's full Arabic tafsir prose, which is impossible with a client-rendered tab SPA; (3) **Unified backend** — the old `server.ts` (Express) + `api/index.ts` (Vercel serverless) duplication and the `vercel.json` routing hacks were eliminated in favor of **Route Handlers** (one code path for dev, prod, and Vercel); (4) **File-based routing** replaced the hand-rolled tab-plus-manual-router approach (tab state survives via `?tab=`). Webpack's Next build also let `@serwist/next` own the PWA pipeline. The offline-first reading experience is preserved (Q13).

### Q2. Which Next.js/App Router features are actually pulling weight here? Rank them.

**A:** (1) **SSG** — 114 surah pages + the landing page are statically generated at build time, so full tafsir prose ships in the HTML with zero client round-trip (Q4); (2) **Route Groups + layouts** — `(reader)/layout.tsx` wraps all reader pages once with `AppStateProvider` + `WorkstationShell` (`src/app/(reader)/layout.tsx:4-10`); (3) **Metadata API + JSON-LD** — `generateMetadata`, canonical/OG, Book schema per surah; (4) **Route Handlers** — the whole REST API with no Express dependency; (5) **`manifest.ts`, `sitemap.ts`, `robots.ts`** — metadata files served by Next itself. RSC streaming and ISR are *not* used — this is a fully static site with a thin API layer.

### Q3. How does navigation work now — how do tabs coexist with file-based routing?

**A:** Two layers. **Route state** (the surah) maps to the URL: `WorkstationShell` (client) reads `useParams().id`, resolves it via `resolveSurah()` which falls back to surah 1 (`src/components/WorkstationShell.tsx:12-15`), and navigates with `router.push('/surah/' + id)` (`:31-35`). **Tab state** (overview/verses/chat/stats) lives in the `?tab=` search param: `SurahReader` reads `useSearchParams().get('tab')`, validates against `VALID_TABS`, defaults to `'overview'`, and writes back with `router.replace('?tab=...')` (`src/components/SurahReader.tsx:32-41`). The sidebar intentionally navigates without a tab param (resets to overview); chat search results push `?tab=verses` (`SurahReader.tsx:51-53`). So the URL is both shareable and tab-aware — the old SPA couldn't do either.

### Q4. The surah pages are SSG. Walk through the static generation.

**A:** `generateStaticParams()` returns `SURAHS.map(s => ({ id: String(s.id) }))` — 114 ids (`src/app/(reader)/surah/[id]/page.tsx:11-13`). At build time Next calls the component for each id: it `await`s the `params` Promise (Next 16 — params are async), looks up the surah, calls `loadTafsirData()` (the singleton import of `src/data/tafsir.ts`, cached across pages), slices the surah's text via `getTafsirText()`, and renders `<SurahReader>` with `initialTafsirText` — so the **full Arabic tafsir prose is baked into the static HTML** for SEO (`:36-43`). `generateMetadata` produces per-surah titles/descriptions/canonical/OG with `await params` (`:15-34`), and a JSON-LD `Book` schema is embedded (`:44-57`). `dynamicParams = true` + `notFound()` (`:39`, `:70`) means unknown ids 404 gracefully rather than prerendering.

### Q5. The tafsir file is ~19 MB. How can SSG render it into HTML without bloating every page?

**A:** At build time the ~19 MB `src/data/tafsir.ts` is imported **once** into the Node build process (`loadTafsirData()` memoizes the promise — `src/data/tafsir-loader.ts:5-13`), all 114 pages share it, and only the *selected surah's text* (a few dozen KB) is embedded per page. The full data module is still emitted as a **separate lazy chunk** (~19 MB) for client-side use (search, verse-range fetching through `useTafsir`). So: static HTML contains only per-surah prose; the client bundle stays slim; the giant data file is fetched on demand. The old SPA put the same 19 MB behind a `manualChunks` split; App Router achieves it via dynamic import + webpack chunking without hand-written config.

### Q6. The API is now Route Handlers. What exactly did this unify?

**A:** `src/app/api/health/route.ts`, `src/app/api/user-data/route.ts` (GET/PUT), plus `.../user-data/export` and `.../user-data/import`. One implementation serves **dev, prod, and Vercel** — there is no `server.ts`, no `api/index.ts`, no `vercel.json`. The old system required hand-syncing two Express/serverless implementations of the same REST surface (a real drift risk); now a route change is a single file. Vercel auto-detects Next.js, so deployment config is zero. The trade-off: Route Handlers are Next/web-standard (`NextRequest`, `NextResponse`) rather than express — no middleware ecosystem, but the surface here is four endpoints (`src/app/api/user-data/route.ts:8-42` GET, `:44-87` PUT with `upsert(..., { onConflict: 'device_id' })`).

### Q7. Identity is an anonymous `X-Device-Id` header. How is it generated, and what are the limits?

**A:** `getDeviceId()` (`src/hooks/useDeviceId.ts:6-12`) — `crypto.randomUUID()` generated client-side, stored in localStorage under `dhilal_device_id`, re-read on every use; `syncBackend` sends it as `X-Device-Id` on every API call (`src/utils/syncBackend.ts:9-51`). Route Handlers read it from the header (`src/app/api/user-data/route.ts:4-6`); GET creates an empty row on first contact (`:25-29`) and PUT upserts. Limits (unchanged from the old app because the model didn't change): (1) **forgeable** — any client claiming a uuid owns that row, fine for anonymous reading notes, not for sensitive data; (2) clearing localStorage/incognito creates a new identity (loses sync); (3) no account recovery or multi-device merge. This is the #1 reason to migrate to real auth (Q24).

### Q8. The `user_data` table has no RLS policies. What's the threat model, and what breaks if the service_role key leaks?

**A:** `supabase/migrations/20260701_create_user_data.sql` creates the table but never enables RLS. All protection rests on (a) the `service_role` key staying server-side (`src/lib/supabase.ts:15`), and (b) the `device_id` filter in every query. **If the key leaks** (bundled into the client bundle, `.env.local` exposed), an attacker has full read/write to every row across all users — no RLS backstop. Fix: real auth + RLS (`auth.uid()`) as in Q24/Q82. The no-RLS model is meaningful only because the "authenticator" is a forgeable header; a senior should frame it as "the API layer *is* the access control," which is defensible for anonymous bookmark sync but stops being so the moment the data feels valuable.

### Q9. Cloud sync is last-write-wins with no merge. What data-loss scenarios exist?

**A:** `initFromServer()` **overwrites** local localStorage keys from the server on boot (`src/utils/syncBackend.ts:80-96`); `PUT` upserts the whole row (`onConflict: 'device_id'`). Scenarios: (1) **Two devices, both offline, both add bookmarks** — whichever syncs last wins; the other device's additions are gone. (2) **Read on phone, open laptop** — boot overwrites the laptop's local state with the server's; unsynced laptop changes lost. (3) **Race** — two near-simultaneous PUTs; the later timestamp wins. There's no merge, no vector clock, no CRDT. Single-device users are safe; multi-device data loss is inevitable. `docs/TESTING.md` must not claim conflict-resolution coverage (it doesn't; beware of any doc asserting otherwise).

### Q10. Where does the Supabase migration live, and is it version-controlled?

**A:** `supabase/migrations/20260701_create_user_data.sql` — run by `pnpm`-free `supabase db push` or manual SQL. Note the repo's `.gitignore` still lists `supabase/` and `.env.local` is the real-secrets file, so **verify the migration is actually committed** — in the old stack it was gitignored and the schema was irreproducible from a fresh clone. The migration is the contract between the RLS-less table and the four Route Handlers; if it's untracked, that's a repo-hygiene regression waiting to bite (fresh clone → no table → all sync 500s).

### Q11. How does the Serwist PWA caching strategy work, and why `NetworkFirst` for `/api/*`?

**A:** `src/app/sw.ts` uses `new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true, navigationPreload: true, runtimeCaching: defaultCache })` (`src/app/sw.ts:13-21`). `defaultCache` from `@serwist/next/worker` applies the conventional set: **navigations (HTML) and `/api/*` are NetworkFirst** (fresh data when online, cached fallback offline), while static JS/CSS/fonts are CacheFirst. The precache manifest is injected by `@serwist/next` at build (webpack `InjectManifest`, `next.config.ts:4-9`) into `public/sw.js`. `navigationPreload` + `clientsClaim` make first navigations fast and SW activation instant. This is exactly the offline-first behavior the old `vite-plugin-pwa` provided, now inside the Next build pipeline.

### Q12. The ~19 MB tafsir chunk is *not* precached. Is that a bug?

**A:** No — it's the known shape of the system, and a genuinely good senior topic. Serwist (like Workbox) defaults `maximumFileSizeToCacheOnBytes` to 2 MB per precache entry; at ~19 MB the tafsir chunk exceeds it, so it is **excluded from the precache manifest** and only served by the runtime CacheFirst/NetworkFirst caching after the user first loads it. Consequence: a first install is fully offline **except** the tafsir data — the app boots, but the first surah/search needs the network (Script/NetworkFirst). Trade-off: precaching 19 MB would guarantee offline tafsir but blow up install size and update payloads. Mitigations a senior should name: per-surah chunks (Q101), progressive background precache, or an explicit "download for offline" action. The old app raised this same limit to 25 MB and precached everything — the migration deliberately did not.

### Q13. Offline-first with server-rendered pages — how do these coexist?

**A:** The reading combines three layers: (1) SSG HTML bakes per-surah prose into the page (works with no JS, indexable); (2) the PWA's runtime NetworkFirst caches the HTML, JS chunks, and (after first visit) the tafsir data for later offline reads; (3) `/api/*` NetworkFirst keeps sync working offline (queued + retried, Q44). So "server-rendered" and "offline-first" aren't in tension: the SSR output *is* the cached asset. The old Express SPA cached `dist/` wholesale; the App Router version caches statically-generated HTML + route chunks via the SW.

### Q14. The tafsir is inserted as React children (auto-escaped), but the page also uses `dangerouslySetInnerHTML` for JSON-LD. Why is the latter safe?

**A:** Two different sinks. Tafsir prose flows through `TafsirContent`/`HighlightedText` as React children/strings — React escapes `<script>` by default, no XSS surface, and the source is trusted first-party `.doc`-extracted content. The JSON-LD block, by contrast, is `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}>` (`src/app/(reader)/surah/[id]/page.tsx:61-64`). It's safe because the payload is built **server-side at build time** from `SURAHS` metadata (a compile-time constant) — no user input, no runtime string, JSON.stringify escaping could only be defeated if a surah name contained `</script>` (it can't). The `dangerouslySetInnerHTML` is the *only* one in the tree (verify by grep); every other rendering path is auto-escaped children. A senior should know that "no dangerouslySetInnerHTML" and "dangerouslySetInnerHTML is fine *here*" are not the same claim.

### Q15. `formatTafsirParagraphs` runs at render time (client), not at build. Why, and what's the cost?

**A:** The heuristic paragraph-grouping (`src/utils/tafsir-format.ts:37-79`) and verse-segment splitting (`:6-35`) run in `TafsirDisplay` on the client (`src/components/TafsirDisplay.tsx:26`). Decision (from `sessions/2026-06-19-tafsir-formatting.md`): render-time formatting lets the team iterate on the ~40-keyword Arabic heuristic with hot reload, no regeneration step. Cost: it runs on **every render** of the display. For a 286-verse surah that's a noticeable regex pass per render — the classic fix is `useMemo(() => formatTafsirParagraphs(tafsirText), [tafsirText])` (Q89). Note the SSG layer renders the *raw text* server-side for SEO, but the *styled* view is client-formatted — so the same text is formatted twice, once for the HTML, once for the interactive view.

### Q16. The data is stored in localStorage, but this is now an SSR app. How do you avoid hydration mismatches?

**A:** This is the key migration concern and it's handled by an explicit pattern: every storage read is **SSR-guarded** (`localStorageBackend.canUseStorage()` checks `typeof window !== 'undefined'` — `src/utils/localStorage.ts:3-13`), and every hook that reads storage uses a **mount-read + hydrated save-guard**: `useLocalStorageState` initializes with the default, reads storage in a `useEffect` on mount, sets `hydrated`, and only *then* writes back (`src/hooks/useLocalStorageState.ts:4-23`). This is used by `useBookmarks`, `useProgress`, `useDataSync`, `useDeviceId`, and `ThemeContext` (`src/context/ThemeContext.tsx:16-27`). Consequence: localStorage state is never read during SSR and never written before hydration, so server HTML and first client render agree — no "Text content does not match server-rendered HTML" crashes. The cost: a state pops in after mount (a brief flash before bookmarks/theme appear) — an acceptable trade for SSR.

### Q17. `AppStateContext` composes 4 sub-hooks. Walk through the pattern.

**A:** `AppStateProvider` (`src/context/AppStateContext.tsx:43-68`) composes `useBookmarks` (bookmarks), `useProgress` (history + completed), `useChat`/`useSearch` (search state), and `useDataSync` (syncPending), plus local `useState` for UI flags (searchQuery, mobileSidebarOpen, juz/type filters, sidebarTab), and exposes one context value via `useAppState()` (`:70-74`). The Context approach replaces the old "master hook + ~25 explicit props threaded through `App.tsx`" — Context avoids prop drilling but re-renders *every consumer* on any value change; the provider's `value` is a fresh object each render, so consumers bail out only if they're memoized. In the `(reader)` layout the provider wraps `WorkstationShell` + the page's `SurahReader`, so a whole session stays in sync across surah nav without URL baggage.

### Q18. `useTafsir` takes `initialTafsirText` from the server component. Why both server text and client fetch?

**A:** The server passes the static prose (SSG + SEO + instant first paint) and `useTafsir` seeds its state with it (`src/hooks/useTafsir.ts:7-9`). But verse-range changes are a **client concern**: `fetchTafsir(surah, range)` re-reads the shared singleton data and re-slices `getTafsirText` (`:11-19`). So the server supplies surah *boot* content; the client supplies *interaction* content (range switching, `/surah/{id}?tab=verses` deep links into a range). Failure is graceful: `fetchTafsir`'s catch leaves `tafsirText` null and the UI shows the "no tafsir" message. A subtle point: surah changes are router navigations (new page, new server text), so `useTafsir` only ever fetches ranges within the *current* surah — it never needs to fetch cross-surah.

### Q19. `useDataSync` has an async IIFE with an unreachable cleanup. Walk through the bug.

**A:** `src/hooks/useDataSync.ts:8-26` — the `useEffect` body is `(async () => { await initFromServer(); ...; return () => { unsubLocal(); unsubSync(); }; })()`. The effect itself returns `undefined`; the returned "cleanup" is the **async IIFE's** resolve value, which React never sees. So the two `onChange` subscriptions are never torn down on unmount — a leak. A `cancelled` flag was added (`:9`, `:13`) which guards post-unmount setState, but the unsubscriptions are still dropped. Correct fix (Q83): return a real cleanup from the effect and subscribe synchronously, or use the flag + cleanup inside an effect-scoped closure. This is a canonical React anti-pattern and a great debugging prompt — StrictMode (enabled via `reactStrictMode: true`, `next.config.ts:36`) would expose it by double-invoking in dev.

### Q20. Four surahs (44, 50, 76, 89) are missing from the tafsir. How is this handled across server and client?

**A:** `src/data/tafsir-meta.ts:2` exports `SURAHS_WITH_TAFSIR` (110 ids); `useTafsir.hasTafsir` checks it (`src/hooks/useTafsir.ts:26`). The client renders a graceful Arabic "لم نعثر بعد على النص الأصلي…" message in `VersesTab` (`src/components/VersesTab.tsx:30-36`) and `OverviewTab` (`src/components/OverviewTab.tsx:24-28`). On the server, SSG still builds all 114 pages (`generateStaticParams` iterates all of `SURAHS`), and `getTafsirText` returns `null` for missing surahs, so the page renders with the graceful state baked in. Root cause is the source corpus (`fi-thila-al-quran-word-src/*.doc` lacks those 4). Honest handling of incomplete source data — no stubs, no crashes.

### Q21. Security headers are production-only and the CSP allows `'unsafe-inline'` for scripts. Explain both choices.

**A:** `next.config.ts:38-46` gates the header set on `NODE_ENV === 'production'` (dev/`next dev` gets no headers — HMR and source maps would fight CSP). Production adds: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy (`:11-33`). The CSP's `script-src 'self' 'unsafe-inline'` is the interesting trade: **App Router / React Server Components inject inline scripts** (RSC payload inline JSON, inline hydration bootstrap, and the JSON-LD block) — a strict `'self'` would break rendering, so `'unsafe-inline'` is required and *not* a config mistake. A nonce-based policy would tighten this (Q5 of a security-focused round); until then the compromise is documented and the other headers are solid (`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`). The old Helmet CSP had the same `'unsafe-inline'` shape for the same reason (inline style + dev HMR) — the trade moved with us.

### Q22. `app/manifest.ts` auto-serves the manifest. What's the App Router gotcha here?

**A:** `src/app/manifest.ts` exports a `MetadataRoute.Manifest` — Next serves it at `/manifest.webmanifest` **and auto-injects the `<link rel="manifest">`** into the head (`src/app/manifest.ts:3-18`). The gotcha: because Next injects the link itself, you must **not also set `metadata.manifest`** in `layout.tsx` — doing so duplicates or conflicts. The manifest is Arabic, `display: 'standalone'`, `orientation: 'portrait'`, brand accent `#F27D26`, with SVG icons. Same class of gotcha as `sitemap.ts` (which auto-serves `/sitemap.xml` and is referenced from `robots.ts`).

### Q23. Next 16 made `params`/`searchParams` Promises. Where does the app handle that, and what breaks if you forget?

**A:** In the server component `generateMetadata` and the page component both do `const { id } = await params` (`src/app/(reader)/surah/[id]/page.tsx:16`, `:37`). Forgetting the `await` yields `params` as a Promise and the code fails or renders nothing. The client side never touches `params` directly — `WorkstationShell` uses `useParams<{ id?: string }>()` (`src/components/WorkstationShell.tsx:20`, synchronous) — but a client component can't read a server component's `params` anyway; the URL is the bridge. This is a genuine Next 16 breaking-change trap (the old codebases, and most tutorials, treat `params` as a plain object).

### Q24. How would you add real user accounts, replacing anonymous device sync?

**A:** Supabase Auth (email magic-link / OAuth). (1) Add `auth.users` (managed) and link `user_data.user_id → auth.users(id)`, keeping or dropping `device_id`; (2) RLS policies with `auth.uid() = user_id` become meaningful (Q8); (3) migrate data — on first sign-in, copy the anonymous device row into the user row (the app's `initFromServer` merge already has the shape of this); (4) decide the client seam: either keep the Route Handlers (now JWT-verified) or move reads/writes client-side with the anon key + RLS; (5) **rotate/revoke the service_role key** because it's currently the only guard. The anonymous→authed merge is the tricky part (Q9's no-merge becomes merge-on-signin); a senior should also flag session persistence, logout-per-device semantics, and what happens to rows whose `device_id` was never claimed.

### Q25. If you were rebuilding from scratch, top three changes?

**A:** (1) **Real auth + RLS from day one** — the forgeable `X-Device-Id` + no-RLS model is the #1 architectural risk (Q7, Q8); it works for anonymous bookmarks but paints you into a corner. (2) **Per-surah tafsir chunks instead of one 19 MB file** — the all-or-nothing lazy load is the single worst perf cliff (Q101), and SSG already proved per-surah slicing is viable. (3) **Conflict-resolving sync** — replace last-write-wins whole-row upsert with at least a union-merge for bookmarks, ideally an LWW-element-set CRDT (Q102). Beyond: add Route Handler integration tests, unify the `TafsirSection` triple declaration (Q51), and tighten the CSP with nonces (Q21). The Next.js migration itself is sound — the content pipeline, hydration safety, and PWA all survived the move.

---

## Round 2: React, Next.js & App Router Deep Dive (25 questions)

### Q26. What's the `'use client'` boundary in this tree? Map the server/client split.

**A:** Server (RSC): `src/app/layout.tsx`, `(reader)/layout.tsx`, `(reader)/page.tsx`, `surah/[id]/page.tsx`, `manifest.ts`, `sitemap.ts`, `robots.ts`, all Route Handlers. Client: `WorkstationShell.tsx`, `SurahReader.tsx`, `ErrorBoundary.tsx`, `ThemeContext.tsx`, `AppStateContext.tsx` (each starts with `'use client'`), and via them everything interactive (`Sidebar`, `Header`, `TabBar`, `StatsTab`, `VersesTab`…). The interesting boundary is below `surah/[id]/page.tsx`: a **server component renders `<SurahReader surah={...} initialTafsirText={...}>`** — a client component receiving server-computed data as serialized props. That's the idiomatic RSC data flow: the page does the async work (await params, load tafsir, slice text), the client component owns the interactivity. No client component ever directly imports `src/data/tafsir.ts` at module scope — the lazy chunk stays out of the client entry.

### Q27. Why SSG (static generation) rather than `revalidate`/ISR or dynamic rendering?

**A:** The content is **immutable build-time data**: the tafsir corpus changes only when `scripts/extract-tafsir.ts` regenerates `tafsir.ts`, not per-request. So full static generation is optimal: zero server work at request time, cacheable at the CDN, and the entire Quran can be indexed instantly. ISR/`revalidate` would add nothing (no content that changes on a schedule), and dynamic rendering would (a) re-import/parse the 19 MB corpus per request (or warm a cache) and (b) destroy the "0 server cost" property. The one per-request dynamic need — user bookmarks — is client storage + API, not page rendering. A senior should distinguish *page* rendering strategy from *data* rendering strategy: the interactive reading state is never server-rendered.

### Q28. The `surah/[id]` page awaits `loadTafsirData()` at build time. What are the build-time implications?

**A:** Building 114 pages over one ~19 MB module: (1) the module is imported once and memoized in the Node build process (`tafsir-loader.ts:5-13`), so peak memory is one 19 MB parse, shared across all pages; (2) build time is dominated by the parse + 114 × text-slicing — seconds, not minutes; (3) the webpack build still emits the data as a **separate async chunk** so the client can re-use it via `useTafsir`/`useSearch` without re-downloading the whole file; (4) a fresh clone without `src/data/tafsir.ts` (gitignored) makes the build **fail** because SSG literally imports it — a real onboarding trap (Q81). Contrast with the old Vite build, which never touched tafsir.ts at build time (it was lazy-imported at runtime) — App Router moved this 18 MB module into the *build graph*.

### Q29. `WorkstationShell.resolveSurah` falls back to surah 1. Walk through the routing edge cases.

**A:** `resolveSurah(id)` coerces the param and falls back to `SURAHS[0]` (`src/components/WorkstationShell.tsx:12-15`). Edge cases it handles: (1) `/` has no `:id` param → surah 1; (2) `/surah/not-a-number` → surah 1 (the client never 404s even though the server `notFound()` would for a truly bad id — so a malformed client-side push degrades gracefully); (3) `/surah/999` (valid number, nonexistent surah) → surah 1. Meanwhile `onSelectSurah` suppresses redundant navigation (`if (id === selectedSurah.id) return`, `:33`) and closes the mobile overlay first (`:32`). The server-side `notFound()` in the page (`[id]/page.tsx:39`) only fires on *server* visits; client-side, the shell's fallback wins — two layers, deliberately different failure modes.

### Q30. `SurahReader` syncs tab state to the URL with `router.replace`. Why `replace`, not `push`?

**A:** `setActiveTab` builds a `URLSearchParams`, deletes `tab` for overview (clean URLs), and calls `router.replace` (`src/components/SurahReader.tsx:35-41`). `replace` avoids polluting history with every tab switch — back/forward stays meaningful for *surah* navigation (the primary navigational axis), while tabs are a secondary view-state that shouldn't add history entries. It's the same reasoning as `?sort=` in a list UI. The tab is also **validated**: an unknown `?tab=evil` falls back to overview (`:34`), so the search param can't inject an arbitrary tab. Note the outer `<Suspense>` (Q50) is required purely because `useSearchParams` must be under a Suspense boundary in App Router.

### Q31. The tabs still use `React.lazy` inside a client component. Does code-splitting still matter in App Router?

**A:** Yes, layered: the page itself is a RSC boundary (static HTML pre-rendered), but the *interactive* tab payloads are separate client chunks via `lazy(() => import('./OverviewTab'))` etc. (`src/components/SurahReader.tsx:15-18`), each wrapped in `<Suspense fallback={spinner}>` and `AnimatePresence mode="wait"` (`:71-72`). Loading all four tabs eagerly would inflate the hydration payload for a mostly-reader app — only the active tab's chunk hydrates. The big win stack: SSG HTML (immediate paint) → lazy tabs (small JS to hydrate) → lazy tafsir data (19 MB only when needed). Three independent lazy axes, all preserved from the SPA.

### Q32. `ErrorBoundary` is a class component inside the root layout. Explain placement and fallback.

**A:** `ErrorBoundary` (class — React still requires `getDerivedStateFromError`/`componentDidCatch`, no hook form) wraps the app at the root (`src/app/layout.tsx:30-32`). `getDerivedStateFromError` flips state; the fallback (`src/components/ErrorBoundary.tsx:27-50`) is a full-screen Arabic message with `role="alert"`, error details in a `<details>`, and a reload button. Placement nuance: it's on the *server* layout around all children, so it catches renderer errors during SSR hydration too — but a boundary can't catch errors in its *own* rendering, and (as anywhere) it resets the tree but doesn't remount it, so a deterministic error re-throws on retry.

### Q33. `SurahBanner` and `Footer` are `React.memo`-wrapped. Why these two?

**A:** Both are presentational and re-render whenever their parent churns. `SurahBanner` (surah header + Bismillah) re-renders on every tab switch / verse-range change inside `SurahReader` even though its props (the surah) didn't change — `memo` skips that. `Footer` is static — `memo` makes it literally render-once. The noticeable non-memoized hot spot is `TafsirDisplay`, which calls `formatTafsirParagraphs(tafsirText)` in the render body (`src/components/TafsirDisplay.tsx:26`) — every parent re-render re-runs the whole heuristic. `memo`/`useMemo` there (Q89) is the higher-value fix.

### Q34. `Sidebar` derives `filteredSurahs` instead of storing it. Why is that the right React pattern?

**A:** Derived state — compute what you can compute. Storing the filtered list would demand a `useEffect`/synced-update on every filter change, which is exactly where stale-state bugs breed. Deriving per render is O(114) and free; only expensive derivations need `useMemo`. It composes cleanly with the filter flags living in `AppStateContext` (juzFilter/typeFilter/sidebarTab) — the sidebar is a pure function of (surahs, filters). This pre-dates the migration and stays correct; it's a good pattern-recognition probe.

### Q35. `Sidebar` has focus-management and ARIA tab semantics. What a11y problem do they solve?

**A:** The sidebar is a `role="tablist"/"tab"`-semantics surface in an RTL layout: focus must follow the open/close of the mobile overlay and the filter/tab changes, so keyboard + screen-reader users aren't left focused on an invisible trigger. Combined with the explicit `role="tablist"`/`role="tab"` naming and `aria-selected`, the widget is navigable without a mouse. The surah cards expose `id={'surah-card-' + surah.id}` (`src/components/Sidebar.tsx:175`) and the tab bar `id={'tab-' + tab.key}` (`src/components/TabBar.tsx:22`) — ids that double as **stable test hooks** (Q69). RTL (dir="rtl") also means spacing must use `start`/`end` utilities, not `left`/`right` — mixing physical and logical properties is the classic RTL bug.

### Q36. `ThemeContext` is hydration-safe now. Trace the theme flow and why it changed.

**A:** `ThemeProvider` (`src/context/ThemeContext.tsx:16-27`): initial state `isDarkMode = true` (the default), then a mount effect reads `dhilal_theme` and sets `hydrated`, and a second effect persists only after hydration (`if (hydrated) …`). This is the mount-read + hydrated save-guard — identical to `useLocalStorageState`. Why it changed from the old `getInitialTheme()` lazy initializer: in SSR the *server* must render the same HTML as the browser's first client render. A lazy `useState(() => localStorage...)` would read storage on the client's first render but not the server's → mismatch → blank/hydration error. The old SPA had no SSR so it could read storage in the initializer freely. Cost: a possible theme flash after mount (mitigable with an inline "suppressHydrationWarning"-style early paint, but not done here). Accent and palette are the same: default dark, `#F27D26`.

### Q37. `TafsirContent` returns an array (no fragment) with `key={i}`. Is that correct?

**A:** Valid: React accepts arrays; a fragment isn't required. `key={i}` (index) is correct *for static, ordered lists only* — the formatted paragraphs have stable order and are never reordered/inserted/deleted within a surah render, so index keys never misidentify nodes. It becomes a footgun only if the list becomes dynamic (e.g., "load more", splice, client re-sort) — then identity breaks and React mixes DOM state. The reframed question: paragraphs are produced from `formatTafsirParagraphs` per render; memoizing *output* (Q89) matters more than key choice.

### Q38. `SectionSelector` builds ranges dynamically. Why?

**A:** `src/components/SectionSelector.tsx:17-22`: ranges are `['كاملة', '1-50', '51-100', '101-150', '151-200']`, extended with `['201-250', '251-300', \`301-${versesCount}\`]` only when `versesCount > 200`. So long surahs (Al-Baqarah, 286) get more pills; short ones stay tidy. Selecting a range calls `fetchTafsir(selectedSurah, range)` (`:41-44`), which re-slices the shared data client-side — no server round-trip, no page reload in the SPA sense (Q18). Buttons carry `id={'range-btn-' + range}` (`:40`) for tests. The ranges are UI affordances over the real data structure (verse spans in `Surah.endVerse`), not artificial.

### Q39. `QuickSearch` offers 10 preset Arabic topics. How do they feed into search?

**A:** Clicking a preset sets the search query and triggers `handleSearch` (same path as free-text). The presets are curated Arabic entry points (justice, mercy, …) for users who can't phrase a query — a UX affordance, not a separate search mode. They're hardcoded in `QuickSearch.tsx`; a data-driven list (config array) would make them editable without a code change. The `useCallback` on the submit handler (`ChatTab`) keeps the handler identity stable so `SurahReader`'s per-render context work doesn't recreate internals — a micro-optimization that matters since `AppStateContext` re-renders all consumers on any state change (Q17).

### Q40. `AnimatePresence mode="wait"` wraps the tab content. What's the trade-off?

**A:** `mode="wait"` (**`src/components/SurahReader.tsx:72`**) means the exiting tab completes its exit animation *before* the entering tab mounts — no overlap, no double-DOM, clean layout. Cost: a dead beat between tab switches (exit→enter) and the exit animation delays the *next* interactive content slightly. Benefit: the tab-change motion is legible (fade/slide via `motion.div` with `initial/animate/exit`) and it composes with the `Suspense` fallback: on first visit to a lazy tab chunk, the spinner shows, then the tab mounts and animates in. For a reader, subtle motion aids context; `mode="wait"` over `sync` is chosen to avoid layout thrash in the RTL column layout.

### Q41. `getSupabase()` is a lazy singleton that throws on missing env. Walk through its role in Route Handlers.

**A:** `src/lib/supabase.ts:5-17`: first call creates and caches the client; missing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` → `throw new Error('Missing … env vars')`. Throwing is fail-fast: every sync endpoint needs Supabase, so a null client would just 500 cryptically per request. Because Route Handlers are **per-request** (and on Vercel, possibly cold-started per instance), a module-level `let client` is cached for the server's lifetime — a singleton per process/function instance, not per request. The throw surfaces on the *first request*, not at import time, so the API is up (`/api/health` works) while data routes fail loudly — an intentional separation.

### Q42. The Route Handlers use a "send response + return null sentinel" device-id check. Critique it.

**A:** `getDeviceId(req)` returns `req.headers.get('x-device-id')`; each handler checks `if (!deviceId) return NextResponse.json({…400})` (`src/app/api/user-data/route.ts:8-12`). The pattern was inherited from the Express code (which had the same shape). Critique for a senior: the check is repeated in all five handlers (GET/PUT/export/import) — a **middleware/branch** (`withDeviceId(handler)`) would DRY it; and a missing header is arguably a *precondition failure* (422/400) but the cryptographic weakness (any uuid passes) is the deeper issue (Q7). Also note GET's create-if-missing behavior inserts a row on first contact (`:25-29`) — a deliberate "boot on server" choice that the SPA's Express server also made.

### Q43. How do `sitemap.ts` and `robots.ts` work, and what URLs do they produce?

**A:** `src/app/sitemap.ts:6-23` returns `/` (priority 1, weekly) plus one entry per surah (`/surah/{id}`, priority 0.8, monthly) — **115 URLs** total. `src/app/robots.ts:5-13` allows all crawlers and points to `${SITE_URL}/sitemap.xml`. Both derive `SITE_URL` from `process.env.SITE_URL || 'https://fi-dhilal-al-quran.vercel.app'`. App Router serves them at `.xml`/`.txt` automatically — no route handlers, no hand-maintained files. This is the direct SEO win that justified the migration (the SPA had none of it): each surah is individually crawlable and the sitemap is generated from the same `SURAHS` data.

### Q44. The sync engine debounces (1.5s) and retries with exponential backoff. Decode the strategy.

**A:** `src/utils/syncBackend.ts`: (1) **1.5s debounce** (`SYNC_DEBOUNCE_MS = 1500`, `:4`, `:69-77`) — 5 rapid bookmark adds sync once; (2) **3 attempts, exponential backoff** (`MAX_RETRIES = 3`, `Math.pow(2, attempt) * 1000` — wait 1s, 2s — `:9-37`); (3) **`inFlight` serialization** (`:55-76`) — never start a second sync while one is running; queue behind it; (4) **`dhilal_sync_pending` flag** (`:6`, `:65`) — localStorage marker that unsynced changes exist, exposed to UI via `useDataSync.syncPending` and `initFromServer` pulls the server's truth on boot (`:80-96`). The strategy is unchanged from the SPA (it was never server-stack-specific) and remains robust for flaky networks; the missing piece is still conflict resolution (Q9).

### Q45. `AppStateProvider` lives in a server layout but is a client provider. How does that work?

**A:** The `(reader)/layout.tsx` is a **server component** that renders `<AppStateProvider><WorkstationShell>{children}</WorkstationShell></AppStateProvider>` (`src/app/(reader)/layout.tsx:4-10`) — both client components. Children arrive as a **server component payload slot** passed through `{children}`: `SurahReader` (client) receives `children`-less props from the server page; the layout stack (provider → shell → page) forms one client React tree with a server-rendered page. Key mechanism: `{children}` from a server layout is pre-rendered server JSX — it does **not** re-render when the provider re-renders (the slot is reference-stable), so `AppStateContext` value churn doesn't cascade into the page. It's the canonical "client provider + server children" pattern; the old SPA had no such boundary to reason about.

### Q46. Data fetching: RSC resolves tafsir at build, but `useChat`/`useTafsir` still use async-fetch-then-state. Would React 19 `use(promise)` + Suspense be better?

**A:** The RSC layer *is* using declarative async (the page `await`s `loadTafsirData()` directly — the server analogue of `use(promise)`). Client-side, `useChat.handleSearch` uses async/await + `useState` (`src/hooks/useChat.ts:15-24`) — the pre-Suspense pattern with manual `searching` flag. React 19's `use(promise)` could replace it: `use(loadTafsirData())` in a Suspense-bounded component would give declarative loading/error UI and dedupe the singleton. But `use` can't be called conditionally and works best with a cache boundary (which `tafsir-loader`'s singleton promise effectively is — `tafsir-loader.ts:5-13`). Judgment call: the current pattern is fine, identical semantics, slightly more boilerplate; a senior should be able to articulate *why* the singleton-promise loader is already the hard part and `use()` is the sugar.

### Q47. Search runs synchronously on the main thread. What's the perf concern?

**A:** `searchTafsir` (`src/utils/search.ts:16-58`) is a synchronous full scan over ~19 MB of text — a nested loop over 110 surahs' sections, `includes()` per query word per section, capped at 50 results (`:57`). Running it on the main thread after `loadTafsirData()` resolves blocks the UI for the scan duration (hundreds of ms to seconds for a common term like "الله"). The cap bounds the *result set*, not the *scan cost*. Fix: a **Web Worker** (`new Worker(new URL('./search.worker.ts', import.meta.url))` just as Vite/Next support) receiving the query, importing the same singleton data chunk, posting results — main thread stays responsive; the worker chunk itself is what would be cached alongside the data (Q79). The search logic is already pure (`searchTafsir(query, data, nameMap)`) — trivially worker-movable, which is the design signal to look for.

### Q48. `highlightText` uses an `exec` loop with adjacent-match coalescing. What's the edge case?

**A:** `src/utils/highlight.ts` regex-escapes the search term, loops `regex.exec()`, and coalesces adjacent matches so "الله الله" renders as one span, not two abutting ones. Edge cases: (1) **zero-length matches** — a term that can match empty (e.g., a bare alternation) risks an infinite loop unless `lastIndex` is advanced explicitly; (2) **overlapping matches** — `exec` with a global regex never overlaps; that's fine here (adjacent, not overlapping, is the DOM-correctness goal); (3) long strings and many matches → per-keypress cost growing with result count. The same utility renders search excerpts, so it runs on user input — the escape step is the security-critical part (un-escaped `(` or `.` silently mis-matches or throws).

### Q49. Why `motion` and not `framer-motion`? Any App Router nuance?

**A:** Framer Motion rebranded; the package is now `motion` with the React entry `'motion/react'` — imports like `import { motion, AnimatePresence } from 'motion/react'` (`src/components/SurahReader.tsx:5`). `framer-motion` is the legacy name. One App Router nuance: animation libraries that read `window`/`document` at module scope (implying DOM) can't be imported into server components — but `SurahReader` is `'use client'`, so the boundary is already correct. Another: `AnimatePresence` with `mode="wait"` around Suspense-wrapped lazy tabs composes fine, but animations *during* hydration (`isHydrated`-gate if you ever animate first paint) are a classic SSR pitfall — not used here because the page is static and the reader mounts post-hydration.

### Q50. `reactStrictMode: true` is set in `next.config.ts`. What does StrictMode surface here?

**A:** StrictMode double-invokes effects, render functions, and updaters **in dev only** (`next.config.ts:36`). In this codebase it would surface: (1) the `useDataSync` unreachable-cleanup bug (Q19) — double mount means two subscription registrations that *appear* to work in dev but leak in prod; (2) effect-dep sloppiness in any `useEffect` that mutates state derived from itself; (3) impure render functions in `formatTafsirParagraphs` if they ever mutate cached input (they don't). Practically, running `next dev` with StrictMode and fixing what it reports is high-value hygiene; the sync hook is the known offender.

---

## Round 3: TypeScript, Data, Backend & Build Pipeline (25 questions)

### Q51. `TafsirSection` is declared in 3 places. Is that still true after the migration?

**A:** Yes — `src/types.ts:29`, `src/utils/tafsir-data.ts:1`, and the generator's emitted `tafsir.ts` header (`scripts/extract-tafsir.ts:111` emits `export interface TafsirSection`, though `:113-114` imports the canonical type from `'../types'` for the `Record`). Three declarations can drift; the generated file *both* re-emits the type *and* imports the canonical one — redundant and confusing. Fix: declare once in `src/types.ts`, have the generator import it (it already imports `../types` next door), and delete the `tafsir-data.ts` copy. Single source of truth for the type that the ~19 MB file, the loader, and the UI all share.

### Q52. The generator's regex recognizes section headers. Decode it.

**A:** `scripts/extract-tafsir.ts` matches the `[سورة NAME (ID): الآيات START إلى END]` header convention from the `.doc`-extracted text — capturing surah name, id, verse-start, verse-end. The regex is the **contract with the source format**: any upstream change (bracket style, spacing, `إلى` vs `-`) silently produces zero matches. A defensive generator logs "matched N sections" and fails on implausibly low counts. Since the extraction is the entire content pipeline, a silent drop would ship missing tafsir without breaking the build — exactly the failure mode a flaky regex invites.

### Q53. The generator shells out to `catdoc`. What's the dependency risk?

**A:** `catdoc -d utf-8` decodes binary `.doc` files. Risks: (1) **external system tool** (not npm, `apt install catdoc`) — fresh clones/CI without it can't regenerate tafsir; (2) version drift changes output; (3) `.docx` (modern Word) isn't supported — needs `pandoc`/`mammoth`; (4) non-reproducible builds without pinning the version. And it matters more than before: because SSG **imports `tafsir.ts` at build time**, a fresh clone with neither the gitignored data nor catdoc gets a *build failure* (Q81), not just an empty feature. Mitigations: commit a generated JSON source, pin/containerize catdoc, or migrate to a Node-native parser.

### Q54. The generator dedupes by `surahId + verse range`. What's the edge case?

**A:** Sections are keyed `surahId + range`; a repeat is dropped. Edge cases: (1) overlapping ranges (1-20 and 15-30) aren't duplicates → both kept (correct if the source really has both); (2) two sections, same range, *different text* (a real correction) → the second silently overwrites the first, data loss without log; (3) near-duplicates (1-20 vs 1-21) pass through. A robust dedupe hashes the text and flags suspicious collisions for review. The output feeds the same 19 MB corpus the SSG bakes — a silent dedupe bug becomes a *silent content* bug.

### Q55. `loadTafsirData` is a singleton-promise with reset-on-error. Why reset?

**A:** `src/data/tafsir-loader.ts:5-13`: the promise is memoized; `.catch` nulls the memo before rethrowing. Without the reset, a transient failure (network fetch of the ~19 MB chunk flopping) would cache the rejection forever — the user could never retry without a full reload. With it, every subsequent `loadTafsirData()` call re-attempts the import. Trade-off: a *deterministic* failure (corrupt chunk) retries on each call — acceptable; the UI shows the tafsir's graceful state (blank range/surah) and the user reloads. Note this same loader runs at **build time** for SSG: a build-time failure is an un-retriable build error, while a runtime failure is retriable — one loader, two failure modes.

### Q56. `TAFSIR_DATA` is a `Record<number, TafsirSection[]>` keyed by surah id. Why not an array?

**A:** O(1) id lookup (`TAFSIR_DATA[2]` → Al-Baqarah's sections) vs array `.find()`; plain-object Record is JSON-serializable and importable as a data module; it's sparse by design (110 of 114 keys, missing surahs absent). `SURAHS_WITH_TAFSIR` (`src/data/tafsir-meta.ts:2`) answers "does this id have content?" cheaply without touching the big object — the metadata/file split lets the tiny Set load at boot while the content stays lazy (Q74). A `Map` would be equally correct; the Record mirrors the generated `export const TAFSIR_DATA = {…}` shape and keeps the data file conceptually simple.

### Q57. `searchTafsir` caps results at 50. What's the UX implication?

**A:** `src/utils/search.ts:57` — `sort((a,b)=>b.score-a.score).slice(0, 50)`. The cap bounds DOM work and scan-time cost (a term like "الله" would otherwise match hundreds of sections). UX cost: common terms silently truncate; there's no "show more" pagination, so relevant results beyond 50 are invisible. A search for a single common word is effectively "top 50 by score," and the scorer is crude (count of query words present in the section). Improvements: pagination/load-more, a rank that favors section position or verse-level matches, or an aggregator view (group by surah). The cap is defensible; the absence of any "50 of N matches" indicator is the real gap.

### Q58. The scripts now run through Next — walk through `package.json`.

**A:** `dev: next dev --webpack`, `build: next build --webpack`, `start: next start`, `clean: rm -rf .next`, `lint: tsc --noEmit`, `test: vitest run`, `test:watch: vitest` (`package.json:6-14`). Two things a senior should interrogate: (1) `lint` is `tsc --noEmit` — a *type check*, not ESLint (deliberate: type errors are the real gate here; no ESLint config exists); (2) `--webpack` on dev/build — **required, not optional**: `@serwist/next` emits `public/sw.js` through the webpack build hook; Turbopack bypasses the hook and the SW is never generated. Anyone "helpfully" removing `--webpack` silently drops the PWA. Node 24 + pnpm; `.next/` and `public/sw.js` are gitignored.

### Q59. Why `--webpack`, specifically? What does `@serwist/next` actually do?

**A:** `withSerwistInit({ swSrc: 'src/app/sw.ts', swDest: 'public/sw.js', cacheOnNavigation: true, disable: NODE_ENV !== 'production' })` (`next.config.ts:4-9`) wraps the Next config; during **webpack** compilation it (a) type-checks/compiles `src/app/sw.ts` and (b) injects the precache manifest (the `__SW_MANIFEST` from `serwist` typings — `src/app/sw.ts:13-14`). Turbopack, Next 16's default bundler, has no equivalent inject-manifest hook — so the build silently produces no SW. Hence `--webpack` is a hard requirement, documented but easy to regress. A senior should note this couples the app to webpack *only for the PWA*, and that Turbopack→Serwist support (or a separate SW build step) is the eventual decoupling.

### Q60. What does `next build` produce, and where does the 19 MB tafsir end up?

**A:** `.next/` containing: 115 statically-generated pages (114 surah + `/`) with full Arabic prose in HTML, the RSC client chunks, and the tafsir data as a **separate lazy-loaded async chunk** (~19 MB, webpack chunked by the dynamic import in `tafsir-loader.ts`). Plus `public/sw.js` (SW, emitted by Serwist via webpack) and the manifest/sitemap/robots from metadata files. Because the tafsir module participates in the build graph (SSG imports it), it can't be the pre-migration "runtime-only" file — it's a first-class build input *and* a lazy client chunk. Build memory is dominated by that one parse; a low-memory CI can OOM — worth knowing (Q28).

### Q61. The client has no Supabase SDK — only Route Handlers use it. Why this split?

**A:** `@supabase/supabase-js` is imported only in `src/lib/supabase.ts`, which is imported only by Route Handlers (server code — bundled into the server build, never the client bundle). Reasons: the `service_role` key is admin-level and must never reach the browser; Route Handlers are the single seam (the old Express server played this role); the browser sends only the forgeable `X-Device-Id`. The moment real auth + RLS land (Q24), the client SDK with the anon key becomes viable and the handlers can thin out — but today, no client Supabase dependency means one less supply-chain and bundle surface. Verify: grep for `@supabase` outside `src/lib` — it should appear nowhere client-side.

### Q62. `SURAHS` (114) and `JUZ_INDEX` are hand-written in `surahs.ts`. Why hand-written vs derived?

**A:** `src/data/surahs.ts` is canonical reference data — the Quran's fixed structure (names, verse counts, Meccan/Medinan, juz) plus curated `thematicPoints` — so hand-writing (once) beats deriving, and it's stable across builds. The tafsir by contrast *is* generated (source-driven, regenerated). The data is imported by server components (SSG, sitemap, metadata), client components (sidebar, WorkstationShell `resolveSurah`), and search (the `surahNameMap`, `src/hooks/useChat.ts:6-7`) — a single canonical source with schema-loose spot-checked content. A Zod/assertion pass ("114 entries, ids 1-114, verse counts match") would convert trust into a test; `surahs.ts` has no runtime validation today.

### Q63. `getDeviceId` uses `crypto.randomUUID()`. Any browser-support / SSR nuance?

**A:** `crypto.randomUUID()` requires a **secure context** (HTTPS or localhost) — a plain-HTTP host throws. Production is HTTPS (PWA requirement), and `getDeviceId()` is called from `syncBackend`, which itself is SSR-guarded via `localStorageBackend` (`src/utils/localStorage.ts:3-13`) — during SSR the storage calls return null and no UUID is minted, so there's no server/client UUID mismatch. The leftover risk is a non-HTTPS self-host or a very old engine (Safari <15.4). A `crypto.getRandomValues`-based fallback (or `Date.now() + Math.random()`) would harden non-secure contexts; note a genuinely robust device id would use a stored entropy value, not a fresh UUID on every wipe.

### Q64. The Supabase client uses the **service_role** key, never the anon key. Walk through the implication.

**A:** `src/lib/supabase.ts:15` — `createClient(supabaseUrl, supabaseKey)` with `SUPABASE_SERVICE_ROLE_KEY`. service_role bypasses RLS (moot, since RLS isn't enabled — Q8) and has **admin access to the whole project** (all tables, auth, storage). Server-only usage is the whole defense: if the key appears in the client bundle or a repo leak, it's total project compromise. The anon key (browser-safe, RLS-enforced) is unused precisely because there's no RLS to enforce. Bridging: with real auth (Q24) the anon key + RLS become the correct client path and service_role stays server-side only for privileged ops (or is removed entirely). This is a "defense resting on one secret" architecture — name the single point of failure.

### Q65. The app needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` at runtime. How are they provisioned?

**A:** `.env.local` locally (gitignored via `.env*`); on Vercel, project env vars. The *requirement* is enforced at first Route Handler use: `getSupabase()` throws a clear message (Q41). Two sharp edges: (1) **`.env.example` is itself gitignored** (`.gitignore` lists `.env.example` explicitly → even the template isn't shared) and only documents `PORT` — stale from the Express era; a fresh dev runs `next dev` with no Supabase env and only discovers the throw on the first `/api/user-data` call; (2) on Vercel, SSG **doesn't** need the env (tafsir is local), but the API does — so the build succeeds and the routes 500 until env is set, the classic "builds locally, dies in prod" symptom (Q77).

### Q66. `vitest.config.ts` uses jsdom + a setup file. What does the setup do?

**A:** `vitest.config.ts:5-14`: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']` (imports `@testing-library/jest-dom/vitest` for matchers), `globals: true`, `@vitejs/plugin-react` for JSX/TSX transform, and `alias: { '@': … }` mirroring tsconfig. Tests are **colocated** (`*.test.ts(x)` next to source). Note the irony: vitest config is *Vite-shaped*, so the test stack survived the Express→Next migration unchanged. A senior caveat: jsdom is not a browser — component tests can't assert real layout/PWA behavior, and Web Worker / service-worker code paths simply don't exist in that env.

### Q67. The suite has 117 `it()` tests across 13 files. What does it cover, and what's *not* tested?

**A:** Covered: pure functions (`tafsir-format`, `search`, `highlight`, `localStorage`, `tafsir-data`), `syncBackend` (debounce/retry/pending logic), `useLocalStorageState`, and two **new router-mocked component suites** — `WorkstationShell.test.tsx` (4 tests) and `SurahReader.test.tsx` (3 tests) — that `vi.mock('next/navigation')` (`WorkstationShell.test.tsx:9-19`, `SurahReader.test.tsx:13-23`), query the DOM by the explicit test hooks (`id="surah-card-{id}"`, `id="tab-{key}"`), and use `fireEvent`/`userEvent` (`SurahReader.test.tsx:83-88` asserts `replace` was called with `'?tab=verses'`). **Not tested:** the five API Route Handlers (no integration tests — the sync contract has zero coverage), `scripts/extract-tafsir.ts` (the content pipeline's only gate), the SW/precache config, theme behavior under isDarkMode toggling, and no e2e (Playwright/Cypress). The generator + API being untested is the notable gap given Q52-54.

### Q68. How do the next/navigation mocks work, and what's their limitation?

**A:** Each test file rebuilds `useRouter`/`useParams`/`useSearchParams` as `vi.fn()`-backed stubs (`WorkstationShell.test.tsx:9-19`), then asserts on the fns (`push` called with `/surah/1`). `SurahReader.test.tsx` goes further with a **mutable searchParams** (`currentSearch` re-set in `beforeEach`, `:11`, `:66-71`) so it can test `?tab=chat` and `?tab=overview` renders. Limitation: these mock *the hooks*, so the tests validate component logic (what the component does with router/search API), not Next's actual routing or search-param plumbing — a real integration suite would render through `next/link` + memory router or e2e. Trade-off accepted: fast, deterministic, and covers the tab/URL contract the company actually cares about.

### Q69. `useLocalStorageState` is now unit-tested. What does the test assert?

**A:** `src/hooks/useLocalStorageState.test.ts` covers the hydration contract: initial render yields the default (no storage read), the mount effect hydrates from storage, and the save-guard writes back only after hydration. This test exists specifically because SSR/hydration is the sharp edge the migration introduced (Q16) — it pins the behavior that prevents hydration mismatches and documents *why* the double-`useEffect` shape exists. A senior note: with jsdom, "SSR" is simulated as storage being absent/empty — the *server* half of the mismatch isn't truly exercised; a hydration e2e would be the real proof.

### Q70. `docs/TESTING.md` claimed localStorage `remove`/`clear` and conflict-resolution tests in the old stack. What's the state now?

**A:** The claims were drift then and remain drift: `localStorageBackend` exposes only `get/set/onChange` (`src/utils/localStorage.ts:7-25`) and `syncBackend` is last-write-wins (Q9) — no merge code, no union. Worth restating because the migration *didn't* touch this: the "conflict-resolution tests" claim never matched the code, and documentation rot survives framework migrations unchanged. The general senior point (Q97, Q105): docs that describe *features* rather than *verified facts* must be audited, not inherited.

### Q71. `tsconfig.json` has `target: ES2022`, `moduleResolution: bundler`, plus `@serwist/next/typings`. Walk through the relevant bits.

**A:** `tsconfig.json`: `target ES2022`, `module ESNext`, `moduleResolution bundler`, `isolatedModules`, `noEmit`, `jsx react-jsx`, `strict`, paths `@/* → ./*` (`tsconfig.json:3-36`), and `types: ['node', '@serwist/next/typings']` (`:27-30`) which brings the SW global types (`__SW_MANIFEST`, `WorkerGlobalScope` — `src/app/sw.ts:5-11`). `isolatedModules` is what makes each file transpile independently — which is why the `import type` discipline in `tafsir-loader.ts` (`:1`) and the singular `export type` in `useChat.ts:42` exist. Because `lint` is `tsc --noEmit` (Q58), breaking one type anywhere fails the "lint"; the `allowImportingTsExtensions: true` reflects `tsx`-style execution of the generator script.

### Q72. `pnpm-workspace.yaml` allow-lists native build deps. Why, and what's in the list now?

**A:** `onlyBuiltDependencies` permits postinstall build scripts pnpm blocks by default (`esbuild` needs its binary; `@vitejs/plugin-react` pulls esbuild — the vitest stack still uses it). This mirrors the pre-migration list minus the server-side ones. It matters because the **test toolchain depends on esbuild's native binary**, and a fresh install without it fails at `vitest run` with a cryptic module error. A senior hydration note: the list is a marker of *which* toolchains still lean on native binaries; Next 16 itself is bundler-neutral here, but dev tooling (vitest) drags Vite/esbuild in regardless.

### Q73. The generator emits both `tafsir.ts` and `tafsir-meta.ts`. Why two outputs?

**A:** `scripts/extract-tafsir.ts:111-114` emits `TAFSIR_DATA` (~19 MB) and `:130` emits `SURAHS_WITH_TAFSIR` (the 110-id Set). Splitting: the meta is tiny and imported at boot everywhere (`useTafsir.hasTafsir`, the no-tafsir checks), while the content is ~19 MB and lazy. One file would force every import of the meta to drag the content. The split survived the migration verbatim because it's about *client-side* data plumbing (import-time cost), orthogonal to the server. The column-count: `tafsir-meta.ts:2` shows ids ascending with the four gaps (44, 50, 76, 89) — a quick visual verification that the Set and Q20 agree.

### Q74. The generated `tafsir.ts` re-exports its own `TafsirSection` interface alongside the imported one (Q51). Why is that a code-smell specific to this pipeline?

**A:** The generator emits both `export interface TafsirSection {…}` (`extract-tafsir.ts:111`) *and* `import type { TafsirSection } from '../types'` (`:113`) — a self-duplication: generated code declares a type that hand-written code also owns. If they ever diverge, the *generated* one wins for the emitted module while `tafsir-data.ts`'s copy is used by the slice functions — and `tsc` may not catch the mismatch if the shapes remain assignable-but-wrong. The clean fix: the generator imports the canonical type only (it's adjacent already) and drops the local interface. Same root fix as Q51: one definition, everywhere.

### Q75. How would you add input validation to the `/api/user-data` PUT Route Handler?

**A:** Today PUT trusts the body shape — `bookmarks?: unknown[]; history?: unknown[]; completed?: number[]; theme?: string`, defaults applied (`src/app/api/user-data/route.ts:50-57`). Add Zod: `const schema = z.object({ bookmarks: z.array(z.any()).max(1000), history: z.array(...).max(...), completed: z.array(z.number().int().min(1).max(114)), theme: z.enum(['dark','light']) })`; `safeParse` → 400 on failure. This prevents malformed/oversized payloads reaching the upsert and — since the device id is forgeable (Q7) — is the actual authorization proxy. Bonus: a `Content-Length`/body-size cap (Route Handlers can check `request.headers.get('content-length')`) against payload DoS, and reusing the same schema on the *client* import path (Q94) so export/import round-trips validated shapes both ways.

---

## Round 4: Problem-Solving, Debugging & System Evolution (25 questions)

### Q76. A user's bookmarks disappear after switching devices. Diagnose the sync.

**A:** Last-write-wins (Q9). Device A syncs its bookmarks; device B boots and `initFromServer()` **overwrites** B's localStorage with the server row (`src/utils/syncBackend.ts:80-96`); B's offline-added bookmarks are gone. Same with two devices syncing near-simultaneously — last PUT wins the whole row. Diagnose: check the server row's `updated_at` vs each device's `dhilal_sync_pending` marker; look for a PUT you didn't expect from a second device. Fix: at minimum a union-merge for bookmarks (additive), per-item rather than per-row reconciliation; properly, an LWW-element-set CRDT (Q102). Note the UI reports sync only via `syncPending` — it can't tell the user "device B just erased 12 bookmarks," which is itself a UX gap worth mentioning.

### Q77. The app builds fine locally but `/api/user-data` 500s in production. Diagnose.

**A:** Three classic causes, all still live post-migration: (1) **env vars not set on Vercel** — `getSupabase()` throws `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` and the handler 500s (`src/lib/supabase.ts:11-13`); local `.env.local` masks this (Q65); (2) a **CSP/connect-src block** — `connect-src 'self'` (`next.config.ts:20`) means any call to a non-self origin fails in the browser while curl works (doesn't apply here since API is same-origin, but worth checking if a future external origin is added); (3) **body parsing** — a `Content-Type` mismatch makes `req.json()` throw and the handler 400, which clients may misreport. Debug path: Vercel function logs → check env → `GET /api/health` (always works — no Supabase) vs a data route → confirm which layer dies. The unified Route Handler means there's exactly *one* implementation to debug — the old two-backend app had two to diff (that divergence risk is gone).

### Q78. The ~19 MB tafsir chunk fails to load on a slow connection. What happens, and how do you recover?

**A:** Runtime: `loadTafsirData()`'s `import('./tafsir')` rejects → the promise is reset (`tafsir-loader.ts:8-11`) → the UI's tafsir text stays `null` and shows the graceful empty/no-content state; the user can re-trigger (range click, search) to retry the import. Build-time it would be a *build failure* instead (Q28). For genuinely slow networks the 19 MB all-or-nothing chunk is a barrier: options — per-surah chunks (~tens of KB each, Q101), progressive background download after first paint, an explicit "download for offline," or a compressed/streamed data format. The PWA's NetworkFirst will cache the chunk after first success, so a patient first visit becomes instant offline later — but the first visit is the cliff.

### Q79. Search for "الله" janks the UI. How do you fix it?

**A:** `searchTafsir` scans ~19 MB synchronously on the main thread (Q47). Fix: move it to a **Web Worker** — the worker imports the same `tafsir.ts` singleton and `search.ts`, receives `{query, nameMap}` via `postMessage`, runs the scan, replies with results. The main thread never blocks, the data chunk is fetched into the worker's cache/context, and the existing `searching` state still drives the spinner. Next.js supports workers via `new Worker(new URL('./search.worker.ts', import.meta.url))`. The `searchTafsir(query, data, nameMap)` signature is pure, so the worker needs no DOM glue. Highest-impact search fix in the app; capped results (Q57) bound the reply size, not the scan.

### Q80. How would you deep-link to a specific verse range (`/surah/2?tab=verses&range=51-100`)?

**A:** The tab part already exists (`?tab=verses` is pushed by chat result navigation — `SurahReader.tsx:51-53`). Extend the same mechanism to a `range` param: read `searchParams.get('range')`, validate against `SectionSelector`'s allowed ranges, and seed `verseRangeValue` + run `fetchTafsir(surah, range)` on mount; `setVerseRangeValue` writes the param back via `router.replace` (Q30 gives precedent). Clean URL, shareable, refresh-safe — all properties the SPA's `history.pushState` idea tried to bolt on manually; App Router gives them for free. The remaining asymmetry: server-side `generateMetadata` can't know the range (it'd need the param at build time — impossible for static), so OG previews stay surah-level (Q95).

### Q81. A fresh clone runs `pnpm build` and it fails with "Cannot find module './tafsir'". Explain.

**A:** `src/data/tafsir.ts` is gitignored (generated — `.gitignore: src/data/tafsir.ts`). **SSG imports it at build time**, so `next build` on a clone without the data fails — this is a *behavior change from the Vite stack*, where build succeeded and the app merely lacked content at runtime. The data is regenerable from the gitignored `.doc` sources via `scripts/extract-tafsir.ts` (needs `catdoc`, system tool — Q53). Onboarding must either (a) run extraction first, (b) share a pre-generated data artifact, or (c) commit the data (heavy but 19 MB of text is manageable for some teams). This is the #1 onboarding trap post-migration; a senior should flag that the build graph *assumes* a gitignored file exists.

### Q82. How would you enable RLS without breaking the anonymous device-id model?

**A:** The honest answer hasn't changed: **RLS policies are keyed on `auth.uid()`**, and this app's identity is an HTTP header, not a JWT — so RLS is only meaningful with real auth. Options: (1) add Supabase Auth and key on `user_id` (Q24, Q104) — the real fix; (2) pass `device_id` into Postgres via a function/`SET LOCAL` and write a device-keyed policy — hacky, and the *client* would need to control that value, which it can already forge (Q7); (3) keep server-side service_role + handler-level checks as the access control and treat RLS as unavailable theater until auth exists. The Route Handlers already centralize these checks; the senior answer is "don't fake RLS — plan the auth migration."

### Q83. The `useDataSync` cleanup bug (Q19) leaks listeners. Fix it properly.

**A:** Restructure the effect so React owns the cleanup:
```
useEffect(() => {
  let cancelled = false;
  const unsubLocal = localStorageBackend.onChange(...);
  const unsubSync = syncBackend.onChange(...);
  (async () => { await syncBackend.initFromServer(); if (cancelled) return; ... })();
  return () => { cancelled = true; unsubLocal(); unsubSync(); };
}, []);
```
The key moves: register subscriptions **synchronously**, do the async work in an inner task guarded by the `cancelled` flag, and return the cleanup **from the effect**, not from the IIFE. This kills both the leak and the post-unmount setState hazard. (The existing `cancelled` flag in `src/hooks/useDataSync.ts:9` already prevents the setState-after-unmount; the missing piece is the effect-level return.)

### Q84. The verse-coloring logic uses guillemets `«…»` + trailing `(digit)` segments. What's the fragility?

**A:** `splitVerseSegments` (`src/utils/tafsir-format.ts:6-35`) recognizes verses as either `«…»`-wrapped spans or text ending `(digit)`. Fragilities: (1) source quote variance (`"…"`, no quotes) silently breaks detection; (2) a verse spanning the guillemet boundary splits wrong; (3) `(digit)` must immediately follow the verse — stray whitespace kills it; (4) non-verse `«…»` (rare in this corpus) false-positives. After the migration, the same heuristic feeds both the SSG HTML and the client render — the *server-rendered* view uses the same `formatTafsirParagraphs`/verse segmentation indirectly, so a heuristic change alters SEO-markup and interactive markup in lockstep. A robust version cross-references a known verse corpus; the heuristic is "good enough" for highlighting but not authoritative.

### Q85. How would you add an AI "ask about this surah" feature?

**A:** The `chat` tab today is tafsir search (`useChat`), not an AI. To make it an ask-the-surah assistant: (1) a new Route Handler `POST /api/ask` receiving `{surahId, question, context}`; (2) server-side LLM call (the old stack had a vestigial `@google/genai` dep hinting at Gemini) that receives the relevant sliced tafsir text as grounding (RAG over the *local* corpus — keeps answers anchored, no invented fatwas); (3) stream back via SSE/`ReadableStream` (Route Handlers support streaming responses — an App Router advantage over the old Express+fetch designs); (4) client renders markdown + citation chips linking to `/surah/{id}?tab=verses`. Considerations: API key **server-side only** (Same key discipline as Supabase service_role — Q64), cost/rate limits, and Arabic prompt engineering. A senior should flag trust boundaries: the model must be *reviewed* content, never a substitute for the scholar's text.

### Q86. How would you add a "continue reading" / last-position feature?

**A:** `dhilal_history` already stores visited surahs; extend entries with `{surahId, range, scrollY}`. On navigating to a surah, after the reader mounts and (if lazy) the tafsir resolves, restore `verseRangeValue` + `scrollTo`. The hydration-safe pattern (Q16) is the template: read position in a mount effect, write on scroll (throttled). Two Next-specific wrinkles: (1) SSG HTML paints before any JS runs, so restoring scroll must happen *after* hydration/layout — defer to `requestAnimationFrame`/`useEffect`; (2) the sidebar navigation resets tab (Q3), so "continue" needs the `?tab=`+`range` URL params (Q80) to survive a surah hop, or the state must live in `AppStateContext` across the soft navigation. `StatsTab` could then offer "متابعة القراءة: سورة 2، الآيات 51-100" as an actionable row.

### Q87. `.env.example` is gitignored and stale. Fix onboarding.

**A:** Un-ignore it (`.gitignore` explicitly lists `.env.example` — the template should be committed) and update it to the **new runtime reality**: the API needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (the old file only mentioned `PORT`, an Express leftover that's now meaningless since Next runs the server). Keep `.env.local` ignored (real secrets). With the migration, a new dev's first failure is `next build` (missing tafsir.ts, Q81) or the sync 500s (missing env, Q77) — so onboarding docs must sequence: install deps → extract-or-fetch tafsir data → copy `.env.example` → set Supabase env → `pnpm dev --webpack`. Document the *required* vars in the committed example with placeholders.

### Q88. The old app had two hand-synced backends. How was unification achieved, and what would you still improve?

**A:** Two problems were solved in one move: (1) the Express `server.ts` and Vercel serverless `api/index.ts` **duplication** (route changes had to land in both) and (2) the `vercel.json` route gymnastics. Route Handlers (`src/app/api/*/route.ts`) are the single implementation, served identically by `next dev`, `next start`, and Vercel's serverless auto-detection. Remaining improvement: the handlers still duplicate logic *between themselves* — `getDeviceId`, the JSON-body parse, and the error-wrapping repeat across GET/PUT/export/import (Q42). A senior refactor: extract `withDeviceId(handler)` and a shared `upsertUserData(deviceId, body)` service function that the four routes call — thin adapters over one data module, which is the framework-agnostic "ports & adapters" shape the old Q88 proposed but never implemented.

### Q89. `TafsirDisplay` calls `formatTafsirParagraphs` every render. Memoize it.

**A:** `src/components/TafsirDisplay.tsx:26` invokes the heuristic in the render body. Fix: `const paragraphs = useMemo(() => formatTafsirParagraphs(tafsirText), [tafsirText]);` so the regex-heavy pass runs only when the text actually changes (surah/range switch), not on every theme toggle, scroll-driven re-render of ancestors, or AppStateContext churn. Same for `splitVerseSegments` if it feeds a component that re-renders often (it runs inside `TafsirContent` per render — verify and memoize or lift). This is the value-level pair of the `React.memo` on `SurahBanner`/`Footer` (Q33) — and the bigger win for a 19 MB datastore feeding long surahs.

### Q90. How would you add audio recitations?

**A:** Source per-verse/per-surah audio (e.g., everyayah / mp3quran), keyed by `surahId:verse`. A player component on the verses tab; preload current range, lazy-load neighbors. **PWA constraint flavored by this stack**: audio is large (≈1 MB/min) — *stream* via range requests (NetworkFirst is wrong for media; you'd add a custom range-request runtime cache in `sw.ts`) rather than precache, or offer an explicit "download surah" action. Sync highlighting to audio requires per-verse timing metadata (source gate). The old discussion stands, but the SW caching of /api-and-navigation (`defaultCache`) doesn't cover media — adding a bespoke `urlPattern`/handler in Serwist's `runtimeCaching` array is the concrete step a senior should name.

### Q91. A user reports the SW serves a stale version after a deploy. Diagnose.

**A:** With `skipWaiting: true` + `clientsClaim: true` (`src/app/sw.ts:15-16`) an updated SW should activate promptly — so staleness means: (1) the deployed `public/sw.js` hash didn't change (identical build, no new SW — check the deploy artifact's hash); (2) the browser never re-fetched `sw.js` (SW update check happens on navigation/30-min cycle — user left the tab open); (3) the *surahs page* was served from the HTTP cache rather than the SW because `defaultCache` nav handling didn't engage; (4) an in-flight page won't re-evaluate until navigation. Debug: DevTools → Application → Service Workers (installed vs active SW). Note the PWA is disabled in dev (`disable: NODE_ENV !== 'production'`, `next.config.ts:8`) — so this whole class of problem is invisible under `pnpm dev`; you can only reproduce via `next build && next start` or a deployed preview.

### Q92. How would you write real tests for the API Route Handlers?

**A:** Route Handlers are plain async functions taking `NextRequest` → `NextResponse`, so they're testable without a server: construct `new NextRequest('http://localhost/api/user-data', { method, headers, body })`, call the exported `GET`/`PUT`/`POST`, assert status/JSON. Mock `@/src/lib/supabase` (vi.mock) with a fake that records calls and returns canned rows. Cases: GET with/without `x-device-id` (400), GET create-if-missing, PUT upsert with `onConflict: 'device_id'` and defaults, export's `Content-Disposition` header + 404, import's 200 + `message`. This closes the biggest coverage gap (Q67) — the sync contract is currently protected only by the client's `syncBackend` unit tests, which assert the *calls* but not the *server behavior*.

### Q93. How would you add i18n to an Arabic-first app?

**A:** The audience is Arabic readers; the *content* (tafsir) is Arabic-only by scholarship. If a UI locale were wanted: extract UI strings to a messages module, a small `useTranslate` hook (no need for i18next at this scale), and keep `<html lang="ar" dir="rtl">` (`src/app/layout.tsx:20`) switching to ltr for a hypothetical LTR locale — which also means swapping `start`/`end` utilities (Q35). The RSC side has no i18n hooks at all: `generateMetadata` (Arabic strings), JSON-LD (Arabic `@type:'Book'`), sitemap/robots — if a second locale appeared, metadata would need `alternates.languages` and per-locale static params, a genuinely bigger change than the client UI strings. Verdict: low priority; the content, not the chrome, defines the audience.

### Q94. The StatsTab client import does `JSON.parse` then writes to storage. How do you harden it?

**A:** Today import reads a file, `JSON.parse`s it, and writes `dhilal_*` keys — which then *sync to the server* (Q44). A crafted file can thus inject arbitrary history/bookmarks upstream. Harden: (1) validate with the same Zod schema as PUT (Q75 — reuse it); (2) cap array sizes and string lengths; (3) reject non-object shapes early with a clear Arabic error; (4) optionally re-import via the API's `/import` route so the server validates once. Since the device id is forgeable (Q7), the API already accepts junk — the defense-in-depth point is *both* sides validate. The client path adds no new risk model, but it's the untrusted-input path closest to a user, so it deserves the schema most.

### Q95. Sharing per-surah links / rich social previews: what's done, what's missing?

**A:** Done — every surah has a shareable URL (`/surah/{id}`), `navigator.share`-able, with OG tags + canonical from `generateMetadata` (`[id]/page.tsx:22-33`) and JSON-LD Book schema. Missing — (1) **verse-range sharing** (`/surah/2?tab=verses&range=51-100`, Q80) and (2) **per-surah OG images** (Currently OG has title/description/url/locale but no `images` field; cards render with just text). Adding `openGraph.images` per surah requires generating 114 social images at build (a script → `/og/{id}.png` in `public/` — a build step, now that App Router serves static assets fine). The SPA could do *none* of this (no SSR meta at all); the migration built the floor.

### Q96. A teammate proposes adopting Zustand for state. Respond.

**A:** Current state: one `AppStateContext` (Q17) + `ThemeContext`, both client-side, composed in the `(reader)` layout. The context re-renders all consumers on any value change — the known cost. Zustand would give selector-granular subscriptions (`useStore(s => s.bookmarks)`), removing spurious re-renders, and drop the provider from the layout entirely. But the *server* story matters more than the client: state that's needed by RSC (selected surah, page metadata) must NOT move into a client-global store — the URL is the source of truth for anything linkable (Q3), which is the architectural principle Zustand would dangerously weaken if it became a parallel copy of "current surah." Verdict: justified only if consumer re-renders measurably hurt (they don't here — tiny component tree per surah); otherwise YAGNI. The senior answer is "scope the store to non-routing UI state, never routing."

### Q97. The docs show outdated code samples. How do you keep docs honest in a repo that just migrated?

**A:** (1) **Link, don't copy** — point at source (`src/context/ThemeContext.tsx`) instead of embedding code blocks that rot; (2) **version-stamp** each doc ("accurate against Next 16.3.1 + commit X"); (3) **archive, don't edit** — a stale doc becomes `docs/archive/` with a pointer to the successor, exactly what should have happened to the Vite-era material; (4) **CI docs check** — a script verifying every `src/...:line` cited in docs still exists and (fuzzy) matches referenced identifiers — the strongest lever here since 105 answers now cite paths. The pre-migration docs under `sessions/` are historical by construction; the migration is the wake-up call to make `AGENTS.md` + this file the single current source.

### Q98. How would you add an offline indicator?

**A:** A small `'use client'` banner component: `useEffect` subscribing `window.addEventListener('online'/'offline')` → set state → conditional banner ("أنت غير متصل — القراءة مستمرة، وستزامن البيانات عند عودة الاتصال"). Feed it from `syncPending` too: `useDataSync()` already exposes `syncPending` (`src/hooks/useDataSync.ts:28`) — "X تغييرات بانتظار المزامنة". Since pages are SSG and the SW caches what it caches (Q11-12), the banner should distinguish "offline" (network down) from "not yet cached" (first visit, tafsir not fetched) — the 19 MB caveat makes those materially different user experiences. Serwist also exposes update/install events via `serwist`'s SW; wires up to a real "new version available" toast if you want `prompt`-style updates (Q91).

### Q99. `app-lifecycle.md` said "No database. No external APIs." — yet Supabase sync exists. Reconcile?

**A:** Same drift as pre-migration, now *compounded* by Next.js which *is* the API platform: the app has a database (Supabase `user_data`), a REST API (`/api/user-data*`), *and* a service-worker runtime — the old "no database, no APIs" claim couldn't be more obsolete. What's still true and worth preserving: **content** (the tafsir) is 100% local and bundled; the DB/API exist only for user-state sync. Reconcile by rewriting the claim as: "Tafsir content is fully local; Supabase persists user data only; all sync goes through Next Route Handlers." Rule of thumb (for this and every audit): absolute claims ("No X. Never Y.") are the first things to grep for when a stack changes — invariants are exactly what migrations break.

### Q100. Onboarding a new dev to the migrated repo: 5-step guide?

**A:** 1. Read `AGENTS.md` (it's current — Next 16, `--webpack` requirement) and this file. 2. `pnpm install`, then ensure `src/data/tafsir.ts` exists — it's gitignored (Q81); if missing, run `pnpm exec tsx scripts/extract-tafsir.ts` (needs `catdoc` + the gitignored `.doc` sources) or fetch a data artifact. 3. Set up Supabase: run `supabase/migrations/20260701_create_user_data.sql`, make your `.env.local` (see Q87 — example is stale/gitignored) with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. 4. `pnpm dev` (note: `--webpack`, PWA disabled in dev) and trace a surah: RSC page (`[id]/page.tsx`) → `loadTafsirData` (build-time + lazy client) → `getTafsirText` slice → `SurahReader` (client, `?tab=`) → `TafsirDisplay` formatting. 5. Read `sessions/2026-06-30-production-readiness.md` and re-audit: which items did the migration resolve (duplicated backends — gone; vercel.json — gone; manualChunks — moot) and which remain (no RLS/Q8, last-write-wins/Q9, `TafsirSection` ×3/Q51, no API tests/Q67, no e2e).

---

## Bonus Round: Stretch Questions (5 questions)

### Q101. The single 19 MB tafsir chunk is the biggest perf cliff. Design per-surah lazy chunks.

**A:** Generate **per-surah data files** (`src/data/tafsir/{id}.ts`, each `Record<number, TafsirSection[]>` with one key) instead of one 19 MB module. `loadTafsirData(surahId)` becomes `import('./tafsir/' + surahId)` — dynamic import → webpack emits one chunk per surah (~tens to low-hundreds of KB). Boot/surah-open cost drops ~100×. Consequences: (1) SSG pages import only their own surah (build memory drops, fresh-clone build failure at Q81 shrinks to per-file); (2) **search must change** — `searchTafsir` scans all surahs, so a per-surah model needs a search index: either cross-surah index chunks (built at generate-time, since the corpus is static and immutable) or a progressively-fetched index; (3) `SURAHS_WITH_TAFSIR` metadata already tells you which files exist (Q20) — the loader can 404-gracefully per surah. Compare with the old manualChunks approach: Vite could *split* one module; App Router's dynamic import gives you *per-key* granularity natively. The PWA also gains: per-surah chunks easily fit the 2 MB precache cap that disqualifies the 19 MB file (Q12) — offline tafsir becomes actual.

### Q102. Sync is last-write-wins. Design a conflict-free merge for bookmarks.

**A:** Bookmarks are additive sets of `{surahId, verseIndex}`; the minimal fix is **set-union merge**: `merged = new Set([...local, ...server])` with a timestamp per item to resolve same-id duplicates (newer wins). For history (append) and completion (boolean/surah) the granularity sharpens: LWW *per item*, not per whole array. Full correctness is an **LWW-element-set CRDT**: each element `{id, surahId, verseIndex, addedAt, deletedAt}`; merge = union of adds minus adds whose delete is newer. The Route Handler's whole-row `upsert` (`src/app/api/user-data/route.ts:60-74`) is the coarsest possible granularity — it must change to either (a) a per-item payload (`bookmarks: [{id, ts, del}]`) or (b) a JSON `bookmarks` column merged client-side during `initFromServer`. `syncBackend.ts:80-96` runs the merge on boot; that's the seams a senior should draw.

### Q103. Route Handlers vs Server Actions: which would you choose for this API, and when?

**A:** Today, Route Handlers — and the reasons are the *senior* part: (1) the four endpoints are a REST surface consumed by a **non-React client primitive** (`syncBackend` uses plain `fetch` — `src/utils/syncBackend.ts:19-26`); Server Actions are RSC-native and awkward to call from vanilla fetch code (their encoding is React-specific); (2) `cacheOnNavigation` + Serwist's NetworkFirst caches `/api/*` as resources (Q11) — Server Actions bypass the normal runtime-cache URL space; (3) export's `Content-Disposition: attachment` (Q40 of old; `export/route.ts:29-35`) is a Response concern — fine as either, but a plain GET is clearer. Choose Server Actions when (a) the only consumers are React components, (b) you want progressive enhancement/`useActionState`, (c) you want type-safety from server to client without a shared schema package. For an offline-first PWA sync via SW-cached fetching, Route Handlers remain correct.

### Q104. Design the migration to RLS-backed auth (the #1 security item).

**A:** (1) **Supabase Auth** (email magic-link/OAuth → JWT sessions); (2) add `user_id uuid references auth.users(id)` to `user_data`, keep `device_id` during transition; (3) **enable RLS** with policies `using (auth.uid() = user_id)` for select/insert/update/delete; (4) choose the client seam — keep Route Handlers but verify the JWT (use Supabase's `getUser(token)` server-side) and inject `user_id`, or move reads/writes client-side with the anon key + RLS (then the Route Handlers support only the anonymous legacy path); (5) **merge anonymous data on first sign-in** — read the ephemeral `device_id` row, copy into the user row, delete the device row (the boot-time merge in `syncBackend.ts:80-96` prefigures this); (6) **rotate/revoke the service_role key** — it was the only guard (Q64) and must not linger; (7) re-audit `SURAHS`-level metadata (none — it's public content, no per-user surah data exists except `user_data`). This is the standard anonymous→authenticated migration; the forgeable-header model (Q7) is the reason it's overdue.

### Q105. Docs drift across a framework migration. Design a docs-freshness process.

**A:** (1) **No inline code in docs** — link to source (`path:line`), so a `--webpack` removal (Q58) or a `params` Promise change (Q23) can't silently invalidate prose (this file's convention); (2) **generate structural facts** — dep versions come from `package.json`, route inventories from `src/app/api/*` — a small script emitting a facts table per PR; (3) **version-stamp every doc** ("verified against Next 16.3.1, commit `<sha>`") and **archive, don't edit** superseded docs (the Vite-era material should live in `docs/archive/`); (4) **CI docs check** — verify each cited `src/...:line` exists and fuzzy-contains the referenced identifier; grep for stale-stack keywords (`server.ts`, `vercel.json`, `vite.config.ts`, `main.tsx`, `createRoot`, `useAppState():12`) and fail; (5) **PR rule** — behavior-changing PRs update docs in the same PR; (6) **single source** — `AGENTS.md`, `README.md`, and this file must not maintain dueling facts (the two-backend, gitignored-supabase claims in older docs are exactly the drift class to kill). Process beats one-off cleanup: the migration is the proof that hand-maintained docs decay at exactly the speed of a stack change.

---

## Evaluation Criteria

| Area | Mid | Senior | Staff |
|------|-----|--------|-------|
| **Architecture** | Explains the Next.js+Route Handler+Supabase split | Debates SSG-vs-dynamic + the 19 MB chunk cliff | Designs per-surah chunks + unified handler/service layer |
| **React/Next.js** | Knows `'use client'` boundaries + `await params` | Diagnoses the `useDataSync` cleanup bug + hydration-safe storage | Designs RSC/`use(promise)` + Suspense refactor |
| **Backend** | Traces a Route Handler ↔ Supabase flow | Debates Route Handlers vs Server Actions + device-id forgeability | Designs RLS-backed auth + handler-service refactor |
| **Data** | Explains the catdoc extraction pipeline | Diagnoses last-write-wins data loss + build-on-gitignored-data trap | Designs per-item CRDT merge + per-surah data files |
| **PWA** | Knows what a service worker does | Debates NetworkFirst vs precache + the 2 MB precache exclusion | Designs per-surah progressive caching + offline search worker |
| **Security** | Knows XSS basics (children escaping) | Identifies the no-RLS + service_role risk + CSP `'unsafe-inline'` trade | Designs full auth + RLS + key-rotation migration + nonce CSP |
| **Performance** | Knows lazy loading | Diagnoses the 19 MB all-or-nothing cliff + main-thread search scan | Designs Web Worker search + per-surah lazy chunks |
| **Maintainability** | Notices docs drift | Catalogs stale claims (gitignored supabase, `.env.example`) | Designs the docs-freshness CI process |

---

*End of interview document. 105 questions across 5 rounds. All file/function references reflect the current Next.js 16 App Router implementation of the fi-dhilal-al-quran codebase and were verified against source where cited.*