# Full Analysis: Architecture, Performance & Code Quality Audit

**Project:** في ظلال القرآن (Fi Thilal Al-Quran)
**Date:** 2026-06-02
**Scope:** Architecture audit → Code quality → Performance (in that order)

---

## Phase 1: Architecture Audit

### Problem
`src/App.tsx` is a monolithic 1361-line component containing all state, logic, API calls, UI rendering, and utilities in a single function. `server.ts` embeds hardcoded fallback data (LOCAL_TAFSIR_CACHE) inline.

### Plan

#### 1a. Extract utility functions
- Move `toArabicNumerals` to `src/utils/arabicNumerals.ts`

#### 1b. Create API client layer
- `src/api/tafsir.ts` — `fetchTafsir(surahId, surahName, verseRange): Promise<TafsirResponse>`
- `src/api/chat.ts` — `sendChatMessage(messages, selectedSurah): Promise<{reply: string}>`

#### 1c. Extract custom hooks
- `src/hooks/useTheme.ts` — theme toggle + localStorage
- `src/hooks/useBookmarks.ts` — bookmarks CRUD + localStorage
- `src/hooks/useTafsir.ts` — tafsir fetch + loading + error + reading history
- `src/hooks/useChat.ts` — chat state + send + loading
- `src/hooks/useProgress.ts` — completed surahs + history

#### 1d. Split UI into components
- `src/components/Header.tsx` — Canvas header (theme, bookmark, completion toggles)
- `src/components/SurahBanner.tsx` — Surah info card
- `src/components/TabBar.tsx` — Tab navigation
- `src/components/OverviewTab.tsx` — Core concept, tafsir, reflection, secrets
- `src/components/VersesTab.tsx` — Verse selection, display, verse tafsir
- `src/components/ChatTab.tsx` — Chat messages, input, suggestions
- `src/components/StatsTab.tsx` — Stats, bookmarks list, history
- `src/components/Sidebar.tsx` — Full sidebar panel (surah list, juz list, filters)
- `src/components/Footer.tsx` — App footer

#### 1e. Server refactor
- Extract `LOCAL_TAFSIR_CACHE` to `src/data/localTafsirCache.ts`
- (Optional) Extract route handlers to separate files

### Files to create
```
src/utils/arabicNumerals.ts
src/api/tafsir.ts
src/api/chat.ts
src/hooks/useTheme.ts
src/hooks/useBookmarks.ts
src/hooks/useTafsir.ts
src/hooks/useChat.ts
src/hooks/useProgress.ts
src/components/Header.tsx
src/components/SurahBanner.tsx
src/components/TabBar.tsx
src/components/OverviewTab.tsx
src/components/VersesTab.tsx
src/components/ChatTab.tsx
src/components/StatsTab.tsx
src/components/Sidebar.tsx
src/components/Footer.tsx
```

### Files to modify
- `src/App.tsx` — Slim to orchestration (~100 lines importing and composing components)
- `server.ts` — Extract cache and routes

---

## Phase 2: Code Quality

#### 2a. Type safety
- `catch (apiError: any)` in server.ts → `unknown` + narrowing
- `catch (err)` in App.tsx → same
- `LOCAL_TAFSIR_CACHE: Record<number, any>` → `Record<number, TafsirResponse>`

#### 2b. Hardcoded placeholder ayah text
- App.tsx:910-914 — Fake ayah text not matching selected surah. Replace with placeholder message or remove.
- App.tsx:920 — Same for individual verse view.

#### 2c. Progress bar math bug
- App.tsx:517 — `* 105` should be `* 100`

#### 2d. Config cleanup
- `tsconfig.json`: Remove unused `experimentalDecorators: true`, `useDefineForClassFields: false`

#### 2e. Error handling
- No consistent error response shape. Add one.
- Keyword-match fallback in chat handler is fragile but functional.

---

## Phase 3: Performance

#### 3a. Lazy loading
- Wrap tab content in `React.lazy()` for OverviewTab, VersesTab, ChatTab, StatsTab

#### 3b. Re-renders
- Splitting into components (Phase 1) isolates re-renders naturally
- Add `React.memo` on: SurahBanner, Footer, SurahCard (in Sidebar)

#### 3c. Split coupled useEffect
- App.tsx:133 — `selectedSurah` effect does tafsir fetch AND chat reset. Separate them.

#### 3d. Font display swap
- `index.css`: Add `font-display: swap` to `@import`

#### 3e. Server timeout + cache
- Add 30s timeout to Gemini API calls
- Add in-memory cache for tafsir responses keyed by `surahId-verseRange`

---

## Implementation Order

```
Phase 1 (Architecture):
  utils → API layer → hooks → components → App.tsx slim → server refactor
Phase 2 (Code Quality):
  typesafety → placeholder text → progress bar fix → config cleanup
Phase 3 (Performance):
  lazy loading → React.memo → split effect → font swap → server timeout + cache
```
