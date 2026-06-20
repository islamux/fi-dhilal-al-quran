# Search Pagination — "Load More" Button

## Problem
ChatTab search shows only the first 50 results. When there are more, it displays a dead-end message "... و{N} نتيجة أخرى. استفسارك أكثر دقة لعرض نتائج أدق." with no way to see the remaining results.

## Solution
Replace the dead-end message with a working **"Load more"** button. All results are already in memory — pagination is purely presentational.

## Design

### State
- One new piece of state: `visibleCount: number` initialized to `50`

### Rendering
- `results.slice(0, visibleCount)` instead of `results.slice(0, 50)`
- When `results.length > visibleCount`, show a full-width button at the bottom:
  - Text: `عرض {N} نتيجة أخرى` (where N = `results.length - visibleCount`)
  - On click: `visibleCount += 50`
- When `visibleCount >= results.length`, the button is not rendered

### Button Styling
- `w-full` with centered text
- `border`, same border color as other card borders
- Text color: `text-gilded-gold`, font-weight: `font-semibold`
- Hover: `hover:bg-gilded-gold/5`
- `py-3` for comfortable tap target
- Matches existing card border style for dark/light mode

### Other Behaviors
- When `searchInput` changes or a new search is performed, `visibleCount` resets to `50`
- The summary line ("تم العثور على {N} نتيجة") remains unchanged and always reflects the total count

### Files Touched
- `src/components/ChatTab.tsx` only — add state, update slice, add button, remove old message

### Order of Operations
1. Add `visibleCount` state, reset on new search
2. Replace `results.slice(0, 50)` with `results.slice(0, visibleCount)`
3. Replace the "... و{N} نتيجة أخرى" `<p>` with the load-more button
4. Verify: 88 existing tests still pass, `tsc --noEmit` clean, prod build succeeds
