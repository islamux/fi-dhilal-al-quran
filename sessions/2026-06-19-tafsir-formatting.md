# Session: Tafsir Paragraph Formatting (2026-06-19)

## Problem
Main page text showed ~6–7 words in desktop mode. Root causes:
1. `max-w-5xl` (1024px) constrained content width
2. `split('\n')` created individual `<p>` per line from `.doc` extraction (each line = 2–4 words)

## Files Changed

### `src/utils/tafsir-format.ts` (created/refined)
Heuristic paragraph formatter. Splits on `\n\n` first, then joins wrapped lines within sections. Paragraph break when:
- Previous line ends with `.`, `!`, `؟`, `»`, `…`, `..`, or `(digit)` AND
- Current line starts with a known paragraph word (line 27 regex)

**`isNewPara` regex** covers:
`إن` variants, `والبدء`, `ووصفه`, `هذه/هذا`, `ذلك`, `تلك`, `فإن`, `فإنَّ`, `فإذا`, `ثم`, `لكن`, `بل`, `قد`, `لقد`, `أما`, `فأما`, `هنا`, `ومن`, `وقد`, `ولقد`, `ولكن`, `وبعد`, `تبدأ`, `يردد`, `يبدأ`, `يقول`, `يذكر`, `وكذلك`, `فهو`, `فهي`, `فهذا`, `فهذه`, `انتهى`, `نزلت`, `يمضي`, `يشير`, `يتحدث`, `ينتقل`, `يختم`

`و`-prefixed starters like `وهو`, `وفي`, `وهذا`, `وهذه`, `وهي`, `وهكذا`, `وكان`, `وحين` intentionally excluded (mid-paragraph connectors, not paragraph breaks).

### `src/components/MainContent.tsx`
- `max-w-5xl xl:max-w-7xl mx-auto` → `w-full px-4 sm:px-8 md:px-12`

### `src/components/OverviewTab.tsx`
- Updated to use `formatTafsirParagraphs()`

### `src/components/TafsirDisplay.tsx`
- Updated to use `formatTafsirParagraphs()`

### `src/utils/tafsir-format.test.ts` (created)
- 20 tests covering edge cases, surah patterns, Arabic starters

## Data Analysis
- 305 sections across 110 surahs
- Most common commentary-first-word: `هذه` (67x), `هذا` (48x), `في` (20x), `انتهى` (8x), `بعد` (5x)
- Most common internal paragraph starter in commentary: `إن` (1213x), `ثم` (1208x)
- `هذه` + `هذا` = ~38% of all verse-to-commentary transitions

## Architecture Decision
- **Heuristic in render layer** (not extraction script) — faster iteration
- **No NLP** — simple regex + punctuation detection suffices
- **Conservative `و`-prefixed starters** — `وهو/وهي/وهذا/وهذه` are mid-paragraph connectors

## Deferred
- **Search excerpts** (`ChatTab.tsx`, `search.ts`) — short fragments, not worth formatting
- **Extraction script** (`scripts/extract-tafsir.ts`) — Phase 4; would add blank lines at paragraph boundaries in source
- **CSS visual polish** — Phase 2
- **Verse-to-commentary edge cases** — ~85%+ coverage; remaining edge cases (e.g. `يرد القصص` in 2:30-39) fall through but remain readable
