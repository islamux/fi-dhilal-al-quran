# رحلة في ظلال القرآن — App Lifecycle Walkthrough

> **For:** Junior developers who know basic HTML, CSS, and JavaScript but have never touched React.
>
> **What this is:** A step-by-step tour of the app's journey — from the moment your browser hits the server all the way through rendering, clicking, searching, and building for production.
>
> **Reference:** For deeper dives into React patterns used here, see [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md).

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture--what-are-we-even-building)
2. [The Starting Line — index.html → React Boot](#2-the-starting-line--indexhtml--react-boot)
3. [Safety Nets & Global Settings](#3-safety-nets--global-settings)
4. [The Layout — Three Columns](#4-the-layout--three-columns)
5. [The Sidebar — Finding a Surah](#5-the-sidebar--finding-a-surah)
6. [The Tafsir Data](#6-the-tafsir-data--where-does-it-live)
7. [The Engine Room — Hooks](#7-the-engine-room--hooks)
8. [Reading Tafsir — Click → Text](#8-reading-tafsir--click--text-on-screen)
9. [Search — Full-Text](#9-search--full-text-across-all-tafsir)
10. [Styling — Tailwind + Dark Mode](#10-styling--tailwind-css-v4--dark-mode)
11. [Build & Deploy](#11-build--deploy--what-pnpm-run-build-does)
12. [Glossary](#12-glossary-of-react-terms)
13. [React Patterns](#13-react-patterns-youll-see-on-every-page)
14. [Common Mistakes](#14-common-mistakes--what-to-watch-for)

---

## 1. The Big Picture — What Are We Even Building?

This app is called **في ظلال القرآن** ("Fi Dhilal al-Quran" — "In the Shades of the Quran"). It's a digital reader for Sayyid Qutb's tafsir (commentary/exegesis) of the Quran.

But more importantly for you to understand: it's a **Single-Page Application (SPA)**.

### What's an SPA?

You're used to traditional websites where every click on a link causes the browser to request a new HTML page. The page goes blank, then the new content appears. That's a **Multi-Page Application**.

In an SPA, the browser loads **one HTML page once**, and then JavaScript takes over. When you click something, JavaScript updates what you see on screen without asking the server for a new page. No flashing, no blank white page, no waiting.

Think of it like a **car dashboard vs. a paper map**:
- **Traditional website (paper map):** To see a different area, you need an entirely new map.
- **SPA (digital dashboard):** The screen refreshes instantly based on what you touch, but the car itself keeps running. You never need a new car.

### What's inside this app?

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│  Browser     │     │  Express Server (Node.js)                    │
│  (React app) │◄────│  - Serves index.html                        │
│              │     │  - Serves JS/CSS assets                     │
│              │     │  - Has one API: GET /api/health             │
└─────────────┘     └──────────────────────────────────────────────┘
```

**No database.** **No external APIs.** **No AI.** All the tafsir content (~18MB) is bundled inside the JavaScript that the browser downloads. This is what "fully offline" means — once the page loads, you can disconnect the internet and keep reading.

### What makes this different from a "normal" website?

| Aspect | Traditional Website | This SPA |
|--------|-------------------|----------|
| Page loads | Every click = new page | One load, then instant updates |
| Who does the work? | Server builds HTML, sends it | Browser runs JavaScript |
| Content source | Database on server | A local JavaScript file (~18MB) |
| Feel | Flashy, slow transitions | Smooth, app-like |

---

## 2. The Starting Line — index.html → React Boot

Your browser journey begins with a URL. The Express server receives the request and sends back `index.html`.

### Step 1: The server sends a nearly-empty HTML page

Open `index.html` at the project root. It looks like this (simplified):

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>في ظلال القرآن</title>
  <!-- Google Fonts: Amiri, Tajawal, Playfair Display, JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <!-- ... font links ... -->
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Notice the `<div id="root"></div>` — it's completely empty. The entire app — the sidebar, the surah list, the tafsir text — will be created inside this empty div by JavaScript.

The `<script>` tag loads `src/main.tsx`. This is the **entry point** of the entire React application.

### Step 2: `main.tsx` runs

Open `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
```

Let's break this line by line:

1. **`createRoot(document.getElementById('root')!)`** — React looks for the empty `<div id="root">` in the HTML and claims it. This is React's territory now. The `!` is TypeScript saying "trust me, this exists".

2. **`.render(...)`** — Tells React: "put this component tree inside that div".

3. **`<StrictMode>`** — A development-only wrapper that checks for common mistakes. In production, it does nothing special.

### What's "component tree"?

A React app is a **tree of components**. Components are like HTML elements but smarter. Instead of writing `<div>`, you write `<App />`. Each component is a function that returns what should appear on screen.

The tree from `main.tsx` looks like:

```
<StrictMode>
  └── <ErrorBoundary>
        └── <ThemeProvider>
              └── <App />
```

React will call these functions in order, from outside to inside, collecting the HTML they produce, and then insert everything into the `<div id="root">`.

### What happens visually?

The user sees nothing for a split second, then the full layout appears: sidebar on the right, a decorative strip on the left, and the main content area showing Surah Al-Fatihah's tafsir.

That instant appearance is what we call **"the first paint"** or **"initial render"** in React.

---

## 3. Safety Nets & Global Settings

Before diving into `App.tsx` and the fun visual stuff, let's look at the two wrappers that protect and power every component.

### ErrorBoundary — The Safety Net

Open `src/components/ErrorBoundary.tsx`. You'll notice it's a **class component**, not a function. React requires error boundaries to be class components (it's a technical limitation).

```tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorUI error={this.state.error} />
    }
    return this.props.children
  }
}
```

**What it does:** If any component inside it throws an error during rendering (e.g., you try to access `something.undefined.property`), React would normally crash and show a white screen. ErrorBoundary catches that crash and instead shows a nice Arabic error message with a "إعادة تحميل" (Reload) button.

**Think of it like:** The airbag in a car. You hope you never need it, but you're glad it's there.

### ThemeProvider — The Global Settings

Open `src/context/ThemeContext.tsx`. This uses React's **Context** feature.

**What's Context?** Normally, data flows from parent to child via **props** (like function arguments). If you need to pass something to a deeply nested component, you'd have to thread it through every component in between ("prop drilling"). Context creates a **secret tunnel** — a component can broadcast a value, and any component anywhere below can read it directly.

```tsx
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dhilal_theme')
    return saved ? saved === 'dark' : true // default: dark
  })

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev
      localStorage.setItem('dhilal_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**What's happening here:**
1. `useState` remembers whether we're in dark mode. It checks `localStorage` first.
2. `toggleTheme` flips the value and saves it back to `localStorage`.
3. Any component can call `useTheme()` and get `{ isDarkMode, toggleTheme }` — no props needed.

**Analogy:** Think of `ThemeProvider` as the building's main electrical panel. It distributes "dark mode power" to every room (component) through hidden wiring (Context). Each room has a light switch (`useTheme()`) that reads the current state.

> **Deeper dive:** See the Context section in [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md) for more patterns.

---

## 4. The Layout — Three Columns

Now let's look at `src/App.tsx` — the heart of the app.

```tsx
export default function App() {
  const { isDarkMode } = useTheme()
  const {
    selectedSurah, setSelectedSurah,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    mobileSidebarOpen, setMobileSidebarOpen,
    typeFilter, setTypeFilter,
    juzFilter, setJuzFilter,
    sidebarTab, setSidebarTab,
    bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll,
    readingHistory, completedSurahs, addHistoryItem, toggleComplete,
    tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir,
    searchInput, setSearchInput, results, searching, bottomRef,
    handleSearch, clearResults, handleNavigateToSurah,
  } = useAppState()

  return (
    <div className={`flex h-screen w-full overflow-hidden ${
      isDarkMode ? 'bg-brand-dark-bg text-brand-dark-active' : 'bg-brand-parchment text-brand-rich'
    }`}>
      <MobileOverlay open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <BrandStrip />
      <Sidebar
        selectedSurah={selectedSurah}
        setSelectedSurah={setSelectedSurah}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        juzFilter={juzFilter}
        setJuzFilter={setJuzFilter}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        completedSurahs={completedSurahs}
      />
      <MainContent
        selectedSurah={selectedSurah}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        toggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        toggleComplete={toggleComplete}
        completedSurahs={completedSurahs}
        tafsirText={tafsirText}
        verseRangeValue={verseRangeValue}
        setVerseRangeValue={setVerseRangeValue}
        fetchTafsir={fetchTafsir}
        hasTafsir={hasTafsir}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        results={results}
        searching={searching}
        bottomRef={bottomRef}
        handleSearch={handleSearch}
        clearResults={clearResults}
        handleNavigateToSurah={handleNavigateToSurah}
        bookmarks={bookmarks}
        readingHistory={readingHistory}
        clearAll={clearAll}
        removeBookmark={removeBookmark}
      />
    </div>
  )
}
```

The layout is simple: three columns side by side (on large screens):

```
┌──────────────┬──────────────────────────────────┬──────────────────────┐
│  BrandStrip  │          MainContent              │      Sidebar         │
│  (decorative │  ┌─Header─────────────────────┐   │  ┌────────────────┐  │
│   strip,     │  │  Surah Banner              │   │  │ Surah list     │  │
│   xl screens │  ├─TabBar─────────────────────┤   │  │ with search    │  │
│   only)      │  │  Active Tab (content)      │   │  │ and filters    │  │
│              │  │  - OverviewTab             │   │  │                │  │
│              │  │  - VersesTab               │   │  │                │  │
│              │  │  - ChatTab                 │   │  │                │  │
│              │  │  - StatsTab                │   │  │                │  │
│              │  └─Footer─────────────────────┘   │  └────────────────┘  │
└──────────────┴──────────────────────────────────┴──────────────────────┘
```

On mobile, the sidebar becomes a slide-out drawer (triggered by the hamburger icon), and BrandStrip disappears.

### The Props Pattern

Notice that every prop is **explicitly listed**. App.tsx destructures everything from `useAppState()` and passes each prop individually to the child components.

The key pattern here: **no prop spreading, no magic.** You can see exactly what data each component receives by looking at the `App.tsx` file. This is deliberate — with ~25 pieces of shared state, listing them explicitly makes the data flow transparent. If a component needs a new piece of state, you add it in one place (`useAppState`) and thread it through `App.tsx` to the component that needs it.

> **Note:** This is a project-specific pattern, not a universal React convention. It works well here because the state is centralized.

---

## 5. The Sidebar — Finding a Surah

The sidebar (`src/components/Sidebar.tsx`) is the main navigation. It's split into two sub-tabs:

1. **فهرس السور** (Surah Index) — scrollable list of all 114 surahs
2. **فهرس الأجزاء** (Juz Index) — 7 Juz groups

### How does the surah list work?

The surah data lives in `src/data/surahs.ts`:

```ts
export const SURAHS: Surah[] = [
  { id: 1, name: "Al-Fatihah", arName: "الفاتحة", type: "مكية", versesCount: 7, ... },
  { id: 2, name: "Al-Baqarah", arName: "البقرة", type: "مدنية", versesCount: 286, ... },
  // ... 112 more
]
```

This is a plain array — not loaded from a server or database. It's hard-coded in the source.

### State: `useState` explained

When you click a surah, the app needs to remember which one you picked. This is where `useState` comes in:

```tsx
import { SURAHS } from '../data/surahs'
import type { Surah } from '../types'

const [selectedSurah, setSelectedSurah] = useState<Surah>(SURAHS[0])
```

`selectedSurah` is a **Surah object**, not just a number. The `Surah` type holds the surah's ID, Arabic name, English name, verse count, revelation type, and Juz number. `SURAHS[0]` is the first entry in the surahs array — Al-Fatihah.

**Think of `useState` as a memory box with a remote control:**
- The box holds a Surah object (`selectedSurah` starts at Al-Fatihah, `id: 1`)
- The remote control (`setSelectedSurah`) is the only way to change what's in the box
- When you press the remote (pass a new surah object), React notices and **re-renders** the component

### What happens when you click a surah?

1. You click "البقرة" (Al-Baqarah) in the sidebar
2. The click handler runs: `setSelectedSurah(surah)` where `surah` is the full Surah object for Al-Baqarah
3. React marks the component tree as "dirty" (needs update)
4. React calls `App()` again (re-render)
5. This time, `selectedSurah` is the object for surah 2, not surah 1
6. The sidebar highlights Al-Baqarah instead of Al-Fatihah
7. `MainContent` receives the new `selectedSurah` and loads Al-Baqarah's tafsir

### Filters — Derived State

The sidebar has search, type filter (مكية/مدنية), and Juz filter. But notice — there's **no separate state** for the filtered list. The filtered list is **derived** from the original `SURAHS` array:

```tsx
const filteredSurahs = SURAHS.filter(surah => {
  const matchesSearch = surah.arName.includes(searchQuery) ||
                        surah.name.toLowerCase().includes(searchQuery.toLowerCase())
  const matchesType = typeFilter === 'all' || surah.type === typeFilter
  const matchesJuz = juzFilter === null || surah.juzNumber === juzFilter
  return matchesSearch && matchesType && matchesJuz
})
```

**Key lesson:** You don't need state for everything. If you can calculate a value from existing state, calculate it during render. This keeps your code simpler and avoids bugs where the "filtered list" gets out of sync with the "original list."

> **Deeper dive:** See the State Management section in [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md).

---

## 6. The Tafsir Data — Where Does It Live?

This is the most unusual thing about this app. The entire Quranic commentary — all 110 surahs, 305 verse-range sections — lives inside a **single JavaScript file**.

### The File: `src/data/tafsir.ts`

This file is **auto-generated** from `.doc` files (Word documents) using the script at `scripts/extract-tafsir.ts`. It looks something like:

```ts
export const TAFSIR_DATA: Record<number, TafsirSection[]> = {
  1: [
    { startVerse: 1, endVerse: 7, text: "هذه السورة..." }
  ],
  2: [
    { startVerse: 1, endVerse: 50, text: "الم... " },
    { startVerse: 51, endVerse: 100, text: "وإذ واعدنا..." },
    // ...
  ],
  // ... 108 more surahs
}
```

The type `Record<number, TafsirSection[]>` means: an object where each key is a surah ID (number), and each value is an array of sections. Each section has a verse range and the tafsir text.

### Why is it 18MB?

Uncompressed Arabic text takes space. 305 sections of dense commentary across 110 surahs adds up. The file is gitignored (listed in `.gitignore`) because it's regeneratable — you can always run the extraction script again.

### The Problem: 18MB is Big

If this file were imported at the top of the app, the browser would have to download and parse 18MB before showing anything useful. First page load would take forever.

### The Solution: Lazy Loading

Open `src/data/tafsir-loader.ts`:

```ts
import type { TafsirSection } from '../types'

let dataPromise: Promise<Record<number, TafsirSection[]>> | null = null

export function loadTafsirData(): Promise<Record<number, TafsirSection[]>> {
  if (!dataPromise) {
    dataPromise = import('./tafsir').then(m => m.TAFSIR_DATA)
  }
  return dataPromise
}
```

**Dynamic `import()`** is a browser feature that lets you load a JavaScript file on demand, not at startup. The first time any component calls `loadTafsirData()`, the browser fetches and parses the 18MB file. Every subsequent call gets the cached promise (a **singleton pattern**).

**Think of it like:** Netflix doesn't download every movie when you open the app. It downloads the menu first, then downloads a movie only when you click "Play." Here, the "menu" is the surah list (~5KB), and the "movie" is the tafsir data (18MB).

The tafsir data loads only when the user clicks a surah (triggered by `useTafsir` hook) or when they use search (triggered by `useSearch` hook). The initial screen appears instantly.

### The Meta File

`src/data/tafsir-meta.ts` contains a simple `Set`:

```ts
export const SURAHS_WITH_TAFSIR = new Set([1, 2, 3, ...]) // 110 IDs
```

This lets the app check "does surah X have tafsir?" in **O(1)** time — basically instantly — without loading the 18MB file. Four surahs (44, 50, 76, 89) are missing from the source material, so they show a graceful "لم نعثر بعد" (not found yet) message.

> **Deeper dive:** See the Performance section in [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md) for more on lazy loading strategies.

---

## 7. The Engine Room — Hooks

Hooks are the most important React concept to understand. They are functions that let your component **remember things** and **do things at the right time**.

### What is a Hook?

A hook is a function whose name starts with `use`. Built-in hooks include `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`. You can also write your own custom hooks — that's what this project does.

**Analogy:** A component is like a kitchen. Hooks are the appliances:
- `useState` = refrigerator (remembers ingredients between uses)
- `useEffect` = timer (rings when something needs attention)
- `useRef` = measuring cup (holds a reference without causing re-renders)

### The Master Hook: `useAppState()`

Open `src/hooks/useAppState.ts`. This is the conductor of the whole orchestra. Instead of spreading state management across 10 different files, one hook collects it all:

```tsx
export function useAppState() {
  // Shared state (useState calls)
  const [selectedSurah, setSelectedSurah] = useState<number>(SURAHS[0].id)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [juzFilter, setJuzFilter] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<'الكل' | 'مكية' | 'مدنية'>('الكل')
  const [sidebarTab, setSidebarTab] = useState<'surahs' | 'juz'>('surahs')

  // Sub-hooks
  const { bookmarks, toggleBookmark, isBookmarked, removeBookmark, clearAll: clearBookmarks }
    = useBookmarks()
  const { completedSurahs, readingHistory, addHistoryItem, toggleComplete, clearAll: clearHistory }
    = useProgress()
  const { tafsirText, verseRangeValue, setVerseRangeValue, fetchTafsir, hasTafsir, tafsirLoaded }
    = useTafsir()
  const { searchInput, setSearchInput, results, searching, bottomRef, handleSearch, clearResults }
    = useChat()

  // Effects
  useEffect(() => {
    fetchTafsir(selectedSurah, 'كاملة')
    addHistoryItem(selectedSurah, 'كاملة')
    setVerseRangeValue('كاملة')
  }, [selectedSurah])

  // Return everything as a tidy package
  return { selectedSurah, setSelectedSurah, activeTab, setActiveTab, ... }
}
```

The key `useEffect` near the bottom is the **bridge between clicking and loading**:

```tsx
useEffect(() => {
  fetchTafsir(selectedSurah, verseRangeValue)   // load the text
  addHistoryItem(SURAHS[selectedSurah - 1])      // save to history
  setVerseRangeValue('كاملة')                     // reset verse range
}, [selectedSurah])                               // ← "when selectedSurah changes"
```

This says: **"Every time `selectedSurah` changes, run this code."**

### Individual Hooks

| Hook | File | What it manages | Persistence |
|------|------|----------------|-------------|
| `useTheme` | `context/ThemeContext.tsx` | Dark/light mode | localStorage |
| `useBookmarks` | `hooks/useBookmarks.ts` | Bookmarked surahs & verses | localStorage |
| `useProgress` | `hooks/useProgress.ts` | Reading history + completion | localStorage |
| `useTafsir` | `hooks/useTafsir.ts` | Tafsir text + verse range | None (derived from data) |
| `useSearch` | `hooks/useChat.ts` | Search query + results | None (in-memory) |

### How localStorage Persistence Works

The hooks use a thin wrapper at `src/utils/localStorage.ts`:

```ts
export const localStorageBackend = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value))
  }
}
```

Every time a bookmark is added or removed, the hook calls `localStorageBackend.set()`. On initial load, it calls `.get()` to restore previous state. This is why your bookmarks and dark mode preference survive a page refresh — they're saved in the browser's local storage.

---

## 8. Reading Tafsir — Click → Text on Screen

This is the most important flow in the app. Let's trace it end-to-end.

### The Chain

```
Sidebar Click
    │
    ▼
const selectedSurah = { id: 2, arName: 'البقرة', ... }  // ← full Surah object
setSelectedSurah(selectedSurah)
    │
    ▼
React re-renders App()
    │
    ▼
useEffect runs (because [selectedSurah] changed)
    │
    ├── fetchTafsir(selectedSurah, 'كاملة')
    │       │
    │       ▼
    │   loadTafsirData()  ← dynamic import of 18MB file (first time only)
    │       │
    │       ▼
    │   getTafsirText(selectedSurah.id, data, 'كاملة')
    │       │
    │       ▼
    │   Joins all sections for surah 2 into one string
    │       │
    │       ▼
    │   setTafsirText(result)   ← triggers re-render of OverviewTab
    │
    ├── addHistoryItem(selectedSurah, 'كاملة')
    │       │
    │       ▼
    │   Saves to localStorage, keeps last 20 items
    │
    └── setVerseRangeValue('كاملة')
            │
            ▼
        Resets the range selector to "full surah"
```

### Step-by-Step: The Rendering Chain

**1. `fetchTafsir(surah, range)`** — In `hooks/useTafsir.ts`:

```ts
const fetchTafsir = async (surah: Surah, range = 'كاملة') => {
  setTafsirText(null)  // clear current text (shows loading state)
  const data = await loadTafsirData()  // get the big data Record
  const text = getTafsirText(surah.id, data, range)
  setTafsirText(text)  // set the text → triggers re-render
}
```

**2. `getTafsirText(surahId, data, range)`** — In `utils/tafsir-data.ts`:

```ts
export function getTafsirText(
  surahId: number,
  data: Record<number, TafsirSection[]>,
  range: string
): string | null {
  const sections = data[surahId]
  if (!sections) return null  // no tafsir for this surah

  if (range === 'كاملة') {
    return sections.map(s => s.text).join('\n\n')  // join all sections
  }

  // Parse "1-50" → start=1, end=50, filter overlapping sections
  const [start, end] = range.split('-').map(Number)
  return sections
    .filter(s => s.startVerse <= end && s.endVerse >= start)
    .map(s => s.text)
    .join('\n\n')
}
```

**3. Formatting — `formatTafsirParagraphs()`** — In `utils/tafsir-format.ts`:

Raw `.doc` text comes as one long string with hard-wrapped lines. This function:
- Splits on `\n\n` (section boundaries)
- Joins hard-wrapped lines within sections
- Detects where new paragraphs should start using punctuation + keyword detection (~40+ Arabic keywords like `إن`, `هذا`, `ثم`, `لقد`)

**4. Rendering — `TafsirContent`** — In `components/TafsirContent.tsx`:

```tsx
export default function TafsirContent({ paragraphs }: { paragraphs: TafsirSegment[][] }) {
  return paragraphs.map((segments, i) => (
    <p key={i}>
      {segments.map((seg, j) =>
        seg.isVerse
          ? <span key={j} className="text-gilded-gold">{seg.text}</span>
          : seg.text
      )}
    </p>
  ))
}
```

Each paragraph is split into **verse segments** and **commentary segments**:
- Verse text (detected by Arabic guillemets `«...»` or patterns ending with a verse number in parentheses) is rendered in **gold** (`#F27D26`)
- Commentary text is rendered in the normal body color

### What the User Sees

```
┌──────────────────────────────────────────────────────────────┐
│  تفسير سورة البقرة                                           │
│  Tafsir al-Qutb                                              │
│                                                              │
│  آية 1-50                                                     │
│                                                              │
│  الم  ﴿1﴾ ذلك الكتاب لا ريب فيه هدى للمتقين ﴿2﴾           │
│                                                              │
│  يبدأ السياق القرآني في سورة البقرة بهذه الحروف المقطعة       │
│  التي يقول فيها سيد قطب: «إنها سر الله في كتابه» وهذه        │
│  إشارة إلى أن القرآن معجز في تركيبه ومحتواه. (1)             │
│                                                              │
│  هذا المشهد القرآني يستغرق الحديث عن بني إسرائيل...          │
└──────────────────────────────────────────────────────────────┘
```

The gold text is the actual Quranic verses embedded in the commentary. The regular text is Sayyid Qutb's explanation.

### Missing Surahs

For the 4 missing surahs (44 الدخان, 50 ق, 76 الإنسان, 89 الفجر), `getTafsirText` returns `null`, and the component shows:

> "لم نعثر بعد على النص الأصلي لتفسير سورة '...' في مخطوطات الظلال المتوفرة. يعكف فريق التحرير على استكمال فهرسة جميع أجزاء موسوعة الأستاذ سيد قطب."

> **Deeper dive:** See the Data Flow section in [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md).

---

## 9. Search — Full-Text Across All Tafsir

The search tab (بحث في الظلال) lets the user search across **all** 110 surahs of tafsir text at once.

### The Search Flow

```
User types "التوحيد"
    │
    ▼
handleSearch("التوحيد")
    │
    ▼
loadTafsirData()  ← loads 18MB if not already loaded
    │
    ▼
searchTafsir("التوحيد", TAFSIR_DATA, surahNames)
    │
    ▼
Iterates every section in every surah, counts word matches,
generates excerpts, sorts by score, caps at 50 results
    │
    ▼
setResults(matches)  ← triggers re-render of results list
```

### The Search Algorithm — `searchTafsir()` in `utils/search.ts`

```ts
export function searchTafsir(
  query: string,
  data: Record<number, TafsirSection[]>,
  surahNames: Map<number, string>
): SearchMatch[] {
  const queryWords = query.trim().split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return []

  const matches: SearchMatch[] = []

  for (const [surahId, sections] of Object.entries(data)) {
    for (const section of sections) {
      const matchCount = queryWords.filter(word =>
        section.text.includes(word)
      ).length

      if (matchCount > 0) {
        matches.push({
          surahId: Number(surahId),
          surahName: surahNames.get(Number(surahId)) ?? '',
          verseRange: `${section.startVerse}-${section.endVerse}`,
          excerpt: generateExcerpt(section.text, queryWords),
          score: matchCount
        })
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)  // max 50 results
}
```

**The scoring is simple:** count how many of the search query's words appear in the section text. More word matches = higher score.

### Highlighting — `highlightText()` in `utils/highlight.ts`

When displaying search results, the matching words need to be highlighted. The `highlightText` function splits text into segments:

```ts
export function highlightText(text: string, query: string): HighlightSegment[] {
  const words = query.trim().split(/\s+/)
  const pattern = new RegExp(`(${words.map(escapeRegex).join('|')})`, 'gi')
  const segments: HighlightSegment[] = []
  let lastIndex = 0

  text.replace(pattern, (match, ...args) => {
    const index = args[args.length - 2]  // match index
    segments.push({ text: text.slice(lastIndex, index), highlighted: false })
    segments.push({ text: match, highlighted: true })
    lastIndex = index + match.length
    return match
  })

  segments.push({ text: text.slice(lastIndex), highlighted: false })
  return segments
}
```

And the `HighlightedText` component renders it:

```tsx
export default function HighlightedText({ text, query }: Props) {
  const segments = highlightText(text, query)
  return segments.map((seg, i) =>
    seg.highlighted
      ? <mark key={i} className="bg-gilded-gold/20 text-gilded-gold">{seg.text}</mark>
      : <span key={i}>{seg.text}</span>
  )
}
```

### Quick Search

`QuickSearch.tsx` renders 10 predefined search buttons for common Islamic topics: التوحيد, الربا, الجهاد, النفس, الإيمان, الموت, السماء, النار, التقوى, الصبر. Clicking one fills the search input and triggers a search.

---

## 10. Styling — Tailwind CSS v4 + Dark Mode

The app uses **Tailwind CSS v4**, the latest version of the popular utility-first CSS framework. v4 is significantly different from v3 — no config file needed.

### What's "Utility-First CSS"?

Instead of writing:

```css
.sidebar-button {
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #1E1E1E;
  color: #E0E0E0;
  font-size: 14px;
}
```

You write classes directly in your JSX:

```tsx
<button className="px-4 py-2 rounded-lg bg-brand-dark-hover text-brand-dark-active text-sm">
  الفاتحة
</button>
```

Each class maps to one CSS property. `px-4` = `padding-left: 1rem; padding-right: 1rem`. `rounded-lg` = `border-radius: 0.5rem`.

### The Theme System — Not What You'd Expect

**Most** React apps with Tailwind and dark mode use Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-black">
```

This project does **not** do that. Instead, it uses **React Context** to control which class gets applied:

```tsx
const { isDarkMode } = useTheme()

<div className={isDarkMode ? 'bg-brand-dark-bg' : 'bg-brand-parchment'}>
```

Why? Because `dark:` in Tailwind relies on a CSS media query or a class on `<html>`. This project uses JavaScript state instead, giving more control and smoother transitions.

### Custom Theme Colors

In `src/index.css`, the `@theme` block defines the project's palette:

```css
@theme {
  --color-gilded-gold: #F27D26;        /* Brand accent — gold */
  --color-brand-parchment: #FAF9F6;    /* Light background */
  --color-brand-dark-bg: #0E0E0E;      /* Dark background */
  --color-brand-dark-surface: #151515;  /* Dark card surface */
  --color-brand-dark-hover: #1E1E1E;   /* Dark hover state */
  --color-brand-dark-active: #E0E0E0;  /* Dark text color */
}
```

These are used everywhere as `text-gilded-gold`, `bg-brand-parchment`, etc.

### How the Theme Toggle Works

1. User clicks the Sun/Moon icon in the header
2. `toggleTheme()` flips `isDarkMode` from `true` to `false`
3. All components re-render with the new class names
4. The change is saved to `localStorage` so it persists after refresh

### Arabic Fonts

The app loads four Google Fonts for Arabic and display text:
- **Tajawal** — The main sans-serif font for UI text
- **Amiri** — A beautiful Arabic serif font for tafsir reading
- **Playfair Display** — English serif for decorative headings
- **JetBrains Mono** — Monospace for code

> **Deeper dive:** See the Styling section in [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md).

---

## 11. Build & Deploy — What `pnpm run build` Does

When you run `pnpm run build`, two things happen in sequence:

### Step 1: `vite build` — Bundle the React App

Vite takes all the `src/` files and creates optimized bundles:

```
Before (development):                     After (production):
src/main.tsx                              dist/assets/index-abc123.js
src/App.tsx                               dist/assets/index-abc123.css
src/components/*.tsx                      dist/assets/OverviewTab-xyz789.js
src/data/tafsir.ts (~18MB)                dist/assets/ChatTab-def456.js
src/index.css                             dist/index.html
```

**What Vite does:**
1. **Tree-shaking** — Removes unused code. If a function isn't imported anywhere, it's excluded.
2. **Code splitting** — `React.lazy()` imports (the tabs) become separate files. The 18MB tafsir data becomes its own chunk, loaded only when needed.
3. **Minification** — Variable names are shortened, whitespace removed, file size reduced.
4. **CSS processing** — Tailwind scans your JSX for class names, generates only the CSS you actually used, and purges the rest. The resulting CSS is tiny.

### Step 2: `esbuild server.ts` — Bundle the Server

The server also needs to be "built" because Node.js doesn't understand TypeScript imports directly.

```
Before:              After:
server.ts            dist/server.cjs  (single CommonJS file)
server/routes/health.ts
```

**What esbuild does:**
- Bundles `server.ts` and its imports into one file
- `--packages=external` — keeps `node_modules` imports as `require()` calls (no need to bundle Express itself)
- Outputs **CommonJS** format (`.cjs`) because Node.js uses CommonJS by default

### The Final `dist/` Folder

```
dist/
├── index.html           ← Updated with hashed asset references
├── assets/
│   ├── index-abc123.js  ← Main React bundle (no tafsir)
│   ├── index-abc123.css ← Compiled Tailwind CSS
│   ├── tafsir-789xyz.js ← The 18MB tafsir data (lazy chunk)
│   ├── OverviewTab-*.js ← Lazy-loaded tab
│   ├── VersesTab-*.js   ← Lazy-loaded tab
│   ├── ChatTab-*.js     ← Lazy-loaded tab
│   └── StatsTab-*.js    ← Lazy-loaded tab
└── server.cjs           ← Bundled Express server
```

### How the Production Server Works

When you run `node dist/server.cjs`, the Express server starts in **production mode** (`NODE_ENV === 'production'`):

```ts
if (process.env.NODE_ENV === 'production') {
  // Serve pre-built files directly from disk
  app.use(express.static('dist'))

  // Any unrecognized route → send index.html (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist/index.html'))
  })
}
```

The `express.static('dist')` middleware handles serving `index.html`, CSS, and JS files. The `GET *` fallback ensures that if someone navigates directly to a deep URL (which doesn't exist as a real route — remember, there's no React Router), they get the app's HTML, and React takes over on the client side.

---

## 12. Glossary of React Terms

| Term | Simple Definition |
|------|------------------|
| **Component** | A function that returns what the UI should look like. Like a custom HTML element. |
| **JSX** | HTML-like syntax inside JavaScript: `<div>Hello</div>`. Gets compiled to `React.createElement('div', null, 'Hello')`. |
| **Props** | Arguments passed to a component: `<User name="Ali" age={25} />`. Read-only. |
| **State** | Data that a component remembers between renders. Changes to state trigger re-renders. |
| **Hook** | A function starting with `use` that gives components superpowers (state, effects, refs, etc.). |
| **useState** | Hook that creates a "memory box" with a setter. `const [count, setCount] = useState(0)`. |
| **useEffect** | Hook that runs code after render. Used for side effects: loading data, saving to localStorage, etc. |
| **Context** | A way to broadcast a value to all descendants without passing it through props at every level. |
| **Provider** | The component that "broadcasts" the Context value. Wraps the subtree that should receive it. |
| **Lazy Loading** | Loading code only when it's needed, not at startup. Done via dynamic `import()`. |
| **Memo** | `React.memo()` — wraps a component so it only re-renders if its props actually changed (not just because parent re-rendered). |
| **Error Boundary** | A special component that catches rendering errors and shows a fallback UI instead of crashing. |
| **Re-render** | When React calls a component function again because state or props changed, to update the UI. |
| **Virtual DOM** | React's lightweight copy of the real DOM. React compares (diffs) the virtual DOM after re-renders and applies only the minimum changes to the real DOM. |

---

## 13. React Patterns You'll See On Every Page

This chapter covers the patterns and syntax you'll encounter in virtually every file. Understanding these will let you read any component in the project.

### 13.1 TypeScript for Reading

The entire codebase is TypeScript. You don't need to write it yet — you just need to **read** it. Here's what the symbols mean:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `variable: string` | "this variable holds a string" | `const name: string = "Al-Fatihah"` |
| `variable: number` | "this variable holds a number" | `const id: number = 1` |
| `variable: boolean` | "this variable holds true/false" | `const isDark: boolean = true` |
| `variable: string \| null` | "this variable is either a string OR null" | `const text: string \| null = null` |
| `function foo(): number` | "this function returns a number" | `function getCount(): number { return 5 }` |
| `props: { name: string }` | "props is an object with a name field that's a string" | Type for component props |
| `value!` | "trust me, this is not null/undefined" | `document.getElementById('root')!` |
| `value?.property` | "if value exists, access its property; otherwise undefined" | `user?.name` |
| `as number` | "treat this value as a number" (less common, used when you know better than TypeScript) | |

**You don't need to learn TypeScript deeply.** The `: type` annotations are like labels on boxes — they tell you what's inside. When you see `count: number`, read it as "count, which is a number."

### 13.2 `export default` vs `export`

This is confusing because both patterns appear in this project. Let's settle it:

```tsx
// Pattern A: named export (used by most components)
export function Sidebar() { ... }
// Import: import { Sidebar } from './Sidebar'
//          ^^^^^^^^^ curly braces = named import

// Pattern B: default export (used by lazy-loaded tabs)
export default function OverviewTab() { ... }
// Import: import OverviewTab from './OverviewTab'
//          ^^^^^^^^ no curly braces = default import

// Pattern C: both! (used by OverviewTab, VersesTab, ChatTab, StatsTab)
export function OverviewTab() { ... }   // ← named: for direct imports
export default OverviewTab              // ← default: for React.lazy()
```

**Why both?** `React.lazy()` (see section 13.5) requires a default export. But named exports are cleaner for normal imports. So these components have both — the named export for regular use, and the default export just to satisfy `lazy()`.

**Quick rule:**
- If you see `import { Something }` — it's a named export (curly braces)
- If you see `import Something` — it's a default export (no curly braces)
- `import { Something } from './file'` vs `import Something from './file'` are asking for different things

### 13.3 Conditional Rendering

React doesn't have `if/else` in JSX. Instead, you use JavaScript expressions:

```tsx
// Pattern 1: ternary (if/else)
{isDarkMode ? <DarkIcon /> : <LightIcon />}
//            "if true"          "if false"

// Pattern 2: logical AND (show or nothing)
{hasTafsir && <TafsirContent />}
//            ^^^^ "if hasTafsir is true, render TafsirContent"

// Pattern 3: logical OR (fallback)
{tafsirText || <MissingSurahMessage />}
//            ^^^^ "if tafsirText is falsy, show the message instead"
```

**What the `&&` pattern does step by step:**
1. JavaScript evaluates `hasTafsir`
2. If `true`, it returns whatever is after `&&` (`<TafsirContent />`)
3. If `false`, it returns `false` (React ignores `false` in render)

This is why you'll see `{condition && <Component />}` everywhere — it's the idiomatic way to conditionally render something in React.

### 13.4 The `key` Prop

You'll see `key={i}` or `key={surah.id}` on elements inside `.map()`:

```tsx
{sections.map((section, i) => (
  <p key={i}>{section.text}</p>
))}
```

**Why is `key` needed?** React uses `key` to track which items changed, were added, or were removed. Without `key`, if the list changes, React might re-render everything inefficiently or (worse) keep wrong state attached to the wrong item.

**Rules for keys:**
- Always add `key` when using `.map()` to create elements
- Use a unique ID if available (`surah.id`), not the array index, if the list can be reordered
- Using index (`key={i}`) is fine for static lists that don't change order

### 13.5 `React.lazy()` + `Suspense` — Code Splitting

This is how the tabs avoid loading all code at once. In `MainContent.tsx`:

```tsx
const OverviewTab = React.lazy(() => import('./OverviewTab'))
const VersesTab = React.lazy(() => import('./VersesTab'))
const ChatTab = React.lazy(() => import('./ChatTab'))
const StatsTab = React.lazy(() => import('./StatsTab'))
```

**What happens here:**
1. `React.lazy()` takes a function that calls `import('./OverviewTab')`
2. The browser does NOT fetch `OverviewTab` at page load
3. It only fetches the file when `OverviewTab` is about to be rendered
4. While the file is loading, `<Suspense>` shows a spinner

```tsx
<Suspense fallback={<div className="...">جاري التحميل...</div>}>
  {activeTab === 'overview' && <OverviewTab />}
</Suspense>
```

**Analogy:** Netflix doesn't download every movie when you open the app. It downloads the homepage first, then downloads a movie only when you click "Play." `lazy()` is "download on demand."

### 13.6 The Re-render Cycle & Virtual DOM

This is the most important mental model in React.

**Step 1: State changes.** You call `setSelectedSurah(2)`.

**Step 2: React re-calls the component.** React calls `App()` again from the top. This is called a **re-render**.

**Step 3: React produces a new Virtual DOM.** The "Virtual DOM" is React's lightweight copy of the real DOM — just JavaScript objects, not actual browser elements:

```
Before:                             After:
<div className="...">               <div className="...">
  <Sidebar selectedSurah={1} />       <Sidebar selectedSurah={2} />
  <MainContent tafsirText={...}/>     <MainContent tafsirText={...}/>
</div>                               </div>
```

**Step 4: React diffs the two versions.** It compares the "before" virtual DOM with the "after" virtual DOM and identifies the minimum changes needed.

**Step 5: React applies only those changes to the real DOM.** It doesn't rebuild the whole page — just the specific elements that changed.

**The key insight:** React re-calls ALL components during re-render by default. That's why `React.memo()` exists — it says "skip this component if its props haven't changed." You'll see it on `SurahBanner` and `Footer` because they rarely change and don't need to re-render every time.

---

## 14. Common Mistakes — What to Watch For

These are the most common pitfalls juniors hit when working with this codebase.

### 14.1 Forgetting That `useState` Setter is Async

```tsx
// WRONG — won't work as expected
setSelectedSurah(2)
console.log(selectedSurah)  // still shows the OLD value!
```

The `setSelectedSurah` function schedules an update, it doesn't happen immediately. The new value will be available in the **next render**, not the current one. If you need to act after state changes, use `useEffect`.

### 14.2 Calling Hooks Conditionally

```tsx
// WRONG — hooks must be called in the same order every render
if (someCondition) {
  const [value, setValue] = useState(0)
}
```

React relies on hooks being called in the exact same order every render. If you put a hook inside an `if`, the order breaks and React throws an error. Hooks must always be at the top level of your component.

### 14.3 Mutating State Directly

```tsx
// WRONG — this won't trigger a re-render
bookmarks.push(newBookmark)

// RIGHT — create a new array
setBookmarks([...bookmarks, newBookmark])
```

React only knows state changed when you call the setter function. Mutating an array or object without calling the setter changes the value but doesn't tell React to re-render.

### 14.4 Confusing `export default` and `export`

If you see this error:

```
The requested module './Component' does not provide an export named 'Component'
```

It means you're trying a named import (`import { Component }`) for a file that only has a default export (`export default Component`). Use `import Component from './Component'` instead (no curly braces).

### 14.5 Forgetting the Dependency Array in `useEffect`

```tsx
useEffect(() => {
  fetchTafsir(selectedSurah)
})  // ← runs on EVERY render (missing [])
```

Without the dependency array, `useEffect` runs after every single render — causing infinite loops if it sets state. Always add the array:
- `useEffect(fn, [])` — runs once after first render
- `useEffect(fn, [selectedSurah])` — runs when `selectedSurah` changes

### 14.6 Missing `key` on Mapped Elements

If you see a console warning about "Each child in a list should have a unique 'key' prop," you forgot to add `key` to elements inside `.map()`. Add `key={item.id}` or `key={index}`.

### 14.7 Thinking `localStorage` is Server-Side

Local storage lives in the browser, not on the server. If you build for production and run `node dist/server.cjs`, the server has no access to `localStorage`. All `localStorage` operations happen in the browser, inside React components, after the page loads.

---

## Summary: The Full Lifecycle

```
1. BROWSER REQUESTS PAGE
       │
       ▼
2. EXPRESS SERVER sends index.html (nearly empty)
       │
       ▼
3. main.tsx EXECUTES
       │
       ├── createRoot() claims <div id="root">
       │
       ▼
4. REACT MOUNTS component tree
       │
       ├── ErrorBoundary (catches crashes)
       ├── ThemeProvider (reads localStorage, provides dark/light)
       └── App.tsx
               │
               ├── useAppState() initializes all state
               │   ├── selectedSurah = 1 (Al-Fatihah)
               │   ├── activeTab = 'overview'
               │   ├── Bookmarks from localStorage
               │   ├── History from localStorage
               │   └── Completed surahs from localStorage
               │
               ▼
5. FIRST RENDER — user sees surah list + Fatihah tafsir
       │
       ▼
6. useEffect runs: fetchTafsir(1, 'كاملة')
       │
       ├── dynamic import('./tafsir') → 18MB loads asynchronously
       ├── getTafsirText() → extracts Al-Fatihah's text
       ├── formatTafsirParagraphs() → structures into paragraphs
       └── TafsirContent renders gold-highlighted ayah text
       │
       ▼
7. USER INTERACTS
       │
       ├── Clicks surah → setSelectedSurah → re-render → new tafsir
       ├── Toggles dark mode → Context updates → all components re-class
       ├── Searches → loads tafsir if needed → searchTafsir() → results
       └── Bookmarks → localStorage.save() → state updates → UI updates
       │
       ▼
8. BUILD TIME (pnpm run build)
       │
       ├── vite build: bundles React app with code splitting
       └── esbuild server.ts: bundles server into single .cjs file
       │
       ▼
9. PRODUCTION: node dist/server.cjs serves everything statically
```

---

> **Next steps:** Want to get into the code? Start with `src/App.tsx` and the component it renders. Read the `src/hooks/` files one at a time. Each hook is only 30-80 lines.
>
> If you hit something confusing while reading, revisit **Chapter 13 (Patterns)** and **Chapter 14 (Common Mistakes)** — they cover the syntax and gotchas you're most likely to encounter.
>
> For deeper explanations of specific React patterns, see [`docs/REACT-19-BEST-PRACTICES.md`](./REACT-19-BEST-PRACTICES.md).
