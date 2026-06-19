# React 19 Best Practices — Junior Reference

This documents the patterns, conventions, and rationale used in this project. If you're new to React 19 or to this codebase, start here.

---

## Table of Contents
1. Component patterns
2. Hooks patterns
3. Testing
4. Styling with Tailwind CSS v4
5. Performance
6. Common mistakes

---

## 1. Component Patterns

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

## 2. Hooks Patterns

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

## 3. Testing

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

## 4. Styling with Tailwind CSS v4

### No CSS modules or styled-components
All styles use Tailwind utility classes directly in JSX.

### Dark mode pattern
Currently uses props threading (`isDarkMode`). When you see:

```tsx
className={`${isDarkMode ? 'bg-dark' : 'bg-light'} ${isDarkMode ? 'text-white' : 'text-black'}`}
```

This means the component receives `isDarkMode` as a prop. Eventually this may switch to Tailwind's `dark:` variant.

### Color palette
Use semantic color tokens from `tailwind.config`:

- `bg-brand-dark-bg` / `bg-brand-parchment` — page backgrounds
- `text-gilded-gold` — accent color (`#F27D26`)
- `border-brand-dark-border` / `border-brand-border` — borders
- `font-serif` — Arabic body text
- `font-mono` — numerals and technical text

### RTL support
App is `dir="rtl"`. Mind CSS logical properties:
- `mr-*` / `ml-*` work as expected in RTL
- `border-r` / `border-l` need attention — they don't flip
- Use `gap-*` instead of margin on flex items when possible

---

## 5. Performance

### Bundle size: 19MB tafsir data
The entire tafsir dataset (~18MB) is imported eagerly. This is acceptable for now because:
- It's served gzipped (~5MB over the wire)
- It loads once and stays in memory
- No network calls needed after initial load

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

---

## 6. Common Mistakes

| Mistake | Fix |
|---------|-----|
| `useRef<Type>()` without initial value | Provide `undefined` explicitly: `useRef<Type \| undefined>(undefined)` |
| `toLowerCase()` on Arabic strings | Harmless but pointless — Arabic has no case |
| Loading state UI when data is synchronous | Don't show "loading" for sync data — show it or don't |
| Hardcoded placeholder content (fake verses, mock data) | Remove or replace with real data |
| Adding abstractions (interfaces, factories) for one use case | Don't — YAGNI. Inline until a second caller exists |
| Calling `useRef` outside component | Refs only work inside hooks/components |
| Putting business logic in components | Extract to `utils/` for testability |
| `posts_per_page => -1` in WP (wrong framework!) | This is React, not WordPress. No `$wpdb` here. |

---

## File Structure Quick Reference

```
src/
  App.tsx              ← Root component, orchestrates tabs + sidebar
  types.ts             ← TypeScript interfaces (Surah, Bookmark, etc.)
  utils/
    index.ts           ← toArabicNumerals()
    search.ts          ← searchTafsir() pure function
    tafsir-data.ts     ← getTafsirText() pure function
    localStorage.ts    ← StorageBackend abstraction
  hooks/
    useTafsir.ts       ← Reads tafsir data for a surah
    useChat.ts         ← Search hook (uses search.ts)
    useBookmarks.ts    ← Bookmark management
    useProgress.ts     ← Reading history + completion
    useTheme.ts        ← Dark/light mode
  components/
    [name].tsx         ← One file per component
  data/
    tafsir.ts          ← Auto-generated tafsir content (18MB!)
    surahs.ts          ← Surah metadata (hand-authored)
  test/
    setup.ts           ← jest-dom matchers
```

---

## Resources

- [React 19 docs](https://react.dev/blog/2024/12/05/react-19)
- [Vitest docs](https://vitest.dev/guide/)
- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs/installation)
- [Motion docs](https://motion.dev/) (animation library, replaces framer-motion in this project)
