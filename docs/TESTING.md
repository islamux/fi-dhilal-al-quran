# Testing — في ظلال القرآن

## Stack

- **Vitest 4** — test runner
- **Testing Library** (`@testing-library/react` + `@testing-library/jest-dom`) — DOM assertions
- **jsdom** — browser environment for component/hook tests

All test files are **colocated** with their source: `src/utils/search.ts` → `src/utils/search.test.ts`.

## Running Tests

```bash
pnpm test          # Run once
pnpm test:watch    # Watch mode
```

## Test Suite (117 tests, 13 files)

| File | Tests | What it covers |
|------|-------|----------------|
| `utils/tafsir-format.test.ts` | 32 | Paragraph splitting from raw `.doc` text — keyword detection, punctuation heuristics, edge cases |
| `utils/localStorage.test.ts` | 12 | `localStorageBackend`/`createMemoryBackend` — get, set, remove, clear, `onChange` callbacks, SSR fallback |
| `utils/search.test.ts` | 12 | Word-matching across sections, scoring, excerpt generation, empty query |
| `utils/syncBackend.test.ts` | 11 | Supabase sync — push, pull, merge, conflict resolution, debounce, pending flag |
| `utils/highlight.test.ts` | 10 | `highlightText()` — split, multi-word, Arabic, no-match |
| `utils/tafsir-data.test.ts` | 8 | `getTafsirText()` — full surah, verse range, missing surah |
| `hooks/useLocalStorageState.test.ts` | 6 | Hydration-safe state hook — default before mount, hydrate after mount, no overwrite, functional updates |
| `components/QuickSearch.test.tsx` | 5 | Renders buttons, click triggers search callback |
| `components/SectionSelector.test.tsx` | 5 | Renders sections, selection changes value, empty state |
| `utils/index.test.ts` | 5 | `toArabicNumerals()` — number conversion, edge cases |
| `components/TafsirDisplay.test.tsx` | 4 | Renders paragraphs, highlights ayah text, handles null |
| `components/WorkstationShell.test.tsx` | 4 | Client shell — resolves surah from route param, `router.push` navigation, skips re-nav for current surah |
| `components/SurahReader.test.tsx` | 3 | Reader chrome + 4 tabs, tab `?tab=` query-param sync, chat tab from URL |

## Test Patterns

### Pure function tests (no React)

The simplest pattern — import a function, call it, assert the result:

```ts
// src/utils/search.test.ts
import { describe, it, expect } from 'vitest'
import { searchTafsir } from './search'

describe('searchTafsir', () => {
  it('returns empty array for empty query', () => {
    expect(searchTafsir('', {}, new Map())).toEqual([])
  })

  it('finds matching sections', () => {
    const data = { 1: [{ startVerse: 1, endVerse: 1, text: 'نص عربي للبحث' }] }
    const result = searchTafsir('عربي', data, new Map([[1, 'الفاتحة']]))
    expect(result).toHaveLength(1)
    expect(result[0].surahName).toBe('الفاتحة')
  })
})
```

### Hook tests (with `renderHook`)

Tests that exercise React hooks without mounting a full component:

```ts
// src/utils/localStorage.test.ts
import { renderHook, act } from '@testing-library/react'
import { useBookmarks } from './useBookmarks'

describe('useBookmarks', () => {
  beforeEach(() => localStorage.clear())

  it('toggles bookmark', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => result.current.toggleBookmark(1))
    expect(result.current.isBookmarked(1)).toBe(true)
  })
})
```

### Component tests (with `render` + `screen`)

Tests that render a component and assert on the DOM:

```tsx
// src/components/QuickSearch.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickSearch } from './QuickSearch'

it('triggers search when button clicked', async () => {
  const onSearch = vi.fn()
  render(<QuickSearch onSearch={onSearch} />)
  await userEvent.click(screen.getByText('التوحيد'))
  expect(onSearch).toHaveBeenCalledWith('التوحيد')
})
```

### Router-dependent component tests (mocking `next/navigation`)

Client components that use `useRouter` / `useParams` / `useSearchParams` (e.g. `WorkstationShell`, `SurahReader`) must mock `next/navigation` so they render in jsdom without a real router. Stub only the hooks you need and record the router calls:

```tsx
// src/components/WorkstationShell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { WorkstationShell } from './WorkstationShell'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('../context/AppStateContext', () => ({
  useAppState: () => ({ /* ...stub the slice of state the shell reads... */ }),
}))
vi.mock('../context/ThemeContext', () => ({ useTheme: () => ({ isDarkMode: true }) }))
```

Notes:
- Use **`fireEvent`** (synchronous) rather than `userEvent` for these router tests — the original async examples predate these and `fireEvent` keeps the assertions deterministic in the mocked-router setup.
- Give the shell's interactive elements stable test hooks — surah cards expose `id="surah-card-{id}"` and the reader tabs expose `id="tab-{key}"` — so tests can target them reliably.
- For `?tab=` behavior, hold `currentSearch` in a mutable variable that the `useSearchParams` mock returns, then update it and re-render to assert the router `push`/`replace` URL.
- The `AppStateContext`/`ThemeContext` stubs return only the fields the component under test consumes; keep the stubs narrow so a provider change doesn't silently break unrelated assertions.

## Lint Pass

```bash
pnpm run lint    # tsc --noEmit — must exit 0
```

Before committing, always run both `pnpm run lint` and `pnpm test` to verify no type errors and no regressions.
