# في ظلال القرآن — Local Data Conversion

## Problem
The app depended on the Gemini AI API to generate tafsir content in real-time. Only 3 surahs had hardcoded fallback text. This made the app non-functional without an API key and internet.

## Solution
Replace all AI-generated content with the actual "في ظلال القرآن" text by Sayyid Qutb, extracted from the 22 `.doc` source files in `fi-thila-al-quran-word-src/`. This makes the app fully offline and self-contained.

## Architecture Change

**Before:**
```
User → React UI → fetch('/api/tafsir') → Express → Gemini AI API
                → fetch('/api/chat')   → Express → Gemini AI API
```

**After:**
```
User → React UI → import { TAFSIR_DATA } from './data/tafsir'
                → local full-text search across TAFSIR_DATA
```

## What Changed

### New file: `scripts/extract-tafsir.ts`
- Uses `catdoc` to extract UTF-8 text from binary `.doc` files
- Regex-parses section headers: `[سورة NAME (ID) : الآيات START إلى END]`
- Strips page references `(1/7767)`, volume headers, index entries
- Groups by surah ID, deduplicates sections
- Outputs `src/data/tafsir.ts`

### New file: `src/data/tafsir.ts` (~18 MB, auto-generated)
- 110 surahs with 305 verse-range sections
- `TAFSIR_DATA: Record<number, TafsirSection[]>` for O(1) lookup
- `SURAHS_WITH_TAFSIR: Set<number>` for fast presence check

### Changed: `src/types.ts`
- Removed `TafsirResponse` (coreConcept, tafsir, spiritualReflection, linguisticSecrets)
- Removed `SearchResult` (unused)
- Added `TafsirSection` with startVerse, endVerse, text

### Changed: `src/hooks/useTafsir.ts`
- Rewritten from async API call to synchronous local lookup
- `fetchTafsir()` now reads from `TAFSIR_DATA` instantly
- Returns `tafsirText: string | null` instead of `TafsirResponse | null`
- Exposes `hasTafsir(surahId: number): boolean`

### Changed: `src/hooks/useChat.ts` → renamed to `useSearch`
- Replaced AI chat with full-text search across all tafsir text
- Word-matching search with relevance scoring
- Returns `SearchMatch[]` with surah name, verse range, text excerpt
- Click-to-navigate to the matching surah

### Changed: `src/components/OverviewTab.tsx`
- Removed coreConcept, spiritualReflection, linguisticSecrets boxes
- Shows continuous prose from the raw tafsir text
- Missing surahs show graceful Arabic fallback message
- Thematic points card remains unchanged (always was local)

### Changed: `src/components/VersesTab.tsx`
- Dropdown now shows actual section ranges from the data
- Removed "تأويل" refresh button (no API to re-fetch)
- Bookmark logic handles section ranges correctly
- Missing surahs show graceful Arabic fallback

### Changed: `src/components/ChatTab.tsx`
- Transformed from AI chat widget to local search interface
- Search results replace message bubbles
- Results clickable → navigate to surah

### Deleted files
- `src/api/tafsir.ts` (old API client)
- `src/api/chat.ts` (old API client)
- `server/routes/tafsir.ts` (Gemini-powered tafsir endpoint)
- `server/routes/chat.ts` (Gemini-powered chat endpoint)
- `server/gemini.ts` (Gemini client singleton)
- `server/localTafsir.ts` (hardcoded fallback)

### Changed: `server.ts`
- Removed tafsirRouter and chatRouter imports
- Removed `dotenv` and `express.json()` — no longer needed
- Only healthRouter remains

### Changed: package.json
- Removed `@google/genai` and `dotenv` dependencies

### Missing Surahs
44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر) show:
"عذراً، لم يرد تفسير هذه السورة في كتاب في ظلال القرآن للسيد قطب."

## Data Flow
```
User selects surah
  → App.useEffect [selectedSurah]
    → fetchTafsir(surah, 'كاملة')
      → useTafsir hook reads TAFSIR_DATA[surah.id]
      → Sets tafsirText = concatenated section text
    → OverviewTab renders tafsirText as continuous prose
    → VersesTab renders sections dropdown + tafsirText

User searches in Chat tab
  → handleSearch(query)
    → Iterates all TAFSIR_DATA entries
    → Word-matches against section text
    → Returns ranked SearchMatch[] results
    → User clicks result → navigates to surah's Verses tab
```
