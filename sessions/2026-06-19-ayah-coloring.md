# Session: Ayah Coloring — Gold Verse Text (2026-06-19)

## Goal
Color all Quranic verse text in gold (`#F27D26`) to visually distinguish it from Sayyid Qutb's commentary.

## Files Created

### `src/components/TafsirContent.tsx`
Renders paragraphs via `splitVerseSegments()` — gold `<span className="text-gilded-gold">` for verse segments, normal color for commentary.

### `docs/superpowers/specs/2026-06-19-ayah-coloring-design.md`
Approved design spec — Option B (color ALL Quranic occurrences including inline `«...»`).

### `docs/superpowers/plans/2026-06-19-ayah-coloring.md`
Implementation plan — 5 tasks.

## Files Modified

### `src/utils/tafsir-format.ts`
Added `TafsirSegment` interface and `splitVerseSegments()` (lines ~40-62). Splits paragraph text into segments using:
1. Regex `/(«[^»]*»)/g` to isolate `«...»` ayah quotes (always verse)
2. Remaining text: everything through last `(digit)` is verse; rest is commentary

### `src/utils/tafsir-format.test.ts`
7 new tests for `splitVerseSegments()` covering:
- No verse content → single commentary segment
- Verse number at end → two segments
- Multiple `«...»` quotes → alternating segments
- Mixed: `«...»` quotes + trailing verse numbers

### `src/components/OverviewTab.tsx`
Swapped raw `<p>` map loop for `<TafsirContent>` component.

### `src/components/TafsirDisplay.tsx`
Same swap — uses `<TafsirContent>` with `isDarkMode` prop.

## Architecture Decisions
- **Separation of concerns**: `tafsir-format.ts` has pure segment-splitting logic; `TafsirContent` handles rendering
- **Render-time detection** (not build-time): keeps flexibility for future changes
- **`font-serif` stays on prose wrapper**, not duplicated on `<p>` tags
- **Detection is regex-only**: no NLP/content understanding; greedy `(digit)` matching and `«…»` boundary splitting

## Branch
`feature/phase2-css-polish` (from `main`, cherry-picked Phase 1 commit)

**PR:** https://github.com/islamux/fi-thilal-al-quran-2/pull/8

## Deferred (Next)
- Phase 3: Surah metadata completion (~91 missing entries in surahs.ts)
- Phase 4: Reading UX improvements (search highlighting, text size controls)
- Phase 5: Missing surah extraction (44, 50, 76, 89)
