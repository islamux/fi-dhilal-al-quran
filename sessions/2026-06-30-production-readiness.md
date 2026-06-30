# Production Readiness — Execution Plan

**Score:** 29/100 → Target: 80+/100

## Priority 1 — Quick Fixes (config/deps)
- [ ] Rename package.json `name` → `"fi-thilal-al-quran"`, version → `"1.0.0"`
- [ ] Fix `clean` script: `rm -rf dist` 
- [ ] Remove `autoprefixer` from devDependencies (Tailwind v4 uses Lightning CSS)
- [ ] Update `.env.local` — remove GEMINI_API_KEY dummy, remove AI Studio comments
- [ ] Remove `.env.example` stale file (already git-rm'd, clean up)

## Priority 2 — Security & Server Hardening
- [ ] Add `helmet` middleware for HTTP security headers (CSP, XFO, etc.)
- [ ] Wrap `startServer()` in try/catch with graceful exit
- [ ] Add 404 error page handler in Express production mode
- [ ] Remove `GEMINI_API_KEY` references from any leftover docs

## Priority 3 — Code-Split Tafsir Data (→ main bundle from 18MB to ~200KB)
- [ ] Create `src/data/tafsir-loader.ts` with async `loadSurahTafsir(surahId)` 
- [ ] Refactor `useTafsir.ts` to use async loader instead of static import
- [ ] Refactor `useChat.ts` to dynamically import search index
- [ ] Add loading state for tafsir data
- [ ] Verify treeshaking removes the 18MB from main chunk

## Priority 4 — Polish
- [ ] Unify `TafsirSection` interface (export from types.ts)
- [ ] Add error boundary for unhandled promise rejections
- [ ] Add GitHub Actions CI workflow
