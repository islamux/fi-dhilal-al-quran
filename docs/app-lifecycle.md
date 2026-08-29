# رحلة في ظلال القرآن — App Lifecycle Walkthrough

> **For:** Junior developers who know basic HTML, CSS, and JavaScript but have never touched React or a Next.js app.
>
> **What this is:** A step-by-step tour of the app's journey — from `next build` to a request like `/surah/2`, through static generation, React hydration, clicking, searching, the unified API, and the PWA service worker.
>
> **Reference:** For deeper dives into React patterns used here, see [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md). For how the app is tested, see [`docs/TESTING.md`](./TESTING.md).

---

## Table of Contents

1. [The Big Picture — A Hybrid App](#1-the-big-picture--a-hybrid-app)
2. [The Two Worlds — Server & Client](#2-the-two-worlds--server-components--client-components)
3. [The Start Line — Build Time & SSG](#3-the-start-line--build-time--static-site-generation)
4. [A Real Request — Visiting `/surah/2`](#4-a-real-request--visiting-surah2)
5. [Hydration — The Page Comes Alive](#5-hydration--the-page-comes-alive)
6. [The Shell — Layout & Client Navigation](#6-the-shell--layout--client-side-navigation)
7. [SurahReader — The Tab Interface](#7-surahreader--the-tab-interface)
8. [The Tafsir Data Pipeline](#8-the-tafsir-data-pipeline)
9. [Persistence — localStorage & Supabase Sync](#9-persistence--localstorage--supabase-sync)
10. [The Unified API — Route Handlers](#10-the-unified-api--route-handlers)
11. [PWA — Offline & Installation](#11-pwa--offline--installation)
12. [Scripts & Tooling](#12-scripts--tooling)
13. [Glossary of Framework Terms](#13-glossary-of-framework-terms)
14. [React Patterns You'll See on Every Page](#14-react-patterns-youll-see-on-every-page)
15. [Common Mistakes — What to Watch For](#15-common-mistakes--what-to-watch-for)
16. [The Full Lifecycle](#16-the-full-lifecycle)

---

## 1. The Big Picture — A Hybrid App

This app is called **في ظلال القرآن** ("Fi Dhilal al-Quran" — "In the Shades of the Quran"). It's a digital reader for Sayyid Qutb's tafsir (commentary/exegesis) of the Quran, built with **Next.js** (the React framework for the web).

### What kind of app is it, exactly?

If you've only ever seen two kinds of websites — plain "request HTML → get HTML" sites, and single-page apps (SPAs) where an empty HTML shell is filled in entirely by JavaScript — this app is a **hybrid** that takes the best of both:

| Concern | Classic SPA | This Next.js app |
|---------|-------------|------------------|
| First paint | Needs to download + run all JS first | **Pre-rendered HTML** arrives instantly from a static file |
| SEO | Search engines see an empty shell | Full Arabic tafsir text is **already in the HTML** |
| Clicking around | One big in-memory app | **Client-side navigation** with no full-page reloads |
| API | Separate backend server | **Route Handlers** — same code runs in dev, prod, and Vercel |
| Offline | Manual, often missing | **Service worker (PWA)** pre-caches the app + runtime caches pages/API |
| "Login" | None needed | **Device-ID based** user-data sync to Supabase |

Next.js 16 statically generates all the reading pages at **build time** (Static Site Generation, SSG). When a visitor asks for `/surah/2`, the server — or, usually, a CDN — hands back a fully-formed HTML page with the surah's tafsir text already inside it. Then React takes over in the browser and turns that static page into a living, interactive app.

### What's inside this app?

```
┌──────────────────────────────────────────────────────────────────┐
│                            Browser                               │
│                                                                  │
│  ┌─────────────────────┐   ┌──────────────────────────────────┐  │
│  │   Service Worker    │   │   React app (hydrated)           │  │
│  │   (PWA, offline)    │◄──│   WorkstationShell               │  │
│  └──────────▲──────────┘   │   └─ Sidebar · SurahReader       │  │
│             │              │      ├─ Overview / Verses / Chat │  │
│             │              │      └─ Stats tabs               │  │
└─────────────┼──────────────┴───────────────┬──────────────────┘  │
              │                              │
              ▼ fetch / navigations          ▼ fetch /api/*
┌──────────────────────────────────────────────────────────────────┐
│                         Next.js server                           │
│                                                                  │
│  • Static files: pre-rendered /surah/* HTML (SSG ×114) + "/"     │
│  • Route Handlers: /api/health, /api/user-data{,/export,/import} │
│  • PWA artifacts: /manifest.webmanifest, /sw.js                  │
└──────────────────────────────────────────────────────────────────┘
```

**No database for reading.** All the tafsir content — 110 surahs, 305 verse-range sections, ~19MB of Arabic text — is local. The pages are generated from it at build time, and searching happens entirely in the browser over the same local data.

**One database for user data.** Supabase stores each "device's" bookmarks, reading history, completed surahs, and theme — synced over the unified API. No accounts, no passwords; a `dhilal_device_id` in localStorage is the key.

---

## 2. The Two Worlds — Server Components & Client Components

Modern Next.js (the App Router) runs your React components in **two different places**. This is the single most important mental model for this codebase.

### Server components (the default)

Any component that does **not** say `'use client'` at the top is a **Server Component**. It runs only on the server (at build time for static pages, or at request time for dynamic pages). It can:

- `await` things directly (see `surah/[id]/page.tsx` doing `await params`)
- read files and Node/`process.env` securely
- render Arabic text straight into HTML

**The browser never sees the source of a server component** — it only receives the HTML/streamed output.

### Client components (`'use client'`)

The moment you write `'use client'` at the top of a file, that component **also ships to the browser as JavaScript**, where it can:

- use hooks (`useState`, `useEffect`, `useRouter`, `useSearchParams`, …)
- respond to clicks, manage tabs, handle input
- read `localStorage` (carefully — see Chapter 9)

A client component is allowed to *import and render* a server component (as children), but a server component cannot pass event handlers into a client component.

### Where each piece of this app lives

```
next build / request time (server)            browser (client)
──────────────────────────────                 ──────────────
src/app/layout.tsx         ──────────────►     <html lang="ar" dir="rtl">
src/app/(reader)/layout.tsx                       providers + shell
src/app/(reader)/page.tsx                         → <SurahReader/>  (client)
src/app/(reader)/surah/[id]/page.tsx
   ├─ await params
   ├─ loadTafsirData()   (build time)
   ├─ getTafsirText()    (build time)
   └─ JSON-LD, metadata                        src/components/SurahReader.tsx ('use client')
src/app/api/*/route.ts  (request time)           src/components/WorkstationShell.tsx ('use client')
src/lib/supabase.ts      (server only)           src/components/{Sidebar,TabBar,OverviewTab,...}
                                                 src/context/*, src/hooks/*
```

**Rule of thumb you'll see applied throughout:** keep everything that can run on the server there (data loading, metadata, API), and push only what *must* interact with the user into `'use client'` components.

### The nesting of layouts

Like a Matryoshka doll, every route is wrapped by its ancestor layouts:

```
<RootLayout>                          src/app/layout.tsx        (server)
  <ErrorBoundary>                     client class component
    <ThemeProvider>                   client context
      <ReaderLayout>                  src/app/(reader)/layout.tsx (server)
        <AppStateProvider>            client context
          <WorkstationShell>          client shell (sidebar etc.)
            <SurahReader/>            client page content
```

This chain is how `useAppState()` and `useTheme()` are available to every component that renders inside the app (Chapters 5–7).

---

## 3. The Start Line — Build Time & Static Site Generation

If you want to understand how `https://site/surah/2` gets its content, you have to understand what happens when a developer runs:

```bash
pnpm run build   # → next build --webpack
```

This is the moment the app "pre-commits" its content. Everything tafsir-related is decided here.

### Step 1: Next discovers the routes

Next.js derives routes from the **file system** under `src/app/`. Every `page.tsx` is a page, every `layout.tsx` is a wrapper, every `route.ts` is an API endpoint, every special file (`manifest.ts`, `sitemap.ts`, `robots.ts`, `sw.ts`) is metadata or infrastructure.

```
src/app/
├── layout.tsx                  → wraps the whole app
├── globals.css                 → Tailwind v4 + design tokens
├── manifest.ts                 → web app manifest (PWA)
├── sitemap.ts                  → /sitemap.xml
├── robots.ts                   → /robots.txt
├── sw.ts                       → service worker SOURCE (built to public/sw.js)
├── api/
│   ├── health/route.ts         → GET /api/health
│   └── user-data/
│       ├── route.ts            → GET/PUT /api/user-data
│       ├── export/route.ts     → GET /api/user-data/export
│       └── import/route.ts     → POST /api/user-data/import
└── (reader)/                   ← route group (adds no URL segment)
    ├── layout.tsx              → AppStateProvider + WorkstationShell
    ├── page.tsx                → serves "/"
    └── surah/[id]/page.tsx     → serves /surah/2, /surah/3, …
```

> **What's a route group?** A folder in parentheses, `(reader)`, groups files that share a layout **without** adding anything to the URL. `(reader)/page.tsx` is the URL `/`, not `/reader`.

### Step 2: `generateStaticParams()` — "make every surah page"

The per-surah page exports a function that tells Next which routes to pre-build (see `src/app/(reader)/surah/[id]/page.tsx`):

```ts
export async function generateStaticParams() {
  return SURAHS.map(s => ({ id: String(s.id) }));
}
```

`SURAHS` has all 114 surahs, so Next **builds the exact same page component 114 times** — once for each surah id. On the server's build machine (not the browser), each run:

```ts
const { id } = await params;                 // e.g. "2"

const surah = SURAHS.find(s => s.id === Number(id));
if (!surah) notFound();                      // unknown /surah/999 → 404 page

const data = await loadTafsirData();         // parses the ~19MB tafsir.ts ONCE, server-side
const tafsirText = getTafsirText(surah.id, data, 'كاملة');   // slices just surah 2's text
```

Then it returns `<SurahReader surah={surah} initialTafsirText={tafsirText} />`. The fully-rendered HTML — **including Al-Baqarah's complete Arabic tafsir** — is written to disk as a static `.html` file. This is what makes the app SEO-friendly: the text is in the markup, not waiting for JavaScript.

The same thing happens for `/` — `(reader)/page.tsx` builds Al-Fatihah the same way (`SURAHS[0]`).

### Step 3: Per-page metadata is generated too

`generateMetadata()` runs for each surah and returns `<title>تفسير سورة البقرة — في ظلال القرآن</title>`, a description, a canonical URL, and OpenGraph tags. A JSON-LD `Book` schema block is also inlined into each page's HTML — this is the structured data that makes search-engine result snippets look rich.

### Step 4: The build outputs

```
.next/                        ← build artifacts (gitignored)
├── server/                   ← compiled server + RSC renderer
├── static/                   ← HTML/CSS/JS chunks
│   ├── 2/f39a…/surah/2.html  ← pre-rendered HTML for surah 2 (full Arabic text inside!)
│   ├── …                     ← 113 more surah pages + "/"
│   └── chunks/…tafsir*.js    ← the ~19MB tafsir data as a LAZY chunk (only fetched on demand)
public/sw.js                  ← service worker built from src/app/sw.ts by @serwist/next
public/sitemap.xml, robots.txt, manifest.webmanifest
```

Two important "relocations" to notice:

1. **The tafsir text ships inside the page HTML** for whatever surah you visit. The 19MB file itself is **not** downloaded to read a page — it stays server-side at build time and only becomes a *lazy* browser chunk for the cases where the whole dataset is needed (full-text search, or re-slicing a verse range — Chapter 8).
2. **The service worker** is compiled from `src/app/sw.ts` into `public/sw.js` by `@serwist/next` during the same build (Chapters 11–12).

> **Why `--webpack`?** See Chapter 12 — `@serwist/next` only writes `public/sw.js` through Next's webpack build hook. Turbopack bypasses it, so the scripts pass `--webpack` on purpose.

---

## 4. A Real Request — Visiting `/surah/2`

The static files exist. Now a user opens the browser and types the URL. Here's the full journey.

### Step 1: The server answers without running your code

For a statically generated page, the runtime server (Vercel, or `next start` locally) does **not** re-run `SurahPage` at request time. It looks up the matching static file and streams it back: `200 OK` with the complete HTML document.

Your React code *already* ran — at build time. That's the definition of SSG.

### Step 2: The root layout wraps everything

Every page response is assembled inside `src/app/layout.tsx`:

```tsx
<html lang="ar" dir="rtl">
```

So the document is **RTL by default**, and the four Google Fonts (Amiri for the tafsir reading face, Tajawal for UI, Playfair Display for decorative serif, JetBrains Mono for those "PART ١/٢٣/..." mono labels) are linked here. `metadataBase` comes from `SITE_URL` (env `SITE_URL`, falling back to `https://fi-dhilal-al-quran.vercel.app`), and the `<title>` template makes every surah title read `تفسير سورة البقرة — في ظلال القرآن`.

Inside `<body>`, the `ErrorBoundary` and `ThemeProvider` are already in the markup — they're Server-Component-compatible client components whose initial HTML is rendered server-side and then hydrated (Chapter 5).

### Step 3: The reader layout provides the shell state

`src/app/(reader)/layout.tsx` mounts two client providers around the page:

```tsx
<AppStateProvider>          // useAppState(): bookmarks, history, search, sync state…
  <WorkstationShell>        // sidebar + brand strip + the page itself
    {children}              // ← the output of surah/[id]/page.tsx
  </WorkstationShell>
</AppStateProvider>
```

The `WorkstationShell` draws the three-column frame — decorative BrandStrip on the far side, the Sidebar with the surah index, and a flexible column where the page content lands. On mobile the sidebar becomes a slide-in drawer.

### Step 4: The page renders with data already in hand

The `SurahPage` server component produces `<SurahReader surah={…} initialTafsirText={…} />` plus the JSON-LD script. Because `SurahReader` is a client component, its **server-rendered HTML** is what the user sees before any JavaScript runs:

```
┌──────────────────────────────────────────────────────────────────┐
│  فِي ظِلَالِ الْقُرْآن        ◐  ⭐ Mark Surah   ✔ Mark Study    │
│  PART ١                                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Surah 2 · Juz 1                                           │  │
│  │ البقرة                                                     │  │
│  │ MEDINAN REVELATION · ٢٨٦ VERSE(S)                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│  نظرة عامة │ استعراض الآيَات │ بحث في الظلال │ سجل المُدارسة     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ TAFSIR AL-QUTB · SURAH ٢                                  │  │
│  │ الم ﴿١﴾ ذلك الكتاب لا ريب فيه...                           │  │
│  │ يبدأ السياق القرآني في سورة البقرة بهذه الحروف المقطعة…     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  DHILAL AL-QURAN • STUDIOS                                       │
└──────────────────────────────────────────────────────────────────┘
```

### Step 5: The dynamic params safety net

The page also sets `export const dynamicParams = true`. That, plus `if (!surah) notFound()`, means:

- All 114 real surahs are served from pre-rendered static files.
- A garbage URL like `/surah/999` (or `/surah/abc`) hits the built-in `notFound()` handler and returns a proper `404` page — one code path, no crash.

> **Note — RTL layout:** because the document is `dir="rtl"`, you'll see CSS use `start`/`end`-aware properties and the sidebar fixed to the *right* (`right-0` in `Sidebar.tsx`) rather than `left`. Mind that when you touch layout styles.

---

## 5. Hydration — The Page Comes Alive

At this point the page is beautiful static HTML. But nothing *responds* yet — no clicks, no tabs, no theme toggle. Time for hydration.

### What hydration is

Every client component you write gets compiled into JavaScript. Alongside the HTML, Next serves that JavaScript plus a **React Server Component (RSC) payload** — a compact description of the component tree. The browser downloads these, and **React 19 walks the existing DOM and attaches itself to it** — attaching event listeners, running `useEffect`s, and taking ownership of the components. No blank flash, no re-render of everything from scratch: it "resumes" where the server left off.

Think of it like the difference between a *photograph* of a car dashboard and sitting in the driver's seat. The HTML was the photograph; after hydration you're holding the wheel.

```
Static HTML arrives ──► React 19 hydrates ──► Interactive app
   (looks right)          (becomes alive)        (responds)
```

### Step-by-step after a reload on `/surah/2`

1. **`ThemeProvider` mounts.** It starts in dark mode (`useState(true)`) and then reads `dhilal_theme` from localStorage in a `useEffect` — see Chapter 9 for why this two-phase approach is mandatory under SSR.
2. **`useAppState()` initializes.** `AppStateProvider` composes the bookmark hook, progress hook (history + completed), search hook, and data-sync hook, plus local UI state (filters, mobile sidebar toggle).
3. **`SuraReader` picks its initial tab** from the query string: `?tab=overview|verses|chat|stats`, defaulting to `overview`. (A search result elsewhere in the app can navigate here with `?tab=verses` so the user lands on the verses view.)
4. **Data sync starts.** `useDataSync()` kicks off `syncBackend.initFromServer()` — a `GET /api/user-data` with the device header, which pulls this device's bookmarks/history/theme down from Supabase into localStorage (Chapters 9–10).
5. **The service worker registers.** The Serwist worker claims the page and controls subsequent fetches (Chapter 11), so the next navigation can be served straight from the cache.
6. **The user starts interacting** — and now we're in client-side React land for the rest of the session.

---

## 6. The Shell — Layout & Client-side Navigation

The `WorkstationShell` (`src/components/WorkstationShell.tsx`) is the permanent frame. It's a client component, so it can use the router hooks.

### How it knows which surah we're on

```ts
const router = useRouter();                            // navigate programmatically
const params = useParams<{ id?: string }>();           // reads the CURRENT URL segment
const selectedSurah = resolveSurah(params?.id);
```

- On `/` there's no `id` param, so `resolveSurah` falls back to `SURAHS[0]` (Al-Fatihah).
- On `/surah/50` it finds surah 50 by id; if the id is unrecognized it also falls back safely.

> **Two different "params":** in the *server* page (`surah/[id]/page.tsx`) params is an `async Promise` you `await`. In this *client* shell, `useParams()` is a hook that returns the plain current-route value. Different mechanisms for the same URL — don't mix them up.

### Client-side navigation — the click that never reloads

When the user clicks البقرة in the sidebar:

```ts
const onSelectSurah = (id: number) => {
  setMobileSidebarOpen(false);          // close the drawer on mobile
  if (id === selectedSurah.id) return;  // already there, do nothing
  router.push(`/surah/${id}`);          // ← the magic line
};
```

`router.push` is **client-side navigation**. Next *does not reload the page*; instead it fetches the RSC payload for the target route (or grabs it from the cache/service worker) and swaps the content in place. The shell, sidebar, theme, bookmarks — all stay mounted and keep their state. That's why the whole reader feels app-like despite being 115 separate pages.

### The three columns

```
┌──────────────┬──────────────────────────────────┬──────────────────────┐
│  BrandStrip  │   {children}  (page content)     │      Sidebar         │
│  (decorative │  ┌─Header─────────────────────┐  │  ┌────────────────┐  │
│   strip,     │  │  Surah banner + toolbar    │  │  │ فهرس السور     │  │
│   xl screens │  ├─TabBar─────────────────────┤  │  │ فهرس الأجزاء   │  │
│   only)      │  │  Active tab content        │  │  │ [search box]   │  │
│              │  └─Footer─────────────────────┘  │  │ [type filters] │  │
└──────────────┴──────────────────────────────────┴──────────────────────┘
```

On small screens the fixed-position sidebar slides in as a right-side drawer (`MobileOverlay` dims the page behind it), and the BrandStrip is hidden.

### Sidebar: derived state, not stored state

The sidebar (`Sidebar.tsx`) has search, type filter (مكيّة/مدنيّة), and Juz filter. Notice there is **no separate state** for the filtered list — it's *derived* during render:

```tsx
const filteredSurahs = SURAHS.filter(surah => {
  const matchesSearch =
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.arName.includes(searchQuery);
  const matchesType = typeFilter === 'all' || surah.type === typeFilter;
  const matchesJuz  = juzFilter === null || surah.juzNumber === juzFilter;
  return matchesSearch && matchesType && matchesJuz;
});
```

**Key lesson:** if you can compute a value from existing state, compute it during render. No extra state = no way for the filtered list to drift out of sync with the source list.

> **Gotcha worth remembering:** the sidebar's own navigation to a new surah does **not** preserve the active tab — it lands back on `overview`. Only the chat search results deliberately navigate with `?tab=verses` to jump straight to verses.

---

## 7. SurahReader — The Tab Interface

The page content is a single client component: `SurahReader` (`src/components/SurahReader.tsx`). It receives the `surah` object and the `initialTafsirText` that the server computed.

### What it renders

- **Header** — the app title, the "PART" badge, theme toggle, quick bookmark, and "mark study/finished" button.
- **SurahBanner** — surah name, revelation type, verse count (`memo`'d so it doesn't re-render on every keystroke elsewhere).
- **TabBar** — the four tabs: `نظرة عامة` (overview), `استعراض الآيَات` (verses), `بحث في الظلال` (chat/search), `سجل المُدارسة` (stats).
- **The active tab** — one of OverviewTab, VersesTab, ChatTab, or StatsTab.
- **Footer** — the decorative "DHILAL AL-QURAN • STUDIOS" footer (`memo`'d too).

### Tabs live in the URL

The active tab is **kept in the query string**, not just in memory:

```tsx
const searchParams = useSearchParams();
const requestedTab = searchParams.get('tab');
const activeTab = requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : 'overview';

const setActiveTab = (tab) => {
  // build ?tab=… (or remove it for overview) and router.replace() to it
};
```

This makes tabs **sharable and refresh-safe**: you can send `https://site/surah/2?tab=stats` to someone and they'll land on the stats tab; refresh, and the tab survives.

### Tabs are lazy-loaded

```tsx
const OverviewTab = lazy(() => import('./OverviewTab').then(m => ({ default: m.OverviewTab })));
const VersesTab   = lazy(() => import('./VersesTab').then(m => ({ default: m.VersesTab })));
const ChatTab     = lazy(() => import('./ChatTab').then(m => ({ default: m.ChatTab })));
const StatsTab    = lazy(() => import('./StatsTab').then(m => ({ default: m.StatsTab })));
```

Each tab is its own JavaScript chunk, fetched only when you first open it (wrapped in the `Suspense` fallback — the tiny gold spinner). The tabs even animate in/out via `motion` (`AnimatePresence mode="wait"`).

### Why `SurahReader` is split into a wrapper + inner component

`SurahReader` itself uses `useSearchParams()`. In Next.js 16, any component calling `useSearchParams()` must be inside a `<Suspense>` boundary (otherwise static pre-rendering would have to bail out). So the component is split:

```tsx
export function SurahReader(props) {
  return (
    <Suspense fallback={<empty-coloured-div/>}>
      <SurahReaderInner {...props} />   // ← the part that calls useSearchParams()
    </Suspense>
  );
}
```

Outer `SurahReader` stays stateless (safe to render during SSG); only the inner, Suspense-wrapped half touches the query string.

### The four tabs at a glance

| Tab | File | Job |
|-----|------|-----|
| نظرة عامة | `OverviewTab.tsx` | Full-surah tafsir with verse highlighting; graceful "لم نعثر بعد" message for the 4 surahs without tafsir |
| استعراض الآيَات | `VersesTab.tsx` | A verse-range selector (`كامل السورة`, `1-50`, …) + the matching slice, via `SectionSelector` + `TafsirDisplay` |
| بحث في الظلال | `ChatTab.tsx` | Full-text search across **all** 110 surahs with highlighted excerpts and quick topics |
| سجل المُدارسة | `StatsTab.tsx` | Stats cards, bookmarks list, reading history, export/import (`تصدير`/`استيراد`), clear-all |

---

## 8. The Tafsir Data Pipeline

Everything a user reads comes from one local data source. Understanding where the pixels come from is the heart of this app.

### The source: `src/data/tafsir.ts`

A single auto-generated TypeScript file (`≈19MB`, `305` sections across `110` surahs):

```ts
// Auto-generated from doc files. Do not edit manually.
export const TAFSIR_DATA: Record<number, TafsirSection[]> = {
  1: [
    { startVerse: 1, endVerse: 7, text: "بِسْمِ اللَّهِ الرَّحْمنِ الرَّحِيمِ\n(1)..." }
  ],
  2: [
    { startVerse: 1, endVerse: 29, text: "بِسْمِ اللَّهِ ... الم (1) ذلِكَ الْكِتابُ..." },
    { startVerse: 30, endVerse: 39, text: "وَإِذْ قالَ رَبُّكَ لِلْمَلائِكَةِ..." },
    // … Al-Baqarah alone has dozens of verse-range sections
  ],
  // … 108 more keys
};
```

It's created from the original `.doc` manuscripts by `pnpm exec tsx scripts/extract-tafsir.ts`. It **isn't committed to git** — it's regeneratable, and it's too big to churn the history every time.

### The tiny meta file

`src/data/tafsir-meta.ts` exports a `Set` of the 110 surah ids that *have* tafsir:

```ts
export const SURAHS_WITH_TAFSIR = new Set([1, 2, 3, …]);
```

This answers "does surah X have tafsir?" in **O(1)** time without touching the 19MB file. Surahs 44 (الدخان), 50 (ق), 76 (الإنسان), and 89 (الفجر) are missing from the source material, so their pages show the graceful "لم نعثر بعد على النص الأصلي…" message.

### Loading the data twice, two different ways

The loader (`src/data/tafsir-loader.ts`) is a **singleton promise**:

```ts
let dataPromise: Promise<Record<number, TafsirSection[]>> | null = null;

export function loadTafsirData() {
  if (!dataPromise) {
    dataPromise = import('./tafsir')      // dynamic import → separate chunk
      .then(m => m.TAFSIR_DATA)
      .catch(err => { dataPromise = null; throw err; });
  }
  return dataPromise;                     // every caller shares ONE load
}
```

Where it's used:

1. **At build time (server).** Each SSG page calls it once to compute `initialTafsirText` for its surah. The ~19MB module is parsed once on the build machine; the browser only receives the *sliced* per-surah text in the HTML.
2. **On the client (browser).** The *whole* dataset chunk is dynamically fetched **only** when needed — notably for full-text search (`useSearch` → `loadTafsirData()`) and for fetching a verse-range that wasn't pre-rendered (`fetchTafsir` in `useTafsir`). The singleton promise means it's downloaded at most once per visit.

**Analogy:** Netflix shows you the "menu" (the tab/shell — small), preloads the *episode you actually clicked Play on* into the HTML (that surah's text), and only downloads the "full archive" if you start searching across everything.

### Getting the text for a (surah, range) pair

`src/utils/tafsir-data.ts` → `getTafsirText(surahId, data, range)`:

```ts
if (range === 'كاملة') {
  return sections.map(s => s.text).join('\n\n');     // join every section
}
// "1-50" → keep sections that overlap verses 1..50, then join them
```

`null` is returned for missing surahs/empty ranges — which is exactly the signal the UI checks to show the "not found yet" panel.

### The formatting pipeline (render layer)

Raw `.doc` text is one hard-wrapped wall of text. Two pure functions shape it, and they run wherever the text is rendered:

```
raw section string
   │
   ▼
formatTafsirParagraphs(text)     src/utils/tafsir-format.ts
   • split sections on \n\n
   • join hard-wrapped lines
   • start a NEW paragraph when a line both follows punctuation and
     begins with a typical opener (~40 Arabic keywords: إن، هذا، ثم، لقد…)
   ▼
paragraph: string[]
   │
   ▼
splitVerseSegments(paragraph)    same file
   • «…» guillemets → verse segment
   • text ending in (1)(2)(3)… → verse segment (gold)
   • everything else → commentary segment
   ▼
TafsirContent renders           src/components/TafsirContent.tsx
   <p>…verse in text-gilded-gold, commentary in body colour…</p>
```

Verse text is rendered in **gold** (`text-gilded-gold`, brand `#F27D26`) within `TafsirContent`, while Sayyid Qutb's commentary keeps the normal reading colour — the app's signature visual device. **Why in the render layer and not the extraction script?** Because it's pure derivation from the raw text; the source file stays as close to the manuscript as possible, and any typography decision can be tweaked without regenerating 19MB.

---

## 9. Persistence — localStorage & Supabase Sync

Your bookmarks, reading history, completed surahs, and theme should survive reloads — and (now) follow you across devices without any login. There are two layers: **localStorage** (instant, offline) and **Supabase** (cloud, debounced).

### The problem SSR introduces: hydration mismatches

In the old SPA era it was "read localStorage at component start" and done. Under Next.js the server renders your components **first** — and the server has no `localStorage`. If a component synced state with storage during the very same render pass it used for output, the HTML (server) and the first client render would disagree → React throws a hydration mismatch / flashes the wrong theme.

### The solution: mount-read + hydrated save-guard

Every storage-backed hook follows the same two-phase pattern. See `src/hooks/useLocalStorageState.ts`:

```ts
const [value, setValue] = useState(defaultValue);   // 1. render with the DEFAULT
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  const stored = localStorageBackend.get(key);     // 2. AFTER mount, read storage
  if (stored !== null) setValue(stored);
  setHydrated(true);
}, [key]);

useEffect(() => {
  if (hydrated) localStorageBackend.set(key, value);  // 3. only write once hydrated
}, [key, value, hydrated]);
```

Server and first client render both agree (phase 1). Storage is read **after** mount (phase 2) and the correction triggers a quiet re-render. Nothing is written back until we know we've read (phase 3, the "hydrated save-guard"), so a stale value can never overwrite a fresh one.

`ThemeContext.tsx` does exactly this for `dhilal_theme` (default: dark). And the storage backend itself (`src/utils/localStorage.ts`) is SSR-guarded — it no-ops its reads/writes if `window`/`localStorage` are undefined, so even a careless call can't crash the server.

> **Golden rule you'll be reminded of constantly:** never touch `localStorage` during render. Read it in a mount effect, write it in a hydrated effect.

### The keys

| Key | Holds |
|-----|-------|
| `dhilal_theme` | `'dark'` \| `'light'` |
| `dhilal_bookmarks` | bookmark objects (surah, optional verse, date) |
| `dhilal_history` | last 20 visited surahs/ranges |
| `dhilal_completed` | array of completed surah ids |
| `dhilal_device_id` | `crypto.randomUUID()` — the "identity" for sync |

### The engine room: `useAppState()`

`src/context/AppStateContext.tsx` composes everything into one hook so components never reach for the storage directly:

```
useAppState()
  ├── useBookmarks()      → bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll
  ├── useProgress()       → readingHistory, completedSurahs, addHistoryItem, toggleComplete
  ├── useSearch()         → searchInput, results, searching, handleSearch, clearResults
  ├── useDataSync()       → syncPending (cloud sync status flag)
  └── local UI state      → searchQuery, mobileSidebarOpen, juzFilter, typeFilter, sidebarTab
```

Every storage-backed hook is built on `useLocalStorageState`, which (as above) is what makes the whole tree hydration-safe.

### Cloud sync: `src/utils/syncBackend.ts`

The storage backend exposes an `onChange` callback registry; `useDataSync` subscribes to it. The flow:

1. **On mount** — `syncBackend.initFromServer()` → `GET /api/user-data` with the device header → writes server data into localStorage (so a fresh device inherits its bookmarks).
2. **User acts** — bookmarking, finishing a surah, toggling theme → `localStorageBackend.set(...)` fires change callbacks → `syncBackend.notifyChange()`.
3. **Debounce (1.5s)** — rapid changes are coalesced; after silence, one `PUT /api/user-data` uploads `{bookmarks, history, completed, theme}`.
4. **Retries with backoff** — up to 3 attempts with `2^n`-second waits, and a `dhilal_sync_pending` flag tracks whether a sync still owes the server (shown by the `syncPending` state).

All API calls send the device header `x-device-id` — the browser's only "login". Keep the localStorage keys in sync with the server table columns (`device_id`, `bookmarks`, `history`, `completed`, `theme`) whenever you change one.

---

## 10. The Unified API — Route Handlers

There is no separate backend folder, no `vercel.json`, no `server.ts`. The entire REST API lives in **Route Handlers** — regular files named `route.ts` under `src/app/api/`. One code path runs identically in dev, in `next start`, and on Vercel.

### The endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | returns `{ status: 'ok' }` |
| `/api/user-data` | GET | fetch this device's data from Supabase (creates a row on first visit) |
| `/api/user-data` | PUT | upsert this device's `{bookmarks, history, completed, theme}` |
| `/api/user-data/export` | GET | download the JSON as an attachment (`dhilal-user-data.json`) |
| `/api/user-data/import` | POST | import JSON from a backup (`upsert`, same shape) |

### Walking through `PUT /api/user-data`

The route handler file exports an async function named after the HTTP method — Next wires it up for you:

```ts
export async function PUT(req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');      // 1. who is this device?
  if (!deviceId) return 400;                            //    no ID → refuse

  const body = await req.json();                        // 2. the payload
  // { bookmarks?, history?, completed?, theme? }

  const { data, error } = await getSupabase()           // 3. lazy singleton client
    .from('user_data')
    .upsert({ device_id: deviceId, ...body,
              updated_at: new Date().toISOString() },
            { onConflict: 'device_id' })                //    insert-or-update
    .select().single();

  return error ? NextResponse.json({ error: error.message }, { status: 500 })
               : NextResponse.json(data);               // 4. JSON out
}
```

`GET /api/user-data` is the mirror image: `.eq('device_id', deviceId).maybeSingle()`, creating the row if it doesn't exist yet. `export` wraps the same read in a download header; `import` is the same upsert as `PUT`.

### The Supabase client is server-only

`src/lib/supabase.ts` creates a **singleton** `@supabase/supabase-js` client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars — the *service role*, which bypasses Row Level Security. That key must **never** be imported into a client component (it's only reachable from server code / route handlers). The browser talks to Supabase *through* our route handlers, never directly.

The `user_data` table (from `supabase/migrations/20260701_create_user_data.sql`):

```
user_data
  id          bigint identity PK
  device_id   text UNIQUE NOT NULL        ← what x-device-id maps to
  bookmarks   jsonb  default '[]'
  history     jsonb  default '[]'
  completed   jsonb  default '[]'
  theme       text   default 'dark'
  created_at / updated_at timestamptz
```

### Security headers (production only)

`next.config.ts` applies a strict set of response headers to every route — **CSP** (`default-src 'self'`, fonts from Google, workers/worker from self, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a `Permissions-Policy` that denies camera/mic/geolocation. Notice the `headers()` hook returns `[]` when `NODE_ENV !== 'production'` — no CSP fights during local dev.

---

## 11. PWA — Offline & Installation

The app is installable and works offline via a service worker provided by **`@serwist/next`** (the Web-push-era successor of `next-pwa`; **serwist** is the library at runtime).

### The pipeline at build time

`next.config.ts` wraps the config:

```ts
withSerwist({
  swSrc: 'src/app/sw.ts',        // the worker SOURCE (TypeScript we author)
  swDest: 'public/sw.js',        // the built worker (a gitignored artifact)
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV !== 'production',   // no SW in dev
})
```

During `next build`, serwist also compiles your **precache manifest** — the list of every static asset (pages, JS chunks, CSS, the manifest, icons) — and bakes it into `public/sw.js` alongside the `swe-worker-*.js` runtime library.

### The worker itself — `src/app/sw.ts`

```ts
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,   // static files to install up-front
  skipWaiting: true,                     // activate new versions immediately
  clientsClaim: true,                    // take control without a reload
  navigationPreload: true,
  runtimeCaching: defaultCache,          // ← the runtime rules from @serwist/next/worker
});
serwist.addEventListeners();
```

`defaultCache` is Serwist's sensible default set, and the two that matter here:

- **HTML pages** → **NetworkFirst** (try the network; fall back to cache — so an open page works offline, but you always get fresh content when online).
- **`/api/*`** → **NetworkFirst** too (your user-data sync benefits from the same fallback/staleness trade-off).

### The web app manifest

`src/app/manifest.ts` produces `/manifest.webmanifest` (Next's `manifest.ts` convention — do **not** also set `metadata.manifest`): Arabic name/short_name, `display: standalone`, portrait orientation, `theme_color: #F27D26`, and the SVG icons from `public/icons/`.

### Supporting metadata

- `src/app/sitemap.ts` — 115 URLs: `/` plus all 114 surah pages.
- `src/app/robots.ts` — allow all, point to the sitemap.
- `src/app/sw.ts` is **not** an API or a page — it's the worker source, and `tsconfig.json` deliberately excludes `public/sw.js` from type-checking.

**A daily-emitting detail:** the service worker is what makes everything above actually *work* when the network is gone. It's also the reason the whole project is coupled to **webpack** — see the next chapter.

---

## 12. Scripts & Tooling

### The commands

| Command | Runs | What happens |
|---------|------|--------------|
| `pnpm run dev` | `next dev --webpack` | Dev server at `http://localhost:3000`, hot reload, PWA disabled (safe for local iteration) |
| `pnpm run build` | `next build --webpack` | Full production build: SSG ×115 pages, route handlers, `public/sw.js`, sitemap/robots/manifest |
| `pnpm run start` | `next start` | Serve the built app in production mode (after `build`) |
| `pnpm run clean` | `rm -rf .next` | Remove build artifacts — the `rm -rf .next` you'll want when an old build confuses `next dev` |
| `pnpm run lint` | `tsc --noEmit` | Type-check the whole project |
| `pnpm test` | `vitest run` | Run the test suite (117 tests across 13 files) |
| `pnpm run test:watch` | `vitest` | Watch mode for the same suite |

### The `--webpack` flag is non-negotiable

Next 16 defaults to **Turbopack** for dev/build speed. Turbopack **bypasses `@serwist/next`'s webpack hook**, so no `public/sw.js` would be emitted and the PWA would silently vanish from production builds. That's why `dev` and `build` both pass `--webpack` — and why you should keep it that way.

### Testing

Tests use **Vitest + React Testing Library** under a jsdom environment (the `@vitejs/plugin-react` in the Vitest config is only for the *test* transpile — it has nothing to do with the app's runtime build). Colocated next to their subjects:

```
src/components/SurahReader.test.tsx     ← component tests; navigation is mocked
src/components/WorkstationShell.test.tsx
src/components/QuickSearch.test.tsx
src/components/TafsirDisplay.test.tsx
src/components/SectionSelector.test.tsx
src/hooks/useLocalStorageState.test.ts
src/utils/{highlight,index,localStorage,search,syncBackend,tafsir-data,tafsir-format}.test.ts
```

Because components now use `next/navigation` (`useRouter`, `useParams`, `useSearchParams`), the component tests mock it. `pnpm run lint` (the type check) is the other pre-merge gate.

### Next.js 16 gotchas that shape the code

- **`params` and `searchParams` are Promises** in server pages/route handlers. You must `await params` (see `surah/[id]/page.tsx`). In *client* components, use the `useParams`/`useSearchParams` hooks instead.
- **`useSearchParams()` consumers must be inside `<Suspense>`** — hence the `SurahReader`/`SurahReaderInner` split.
- **RTL everywhere** — the document is `dir="rtl"`; prefer `start`/`end` to `left`/`right`, and check `border-l`/`border-r` choices against the actual side (the sidebar is anchored `right-0`).

---

## 13. Glossary of Framework Terms

| Term | Simple definition |
|------|-------------------|
| **Next.js / App Router** | The framework and its file-system routing (`src/app/`): pages, layouts, route handlers, metadata files. |
| **Server Component** | A React component (default) that runs only on the server. Can `await`, read env/files; ships no JS. |
| **Client Component** | A component marked `'use client'` that also runs in the browser, with hooks and event handlers. |
| **SSG / Static Site Generation** | Pages rendered *once at build time* into HTML files, served fast forever. This app's 115 reading pages. |
| **generateStaticParams** | Tells Next which dynamic route params to pre-build at build time (here: the 114 surah ids). |
| **RSC Payload / Hydration** | The serialized component data + JS sent alongside HTML; React "resumes" it in the browser (hydration). |
| **Route Group `(reader)`** | A folder in parens that shares a layout without adding a URL segment. |
| **Route Handler** | A `route.ts` file exporting `GET`/`PUT`/… functions — the app's whole API layer. |
| **Layout** | A shared wrapper (`layout.tsx`) that persists across navigations within its segment. |
| **`notFound()`** | Next's built-in 404 trigger, used for unknown surah ids. |
| **Dynamic import / Lazy chunk** | `import('./tafsir')` — code fetched only when first needed; here the 19MB dataset for search. |
| **Hydration-safe storage** | The mount-read + hydrated-guard pattern so `localStorage` never causes SSR/client mismatches. |
| **Service Worker / PWA** | A background script that precaches the app and serves pages/API NetworkFirst for offline support. |
| **Precache / runtime cache** | Static assets installed up-front vs assets fetched and cached on use. |
| **`x-device-id`** | The header identifying "this browser" to the API — the app's login-free identity. |
| **Suspense** | React's "show a fallback while waiting" boundary; required around `useSearchParams` consumers. |
| **Re-render** | React calling a component function again because state/props changed. |

---

## 14. React Patterns You'll See On Every Page

### 14.1 "Is this file client or server?" — look at the top

The very first thing to check in any `.tsx` file in `src/` is whether line 1 is `'use client';`.

- `Sidebar.tsx`, `WorkstationShell.tsx`, `SurahReader.tsx`, `OverviewTab.tsx`, all the `context/` and `hooks/` files → client (use hooks, browser APIs).
- `src/app/layout.tsx`, the reader `page.tsx` files → server (they `await`, read `process.env`, call data functions).

### 14.2 TypeScript for reading

| Syntax | Meaning |
|--------|---------|
| `variable: string` | holds a string |
| `variable: string \| null` | a string *or* `null` (exactly how "no tafsir" is represented) |
| `function foo(): Promise<Metadata>` | async server function returning metadata |
| `props: { id: string }` | an object type |
| `value?.property` | optional access — `undefined` if missing |
| `s.id === Number(id)` | params arrive as strings; compare after converting |

Read `: type` as a *label on the box*. You don't need to write TS to follow the flow.

### 14.3 `export default` vs `export`

- Server pages export a **default** async function (`export default async function SurahPage`).
- Route handlers export **named** functions per method (`export async function GET`).
- Client components mostly use **named** exports (`export function Sidebar`), but `lazy()` chunks are wrapped to expose a default (`import('./OverviewTab').then(m => ({ default: m.OverviewTab }))`).

Quick rule: curly braces in the import → named export (`import { Sidebar }`); no braces → default (`import SurahPage `).

### 14.4 Conditional rendering

```tsx
{hasTafsir ? <TafsirContent … /> : <MissingSurahMessage />}   // if / else
{searching && <Spinner />}                                    // show-or-nothing
```

### 14.5 The `key` prop

Mapped lists always carry a stable key (`key={surah.id}`, `key={match.surahId-…}`, `key={tab.key}`). For static, non-reordering lists index keys are acceptable.

### 14.6 `memo` for heavy-but-static chrome

`SurahBanner` and `Footer` are wrapped in `memo` — their props barely change, so they skip re-rendering on every state twist elsewhere.

---

## 15. Common Mistakes — What to Watch For

### 15.1 Not awaiting `params` / `searchParams` in server components

```tsx
// WRONG — params is a Promise in Next 16 server components
export default async function Page({ params }) {
  const id = params.id;   // "promise is not defined"-style surprises
}
// RIGHT
const { id } = await params;
```

Same rule for `searchParams` in pages and route handlers.

### 15.2 Touching `localStorage` during render

The server doesn't have it, so this breaks hydration or just never works. Read storage in a **mount effect**, keep a `hydrated` flag, and guard writes with it (the exact shape in `useLocalStorageState`).

### 15.3 `useSearchParams()` without a `<Suspense>` wrapper

Next 16 requires the boundary. Copy the `SurahReader`/`SurahReaderInner` split if you add a new hook usage on a page.

### 15.4 Running dev/build without `--webpack`

Turbopack skips the serwist webpack hook → **no `public/sw.js`** → PWA silently broken. Always `next dev --webpack` / `next build --webpack`.

### 15.5 Importing the Supabase service key into a client component

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must stay server-side-only (route handlers). The browser goes through our `/api/*` route handlers, which add the `x-device-id` identity server-side.

### 15.6 Using `left`/`right` where RTL means `start`/`end`

An element positioned `left-0` reads wrong in an RTL doc. Use logical properties, and check where the sidebar is actually anchored (`right-0`) before "fixing" it.

### 15.7 Forgetting retry/backoff exists

`syncBackend` debounces 1.5s and retries up to 3× — a `fetch` to `/api/user-data` from your own test code should replicate this or the flags (`dhilal_sync_pending`) will disagree.

### 15.8 Hooks in conditionals / relying on stale setter state

Standard React food for thought from the old guide, still fully true here: hooks must run unconditionally every render, and `setState` values are only visible in the *next* render (use `useEffect` to react to changes).

---

## 16. The Full Lifecycle

```
A. BUILD TIME  (pnpm run build = next build --webpack)
   1. generateStaticParams()               → 114 surah ids
   2. For each id (+ "/"):
        await params → find surah → loadTafsirData() → getTafsirText(..., 'كاملة')
        → generateMetadata + JSON-LD Book  → render <SurahReader initialTafsirText={…}/>
        → static .html with FULL Arabic tafsir inlined
   3. @serwist/next compiles src/app/sw.ts  → public/sw.js (precache manifest baked in)
   4. sitemap.xml (115 URLs), robots.txt, manifest.webmanifest generated
        │
        ▼
B. REQUEST — visiting /surah/2
   1. Static HTML served instantly (no page code runs at request time)
   2. RootLayout: <html lang="ar" dir="rtl">, fonts, metadata
   3. (reader) layout: AppStateProvider → WorkstationShell
   4. surah/[id] page output: SurahReader with surah 2 + its tafsir as props
        │
        ▼
C. HYDRATION — the page comes alive
   1. React 19 resumes the DOM; client components become interactive
   2. ThemeProvider + useLocalStorageState hydrate from localStorage (mount-read, guarded writes)
   3. useDataSync → GET /api/user-data (x-device-id) → pulls cloud data → localStorage
   4. Service worker registers and takes control
        │
        ▼
D. INTERACTION
   • Click surah in sidebar → router.push('/surah/6')   → client-side navigation (no reload)
   • Click a tab → router.replace('?tab=verses')        → lazy chunk loads, tab animates in
   • Search "التوحيد" → loadTafsirData() (19MB chunk) → searchTafsir() → highlights → click → ?tab=verses
   • Bookmark / finish / toggle theme → localStorage.set → notifyChange → (1.5s debounce)
     → PUT /api/user-data → route handler → Supabase upsert(onConflict device_id)
        │
        ▼
E. PRODUCTION SERVING
   next start / Vercel: static pages + route handlers, service worker caches
   pages & /api/* NetworkFirst → reading works even offline
```

---

> **Next steps:** Want to get into the code? Start at the request path you just traced: `src/app/(reader)/surah/[id]/page.tsx` (server side) → `src/components/SurahReader.tsx` + `WorkstationShell.tsx` (client side). Then work outward through `src/context/AppStateContext.tsx`, the individual `src/hooks/*`, and the route handlers under `src/app/api/`.
>
> Revisit **Chapters 2 and 14** whenever a file's "where does this run?" is unclear, and **Chapter 15** for the traps most likely to bite.
>
> For deeper React patterns see [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md), and for the test suite see [`docs/TESTING.md`](./TESTING.md).