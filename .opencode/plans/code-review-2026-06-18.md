# Code Review: Local Tafsir Data Conversion

## Summary
The codebase is functional and passes lint + build cleanly. Three systematic issues: leftover dead UI states from async legacy, hardcoded placeholder Quran verses instead of real data, and fragile escaping in the extraction script. No security or correctness bugs in the data pipeline.

---

## Critical findings

### 1. Dead "loading" states — async legacy never reached

**Files:** `src/components/OverviewTab.tsx:44-46`, `src/components/VersesTab.tsx:152-155`

```tsx
// Both files have this dead branch:
) : (
  <div>يرجى الانتظار، يجري تحميل التفسير...</div>
)}
```

`useTafsir` is now synchronous — `tafsirText` is always set immediately. The "loading" branch renders only when `!hasTafsir` is false AND `tafsirText` is null, which is impossible (missing surahs already show a specific message). **Never reached.**

**Fix:** Delete both `else` branches. The ternary becomes: `hasTafsir` → show text or missing-surah message. No loading state needed.

### 2. Hardcoded placeholder Quran verses — "declares success" anti-pattern

**File:** `src/components/VersesTab.tsx:76-107`

The UI shows fixed static verses (`﴿ يَا أَيُّهَا الْمُنفِقُونَ... ﴾`, `﴿ وَاسْتَعِينُوا بِالصَّبْرِ... ﴾`, `﴿ وَأَقِمِ الصَّلَاةَ... ﴾`) for every surah regardless of actual content. This is a "declares success" failure mode — displays fake data that looks real.

**Fix:** Either (a) source actual verse text from a Quran data file and render real verses, or (b) remove the placeholder section if verse display is out of scope.

### 3. `useSearch` blocks main thread on first search

**File:** `src/hooks/useChat.ts:22-66`

```tsx
setSearching(true);
// synchronous iteration over all 305 sections (18MB)
for (const [surahIdStr, sections] of Object.entries(TAFSIR_DATA)) { ... }
setResults(...);
setSearching(false);
```

`setSearching(true)` doesn't trigger a paint before the synchronous loop starts. The spinner/loading UI never renders before search completes. On slow devices this causes a noticeable freeze.

**Fix:** Wrap the heavy work in `setTimeout(..., 50)` to let the browser paint the loading state first. Longer-term: use a Web Worker.

---

## Important findings

### 4. Template-literal escaping is fragile

**File:** `scripts/extract-tafsir.ts:109-113`

```tsx
const escaped = section.text
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\${/g, '\\${');
```

Manual escape of `\`, `` ` ``, and `${` before inserting into a template literal. Sequences like `\${` compound incorrectly. **Fix:** Replace with `JSON.stringify(section.text.trim())` — handles all escape sequences correctly and eliminates the `escaped` variable.

### 5. `extract-tafsir.ts` crashes without `catdoc`

**File:** `scripts/extract-tafsir.ts:32`

`execSync('catdoc ...')` throws a confusing `ENOENT` if `catdoc` isn't installed. **Fix:** Add try-catch with a helpful install message.

### 6. No tests for search logic

**File:** `src/hooks/useChat.ts`

The word-matching + scoring algorithm has no tests. Edge cases: empty query, single-character query, common words matching everything, mixed Arabic/English, punctuation in text.

---

## Nits

### 7. Duplicated quick-search button pattern

**File:** `src/components/ChatTab.tsx:110-135`

Three buttons with identical `onClick` structure. **Fix:** Extract to a data array and map.

### 8. Hardcoded English in Arabic-first app

**File:** `src/App.tsx:74`

```
QUTB EXEGESIS STUDY • TAFAKKUR SESSION ١١٤
```

Inconsistent with Arabic-only UX elsewhere.

---

## Duplication report

| Pattern | Files | Severity |
|---------|-------|----------|
| Missing-surah + loading message JSX | `OverviewTab.tsx`, `VersesTab.tsx` | Nit — different components |
| Quick-search buttons | `ChatTab.tsx:110-135` | Minor — should be data-driven |
| Loading spinner | `App.tsx:118`, `ChatTab.tsx:91` | Acceptable — different contexts |

## Outdated / Unused code

| File | Item | Why |
|------|------|-----|
| `OverviewTab.tsx:44-46` | Loading message | Dead — sync data, never shown |
| `VersesTab.tsx:152-155` | Loading message | Dead — sync data, never shown |
| `VersesTab.tsx:76-107` | Placeholder verses | Outdated — shows fake text |
