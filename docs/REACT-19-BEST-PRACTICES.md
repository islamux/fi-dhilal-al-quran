# React 19 Best Practices — Junior Reference

This is your onboarding guide. It covers not just React 19 patterns, but also **how this specific project works**, why it's built this way, and the framework decisions that shape it.

> **Who is this for?** Junior React developers joining the project. Read this first, then explore the code.

---

## Table of Contents
1. [Project Architecture](#1-project-architecture)
2. [App Lifecycle & Workflow](#2-app-lifecycle--workflow)
3. [Next.js App Router vs the old SPA](#3-nextjs-app-router-vs-the-old-spa)
4. [Component Patterns](#4-component-patterns)
5. [Hooks Patterns](#5-hooks-patterns)
6. [Testing](#6-testing)
7. [Styling with Tailwind CSS v4](#7-styling-with-tailwind-css-v4)
8. [Performance](#8-performance)
9. [Next.js 16 Gotchas](#9-nextjs-16-gotchas)
10. [Common Mistakes](#10-common-mistakes)

---

## 1. Project Architecture

### Big picture

```
Browser                      Next.js 16 (Node)
┌─────────────────┐   GET    ┌─────────────────────────────────┐
│  React(Vite-SPA │        │  App Router: Server Components    │
└─────────────────┘          │  + Client Components ('use client')│
                            │  Route Handlers: /api/*          │
                            │  SSG: all 114 /surah/[id] pages  │
                            │  PWA Service Worker (@serwist)    │
                            └─────────────────────────────────┘
       │
       │ All tafsir content is local JavaScript
       ▼
┌─────────────────────────────────────────┐
│  src/data/tafsir.ts   (~18MB, 110 surah) │
│  src/data/surahs.ts   (114 surahs + juz) │
└─────────────────────────────────────────┘
```

This is a **Next.js 16 App Router application** (React 19, TypeScript 6, Tailwind v4). It is **not** a Vite+Express SPA anymore — the app migrated in order to gain static generation (SSG), per-surah public URLs, SEO, and a unified deployment story on Vercel. The tafsir dataset still ships **entirely with the client**; there is no tafsir database or backend API for content.

### The App Router file hierarchy

Files in `src/app/` map directly to **routes**:

| Path | What it is |
|---|---|
| `src/app/layout.tsx` | **Root layout** — RTL `<html lang="ar" dir="rtl">`, Google Fonts (Amiri, Tajawal, Playfair Display, JetBrains Mono), `metadataBase` from `SITE_URL` (fallback `https://fi-dhilal-al-quran.vercel.app`), title template `%s — في ظلال القرآن`. Wraps everything in `<ErrorBoundary>` + `<ThemeProvider>`. |
| `src/app/(reader)/layout.tsx` | **Route group** `(reader)` — the client shell. Wraps children in `<AppStateProvider>` + `<WorkstationShell>`. The `(reader)` group keeps `/`, `/surah/[id]`, etc. under one layout without adding a URL segment. |
| `src/app/(reader)/page.tsx` | The canonical `/` route. Renders surah 1 (Al-Fatiha) via `<SurahReader surah={SURAHS[0]} initialTafsirText={...}/>`. |
| `src/app/(reader)/surah/[id]/page.tsx` | **SSG ×114.** `generateStaticParams()` returns all 114 ids; `generateMetadata` builds per-surah Arabic title/description/canonical/OpenGraph (`ar_AR`); server component `await`s `params`, loads tafsir at build time, embeds JSON-LD `<Book>` schema, renders `<SurahReader>`. `dynamicParams = true` + `notFound()` for unknown ids. |
| `src/app/manifest.ts` | Web app manifest (Arabic name, standalone, portrait, theme `#F27D26`, icons). Next auto-serves it at `/manifest.webmanifest`. Do **not** also set `metadata.manifest`. |
| `src/app/sw.ts` | Serwist Service Worker **source** — built by `@serwist/next` to `public/sw.js` (gitignored). |
| `src/app/sitemap.ts` | Sitemap of 115 URLs (all 114 surahs + `/`). |
| `src/app/robots.ts` | `robots.txt` + sitemap reference. |
| `src/app/api/*/route.ts` | **Route Handlers** (see below). |

### Server vs Client: the `'use client'` split

Next.js components are **Server Components by default** (async, run at build/request time). Any component that needs React state, `useEffect`, or browser APIs must opt in with a `'use client'` directive at the top of the file.

In this app:

- **Server** (no directive): `layout.tsx`, `(reader)/layout.tsx`, `(reader)/page.tsx`, `surah/[id]/page.tsx`, `manifest.ts`, `sitemap.ts`, `robots.ts`, all API route handlers. These do the SSG work — loading the tafsir data and resolving the initial text **before** the client ever hydrates.
- **Client** (`'use client'`): `WorkstationShell`, `SurahReader`, `AppStateContext`, `ThemeContext`, and the UI component tree (Sidebar, Header, tabs, etc.). "use client" here means the component boundary where hydration begins — everything below it runs in the browser.

The key contract is a **props handoff**: the server pre-renders the tafsir text and passes it to the client component as `initialTafsirText`, and the client reads the current surah from the route `params`.

### Tab-based navigation inside a surah

The per-surah screen uses **tab-based navigation** driven by the **URL query string** (`?tab=`):

```
SurahReader
├── Header           ← Title, theme toggle, bookmark buttons
├── SurahBanner      ← Surah name, type, verse count
├── TabBar           ← نظرة عامة | استعراض الآيَات | بحث في الظلال | سجل المُدارسة
└── Tab content (lazy-loaded + Suspense)
    ├── OverviewTab  ← Full surah tafsir
    ├── VersesTab    ← Verse-range selector + tafsir
    ├── ChatTab      ← Full-text search across all tafsir
    └── StatsTab     ← Bookmarks, history, progress
```

The active tab is derived from `useSearchParams().get('tab')` (`src/components/SurahReader.tsx:33-34`), not from React state. Changing tabs calls `router.replace(`?tab=...`)` so the tab is **shareable and survives reload**. Overview is the default (no `tab` param).

Note the sidebar's surah navigation resets to the overview tab (it pushes `/surah/{id}` without a tab); chat search results push `?tab=verses`.

### Directory structure

```
src/
  app/                     ← App Router (routes + layouts + API)
    layout.tsx             ← Root layout (RTL, fonts, providers, metadata)
    globals.css            ← Tailwind v4 entry + theme tokens
    manifest.ts            ← PWA web manifest
    sitemap.ts / robots.ts ← SEO
    sw.ts                  ← Serwist SW source (built to public/sw.js)
    (reader)/              ← Route group for the reading UI
      layout.tsx           ← AppStateProvider + WorkstationShell
      page.tsx             ← canonical / (Surah 1)
      surah/[id]/page.tsx  ← SSG ×114 per-surah page
    api/                   ← Route Handlers (the whole REST API)
      health/route.ts      ← GET {"status":"ok"}
      user-data/route.ts   ← GET/PUT (x-device-id header, Supabase upsert)
      user-data/export/route.ts  ← GET
      user-data/import/route.ts  ← POST
  components/              ← Client components
    WorkstationShell.tsx   ← Shell: sidebar + children; reads route params
    SurahReader.tsx        ← Per-surah reader; tab via ?tab=
    Sidebar.tsx            ← Surah list / Juz filter / search
    BrandStrip.tsx         ← Decorative strip (xl screens)
    Header.tsx / Footer.tsx
    MobileOverlay.tsx
    SectionSelector.tsx    ← Verse-range buttons
    TafsirDisplay.tsx / TafsirContent.tsx  ← Tafsir text rendering
    QuickSearch.tsx        ← Predefined search queries
    HighlightedText.tsx    ← Search match highlighting
    TabBar.tsx             ← Overview / Verses / Chat / Stats tabs
    SurahBanner.tsx
    ErrorBoundary.tsx      ← Class component crash catcher
    OverviewTab.tsx / VersesTab.tsx / ChatTab.tsx / StatsTab.tsx ← lazy tabs
  context/                 ← Client Contexts
    AppStateContext.tsx    ← Cross-surah state via useAppState()
    ThemeContext.tsx       ← Dark/light mode
  hooks/                   ← Custom hooks (React state + utils)
    useAppState.tsx (context) / useBookmarks / useProgress
    useChat.ts (exports useSearch) / useDataSync / useTafsir / useTheme
    useLocalStorageState.ts  ← Hydration-safe localStorage state
    useDeviceId.ts
  utils/                   ← Pure functions (zero React dependency)
    index.ts (toArabicNumerals) / search.ts / tafsir-data.ts
    tafsir-format.ts / highlight.ts / localStorage.ts / syncBackend.ts
  lib/
    supabase.ts           ← lazy singleton Supabase client (service_role key)
  data/                    ← Local content (auto-generated + hand-written)
    surahs.ts              ← 114 surah metadata + Juz index
    tafsir.ts              ← Tafsir content (~18MB, .gitignore'd)
    tafsir-meta.ts         ← SURAHS_WITH_TAFSIR Set for O(1) presence check
    tafsir-loader.ts       ← Dynamic import() singleton for lazy loading
  test/
    setup.ts               ← jest-dom matchers for all test files
```

> **Alias:** `@/` maps to the project root, so `@/src/types`, `@/src/data/surahs`, etc. resolve from anywhere.

### The unified API

Next.js **Route Handlers** serve the entire REST API — one code path for dev, prod, and Vercel (no `server.ts`, no separate `api/index.ts`, no `vercel.json`). Vercel auto-detects Next.js.

| Endpoint | Handler | Purpose |
|---|---|---|
| `GET /api/health` | `src/app/api/health/route.ts` | Healthcheck → `{"status":"ok"}` |
| `GET /api/user-data` | `src/app/api/user-data/route.ts` | Fetch user data from Supabase by `x-device-id` header |
| `PUT /api/user-data` | `src/app/api/user-data/route.ts` | Save user data (Supabase `upsert` on `device_id`) |
| `GET /api/user-data/export` | `export/route.ts` | Export all user data as JSON backup |
| `POST /api/user-data/import` | `import/route.ts` | Import user data from JSON backup |

Server-side Supabase access goes through `src/lib/supabase.ts` (`getSupabase()`, a lazy singleton configured with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).

---

## 2. App Lifecycle & Workflow

### What happens when a surah page is requested

```
1. Next.js resolves /surah/2 from the generated static pages (SSG).
2. Server component (surah/[id]/page.tsx) runs:
   a. await params (a Promise in Next 16) → id = 2
   b. lookup surah from SURAHS
   c. await loadTafsirData() → dynamic-import the 18MB tafsir chunk
   d. getTafsirText(2, data, 'كاملة') → resolve initial text synchronously
   e. embed JSON-LD <Book> schema
3. Server pre-renders HTML (SSG) at build time — tafsir text is in the HTML for SEO.
4. Client hydrates individual pages; server passes initialTafsirText to SurahReader as a prop.
5. WorkstationShell reads params via useParams to know which surah is selected in the sidebar.
```

Because pages are **static**, the heavy tafsir loading happens at **build time**, not per request — every page is pre-rendered HTML with its full Arabic text.

### User selects a different surah

```
1. User clicks a surah card in the Sidebar
2. onSelectSurah → router.push(`/surah/${id}`)  (WorkstationShell.tsx:31-35)
3. Next.js routes to the static page for that id (client-side navigation)
4. Server component runs, resolveSurah(params?.id) updates the sidebar highlight
5. ?tab is absent → the reader shows the overview tab
```

### User switches tabs inside a surah

```
1. User clicks a tab in TabBar
2. setActiveTab(tab) → router.replace(`?tab=verses`)
3. useSearchParams().get('tab') re-reads → activeTab changes
4. The matching lazy tab loads (Suspense fallback shows while loading)
5. No full page reload — the tab is in the URL so it's shareable
```

### User searches

```
1. User types a query in ChatTab input and clicks "بحث"
2. handleSearch(query) → setSearching(true) → spinner appears
3. setTimeout(50ms) → lets the spinner render, then:
   a. searchTafsir(query, TAFSIR_DATA, nameMap) → SearchMatch[]   (sync, local)
   b. setResults(matches) → results render
   c. setSearching(false) → spinner disappears
4. Clicking a result pushes ?tab=verses for that surah
```

The 50ms delay is intentional — it prevents the UI from freezing on large queries while the synchronous local search runs.

### User toggles theme

```
1. User clicks theme button in Header
2. toggleTheme() flips isDarkMode in ThemeContext state
3. ThemeProvider updates React context
4. Every component using useTheme() re-renders
5. After hydration, localStorageBackend.set('dhilal_theme', ...) persists the preference
```

No CSS class toggle — the theme is applied via conditional Tailwind classes (`isDarkMode ? 'bg-brand-dark-bg' : 'bg-brand-parchment'`).

### State management philosophy

No global state library (Redux, Zustand, Jotai). State lives in:

| Scope | Mechanism | Example |
|---|---|---|
| Component-local | `useState` | `searchInput` |
| Per-route | URL (`params` / `searchParams`) | `selectedSurah` from `/surah/[id]`, `activeTab` from `?tab=` |
| Shared (many components, cross-surah) | React Context | `AppStateProvider` via `useAppState()` |
| App-wide theme | React Context | `isDarkMode` via `ThemeProvider` |
| Persistent | `localStorage` (+ Supabase sync) | Bookmarks, history, completion, theme |

The `useAppState()` hook (`src/context/AppStateContext.tsx`) composes the sub-hooks — `useBookmarks`, `useProgress`, `useSearch`, `useDataSync` — plus local UI state (sidebar filters, mobile overlay, search query) into one return value. Each sub-hook manages its own slice independently.

### The "no-tafsir-API" guarantee

Every piece of **content** in this app is **local**:
- Tafsir text → server-side `src/data/tafsir.ts` (lazy-loaded chunk)
- Surah metadata → `src/data/surahs.ts`
- Bookmarks/history/completion → `localStorage`, then synced to Supabase
- Search → runs on the client against local data

The **only** network requests are: the initial page load, the `/api/user-data/*` sync calls (debounced), and Google Fonts. No tafsir/content ever comes from the network.

### Data sync architecture (user data only)

- **localStorage** (immediate): `dhilal_theme`, `dhilal_bookmarks`, `dhilal_history`, `dhilal_completed`, `dhilal_device_id`.
- **Supabase** (debounced 1.5s via `syncBackend.ts`, up to 3 retries with exponential backoff): synced through `src/utils/syncBackend.ts`.
- Device ID = `crypto.randomUUID()` stored in localStorage, sent as the `x-device-id` header for every `/api/user-data` call.
- **Hydration safety:** `localStorageBackend` (in `src/utils/localStorage.ts`) is SSR-guarded, and `useLocalStorageState` (in `src/hooks/useLocalStorageState.ts`) uses a mount-read + hydrated save-guard so we never read/write `localStorage` during SSR — avoiding hydration mismatches. The hooks using it (`useBookmarks`, `useProgress`, `ThemeContext`, `useDataSync`, `useDeviceId`) follow this pattern.

---

## 3. Next.js App Router vs the old SPA

The app **migrated from a Vite+Express SPA to Next.js 16 App Router**. If you look at older docs or git history, the project used to be a single-page app with one React root (`main.tsx` / `App.tsx`), no router, and an Express server (`server.ts`) that only served `index.html` and `/api/health`. That is all gone. Here is what changed and why.

### What changed

| Aspect | Old (Vite SPA + Express) | New (Next.js App Router) |
|---|---|---|
| Entry point | `main.tsx` mounts `<App/>` into the DOM | `src/app/layout.tsx` is the root layout; route files are the pages |
| Routing | Tab state via `useState`, no URLs | File-based routing + `?tab=` query for tabs |
| Surah pages | One screen, `selectedSurah` in state | **SSG ×114** at `/surah/[id]` — shareable, indexed |
| Server | Separate Express `server.ts` | Next.js server + **Route Handlers** (`app/api/*`) |
| Renders | Client-only SPA | Server Components (SSG) + Client Components |
| SEO | None | Per-surah `generateMetadata`, sitemap, robots, JSON-LD |
| Deploy | `vercel.json` forced a Vite `dist` output | Vercel auto-detects Next.js — no `vercel.json` |
| PWA | Vite/other | `@serwist/next` + `serwist` service worker |

### Why the migration was worth it

| Requirement | Old SPA | Next.js App Router |
|---|---|---|
| Public URLs per surah | ✗ (tab state only) | ✓ `/surah/{id}` pages exist statically |
| SEO / indexed tafsir | ✗ | ✓ server-rendered HTML with full Arabic text |
| Sharing a specific tab | ✗ | ✓ `?tab=verses` is in the URL |
| Fast first paint on huge content | Full JS bundle parse | Static HTML arrives instantly, hydrates after |
| Long-term hosting on Vercel | Awkward (`vercel.json` hack) | Native, one code path |

### Data handling comparison (didn't change conceptually)

The old doc said "data is synchronous and local, no network"; that premise is **unchanged** — only *where* the data is loaded changed:

```tsx
// ✅ Now: loaded server-side at build time (SSG), passed to the client as a prop
export default async function SurahPage({ params }) {
  const { id } = await params;                        // params is a Promise in Next 16
  const surah = SURAHS.find(s => s.id === Number(id));
  const data = await loadTafsirData();                // dynamic import, singleton promise
  const tafsirText = getTafsirText(surah.id, data, 'كاملة');
  return <SurahReader surah={surah} initialTafsirText={tafsirText} />;
}
```

The tafsir is still a local file — there is no tafsir API endpoint, no database for the content, no search index on a server.

### API comparison

```tsx
// ✅ Now: a Route Handler (no Express)
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

Route Handlers are the App Router's replacement for Express endpoints. All request/response logic for the app now lives in `src/app/api/*/route.ts`.

### Would you want a fully client-only SPA again?

Rarely. If you ever needed to strip out React Server Components, the tab state and routing could fall back to `useState` + `useSearchParams`. But the current app deliberately relies on the App Router for static generation, per-surah URLs, SEO, and the unified deployment — there is no reason to go back.

---

## 4. Component Patterns

### Server vs Client by default

- **Default = Server Component.** No directive means the file runs on the server at build/request time. Good for loading data, computing text, and producing static HTML.
- **Add `'use client'`** at the very top of any file that needs state, hooks, or browser APIs (all the interactive UI). `'use client'` marks the boundary where hydration starts; everything imported below it is treated as client code.
- Keep **most components presentational** and read state via hooks/context rather than doing work at render time.

### Eager vs lazy loading

Feature tabs are lazy-loaded so each tab's code loads on demand (`src/components/SurahReader.tsx:15-18`):

```tsx
const OverviewTab = lazy(() => import('./OverviewTab').then(m => ({ default: m.OverviewTab })));
```

Because the components are **named exports**, the wrapper remaps them to `default` for `React.lazy`. Generic component guidance below still applies.

### Props interface at top of file
```tsx
interface SurahReaderProps {
  surah: Surah;
  initialTafsirText: string | null;
}
```

- Name it `{ComponentName}Props`
- Place it right above the component
- Use `interface` (preferred) over `type` for props

### Destructure props inline
```tsx
// ✅ Preferred
export function SurahReader({ surah, initialTafsirText }: SurahReaderProps) {
```

### Named exports (except lazy remapping)
Keep **named exports** for consistency — grepable, refactorable. `React.lazy` requires a default export, so lazy files remap the named export explicitly (as above) rather than converting the source to a default export.

### Conditional rendering without ternary overload
If more than 2 branches, extract to a variable or helper:

```tsx
// ✅ Clear — tabs switch on activeTab
{activeTab === 'overview' && <OverviewTab ... />}
{activeTab === 'verses' && <VersesTab ... />}

// ❌ Hard to read nested ternary
```

### The container/shell pattern
`WorkstationShell` (`src/components/WorkstationShell.tsx`, `'use client'`) is the layout shell: it resolves the selected surah from the route `params`, renders the sidebar, and wraps `{children}` (whatever surah page Hydration rendered). Client children are rendered as `{children}` — a normal prop — not a portal.

---

## 5. Hooks Patterns

### Custom hooks start with `use`
```tsx
export function useBookmarks() { ... }
export function useTafsir() { ... }
export function useAppState() { ... }
```

### Keep hooks focused
One hook = one concern. If your hook manages two unrelated pieces of state, split it:

```tsx
// ✅ Separate concerns
export function useTheme() { ... }     // dark/light mode
export function useBookmarks() { ... } // saved bookmarks
export function useProgress() { ... }  // reading history + completion
export function useSearch() { ... }    // chat search
export function useDataSync() { ... }  // cloud sync state

// ❌ One giant useDashboard hook with theme + bookmarks + history + stats
```

### Extract pure logic from hooks
Business logic that doesn't need React state belongs in `src/utils/`:

```tsx
// ✅ Pure function in utils/search.ts
export function searchTafsir(query: string, ...): SearchMatch[] { ... }

// Hook only manages UI state
export function useSearch() {
  const [results, setResults] = useState<SearchMatch[]>([]);
  const handleSearch = (query: string) => {
    setResults(searchTafsir(query, ...));
  };
}
```

This makes the logic testable without rendering a component. Same idea: `getTafsirText` (utils) vs `useTafsir` (hook), `localStorageBackend` (utils) vs `useLocalStorageState` (hook).

### Context hooks must be inside their provider
`useAppState()` and `useTheme()` throw if called outside their provider (`AppStateContext.tsx:70-73`, `ThemeContext.tsx:37-40`). This is a deliberate guard — it surfaces mistakes at development time instead of silently returning `null`.

### State initializers
Use lazy initializer for expensive computations:

```tsx
// ✅ Runs once
const [data] = useState(() => expensiveComputation());
```

### useRef for mutable values (not useState)
```tsx
// ✅ Timer handle
const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

// ✅ DOM ref (null initial value)
const inputRef = useRef<HTMLInputElement>(null);
```

The chat tab keeps a `bottomRef` (auto-scroll target) via context — a shared ref object across renders.

### useEffect dependency discipline
Include every value the effect reads. Omit stable functions and refs:

```tsx
// ✅ Complete dependency array
useEffect(() => {
  setIsDarkMode(localStorageBackend.get<string>('dhilal_theme') !== 'light');
  setHydrated(true);
}, []);
```

### Hydration-safe persistent state
For anything stored in `localStorage`, use `useLocalStorageState` (or the equivalent mount-read + hydrated-guard pattern in `ThemeContext`). It:
1. Mounts with a default value (never reads `localStorage` during SSR),
2. Reads the stored value on mount (first `useEffect`), then
3. Only writes back **after** hydration (`if (hydrated)`).

This prevents the classic hydration mismatch between the server-rendered HTML and the first client render. Never call `localStorage` directly at render time.

---

## 6. Testing

### Vitest + Testing Library
```bash
pnpm test            # Run once (vitest run)
pnpm run test:watch  # Watch mode (vitest)
```

Colocated `*.test.ts(x)` files, jsdom environment, **117 tests across 13 files** pass. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` for matchers like `toBeInTheDocument()`. `vitest.config.ts` is standalone (jsdom, `@vitejs/plugin-react`, `@` → `.` alias); it does **not** interfere with the Next.js build.

### Test file naming
Place test files next to their source:

```
src/utils/search.ts          → src/utils/search.test.ts
src/hooks/useLocalStorageState.ts → src/hooks/useLocalStorageState.test.ts
src/components/SurahReader.tsx  → src/components/SurahReader.test.tsx
```

### Pure function tests (no React needed)
```tsx
// src/utils/search.test.ts
import { describe, it, expect } from 'vitest';
import { searchTafsir } from './search';

describe('searchTafsir', () => {
  it('returns empty array for empty query', () => {
    expect(searchTafsir('', {}, new Map())).toEqual([]);
  });
});
```

### Mocking Next.js navigation in component tests
The client components use `useRouter` / `useParams` / `useSearchParams` from `next/navigation`. In tests, mock that module with `vi.mock` and return controllable fns (`src/components/WorkstationShell.test.tsx:9-19`, `src/components/SurahReader.test.tsx:13-23`):

```tsx
const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn() }),
  useParams: () => ({ id: '2' }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));
```

Then assert on the mocked calls:
```tsx
fireEvent.click(surahCard(1));
expect(push).toHaveBeenCalledWith('/surah/1');
```

### Component test query hooks
To make components testable, they expose stable `id` hooks:
- Surah cards: `id={"surah-card-" + surah.id}` (`Sidebar.tsx:175`) — test helper `surahCard(id)` reads `document.getElementById(...)`.
- Tabs: `id={"tab-" + tab.key}` (`TabBar.tsx:22`).

Prefer querying by accessible role/name (`getByRole('button', { name })`) for real user-facing behaviour, and these `id`s for structural assertions.

### Full component test example
```tsx
it('switching to the verses tab updates the tab query param', async () => {
  const user = userEvent.setup();
  renderReader();
  await user.click(screen.getByRole('button', { name: 'استعراض الآيَات' }));
  expect(replace).toHaveBeenCalledWith('?tab=verses');
});
```

---

## 7. Styling with Tailwind CSS v4

### Tailwind v4 setup
Tailwind CSS v4 is wired through `@tailwindcss/postcss` (PostCSS plugin), with the entry CSS in `src/app/globals.css`. No `tailwind.config.js` needed for the default setup.

### No CSS modules or styled-components
All styles use Tailwind utility classes directly in JSX. `motion` (the successor to framer-motion) handles animations — `motion/react` provides `motion`, `AnimatePresence`, and the reader uses `<AnimatePresence mode="wait">` to cross-fade between tabs.

### Dark mode pattern
This project uses React Context for theme:

```tsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { isDarkMode } = useTheme();
  return (
    <div className={`${isDarkMode ? 'bg-brand-dark-bg' : 'bg-brand-parchment'}`}>
      ...
    </div>
  );
}
```

The `isDarkMode` boolean comes from `ThemeContext` (hydrated from `dhilal_theme`) — no prop drilling needed. Default theme is **dark**.

### Color palette
Use the semantic color tokens defined in `globals.css`:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-brand-dark-bg` / `bg-brand-parchment` | `#FAF9F6` | `#1a1a1a` | Page background |
| `bg-brand-stone` / `bg-brand-dark-surface` | `#F2EFE9` | `#151515` | Card/section background |
| `text-brand-rich` / `text-brand-dark-active` | `#0E0E0E` | `#E0E0E0` | Primary text |
| `text-gilded-gold` | `#F27D26` | `#F27D26` | Accent (same in both) |
| `border-brand-border` / `border-brand-dark-border` | `#E0DCD3` | `#2A2A2A` | Borders |

Brand accent `#F27D26` is used throughout and also as the PWA theme color.

### RTL support
App is `dir="rtl"` (`src/app/layout.tsx`). Mind CSS logical properties:
- Prefer `start`/`end`-aware utilities where available
- `gap-*` instead of margins on flex items when possible
- `border-r` / `border-l` don't auto-flip — use logical border utilities or test in RTL

### Fonts
Loaded from Google Fonts in the root layout's `<head>`: **Amiri** (Arabic body/serif), **Tajawal** (Arabic sans), **Playfair Display** (Latin display), **JetBrains Mono** (numerals). Use `font-serif`/`font-mono` classes and specify logical faces so Arabic and Latin render their intended glyph sets.

---

## 8. Performance

### Tafsir data is lazy-loaded (not in the main bundle)
The tafsir dataset (~18MB) is **lazy-loaded** via dynamic `import()` in `src/data/tafsir-loader.ts`. It is NOT in the main bundle — it loads only when first needed (at SSG build time on the server, cached after):

```ts
let dataPromise: Promise<Record<number, TafsirSection[]>> | null = null;

export function loadTafsirData(): Promise<Record<number, TafsirSection[]>> {
  if (!dataPromise) {
    dataPromise = import('./tafsir').then(m => m.TAFSIR_DATA)
      .catch(err => { dataPromise = null; throw err; });
  }
  return dataPromise;
}
```

Notes:
- On the server (SSG) it's loaded once at **build time**; each page embeds the already-resolved text.
- On the client it loads once and stays in memory (singleton promise pattern).
- Between build and runtime, Next code-splits it into its own lazy chunk, separate from the main app bundle.
- The tafsir chunk is emitted as a separate lazy-loaded chunk (~19MB).

### Search runs on the main thread
The search algorithm iterates all sections synchronously in `src/utils/search.ts`. A 50ms `setTimeout` lets the loading spinner render before the search begins. If search becomes noticeably slow on large queries, the next step is a Web Worker (`search.worker.ts`).

### Code splitting with lazy() + Suspense
Feature tabs use `React.lazy()` + `<Suspense>` (in `SurahReader.tsx`), so each tab's code loads on demand and a spinner shows during load. The `useSearchParams()` consumer (`SurahReaderInner`) is wrapped in an outer `<Suspense>` to satisfy Next's requirement (see Gotchas below).

### SSG keeps first paint fast
All 114 surah pages are static — the browser receives pre-rendered HTML containing the full Arabic tafsir text, no client-side data fetch required to see content.

### Avoid unnecessary re-renders
- Don't create new objects/arrays in render props or context values without `useMemo`
- Don't inline arrow functions in JSX if the child component is memoized
- Use `useCallback` for handlers passed to child components (when needed — don't add it preemptively)

### Layout: `max-w-5xl` centering
The reader content wrapper uses a centered max-width container keeping lines at a readable length (~14-18 Arabic words per line on desktop). If text looks narrow, check font size (`text-base` minimum), mobile padding (`px-3`/`px-4`), and the sidebar width.

---

## 9. Next.js 16 Gotchas

These bite everyone — read carefully.

### `params` and `searchParams` are Promises
In Next.js 16, `params` and `searchParams` (in pages, layouts, and `generateMetadata`) are **Promises**. You must `await` them:

```tsx
// ✅ Correct
export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```
```tsx
// ❌ Wrong — params is not the object itself anymore
export default function SurahPage({ params }: { params: { id: string } }) {
  const { id } = params;
}
```

### `useSearchParams()` consumers need `<Suspense>`
Any client component using `useSearchParams()` must be wrapped in a `<Suspense>` boundary, otherwise it can trigger a pre-render bailout. `SurahReader` handles this by rendering `<SurahReaderInner>` (the consumer) inside a `<Suspense>` fallback (`SurahReader.tsx:121-127`). The reader layout / root already account for this.

### RTL layout — mind `start`/`end`
The whole app is RTL. Prefer logical properties (`start`/`end`, `gap-*`) over physical `left`/`right` so the layout stays correct in both directions.

### Manifest is auto-served
`app/manifest.ts` auto-serves `/manifest.webmanifest` and injects its `<link>`. Do **not** also set `metadata.manifest` (that would conflict/duplicate).

### The `--webpack` flag is mandatory
`dev`/`build` scripts run `next dev --webpack` / `next build --webpack`. This is **NOT** optional and Turbopack must NOT be used: `@serwist/next` only builds the Service Worker through the webpack build hook. Turbopack bypasses it and no `public/sw.js` is emitted. Always keep `--webpack`.

### `@` alias
`@/` maps to the project root (e.g. `@/src/types`). Use it instead of brittle relative paths. It's configured in `tsconfig.json` for the app and mirrored in `vitest.config.ts` for tests.

### SSG + `dynamicParams`
`surah/[id]/page.tsx` returns all 114 ids from `generateStaticParams()` and sets `dynamicParams = true`, calling `notFound()` for unknown ids. This means: known ids are statically generated, unknown ids 404, and new ids are generated on demand. Don't remove `dynamicParams = true` unless you want unknown ids to 404 immediately with no on-demand generation.

### Server-rendered Arabic is in the HTML
Because tafsir text is resolved server-side at build time, full Arabic content is present in the static HTML — that's what makes SEO/JSON-LD meaningful. Don't move content resolution to the client, or you lose this.

---

## 10. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `'use client'` on an interactive component | Add `'use client'` at the top; remember Server Components are the default |
| Treating `params` as an object (not a Promise) | `await params` in Next 16 (`params`, `searchParams`) |
| Using `useSearchParams()` without a `<Suspense>` wrapper | Wrap the consumer in `<Suspense>` |
| Running `next dev/build` without `--webpack` | Always keep `--webpack` — otherwise no `sw.js` is emitted |
| Setting `metadata.manifest` alongside `app/manifest.ts` | Don't — it duplicates the auto-injected manifest link |
| Reading/writing `localStorage` during render/SSR | Use `localStorageBackend` + `useLocalStorageState` (mount-read + hydrated save-guard) |
| Calling `useRef` outside a component | Refs only work inside hooks/components |
| Putting business logic in components | Extract to `utils/` for testability |
| Putting the active tab in state instead of the URL | Keep it in `?tab=` via `useSearchParams` — shareable + survives reload |
| Adding Redux before you have 5+ shared state slices | Start with `useState` + props, add Context when drilling hurts, add Redux only if needed |
| Mocking `next/navigation` in tests without `vi.mock` | Components using `useRouter`/`useParams`/`useSearchParams` need the `vi.mock('next/navigation', ...)` shim (WorkstationShell/SurahReader tests) |
| Mixing Arabic and English fonts without specifying `font-family` for each | Use `font-serif` for Arabic body, `font-mono` for numerals |
| `useRef<Type>()` without initial value | Provide `undefined` explicitly: `useRef<Type \| undefined>(undefined)` |
| `toLowerCase()` on Arabic strings | Harmless but pointless — Arabic has no case |
| Hardcoded placeholder content (fake verses, mock data) | Remove or replace with real data |
| Adding abstractions (interfaces, factories) for one use case | Don't — YAGNI. Inline until a second caller exists |

---

## Resources

- [React 19 docs](https://react.dev/blog/2024/12/05/react-19)
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Vitest docs](https://vitest.dev/guide/)
- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs/installation)
- [Motion docs](https://motion.dev/) (animation library, `motion/react`)
- [Serwist docs](https://serwist.pages.dev/) (PWA service worker)
- [Supabase JS docs](https://supabase.com/docs/reference/javascript/introduction) (user-data sync)
