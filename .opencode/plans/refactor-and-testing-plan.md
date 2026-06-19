# Refactoring & Unit Testing Plan

## Goals
1. Add unit test infrastructure and write meaningful tests (not coverage vanity)
2. Extract pure logic from hooks so business rules are testable without React
3. Decouple localStorage from hooks to make them testable
4. Split large components into smaller, testable pieces

---

## 1. Test Infrastructure

### Dependencies to install
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Config: `vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

### Setup: `src/test/setup.ts`
```ts
import '@testing-library/jest-dom/vitest';
```

### Package.json script
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## 2. Extract Pure Functions (testable without React)

### 2a. `src/utils/search.ts` — extract from `useChat.ts`

Move the search algorithm out of the hook into a pure function:

```ts
// src/utils/search.ts
export interface SearchMatch {
  surahId: number;
  surahName: string;
  startVerse: number;
  endVerse: number;
  excerpt: string;
}

interface RawSection {
  startVerse: number;
  endVerse: number;
  text: string;
}

export function searchTafsir(
  query: string,
  data: Record<number, RawSection[]>,
  nameMap: Map<number, string>
): SearchMatch[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const results: SearchMatch[] = [];
  // ... same algorithm as current runSearch
  return results.sort((a, b) => b.score - a.score).slice(0, 50);
}
```

**Tests needed:**
- Empty query returns `[]`
- Single word finds matching sections
- Multiple words score higher (AND matching)
- No match returns `[]`
- Arabic text matching (no false positives on partial matches)
- Excerpt boundaries are correct (start/end slicing)

### 2b. `src/utils/localStorage.ts` — storage abstraction

Current hooks call `localStorage.getItem/setItem` directly. Extract:

```ts
export interface StorageBackend {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export const localStorageBackend: StorageBackend = {
  get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};
```

Hooks accept `StorageBackend` with `localStorageBackend` as default. Tests inject a `Map`-backed mock.

### 2c. `src/utils/tafsir-data.ts` — extract data access from `useTafsir.ts`

```ts
export function getTafsirText(
  surahId: number,
  range: string,
  data: Record<number, TafsirSection[]>
): string | null {
  const sections = data[surahId];
  if (!sections) return null;
  if (range === 'كاملة') return sections.map(s => s.text).join('\n\n');
  const verseNum = parseInt(range);
  const matched = sections.filter(s => s.startVerse <= verseNum && s.endVerse >= verseNum);
  return matched.length > 0 ? matched.map(s => s.text).join('\n\n') : null;
}
```

**Tests needed:**
- Missing surah returns `null`
- Full surah text concatenates correctly
- Single verse range filters correctly
- Range out of bounds returns `null`

---

## 3. Refactor Hooks for Testability

### 3a. `useBookmarks` → accept optional `StorageBackend`

```ts
export function useBookmarks(storage: StorageBackend = localStorageBackend) {
  // Read: storage.get<Bookmark[]>(BOOKMARKS_KEY) ?? []
  // Write: storage.set(BOOKMARKS_KEY, next)
}
```

**Tests needed:**
- Toggle adds bookmark
- Toggle removes existing bookmark
- `isBookmarked` returns correct boolean
- `clearAll` empties list
- Works with Map-backed storage mock (no localStorage dependency)

### 3b. `useProgress` → same pattern

```ts
export function useProgress(storage: StorageBackend = localStorageBackend) {
  // Same refactoring pattern
}
```

**Tests needed:**
- `addHistoryItem` prepends and deduplicates
- `addHistoryItem` caps at 20 items
- `toggleComplete` adds/removes surah ID
- History stores `viewedAt` in correct format

### 3c. `useTheme` → same pattern

```ts
export function useTheme(storage: StorageBackend = localStorageBackend) {
  // Same refactoring pattern
}
```

### 3d. `useChat` → use extracted `searchTafsir`

```ts
export function useSearch() {
  const handleSearch = (query: string) => {
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      const matches = searchTafsir(query, TAFSIR_DATA, surahNameMap);
      setResults(matches);
      setSearching(false);
    }, 50);
  };
}
```

### 3e. `useTafsir` → use extracted `getTafsirText`

```ts
export function useTafsir() {
  const fetchTafsir = (surah: Surah, range = 'كاملة') => {
    setTafsirText(getTafsirText(surah.id, range, TAFSIR_DATA));
  };
}
```

---

## 4. Component Refactoring

### 4a. Split `VersesTab`

Current: 114 lines, mixes section selector, tafsir display, and heading.

Proposed:
- `VersesTab.tsx` — container, orchestrates child components
- `SectionSelector.tsx` — the dropdown + heading (extract ~30 lines)
- `TafsirDisplay.tsx` — the prose rendering block (extract ~25 lines)

### 4b. Extract `QuickSearchSuggestions` from `ChatTab`

The `['التصوير الفني', 'الجهاد', 'التوحيد']` buttons → own file.

**Test:** Clicking a suggestion sets input and triggers search.

### 4c. Extract theme styles pattern

The repeated `isDarkMode ? 'dark-class' : 'light-class'` pattern appears 30+ times. Extract a helper:

```ts
// src/utils/styles.ts
export function tw(isDark: boolean, dark: string, light: string) {
  return isDark ? dark : light;
}
```

Or switch to Tailwind's `dark:` variant (requires `darkMode: 'class'` config + class on `<html>`).

**Tradeoff:** The `dark:` variant approach requires adding a `dark` class to `<html>` element when `isDarkMode` changes. This is more work upfront but eliminates all the `isDarkMode` prop threading.

---

## 5. File Organization

```
src/
  components/
    VersesTab/
      VersesTab.tsx       ← container
      SectionSelector.tsx  ← extracted
      TafsirDisplay.tsx    ← extracted
    ChatTab/
      ChatTab.tsx          ← container
      QuickSearch.tsx      ← extracted
  hooks/
    useBookmarks.ts       ← refactored with StorageBackend
    useProgress.ts        ← refactored with StorageBackend
    useTheme.ts           ← refactored with StorageBackend
    useChat.ts            ← uses searchTafsir from utils
    useTafsir.ts          ← uses getTafsirText from utils
  utils/
    index.ts              ← toArabicNumerals (already exists)
    search.ts             ← searchTafsir pure function
    tafsir-data.ts        ← getTafsirText pure function
    localStorage.ts       ← StorageBackend interface + impl
    styles.ts             ← optional: tw() helper or dark mode helper
  test/
    setup.ts              ← jest-dom matchers
    utils/
      search.test.ts
      tafsir-data.test.ts
      localStorage.test.ts
      index.test.ts       ← toArabicNumerals tests
    hooks/
      useBookmarks.test.ts
      useProgress.test.ts
      useTheme.test.ts
    components/
      SectionSelector.test.tsx
      TafsirDisplay.test.tsx
      QuickSearch.test.tsx
```

---

## 6. Implementation Order

| Step | Desc | Est. Effort | Depends On |
|------|------|-------------|------------|
| 1 | Install test deps + config | 5 min | — |
| 2 | Extract `searchTafsir` + test | 20 min | — |
| 3 | Extract `getTafsirText` + test | 10 min | — |
| 4 | Extract `StorageBackend` + test | 15 min | — |
| 5 | Refactor `useBookmarks` + test | 15 min | Step 4 |
| 6 | Refactor `useProgress` + test | 15 min | Step 4 |
| 7 | Refactor `useTheme` + test | 10 min | Step 4 |
| 8 | Refactor `useChat` to use extracted fn | 5 min | Step 2 |
| 9 | Refactor `useTafsir` to use extracted fn | 5 min | Step 3 |
| 10 | Split `VersesTab` → `SectionSelector` + `TafsirDisplay` | 20 min | — |
| 11 | Extract `QuickSearch` from `ChatTab` | 10 min | — |
| 12 | Write component tests for extracted pieces | 15 min | Steps 10-11 |
| 13 | Run full test suite, fix failures | 10 min | All above |

**Total:** ~2.5 hours

---

## 7. What This Plan Does NOT Do

- **No end-to-end tests** — the project has no E2E framework; adding Cypress/Playwright is out of scope
- **No code coverage threshold** — set a baseline only after tests exist
- **No Web Worker** — search on main thread is acceptable for <100KB queries; the setTimeout fix already mitigates the freeze
- **No CSS refactoring** — style extraction is noted as optional (`styles.ts` or `dark:` variant)
- **No performance optimization of the 18MB bundle** — code-splitting `tafsir.ts` is a separate concern
