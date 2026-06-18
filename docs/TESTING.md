# Testing Plan — Local Tafsir Data Conversion

## 1. Automated Checks

### `pnpm run lint`
```
$ pnpm run lint
pnpm exec tsc --noEmit
→ Must exit with code 0, no errors.
```

### `pnpm run build`
```
$ pnpm run build
vite build + esbuild server.ts
→ Must exit with code 0.
→ Check dist/ has: index.html, assets/index-*.js, assets/*.css
→ Server bundle at dist/server.cjs
```

## 2. Data Verification

### 2.1 Extraction count
```
$ pnpm exec tsx scripts/extract-tafsir.ts
→ Expected output: "Written 110 surahs (305 sections)"
→ File size ~18 MB
```

### 2.2 Missing surahs
Check `SURAHS_WITH_TAFSIR` in `src/data/tafsir.ts`:
- 44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر) must be absent
- All 110 others must be present

## 3. Manual UI Tests (Dev Server)

Start dev server: `pnpm run dev`

### 3.1 Surah navigation
1. Click surah 1 (الفاتحة) → OverviewTab shows tafsir text
2. Click surah 2 (البقرة) → text loads instantly (no spinner)
3. Click surah 44 (الدخان) → shows "لم يرد تفسير" message
4. Click surah 89 (الفجر) → shows missing message
5. Verify text is continuous prose (no empty sections)

### 3.2 Verses tab
1. Select surah 1 → click Verses tab
2. Dropdown shows actual sections (e.g., "الآيات ١ إلى ٧")
3. Select section → tafsir text updates to match
4. Select "عرض التفسير الإجمالى للسورة" → full text shows again
5. No spinner/loading indicator (instant)

### 3.3 Local search
1. Click Chat tab
2. Type "التصوير الفني" → click Send
3. Results show matching passages with surah names
4. Click a result → navigates to that surah's Verses tab
5. Type a non-matching query → zero results, no crash
6. Empty input → Send button disabled

### 3.4 Server health
```
$ curl http://localhost:3000/api/health
→ {"status":"ok","time":"..."}
```

## 4. Regression Checks
- Sidebar search, juz filter, type filter → still work
- Bookmarks, history, completion → still work (localStorage)
- Stats tab → still shows correct counts
- Dark/light mode toggle → still works
