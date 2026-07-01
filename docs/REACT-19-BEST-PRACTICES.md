# React 19 Best Practices — Junior Reference

This is your onboarding guide. It covers not just React 19 patterns, but also **how this specific project works**, why it's built this way, and how it compares to alternatives like Next.js.

> **Who is this for?** Junior React developers joining the project. Read this first, then explore the code.

---

## Table of Contents
1. [Project Architecture](#1-project-architecture)
2. [App Lifecycle & Workflow](#2-app-lifecycle--workflow)
3. [Next.js Comparison](#3-nextjs-comparison)
4. [Component Patterns](#4-component-patterns)
5. [Hooks Patterns](#5-hooks-patterns)
6. [Testing](#6-testing)
7. [Styling with Tailwind CSS v4](#7-styling-with-tailwind-css-v4)
8. [Performance](#8-performance)
9. [Common Mistakes](#9-common-mistakes)

---

## 1. Project Architecture

### Big picture

```
Browser                    Express Server (Node)
┌─────────────────┐        ┌──────────────────────┐
│  React SPA       │  GET  │  Serves index.html    │
│  (Vite bundle)   │──────>│  Serves static assets │
│                  │<──────│  API: /api/health     │
└─────────────────┘        └──────────────────────┘
       │
       │ All data is local JavaScript
       ▼
┌─────────────────────────────────────────┐
│  src/data/tafsir.ts   (~18MB, 110 surah) │
│  src/data/surahs.ts   (metadata + juz)  │
└─────────────────────────────────────────┘
```

This is a **Single-Page Application (SPA)**. There is **one HTML page**, one React root, and no page navigation. The Express server's only job is:

| Route | What it does |
|---|---|
| `GET /` | Serves `index.html` (the React SPA) |
| `GET /assets/*` | Serves compiled JS/CSS from Vite build |
| `GET /api/health` | Returns `{ status: 'ok' }` |
| any other | Falls through to `index.html` (SPA fallback) |

### No router

There is **no React Router, no pages, no SSR**. The app uses **tab-based navigation** within a single view:

```
App
├── Sidebar        ← Surah picker, Juz filter, search
└── MainContent
    ├── Header     ← Title, theme toggle, bookmark buttons
    ├── SurahBanner ← Surah name, type, verse count
    ├── TabBar     ← Overview | Verses | Chat | Stats
    └── Tab content (lazy-loaded)
        ├── OverviewTab  ← Full surah tafsir
        ├── VersesTab    ← Verse-range selector + tafsir
        ├── ChatTab      ← Full-text search across all tafsir
        └── StatsTab     ← Bookmarks, history, progress
```

Tab state is just `useState<'overview' | 'verses' | 'chat' | 'stats'>` — no URL params, no routing library.

### Data flow

```
src/data/tafsir.ts (static import)
        │
        ▼
   Pure functions (src/utils/)
   ├── search.ts      ← searchTafsir(query, data) → SearchMatch[]
   ├── tafsir-data.ts  ← getTafsirText(surahId, data, range) → string | null
   └── localStorage.ts ← StorageBackend abstraction
        │
        ▼
   Custom hooks (src/hooks/)
   ├── useSearch()    ← manages query/results state, calls searchTafsir
   ├── useTafsir()    ← manages tafsirText state, calls getTafsirText
   ├── useBookmarks() ← manages bookmarks via localStorage
   ├── useProgress()  ← manages history/completion via localStorage
   └── useTheme()     ← manages dark/light via localStorage + context
        │
        ▼
   Components receive state + handlers as props
```

Key insight: **Pure functions → hooks → components**. Pure functions are testable without React. Hooks bridge them to React state. Components are just UI.

### Directory structure

```
src/
  App.tsx              ← Root: Sidebar + MainContent layout
  main.tsx             ← Entry point: mounts <App /> in DOM
  types.ts             ← TypeScript interfaces
  utils/               ← Pure functions (zero React dependency)
    index.ts           ← toArabicNumerals()
    search.ts          ← Full-text search
    tafsir-data.ts     ← Tafsir data lookup
    localStorage.ts    ← StorageBackend interface + implementations
  hooks/               ← Custom hooks (React state + utils)
    useAppState.ts     ← Combines all sub-hooks + shared state
    useTafsir.ts       ← Uses getTafsirText from utils
    useChat.ts         ← Uses searchTafsir from utils
    useBookmarks.ts    ← Uses StorageBackend
    useProgress.ts     ← Uses StorageBackend
    useTheme.ts        ← Re-exports useTheme from context
  context/
    ThemeContext.tsx    ← Provides isDarkMode + toggleTheme to all components
  components/          ← One file per component
    MainContent.tsx    ← Header + SurahBanner + TabBar + lazy tabs + Footer
    Sidebar.tsx        ← Surah list / Juz list
    Header.tsx         ← Top bar with actions
    BrandStrip.tsx     ← Left decorative strip (xl screens)
    MobileOverlay.tsx  ← Backdrop overlay for mobile sidebar
    SectionSelector.tsx ← Verse range buttons (extracted from VersesTab)
    TafsirDisplay.tsx  ← Tafsir text rendering
    QuickSearch.tsx    ← Predefined search queries
    ...
  data/                ← Local content (auto-generated + hand-written)
    surahs.ts          ← 114 surah metadata + Juz index
    tafsir.ts          ← Tafsir content (~18MB, .gitignore'd)
  test/
    setup.ts           ← jest-dom matchers for all test files
```

---

## 2. App Lifecycle & Workflow

### Startup sequence (what happens when the page loads)

```
1. Browser requests page → Express serves index.html
2. Vite-bundled main.tsx executes
3. React mounts <App /> inside <ThemeProvider> + <ErrorBoundary>
4. useAppState() initializes:
   a. selectedSurah = SURAHS[0] (Al-Fatiha)
   b. activeTab = 'overview'
   c. Sub-hooks initialize (useBookmarks reads localStorage, etc.)
5. useEffect runs: fetchTafsir(Al-Fatiha, 'كاملة')
6. getTafsirText(1, TAFSIR_DATA, 'كاملة') finds content synchronously
7. setTafsirText updates state → OverviewTab re-renders with tafsir text
8. User sees: sidebar + surah banner + tafsir text of Al-Fatiha
```

Everything after step 4 is synchronous (data is local, no network calls).

### User selects a different surah

```
1. User clicks surah in sidebar
2. setSelectedSurah(newSurah) triggers re-render
3. useEffect detects selectedSurah changed → runs effect:
   a. fetchTafsir(newSurah, 'كاملة')
   b. addHistoryItem(newSurah) → localStorage write
   c. setVerseRangeValue('كاملة') reset
4. Lazy-loaded tabs re-render with new data
5. Sidebar updates highlight to new surah
```

### User searches

```
1. User types query in ChatTab input
2. Clicks "بحث" button → handleSearch(query)
3. setSearching(true) → loading spinner appears
4. setTimeout(50ms) → lets spinner render, then:
   a. searchTafsir(query, TAFSIR_DATA, nameMap) → SearchMatch[]
   b. setResults(matches) → results render
   c. setSearching(false) → spinner disappears
```

The 50ms delay is intentional — it prevents the UI from freezing on large queries while the synchronous search runs.

### User toggles theme

```
1. User clicks theme button in Header
2. toggleTheme() flips isDarkMode in context state
3. ThemeProvider updates React context
4. Every component using useTheme() re-renders
5. localStorage.setItem('dhilal_theme', 'dark'|'light') persists preference
```

No CSS class toggle — the theme is applied via conditional Tailwind classes (`isDarkMode ? 'bg-dark' : 'bg-light'`).

### State management philosophy

No global state library (Redux, Zustand, Jotai). State lives in:

| Scope | Mechanism | Example |
|---|---|---|
| Component-local | `useState` | `searchInput`, `activeTab` |
| Shared (few components) | Props threading | `selectedSurah` passed from App → Sidebar + MainContent |
| App-wide | React Context | `isDarkMode` via `ThemeProvider` |
| Persistent | `localStorage` | Bookmarks, history, completion, theme preference |

The `useAppState()` hook collects all sub-hooks into one return value for convenience, but each sub-hook manages its own slice of state independently.

### The "no-API" guarantee

Every piece of data in this app is **local**. There are zero network requests for content:
- Tafsir text → imported from `src/data/tafsir.ts`
- Surah metadata → imported from `src/data/surahs.ts`
- Bookmarks/history → read/written to `localStorage`
- Search → runs on the client against local data

The only network request is the initial page load (index.html + JS bundles).

---

## 3. Next.js Comparison

### Why this project is NOT Next.js

This project is a **local-first reading/study tool**, not a website that needs SEO, server rendering, or dynamic routes. The entire dataset ships with the app.

| Requirement | This project | Next.js alternative |
|---|---|---|
| Data location | Client-side (18MB JS import) | Server-side (database or files) |
| Page routes | Tab-based (no routes) | `app/surah/[id]/page.tsx` |
| Search | Client-side (sync) | Server API + database index |
| SSR needed? | No (private tool) | Yes (public website) |
| Bundle size | Large (18MB) but acceptable | Smaller (stream content) |

### Code comparison: Routing

```tsx
// ✅ This project: no router, tab state only
const [activeTab, setActiveTab] = useState('overview');
// Tabs render conditionally:
{activeTab === 'verses' && <VersesTab />}

// ❌ Next.js would use file-based routing:
// app/surah/[id]/page.tsx
export default function SurahPage({ params }: { params: { id: string } }) {
  return <TafsirView surahId={params.id} />;
}
```

For this app, routes would be overkill. There's no public URL to share for a specific tab, and the sidebar + main content layout is always visible.

### Code comparison: Data fetching

```tsx
// ✅ This project: synchronous data from local JS
import { TAFSIR_DATA } from '../data/tafsir';
const text = getTafsirText(surahId, TAFSIR_DATA, 'كاملة');

// ❌ Next.js would fetch from an API or database:
export async function getTafsir(surahId: number) {
  const res = await fetch(`/api/tafsir/${surahId}`, { cache: 'force-cache' });
  return res.json();
}
// Or using server components:
export default async function Page({ params }) {
  const tafsir = await db.query.tafsir.findFirst({ where: ... });
  return <TafsirView data={tafsir} />;
}
```

The synchronous approach is simpler and faster — no loading states, no network errors, no caching strategy.

### Code comparison: API routes

```tsx
// ✅ This project: Express endpoint (healthcheck only)
server.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ❌ Next.js: API routes in app/api/
// app/api/tafsir/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const text = await readTafsirFromFile(parseInt(params.id));
  return Response.json({ text });
}
```

### When WOULD you use Next.js?

| Scenario | Use Next.js because |
|---|---|
| You need SEO | Search engines need server-rendered HTML |
| You need public URLs per surah/verse | File-based routing gives free URL structure |
| You have a database | Server components fetch data efficiently |
| You need image optimization | Next.js `<Image>` component |
| You need middleware/auth | Next.js middleware runs at the edge |
| You're building a public website | SSR improves first-load performance |

### When is an SPA better?

| Scenario | SPA wins because |
|---|---|
| Private/internal tool | No SEO needed |
| Large local dataset | No network latency for data |
| Offline-capable app | Everything is in the browser |
| Simple UI with tabs/panels | No routing complexity |
| Single-user tool | No server-side state |

### Hybrid approach (what you'd do for v2)

If this project ever needed public URLs per surah, you could:

```tsx
// Keep the React SPA architecture, but add a lightweight router:
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/', element: <App /> },          // Current layout
  { path: '/surah/:id', element: <App /> }, // Same app, different initial state
]);
```

You wouldn't need Next.js — you'd just add React Router and initialize `selectedSurah` from the URL param on startup. The app would still be an SPA, but now with shareable URLs.

### Verdict for this project

**Next.js would add complexity without benefit.** The 18MB tafsir dataset would need to be split across API endpoints or a database. Search would require a server-side index. The build would be more complex. And for what? This is a personal study tool, not a public website.

---

## 4. Component Patterns

### Default exports for lazy loading
Components loaded via `React.lazy()` must be default exports:

```tsx
// ✅ Correct — can use with lazy()
export default function App() { ... }

// In parent:
const App = lazy(() => import('./App')); // works

// ❌ Won't work:
export function App() { ... }
const App = lazy(() => import('./App').then(m => ({ default: m.App }))); // awkward
```

### Props interface at top of file
```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

- Name it `{ComponentName}Props`
- Place it right above the component
- Use `interface` (preferred) over `type` for props

### Destructure props inline
```tsx
// ✅ Preferred
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {

// ❌ Avoid
export function Button(props: ButtonProps) {
  const { label, onClick } = props;
```

### No default exports for non-lazy components
Keep named exports for consistency — grepable, refactorable:

```tsx
export function Sidebar(props: SidebarProps) {
// Import: import { Sidebar } from './Sidebar';
```

### Conditional rendering without ternary overload
If more than 2 branches, extract to a variable or helper:

```tsx
// ✅ Clear
const content = isError ? <Error /> : data ? <DataView data={data} /> : <Loading />;
return <div>{content}</div>;

// ❌ Hard to read
return <div>{isError ? <Error /> : data ? <DataView /> : loading ? <Loading /> : null}</div>;
```

---

## 5. Hooks Patterns

### Custom hooks start with `use`
```tsx
export function useBookmarks() { ... }
export function useTafsir() { ... }
```

### Keep hooks focused
One hook = one concern. If your hook manages two unrelated pieces of state, split it:

```tsx
// ✅ Separate concerns
export function useTheme() { ... }    // dark/light mode
export function useBookmarks() { ... } // saved bookmarks
export function useProgress() { ... } // reading history + completion

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

This makes the logic testable without rendering a component.

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

### useEffect dependency discipline
Include every value the effect reads. Omit stable functions and refs:

```tsx
// ✅ Complete dependency array
useEffect(() => {
  fetchTafsir(selectedSurah, 'كاملة');
}, [selectedSurah]); // only selectedSurah changes trigger re-run
```

---

## 6. Testing

### Vitest + Testing Library
```bash
pnpm run test        # Run once
pnpm run test:watch  # Watch mode
```

### Test file naming
Place test files next to their source:

```
src/utils/search.ts          → src/utils/search.test.ts
src/hooks/useBookmarks.ts    → src/hooks/useBookmarks.test.ts
src/components/Button.tsx    → src/components/Button.test.tsx
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

  it('finds matching sections', () => {
    const data = { 1: [{ startVerse: 1, endVerse: 1, text: 'نص عربي للبحث' }] };
    const result = searchTafsir('عربي', data, new Map([[1, 'الفاتحة']]));
    expect(result).toHaveLength(1);
    expect(result[0].surahName).toBe('الفاتحة');
  });
});
```

### Hook tests (with renderHook)
```tsx
import { renderHook, act } from '@testing-library/react';
import { useBookmarks } from './useBookmarks';

describe('useBookmarks', () => {
  it('toggles bookmark', () => {
    const { result } = renderHook(() => useBookmarks());
    act(() => result.current.toggleBookmark(1));
    expect(result.current.isBookmarked(1)).toBe(true);
    act(() => result.current.toggleBookmark(1));
    expect(result.current.isBookmarked(1)).toBe(false);
  });
});
```

### Component tests (with render + screen)
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('renders with label', async () => {
  render(<Button label="Click me" onClick={() => {}} />);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

---

## 7. Styling with Tailwind CSS v4

### No CSS modules or styled-components
All styles use Tailwind utility classes directly in JSX.

### Dark mode pattern
This project uses React Context for theme:

```tsx
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { isDarkMode } = useTheme();
  return (
    <div className={`${isDarkMode ? 'bg-brand-dark-bg' : 'bg-brand-parchment'}`}>
      ...
    </div>
  );
}
```

The `isDarkMode` boolean comes from `ThemeContext` — no prop drilling needed.

### Color palette
Use semantic color tokens defined in `index.css`:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-brand-dark-bg` / `bg-brand-parchment` | `#FAF9F6` | `#0E0E0E` | Page background |
| `bg-brand-stone` / `bg-brand-dark-surface` | `#F2EFE9` | `#151515` | Card/section background |
| `text-brand-rich` / `text-brand-dark-active` | `#0E0E0E` | `#E0E0E0` | Primary text |
| `text-gilded-gold` | `#F27D26` | `#F27D26` | Accent (same in both) |
| `border-brand-border` / `border-brand-dark-border` | `#E0DCD3` | `#2A2A2A` | Borders |

### RTL support
App is `dir="rtl"`. Mind CSS logical properties:
- `mr-*` / `ml-*` work as expected in RTL
- `border-r` / `border-l` need attention — they don't flip
- `ml-3` in Arabic context means "margin-left" which is the right side visually
- Use `gap-*` instead of margin on flex items when possible

---

## 8. Performance

### Bundle size: 18MB tafsir data
The entire tafsir dataset (~18MB) is imported eagerly. This is acceptable because:
- It's served gzipped (~5MB over the wire)
- It loads once and stays in memory
- No network calls needed after initial load
- Vite code-splits by tab, so only the current tab's JS loads

### Search runs on the main thread
The search algorithm iterates all sections synchronously. A 50ms `setTimeout` is used to let the loading spinner render before the search starts. If search becomes noticeably slow on large queries, the next step is a Web Worker in `src/utils/search.worker.ts`.

### Code splitting with lazy()
Feature tabs use `React.lazy()` so each tab's code loads on demand:

```tsx
const OverviewTab = lazy(() => import('./components/OverviewTab'));
```

Only the active tab's code is in memory.

### Avoid unnecessary re-renders
- Don't create new objects/arrays in render props or context values without `useMemo`
- Don't inline arrow functions in JSX if the child component is memoized
- Use `useCallback` for handlers passed to child components (when needed — don't add it preemptively)

### Layout: `max-w-5xl` centering
The content wrapper uses `max-w-5xl` (1024px) with `mx-auto`. This keeps lines at a readable length (~14-18 Arabic words per line on desktop). If text still looks narrow, check:
1. Font size: `text-base` minimum (16px) for body text
2. Padding: reduced to `px-3` on mobile for maximum text area
3. Sidebar width: 330-350px — accounts for ~25% of viewport on desktop

---

## 9. Common Mistakes

| Mistake | Fix |
|---------|-----|
| `useRef<Type>()` without initial value | Provide `undefined` explicitly: `useRef<Type \| undefined>(undefined)` |
| `toLowerCase()` on Arabic strings | Harmless but pointless — Arabic has no case |
| Loading state UI when data is synchronous | Don't show "loading" for sync data — show it or don't |
| Hardcoded placeholder content (fake verses, mock data) | Remove or replace with real data |
| Adding abstractions (interfaces, factories) for one use case | Don't — YAGNI. Inline until a second caller exists |
| Calling `useRef` outside component | Refs only work inside hooks/components |
| Putting business logic in components | Extract to `utils/` for testability |
| Adding route params/query strings for tab state | Tab state is `useState` — no URL needed |
| Installing Next.js "for SEO" on a private tool | SPA is simpler, faster to build, and sufficient |
| Adding Redux before you have 5+ shared state slices | Start with `useState` + props, add Context when drilling hurts, add Redux only if needed |
| Mixing Arabic and English fonts without specifying `font-family` for each | Use `font-serif` for Arabic body, `font-mono` for numerals |

---

## Resources

- [React 19 docs](https://react.dev/blog/2024/12/05/react-19)
- [Vitest docs](https://vitest.dev/guide/)
- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs/installation)
- [Motion docs](https://motion.dev/) (animation library, replaces framer-motion in this project)
