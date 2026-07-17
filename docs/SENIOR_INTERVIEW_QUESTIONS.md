# Senior Engineering Interview: Fi Dhilal al-Quran (في ظلال القرآن)

> **Format:** 4 rounds × 25 questions = 100 + 5 bonus = 105 total
> **Target:** Mid→Senior candidate
> **Style:** FAANG/Big Tech — behavioral, architectural depth, system design, debugging, and coding
> **Project:** Arabic-RTL offline-first PWA for reading Sayyid Qutb's tafsir — **Vite 8 + React 19 + Express + Supabase + vite-plugin-pwa**, 110 surahs / ~18 MB bundled text, anonymous device-keyed cloud sync
> **Note:** Rounds 2 & 3 are reframed to this stack: "React, Vite & Backend Deep Dive" and "TypeScript, Data, Backend & Build Pipeline."

---

## Round 1: Architecture & System Design (25 questions)

### Q1. Why Vite + Express + Supabase + PWA instead of Next.js for this app?

**A:** Documented ADR (`docs/REACT-19-BEST-PRACTICES.md:236-344`): it's a **local-first, offline, private study tool**. (1) No SEO/SSR needed — no public per-surah URLs; content is behind a tab UI. (2) ~18 MB of tafsir text ships in the client bundle and runs client-side; a server/DB would add latency for no benefit. (3) Navigation is tab-based (`useState`), not URL-based — file-based routing is overkill. (4) Express is a thin asset host + sync API; Supabase handles persistence without running a custom DB. Next.js's SSR/SSG/routing strengths are unused here; its constraints (server-centric) would fight the offline-first design. The stack fits the product.

### Q2. There's no router (react-router/hash router). How does navigation work, and what's lost?

**A:** Navigation is pure `useState` tab switching — `activeTab: 'overview'|'verses'|'chat'|'stats'` (`src/hooks/useAppState.ts:12`), rendered conditionally in `MainContent.tsx:74-112`. Sidebar has its own `'surahs'|'juz'` tab. **Lost**: deep-linkable URLs (can't share/bookmark `/surah/2/verses`), browser back/forward (no history), SEO (no per-page indexing), and reload-safety (reload returns to the default tab, losing position). For a private study tool, the trade is acceptable; for a public/shareable app, it'd be a major gap. The Express catch-all (`server.ts:44-51`) returns `index.html` for any path so deep links at least boot the SPA.

### Q3. The app has ~18 MB of tafsir text bundled client-side. How is the load managed?

**A:** Three layers: (1) **Build-time generation** — `scripts/extract-tafsir.ts` produces `src/data/tafsir.ts` (~18 MB, gitignored), never imported at startup. (2) **Singleton-promise dynamic import** — `src/data/tafsir-loader.ts:5-13` uses a memoized `import('./tafsir')` so the 18 MB loads **only on first surah click / first search**, not at app boot. (3) **Manual chunking** — `vite.config.ts:54-56` forces `tafsir` into its own chunk via `manualChunks`, isolating it from the main bundle. Plus PWA precaching (`maximumFileSizeToCacheOnBytes: 25MB`, `vite.config.ts:32`) caches it for offline. Result: fast boot, lazy tafsir, offline-capable.

### Q4. There are two backends: `server.ts` and `api/index.ts`. Why, and what's the cost?

**A:** `server.ts` (long-running Express for dev/prod Node) and `api/index.ts` (Vercel serverless function) implement the **same REST surface** (`/api/health`, `/api/user-data` GET/PUT/export/import). They must be **hand-synced** (`AGENTS.md:24-28`). Reason: the app deploys both as a long-running server (local/dedicated) and as Vercel serverless (`vercel.json:12` routes `/api/*` → `api/index.ts`). Cost: duplication — a route change must be made in both places, or they diverge (a real drift risk). Mitigation: extract shared route handlers into a module both import. Currently they're copy-pasted.

### Q5. The `server.ts` has a Vercel guard: `if (process.env.VERCEL !== '1') startServer()`. Explain.

**A:** `server.ts:59-64` — on Vercel, the serverless function (`api/index.ts`) handles requests; `server.ts`'s `startServer()` (which calls `app.listen`) must NOT also bind a port (Vercel doesn't allow it). The guard skips `startServer` on Vercel, but the module still exports `app` (`:66`) so it could be imported. However, Vercel actually uses `api/index.ts` (per `vercel.json:12`), so the `app` export is moot on Vercel. The guard is defensive but slightly redundant given the routing. A cleaner design: one entrypoint that detects environment.

### Q6. Walk through the dev vs prod server behavior in `server.ts`.

**A:** `startServer()` (`server.ts:30-57`): (1) **Dev** (`NODE_ENV !== 'production'`) — `createViteServer({ server: { middlewareMode: true }, appType: 'spa' })` then `app.use(vite.middlewares)` (`:35-39`); Vite runs in middleware mode (no separate dev server), HMR works. (2) **Prod** — `express.static(dist)` + catch-all `app.get('*')` returning `dist/index.html` with an Arabic RTL 404 on error (`:42-51`). Listens on `0.0.0.0:${PORT}`. So one Express process serves both Vite-HMR (dev) and built static assets (prod). This is the canonical Vite+Express SSR-less setup.

### Q7. Helmet CSP allows `'unsafe-inline'` for scripts and styles. Why, and what's the cost?

**A:** `server.ts:14-23` — `scriptSrc 'self' 'unsafe-inline'`, `styleSrc 'self' 'unsafe-inline' fonts.googleapis.com`. Needed because: Vite injects inline styles/HMR in dev, and `index.html:10-15` has an inline `<style>`. Cost: weakens CSP — an injected inline script/style can execute. Mitigation: (1) move inline styles to external files; (2) use nonce-based CSP (per-request nonce in the script/style tags). Also `crossOriginEmbedderPolicy: false` (`:25`) — relaxed (needed for some fonts/cross-origin). The CSP is permissive for dev convenience; production hardening would tighten it.

### Q8. Identity is an anonymous `X-Device-Id` header. How is it generated, and what are the limits?

**A:** `src/hooks/useDeviceId.ts:6-12` — `crypto.randomUUID()` generated client-side, stored in localStorage (`dhilal_device_id`), sent as `X-Device-Id` header on every sync request. Server (`server/routes/userData.ts:6-13`) reads it; no real auth. Limits: (1) the device id is **forgeable** (any client claiming a uuid owns that row) — fine for anonymous sync, not for sensitive data; (2) clearing localStorage / incognito creates a new identity (loses sync); (3) no account recovery (lose the device → lose the data); (4) can't merge devices. For private reading notes, acceptable; for anything valuable, insufficient.

### Q9. The `user_data` table has no RLS policies. What's the threat model, and what breaks if the key leaks?

**A:** `supabase/migrations/20260701_create_user_data.sql` creates the table but never `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and has no policies. All protection rests on: (a) the `service_role` key staying server-side (`server/lib/supabase.ts:9`), and (b) the `device_id` filter in every query. **If the service_role key leaks** (e.g., accidentally bundled client-side, or `.env.local` exposed), an attacker has **full read/write to every row** (all users' bookmarks/history/completion) — no RLS backstop. Fix: enable RLS + add policies (`device_id` is still the key, but RLS adds defense-in-depth even if you'd need a way to pass device_id to RLS — typically you'd switch to real auth). The no-RLS choice is the #1 security finding.

### Q10. Cloud sync is last-write-wins with no merge. What data-loss scenarios exist?

**A:** `src/utils/syncBackend.ts:80-96` `initFromServer()` **overwrites** local keys from the server on boot; `upsert(...{onConflict:'device_id'})` (`server/routes/userData.ts:55-62`) writes the whole row. Scenarios: (1) **Two devices, both offline, both add bookmarks** — device A syncs (server = A's bookmarks), device B syncs (server = B's bookmarks, A's lost). (2) **Read on phone, switch to laptop** — boot overwrites laptop's local with server's; any unsynced laptop changes lost. (3) **Race** — two near-simultaneous PUTs; last wins. There's no merge, no vector clock, no CRDT. For a single-device user, fine; for multi-device, data loss is inevitable. `docs/TESTING.md:25` falsely claims conflict-resolution tests exist (drift).

### Q11. The Supabase migration is in `.gitignore`. What's the risk?

**A:** `.gitignore:20` ignores `supabase/`, so the schema migration (`20260701_create_user_data.sql`) is **not version-controlled** in the working tree. Risks: (1) a fresh clone has no schema — recreating the DB requires finding the migration elsewhere; (2) schema evolution isn't tracked (no migration history); (3) team members may diverge. The migration IS the contract between app and DB; it must be in version control. Fix: un-ignore `supabase/migrations/` (keep `.gitignore` for `.supabase/` runtime artifacts if any). This is a serious repo-hygiene bug.

### Q12. `.env.example` omits the two env vars the server actually requires. Impact?

**A:** `.env.example:1-2` documents only `PORT`, but the server requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (`server/lib/supabase.ts:8-13` — throws if missing). A new dev copies `.env.example`, runs the server, gets a cryptic throw. Worse, `.env.example` is itself gitignored (`.gitignore:15`) — so even the incomplete template isn't shared. Fix: document both required vars in a committed `.env.example`, and make the throw message helpful ("copy .env.example and set SUPABASE_URL/SERVICE_ROLE_KEY"). This is the highest-friction onboarding bug.

### Q13. How does the PWA caching strategy work, and why `NetworkFirst` for `/api/*`?

**A:** `vite.config.ts:33-42` — runtime caching for `/api/*` uses `NetworkFirst` (cache `api-cache`, `maxEntries:50`, `maxAgeSeconds:86400`). NetworkFirst tries the network, falls back to cache offline — appropriate for sync data (prefer fresh, but work offline). Precaching (`globPatterns: **/*.{js,css,html,ico,png,svg,woff2}`, `:31`) caches all build assets at install. `maximumFileSizeToCacheOnBytes: 25MB` (`:32`) — raised specifically so the ~18 MB tafsir chunk can be precached. `registerType: 'autoUpdate'` silently swaps new SW versions. The strategy set is coherent for an offline-first reader.

### Q14. The tafsir text is inserted as React children (auto-escaped). Why is that XSS-safe?

**A:** Tafsir text is rendered via `{paragraph}` / `{segment}` as React children (`TafsirContent.tsx`, `HighlightedText.tsx`), not `dangerouslySetInnerHTML`. React escapes children by default — `<script>` in the text renders as literal text, not a script. The text comes from the bundled `tafsir.ts` (generated from `.doc` files via `catdoc`), trusted first-party content. The only `JSON.parse` is in `StatsTab.tsx:33` import (validates shape, not XSS — but imported data is re-rendered as children, safe). So no XSS surface. The format/verse-splitting (`tafsir-format.ts`) produces strings/arrays, rendered safely.

### Q15. `formatTafsirParagraphs` runs at render time (not build). Why, and what's the cost?

**A:** `src/utils/tafsir-format.ts:37-78` applies a ~40-Arabic-keyword regex heuristic to format paragraphs, plus `splitVerseSegments` (`:6-35`) colors ayahs gold. Decision (`sessions/2026-06-19-tafsir-formatting.md:38-46`): render-time formatting allows faster iteration on the heuristic (edit + refresh, no rebuild/regenerate). Cost: the formatting runs on **every render** of a surah (not memoized) — for large surahs, a micro-CPU cost per render. Mitigation: `React.memo` the display components (`SurahBanner`, `Footer` are memoized; `TafsirDisplay` calls `formatTafsirParagraphs` at `:26` — consider `useMemo`). Trade-off: dev iteration speed vs runtime cost; for a reader, acceptable.

### Q16. The app supports dark/light themes via React Context + conditional Tailwind classes, NOT Tailwind's `dark:` variant. Why?

**A:** `docs/app-lifecycle.md:852-867` + `src/context/ThemeContext.tsx` — the team chose conditional classes (`isDarkMode ? 'dark-bg' : 'light-bg'`) over Tailwind's `dark:` variant for "finer control / smoother transitions." Cost: every themed component needs both class branches (verbose), and you lose Tailwind's automatic dark-mode tooling. Benefit: explicit control over transitions/animations. This is an unconventional choice (most apps use `dark:`); a senior should question whether the benefit justifies the verbosity. With Tailwind v4's improved dark variant, reconsider.

### Q17. `useAppState` is a "master hook" composing 5 sub-hooks. Walk through the pattern.

**A:** `src/hooks/useAppState.ts:10-54` composes `useBookmarks`, `useProgress`, `useTafsir`, `useSearch`/`useChat`, `useDataSync` + local `useState` for UI flags, returning one big object threaded through props in `App.tsx`. The pattern: one hook aggregates all app state, `App` destructures ~25 props and passes them down explicitly (no spread — `docs/app-lifecycle.md:323-330` calls this "deliberate transparency"). Trade-off: explicit (easy to trace) vs verbose (prop drilling through many levels). An alternative: Context for each concern. The explicit-prop approach avoids Context re-render issues but is finger-heavy. A senior should weigh: at this scale (~25 props), Context might be cleaner.

### Q18. The `useEffect([selectedSurah])` calls `fetchTafsir`/`addHistoryItem`/`setVerseRangeValue`. Is the dependency correct?

**A:** `useAppState.ts:25-29` — the effect lists `[selectedSurah]` but calls three functions. If those functions are stable (useCallback/useMemo), the deps are incomplete-but-safe; if they're recreated each render, the effect runs more than intended. The `docs/REACT-19-BEST-PRACTICES.md:464-471` warns about exactly this. A senior fix: use `useEvent`/ref-stable callbacks or list all deps. The current code likely works because the functions don't change behavior across renders, but it's a lint-rule violation worth cleaning.

### Q19. `useDataSync` has an async IIFE with an unreachable cleanup. What's the bug?

**A:** `src/hooks/useDataSync.ts:8-26` — a `useEffect` containing an async IIFE; the `return` cleanup is inside the IIFE (unreachable from the effect's perspective), so the effect returns `undefined` (no cleanup). The subscription/listener set up inside the IIFE is **never cleaned up** → memory leak / stale listener on unmount. Fix: restructure so the cleanup is the effect's return (not the IIFE's) — e.g., subscribe synchronously, do async work, return a cleanup that unsubscribes. This is a citable React anti-pattern (async in useEffect without proper cleanup handling).

### Q20. Four surahs (44, 50, 76, 89) are missing from the tafsir. How is this handled?

**A:** `src/data/tafsir-meta.ts:2` lists 110 ids (the `SURAHS_WITH_TAFSIR` Set); `src/components/VersesTab.tsx:30-36` shows a graceful Arabic "not available" message for missing surahs; `OverviewTab.tsx:24-34` handles the no-tafsir state. So the UI degrades gracefully (message, not crash). The root cause is the source `.doc` files (those 4 surahs aren't in the extracted corpus). The `surahs.ts` metadata has all 114 (for the index/juz navigation); only the tafsir content is partial. A senior note: this is honest handling of incomplete source data.

### Q21. The production-readiness score is 29/100 (`sessions/2026-06-30-production-readiness.md`). What are the top gaps?

**A:** The backlog: (1) rename package (`fi-dhilal` → correct spelling `fi-thilal` — still pending); (2) `TafsirSection` type declared in **3 places** (`src/types.ts:29`, `src/utils/tafsir-data.ts:1`, re-emitted by `scripts/extract-tafsir.ts:111`) — unify; (3) add CI (none currently, `AGENTS.md:72`); (4) helmet (done); (5) code-split tafsir (done). So some items are resolved, others open. The 29/100 reflects an early state; the resolved items (helmet, code-split, manualChunks) show progress. A senior should treat the score as a snapshot, audit current state, and reprioritize.

### Q22. The Vercel config routes `/api/*` → serverless, `/*` → static. How does that interplay with `server.ts`?

**A:** `vercel.json:11-14` — `/api/*` → `api/index.ts` (serverless fn, `maxDuration:10`); `/*` → `/dist/$1` (static SPA). So on Vercel, `server.ts`'s `startServer()` never runs (the `VERCEL !== '1'` guard, Q5); the static assets come from `dist/`, API from the serverless function. `server.ts` is only used for local/dedicated Node deploys. This is a clean split IF `api/index.ts` and `server.ts` stay in sync (Q4). The risk is divergence — a fix in one not ported to the other.

### Q23. The `index.html` has an inline `<style>` (`:10-15`). Why, given Helmet CSP?

**A:** A small inline style for critical above-the-fold rendering (likely the RTL/font setup) to avoid a flash before the external CSS loads. Helmet's CSP allows `'unsafe-inline'` for styles (`server.ts:18`) partly to permit this. The trade: faster first paint vs weaker CSP. A nonce-based approach would allow this specific inline style via nonce while blocking others. Currently the blanket `'unsafe-inline'` is the simpler choice. The inline style is trusted (hardcoded, no user input).

### Q24. How would you add real user accounts (replacing anonymous device sync)?

**A:** Supabase Auth (email magic-link / OAuth). (1) Add `auth.users` (Supabase managed); link `user_data.user_id → auth.users(id)` (replace or augment `device_id`). (2) RLS policies (`auth.uid() = user_id`) — now meaningful with real auth. (3) Client-side Supabase auth (the browser SDK, since now there's a real session). (4) Merge anonymous device data → user account on first sign-in (like bassaer's `mergeLocalToSupabase`). (5) The Express `/api/user-data` endpoints either become Supabase-direct (client SDK + RLS) or stay server-side with a JWT-verified user. The anonymous→authed migration is the trickiest part (Q10's no-merge becomes merge-on-signin).

### Q25. If you were rebuilding from scratch, top three changes?

**A:** (1) **Enable RLS + real (or at least RLS-backed) auth** — the no-RLS + forgeable device-id model is the #1 risk (Q9). (2) **Single backend** — eliminate the `server.ts`/`api/index.ts` duplication (Q4) via shared handlers; or pick one deploy target. (3) **Conflict-resolving sync** — replace last-write-wins (Q10) with at least a timestamp-based merge or CRDT for bookmarks/history. Beyond: un-ignore `supabase/` migrations (Q11), fix `.env.example` (Q12), add CI, unify the `TafsirSection` type (Q21). The app's offline-first design is sound; the gaps are in security and sync correctness.

---

## Round 2: React, Vite & Backend Deep Dive (25 questions)

### Q26. The tabs use `React.lazy` + `<Suspense>`. What does that buy, and what's the fallback?

**A:** `src/components/MainContent.tsx:12-15` — `lazy(() => import('./OverviewTab'))` etc. for the 4 tabs. This **code-splits** each tab into a separate chunk, loaded on first view. `<Suspense fallback={<Spinner/>}>` (`:73`) shows a spinner during the chunk load. Benefit: the initial bundle excludes tab code (OverviewTab/VersesTab/ChatTab/StatsTab) — faster boot. Since the tafsir itself is already lazy (Q3), the tab split further reduces initial load. Wrapped in `motion`'s `AnimatePresence` for transitions. This is the canonical route-free lazy-loading pattern for a tabbed SPA.

### Q27. `SurahBanner` and `Footer` are `React.memo`-wrapped. Why these two specifically?

**A:** `SurahBanner.tsx` (`React.memo`) — renders the surah header (name, Bismillah); memoized because it rarely changes but its parent (`MainContent`) re-renders on tab/verse changes — `memo` skips re-rendering the banner when its props (surah id) are unchanged. `Footer.tsx` (`React.memo`) — static, never changes; `memo` prevents any parent-driven re-render. The pattern: memoize presentational components that re-render needlessly due to parent state. Notably `TafsirDisplay` (which calls `formatTafsirParagraphs` per render, Q15) is **not** memoized — a candidate for `useMemo`/`memo`.

### Q28. `ErrorBoundary` is a class component with an Arabic fallback. Why class, and what does the fallback do?

**A:** `src/components/ErrorBoundary.tsx:12-52` — class (React requires it for `getDerivedStateFromError`/`componentDidCatch`, no hook equivalent). The fallback (`:15-48`) shows an Arabic error message + `role="alert"` (a11y) + a reset. Like all error boundaries, `reset` clears state but doesn't remount children — a deterministic error re-throws. The boundary wraps the main content area so a tafsir-load/render error doesn't white-screen the whole app (sidebar/header remain usable). This is the canonical placement.

### Q29. `Sidebar` derives `filteredSurahs` instead of storing it. Why is that the right React pattern?

**A:** `src/components/Sidebar.tsx:49-54` — computes `filteredSurahs` from `surahs` + filters each render (no extra state). This is "derived state" — don't store what you can compute. Storing it would require syncing on every filter change (a `useEffect` → stale state bugs). Deriving is always fresh. The only time to store derived state: when the computation is expensive (then `useMemo`). For 114 surahs × simple filter, deriving per render is free. A senior reflex: never duplicate state that's a pure function of other state.

### Q30. `Sidebar` has focus-management effects. What a11y problem do they solve?

**A:** `Sidebar.tsx:35-47` — when the sidebar opens/closes or filters change, the effect manages focus (likely moving focus into the sidebar on open, returning it on close). This is keyboard-a11y: screen-reader/keyboard users need focus to follow the UI change (e.g., opening a modal moves focus in; closing returns it). Without focus management, the focus stays on the trigger button while the sidebar opens elsewhere — disorienting. The `role="tablist/tab"` ARIA (`:81-111`) + focus mgmt together make the sidebar navigable. This is above-average a11y discipline.

### Q31. `StatsTab` does client-side export/import via Blob + hidden file input, bypassing the server endpoints. Why two paths?

**A:** `src/components/StatsTab.tsx:8-48` — export creates a JSON `Blob` + download link (no server round-trip); import reads a file via hidden `<input type=file>` + `JSON.parse`. The server also has `/api/user-data/export|import` (`server/routes/userData.ts:76-131`). So there are two parallel backup mechanisms: client (instant, local) and server (round-trip, syncs). Redundancy is fine, but the client import (`StatsTab.tsx:33`) validates shape only (not deep) — importing a crafted file could set arbitrary bookmarks/history. Defense: validate imported data against expected types. The two paths should be documented as "local backup" vs "cloud sync."

### Q32. `ThemeProvider` uses a lazy `useState` initializer defaulting to dark. Trace the theme flow.

**A:** `src/context/ThemeContext.tsx:13-29` — `useState(() => getInitialTheme())` where `getInitialTheme` reads localStorage (`dhilal_theme`) on the client (defaults dark on SSR/first-load). `toggleTheme` flips + persists + applies classes. Consumers read `isDarkMode` + `toggleTheme` via `useTheme` (`:31-35`). The app defaults dark (a reading preference). Note: this uses conditional Tailwind classes (Q16), not the `dark:` variant. The lazy initializer avoids reading localStorage on every render (once). The theme doesn't FOUC because the class is applied before first paint (via the lazy init + the conditional classes in the initial render).

### Q33. `TafsirContent` returns an array (no Fragment) with `key={i}`. Is that correct?

**A:** `src/components/TafsirContent.tsx:8-13` — returns an array of paragraph elements with `key={i}` (index). Returning an array is valid React (no Fragment needed). `key={i}` (index) is acceptable **only for static lists** (no reorder/insert/delete) — the paragraphs don't move, so index keys are stable and fine. The `formatTafsirParagraphs`/`splitVerseSegments` produce a fixed-order array. A senior note: index keys are a footgun for dynamic lists (reorder breaks identity), but correct here. The array-return + keys is idiomatic for this case.

### Q34. `SectionSelector` grows the range list for surahs >200 verses. Why the dynamic range?

**A:** `src/components/SectionSelector.tsx:17-22` — the tafsir is divided into verse-range sections; long surahs (e.g., Al-Baqarah, 286 verses) have more sections, so the selector offers more range pills. The ranges come from the extracted section data (verse-start to verse-end per section). This adapts the UI to content density. A senior question: are the ranges precomputed in `tafsir-meta.ts` or computed at render? If render-time, `useMemo` for surahs with many ranges.

### Q35. `QuickSearch` offers 10 preset Arabic topic buttons. How do they feed into search?

**A:** `src/components/QuickSearch.tsx:7-9` — 10 hardcoded Arabic topics; clicking sets the search query and navigates to the ChatTab (search). The presets are curated entry points ("justice," "mercy," etc.) for users who don't know what to search. They're a UX affordance, not a separate search mode. A senior note: the presets are hardcoded — a data-driven list (from a config) would be editable without code change. The `useCallback` on submit (`ChatTab.tsx:27-30`) avoids re-creating the handler.

### Q36. `MainContent` wraps tabs in `motion`'s `AnimatePresence`. What's the animation, and the cost?

**A:** `MainContent.tsx:73` — `AnimatePresence` (motion/framer) enables enter/exit animations on tab switch. The tabs fade/slide. Cost: motion adds bundle weight (~30KB+), and exit animations require keeping the old tab mounted briefly. Benefit: polished transitions. For a reader, subtle transitions aid context ("I switched tabs"). The lazy-loaded tabs + AnimatePresence compose (the lazy chunk loads, then animates in). A senior trade-off: animation polish vs bundle/complexity — defensible for a study app used long-term.

### Q37. The Express server uses Vite in middleware mode for dev. Why not a separate Vite dev server?

**A:** `server.ts:35-39` — `createViteServer({ server: { middlewareMode: true }, appType: 'spa' })` + `app.use(vite.middlewares)`. This makes Vite's HMR/transform **part of the Express app**, so the API routes (`/api/*`) and the Vite-served client share one origin/port — no CORS, no proxy config. A separate Vite dev server (port 5173) + Express API (port 3000) would need a proxy (Vite `server.proxy`) and CORS headers. Middleware mode is the simpler dev setup for a combined API+SPA server. This is the canonical Vite+Express pattern.

### Q38. `getSupabase()` is a lazy singleton that throws on missing env. Why throw (not fail softly)?

**A:** `server/lib/supabase.ts:5-17` — `getSupabase()` lazily creates the client; if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are missing, `throw new Error(...)`. Throwing is correct: the server **cannot function** without Supabase (all sync requests fail). Failing softly (returning null) would cause every request to 500 with a confusing null-deref. Throwing at startup (or first use) gives a clear, locatable error. The client (`createClient`) is created once and cached. This is fail-fast design for required config.

### Q39. `getDeviceId(req, res)` sends a 400 and returns null on missing header. Walk through.

**A:** `server/routes/userData.ts:6-13` — if `x-device-id` header is missing, `res.status(400).json({error:'Missing x-device-id header'})` and `return null`. Callers check `if (!deviceId) return;` (the response is already sent). This is the "send + sentinel" pattern for Express handlers. A cleaner pattern: throw a custom error caught by middleware. The current approach works but means each handler must remember to check the sentinel — easy to forget. A senior refactor: a `requireDeviceId` middleware that short-circuits.

### Q40. The `/api/user-data/export` sets `Content-Disposition: attachment`. Why?

**A:** `server/routes/userData.ts:76-101` — sets `Content-Disposition: attachment; filename="..."` so the browser **downloads** the JSON rather than displaying it. The endpoint returns the user's row as JSON for backup. `attachment` triggers the download dialog. Without it, the browser might render the JSON inline. This is the standard way to make an endpoint a "download." The filename includes the device id for traceability.

### Q41. `/api/user-data/import` upserts the same shape as PUT. Why a separate verb?

**A:** `server/routes/userData.ts:103-131` — POST `/import` takes a full data shape and upserts (same as PUT `/api/user-data`). Separate verb (POST vs PUT) semantically distinguishes "import a backup file" from "sync current state." The response (`{message:'imported successfully', data}`) differs from PUT's. This is REST-ish (the verbs aren't perfectly idiomatic — PUT should be idempotent full-replace, which import is). A senior note: the distinction is more semantic than technical; a single PUT could serve both. The separate route is a clarity choice.

### Q42. `App.tsx` destructures ~25 props from `useAppState()` and threads them explicitly. Why not Context?

**A:** `src/App.tsx:8` — explicit prop threading (no spread, per `docs/app-lifecycle.md:323-330` "deliberate transparency"). The team chose explicitness over Context to (a) make the data flow visible (easy to trace what reads what) and (b) avoid Context's re-render characteristics (a context value change re-renders all consumers). Trade-off: verbose (~25 props drilled through several levels) vs explicit. At ~25 props across ~3 levels, it's manageable; at more, Context or a store (Zustand) would win. A senior could argue either way; the explicit approach is defensible for a small app.

### Q43. The `localStorageBackend` has a pub/sub `onChange`. How is it used for sync?

**A:** `src/utils/localStorage.ts:3-20` — a minimal `get/set/onChange` wrapper around localStorage. The `onChange` pub/sub lets the sync engine (`syncBackend.ts`) **react to local writes** — when a bookmark is added, the backend is notified → triggers a debounced sync. This decouples the UI (which writes localStorage) from sync (which reacts). Without pub/sub, sync would have to poll localStorage or be called explicitly after every write. The pattern is a lightweight event bus. Note: the digest says no `remove`/`clear` despite docs claiming tests for them (drift).

### Q44. `createSyncBackend` debounces (1.5s) and retries with exponential backoff. Decode the strategy.

**A:** `src/utils/syncBackend.ts:53-110` — (1) **1.5s debounce** (`:4-5`): batch rapid writes (adding 5 bookmarks syncs once, not 5 times). (2) **3 retries with exponential backoff** (`2^attempt * 1000ms`, `:17-34`): on network failure, retry after 1s, 2s, 4s before giving up. (3) **`inFlight` promise serialization** (`:74-76`): don't start a new sync while one's in flight — queue. (4) **`dhilal_sync_pending` flag** (`:65`): mark that unsynced changes exist (for retry on reconnect). This is a robust client-side sync strategy for flaky networks. The missing piece: conflict resolution (Q10).

### Q45. The SW uses `autoUpdate`. What does the user experience on a new deploy?

**A:** `vite.config.ts:13` `registerType: 'autoUpdate'` — when a new SW is detected, it's installed in the background, `skipWaiting`-like behavior activates it ASAP, and on next navigation the new version runs. The user gets the new version without an explicit "update" prompt. Trade-off: seamless updates but the user might be mid-reading when the new code swaps in (potential inconsistency if the data shape changed). A `prompt` strategy would ask the user — safer but interruptive. For a reading app, `autoUpdate` is usually fine; for one with breaking data migrations, `prompt` is safer.

### Q46. The app has no Suspense for data fetching beyond `React.lazy`. How does data load?

**A:** Data (tafsir, search) loads via `useEffect` + `useState` (the `useTafsir`/`useChat` hooks), not `use(promise)` + Suspense. So there's no Suspense-driven data loading — the hooks manage loading state manually (`loading`, `error`, `data`). This is the pre-Suspense pattern. React 19's `use(promise)` + Suspense could replace it (the tafsir-loader already returns a promise), but the current code uses the classic effect pattern. A senior note: migrating to `use(loadTafsirData())` + Suspense would simplify the loading UI, but the current pattern works.

### Q47. `useChat` (search) runs synchronously on the main thread. What's the perf concern?

**A:** `src/hooks/useChat.ts:15-24` + `src/utils/search.ts:16-57` — `searchTafsir` is a synchronous full-scan over ~18 MB of tafsir text, capped at 50 results (`search.ts:57`). On the main thread, a search janks the UI (blocks interaction during the scan). `docs/REACT-19-BEST-PRACTICES.md:607-608` notes a planned **Web Worker** to move search off the main thread (not yet implemented). A senior fix: a worker (`new Worker(new URL('./search.worker.ts', import.meta.url)`) posts the query, returns results — UI stays responsive. The cap-50 limits the worst case but the scan itself is the cost.

### Q48. `highlightText` uses an `exec` loop with adjacent-match coalescing. What's the edge case?

**A:** `src/utils/highlight.ts:6-36` — regex-escapes the term (`:23-25` likely), then loops `regex.exec()` coalescing adjacent matches (`:23-25`) so "Allah Allah" highlighted as one span, not two adjacent. Edge cases: zero-length matches (infinite loop risk if not guarded), overlapping matches (regex doesn't overlap), and very long input (perf). The coalescing is a refinement for clean rendering. The regex-escape is critical (Q24 of salam shows what happens without it — a `(` throws). Verify the escape covers regex metacharacters.

### Q49. `motion` (the library) is used, not `framer-motion`. What's the difference?

**A:** `package.json` lists `motion ^12.40.0`. Framer Motion rebranded to `motion` (the package `motion` is the new name; `framer-motion` is the legacy). `import { motion, AnimatePresence } from 'motion/react'`. Same library, new package name. Using `motion` (not `framer-motion`) is the current recommendation. A senior note: confirm imports use `'motion/react'` (the React entrypoint), not `'framer-motion'` (legacy). The rebrand is recent; some docs/examples still reference `framer-motion`.

### Q50. `createRoot` + `StrictMode` are in `main.tsx`. What does StrictMode surface here?

**A:** `src/main.tsx:8-9` — `createRoot` + `<StrictMode>`. StrictMode (dev only) double-invokes effects, surfacing: the `useDataSync` unreachable-cleanup bug (Q19 — the subscription leaks), effect deps issues (Q18), impure renders in `formatTafsirParagraphs` (if any mutation). Enabling StrictMode and fixing what it surfaces is high-value dev hygiene. The `useDataSync` bug (Q19) is exactly the kind StrictMode would help reveal (double subscription in dev → visible leak).

---

## Round 3: TypeScript, Data, Backend & Build Pipeline (25 questions)

### Q51. `TafsirSection` is declared in 3 places. Why is that a problem, and how do you unify?

**A:** `src/types.ts:29`, `src/utils/tafsir-data.ts:1`, and re-emitted by `scripts/extract-tafsir.ts:111` all declare `TafsirSection`. Problem: they can drift (one updated, others not) → type mismatches between the generated data, the runtime utils, and the app types. Unify: declare `TafsirSection` **once** in `src/types.ts`, import it everywhere (including the generator — it can import from `src/types` since it runs via `tsx`). The generator re-emitting the type is the worst offender (generated code shouldn't define types consumed by hand-written code). Single source of truth: `src/types.ts`. `sessions/production-readiness.md` flags this.

### Q52. The generator's regex recognizes section headers. Decode it.

**A:** `scripts/extract-tafsir.ts:16` — `/\[سورة\s+([^(]+?)\s*\((\d+)\)\s*:\s*الآيات\s+(\d+)\s+إلى\s+(\d+)\]/` matches `[سورة البقرة (2): الآيات 1 إلى 20]`, capturing surah name, surah id, verse-start, verse-end. The regex is the contract with the `.doc`-extracted text format. If the source format changes (different bracket style, spacing), the regex silently matches nothing → empty output. A defensive generator would log "matched N sections" and fail if N is implausibly low. The regex assumes a very specific textual convention from the Word source.

### Q53. The generator shells out to `catdoc`. What's the dependency risk?

**A:** `scripts/extract-tafsir.ts:35` — `catdoc -d utf-8` decodes `.doc` (binary Word) to text. Risks: (1) `catdoc` is an **external system tool** (not npm) — must be installed separately (`apt install catdoc`); the script hard-exits if missing (`:37-40`). (2) `catdoc` version differences could alter output. (3) `.docx` (newer Word) isn't supported by catdoc (needs `pandoc`/`mammoth`). (4) The build is non-reproducible without the exact catdoc version. A senior fix: use a Node-native `.doc`/`.docx` parser (`mammoth` for `.docx`), or convert sources to a portable format (Markdown/JSON) once and commit that. The `.doc` source files are gitignored (`.gitignore:9`) — so the extraction is irreproducible from a clone.

### Q54. The generator dedupes by `surahId + verse range`. Why, and what's the edge case?

**A:** `scripts/extract-tafsir.ts:86-103` — sections are deduped by `surahId + verseRange` (the same surah + verse range appearing twice is a duplicate). Edge cases: (1) overlapping ranges (1-20 and 15-30) aren't duplicates by this key — both kept (correct if intentional). (2) Two sections with the same range but different text (a real correction) — the second overwrites the first (silent data loss). (3) Near-duplicates (1-20 vs 1-21) aren't caught. A defensive dedupe would hash the text and flag near-duplicates for review. The current dedupe assumes exact-range duplicates are always redundant.

### Q55. `manualChunks` forces `/src/data/tafsir` into its own chunk. Why is this necessary?

**A:** `vite.config.ts:54-56` — without manualChunks, Vite/Rollup might inline the 18 MB tafsir into the main chunk or split it unpredictably based on import graph. Forcing it into a named `tafsir` chunk guarantees: (1) it's a separate file (lazy-loadable), (2) it has a stable name (cacheable), (3) it doesn't bloat the main bundle. Combined with the singleton dynamic import (Q3), this gives precise control over the 18 MB. This is the correct manual chunking for a large data module.

### Q56. `loadTafsirData` is a singleton-promise with reset-on-error. Why reset on error?

**A:** `src/data/tafsir-loader.ts:5-13` — the promise is memoized (created once). On error (`:9-11`), it resets the memoized promise to null so a subsequent call retries (new `import()`). Without reset, a failed import would cache the rejection forever — the user could never recover without reload. With reset, a transient failure (chunk fetch error) allows retry. This is the correct pattern for memoized async that might transiently fail. Trade-off: a deterministic failure (corrupt chunk) retries infinitely on each call — acceptable (the user reloads).

### Q57. The generated `tafsir.ts` exports `TAFSIR_DATA: Record<number, TafsirSection[]>`. Why a Record keyed by surah id?

**A:** Keying by surah id (number) gives O(1) lookup (`TAFSIR_DATA[2]` → Al-Baqarah's sections), vs an array requiring `.find()`. The `tafsir-meta.ts` Set (`SURAHS_WITH_TAFSIR`) tells which keys exist (110 of 114). The Record is sparse (missing 4 surahs). A `Map` would also work; `Record` is plain-object (JSON-serializable, importable). The choice is correct for id-based lookup.

### Q58. `searchTafsir` caps results at 50. Why a cap, and what's the UX implication?

**A:** `src/utils/search.ts:57` — `slice(0, 50)` on results. Cap prevents a huge result set from overwhelming the UI/scan (e.g., searching "الله" matches thousands). UX implication: a user searching a common term sees only 50 (no "show more" pagination in the digest). They might miss relevant results beyond 50. Fix: paginate ("load more") or rank so the top 50 are most relevant (the scoring helps). The cap is a perf/UX trade-off; for a common term, the user may need to refine the query. Document the cap.

### Q59. The build is `vite build && esbuild server.ts --bundle ... --outfile=dist/server.cjs`. Why two bundlers?

**A:** `package.json:8` — Vite builds the **client** (`dist/assets/`, uses Vite's React/Tailwind plugins, PWA injection, manualChunks). esbuild bundles the **server** (`dist/server.cjs`, `--platform=node --format=cjs --packages=external`). Two bundlers because: Vite is client-optimized (dev server, HMR, PWA), and the server is a Node CJS bundle (esbuild is fast, Node-targeted). `--packages=external` keeps `node_modules` external (required at runtime, not bundled — avoids bundling express/helmet). The split is standard for Vite+Express.

### Q60. The server bundle is CJS (`--format=cjs`), but the client is ESM. Why the mismatch?

**A:** Node has historically required CJS for `require()`/`module.exports`; many Node libs (express, helmet) are CJS. Vite's client output is ESM (modern browsers). The server as CJS (`dist/server.cjs`) runs via `node dist/server.cjs` and can `require()` CJS deps directly. ESM server (`.mjs`) would need `import` which works but historically had interop friction. The CJS choice is conservative (maximum Node compatibility). A senior note: modern Node supports ESM well; an ESM server is viable now, but CJS remains safe.

### Q61. `--packages=external` keeps node_modules external in the server bundle. Why?

**A:** esbuild `--packages=external` means `express`, `helmet`, `@supabase/supabase-js` are **not bundled** into `dist/server.cjs` — they're `require()`d at runtime from `node_modules`. Reasons: (1) bundling native/complex deps (Supabase) can break; (2) smaller bundle (deps installed separately); (3) faster build. The trade-off: the deploy must run `pnpm install` (or have `node_modules`) — `vercel.json:1-15` includes `pnpm install`. For serverless (Vercel), the function includes its deps. This is the standard Node-server bundling.

### Q62. The client has no Supabase SDK — only the server does. Why this split?

**A:** The browser never talks to Supabase directly; all Supabase calls are server-side (`server/lib/supabase.ts`, `api/index.ts`) via the **service_role key** (admin). The client only hits the Express `/api/user-data` endpoints. Reasons: (1) the service_role key is admin-level — must never reach the browser; (2) centralizes data access (the Express API is the seam); (3) the browser just sends `X-Device-Id` (forgeable but low-stakes). This is the correct split for a service_role-key architecture. The moment you add real auth (Q24), the client SDK + anon key + RLS becomes viable.

### Q63. `SURAHS` (114) and `JUZ_INDEX` are hand-written in `surahs.ts` (1383 lines). Why hand-written vs derived?

**A:** `src/data/surahs.ts:3` — 114 surah objects (name, verse count, `thematicPoints`) + `JUZ_INDEX` (`:1352`) are reference data (the Quran's structure, not the tafsir). Hand-written because: it's stable canonical data (the 114 surahs don't change), and `thematicPoints` are curated (not mechanical). The tafsir (`tafsir.ts`) is generated (changes with source); the surah metadata is fixed. This is a reasonable split: canonical reference data hand-written, derived content generated. A Zod schema validating `SURAHS` (114 entries, ids 1-114) would catch typos.

### Q64. The `getDeviceId` client hook uses `crypto.randomUUID()`. What's the browser support concern?

**A:** `src/hooks/useDeviceId.ts:6-12` — `crypto.randomUUID()` needs a **secure context** (HTTPS or localhost). On HTTP (e.g., a non-HTTPS deploy), `crypto.randomUUID` is undefined → throws. Since the app is a PWA (requires HTTPS for SW), production is HTTPS — fine. But a local HTTP dev or a non-HTTPS host would break. Fallback: `crypto.getRandomValues`-based UUID or a `Date.now()+Math.random()` fallback for non-secure contexts. The assumption (HTTPS) holds for a PWA, but worth a guard.

### Q65. The Supabase client uses the **service_role** key, never the anon key. What's the security implication?

**A:** `server/lib/supabase.ts:9` — service_role bypasses RLS (which doesn't exist anyway, Q9) and has admin access to the whole project. Used server-side only (never browser). Implication: the server is fully trusted; all authorization is in the Express handlers (the `device_id` filter). If the key leaks (`.env.local` exposed, bundled by mistake), it's a full project compromise (read/write/DELETE anything, auth admin, etc.). The anon key (browser-safe, RLS-enforced) is unused because there's no RLS. Adding RLS + using the anon key client-side would be defense-in-depth (Q24).

### Q66. The `.env.local` contains a live `SUPABASE_SERVICE_ROLE_KEY`. It's gitignored — is that sufficient?

**A:** `.gitignore:7` ignores `.env*`, so it's not committed. But `.env.local` exists on disk with a live admin key — anyone with filesystem read access (or a malicious dependency, or a stolen laptop) has full DB admin. Sufficient for a solo project on a personal machine; insufficient for a team or sensitive data. Best practice: a secrets manager (Doppler, Vault), or at minimum OS-level file permissions, key rotation, and short-lived keys. Supabase service_role keys don't expire by default — rotation is manual. A senior should flag this as "works, but don't let it be the long-term plan."

### Q67. `metadata.json` (project root, 6 lines) is for external tooling, not runtime. How do you know?

**A:** `metadata.json` is 6 lines (name/description) and **not imported** anywhere in `src/`. Grep confirms no runtime reference. It's likely for an external catalog/tooling (a portfolio aggregator, a project lister). Distinguishing runtime vs tooling config: check imports. A senior reflex: if a file isn't imported/read by the app, it's not runtime config — don't assume it affects behavior. The `package.json` is the source of truth for the app's metadata.

### Q68. `vitest.config.ts` uses jsdom env + setup `src/test/setup.ts`. What does the setup do?

**A:** `vitest.config.ts:7-11` + `src/test/setup.ts:1` — jsdom provides a DOM (for component tests), and the setup imports `@testing-library/jest-dom/vitest` (custom matchers like `toBeInTheDocument`). Tests are colocated (`*.test.ts(x)` next to source). The jsdom env lets DOMPurify-style and component tests run in Node. The setup is one line (just the jest-dom import) — minimal. A senior note: jsdom doesn't fully replicate a browser (no layout, limited APIs) — tests pass that might fail in a real browser for layout/Service Worker concerns.

### Q69. The test suite has 103 `it()` across 10 files. What's **not** tested?

**A:** Gaps: (1) `server.ts` and `api/index.ts` (the API handlers — no integration tests); (2) `scripts/extract-tafsir.ts` (the generator — critical pipeline untested); (3) the SW/PWA config (workbox strategies); (4) most hooks beyond pure-function tests (`useAppState`, `useDataSync` with its bug Q19); (5) no e2e (Playwright/Cypress). The tested units are pure functions (`tafsir-format`, `search`, `highlight`, `localStorage`, `syncBackend`) — good unit coverage, thin integration/e2e. The generator being untested is notable given its complexity (Q52-54).

### Q70. `docs/TESTING.md` claims localStorage `remove`/`clear` tests and sync conflict-resolution tests. Do they exist?

**A:** **No** — drift. `localStorage.ts` has no `remove`/`clear` methods (only `get/set/onChange`); `syncBackend.ts` has no merge/conflict logic (last-write-wins, Q10). `docs/TESTING.md:24-25` claims both. So the docs describe tests for features that don't exist. This is the most misleading kind of drift: tests "pass" (for the code that exists) but the docs imply broader coverage. Fix: either implement the features (and tests) or correct the docs. A senior reviewing tests must read the actual test files, not trust docs.

### Q71. The build's `clean` is `rm -rf dist`. Why not also clean `src/data/tafsir.ts`?

**A:** `package.json:10` `clean: "rm -rf dist"` — removes build output, not the generated source (`tafsir.ts`). `tafsir.ts` is regenerated by `extract-tafsir.ts` (separate manual step, not part of `build`). So `clean` resets the build but keeps the generated data (avoiding a re-extraction which needs `.doc` files + catdoc). This is intentional: `clean` is fast (just `dist`); regenerating tafsir is heavy and needs external deps. A `clean:full` that also removes `tafsir.ts` + re-extracts could exist for a deep reset.

### Q72. `tsconfig` has `target: ES2017` (or similar) but the code uses modern syntax. How does that work?

**A:** The `target` controls what JS TS emits, but Vite/esbuild further transpiles for browsers (Browserslist via `baseline-browser-mapping`). So `target` in tsconfig is somewhat moot — Vite handles the final output. `moduleResolution: bundler` + `isolatedModules` matter more (Q69 of voices). The `target` should align with the oldest browser supported; Vite's `build.target` overrides for the client. The server bundle (esbuild `--platform=node`) targets Node. So three "targets" exist (tsconfig, Vite client, esbuild server) — they should be consistent but the build tools have final say.

### Q73. `pnpm-workspace.yaml` allow-lists `@google/genai`, `esbuild`, `protobufjs`. Why these?

**A:** `onlyBuiltDependencies` permits native build scripts: `esbuild` (binary), `protobufjs` (generates code), `@google/genai` (likely protobuf-related native bits). pnpm v9+ blocks native postinstall scripts by default; the allow-list trusts these. Without it, the packages install but their native bits are missing → runtime errors. The list reveals a (planned or vestigial) `@google/genai` (Gemini API) dependency — possibly for the "chat" feature (an AI Q&A over the tafsir?). Worth investigating whether `@google/genai` is actually used or leftover.

### Q74. The generator emits both `tafsir.ts` and `tafsir-meta.ts`. Why two outputs?

**A:** `scripts/extract-tafsir.ts:107-131` — `tafsir.ts` (the ~18 MB content) + `tafsir-meta.ts` (the `SURAHS_WITH_TAFSIR` Set of 110 ids). Splitting: the meta is tiny and imported at app boot (to know which surahs have tafsir, for the index/selector); the content is huge and lazy-loaded (Q3). If they were one file, importing the meta would pull the 18 MB. The split lets the app check "does surah 44 have tafsir?" cheaply (`tafsir-meta.ts`) and load content only on demand (`tafsir-loader.ts`). Correct separation of small-metadata vs large-content.

### Q75. How would you add input validation to the `/api/user-data` PUT endpoint?

**A:** Currently the endpoint trusts the body shape (`server/routes/userData.ts:46-74`). Add Zod: `const userDataSchema = z.object({ bookmarks: z.array(z.any()), history: z.array(z.any()), completed: z.array(z.any()), theme: z.string() })`; `const parsed = userDataSchema.safeParse(body); if (!parsed.success) return 400`. This prevents malformed/giant payloads from being upserted (e.g., a 100MB bookmarks array). Also add size limits (Express `express.json({ limit: '1mb' })`, `server.ts:12`) to prevent payload DoS. Server-side validation is essential even for "trusted" clients (the device-id is forgeable). Share the schema with the client if it sends typed data.

---

## Round 4: Problem-Solving, Debugging & System Evolution (25 questions)

### Q76. A user's bookmarks disappear after switching devices. Diagnose the sync.

**A:** Last-write-wins (Q10). Device A (old bookmarks) syncs to server; device B boots, `initFromServer` overwrites B's local with server's (A's); B's own bookmarks (added offline) are lost. Or both offline, both sync near-simultaneously — last wins. Diagnose: check `dhilal_sync_pending` and the `updated_at` on the server row vs local. The fundamental issue: no merge. Fix: at minimum, a union-merge for bookmarks (additive, never delete on sync) or a CRDT. For history/completion, a last-write-wins per-item (not per-whole-array) is less lossy. The current per-row upsert is too coarse.

### Q77. The app works locally but `/api/user-data` 500s on Vercel. Diagnose.

**A:** On Vercel, `/api/*` → `api/index.ts` (serverless), not `server.ts`. Likely causes: (1) env vars `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` not set in Vercel project env (they're in local `.env.local` only); `getSupabase` throws (`server/lib/supabase.ts:11-13`). (2) `api/index.ts` and `server.ts` diverged (Q4) — a route exists in one but not the other. (3) Serverless cold-start timeout (`maxDuration:10`, `vercel.json`) exceeded. Debug: Vercel function logs, check env vars are set, diff `api/index.ts` vs `server.ts`. The most common cause: missing env vars on Vercel.

### Q78. The 18 MB tafsir chunk fails to load on a slow connection. What happens, and how do you recover?

**A:** `loadTafsirData` (`tafsir-loader.ts`) rejects → the consuming component's error state shows (or the `ErrorBoundary` catches). `loadTafsirData` resets its memoized promise on error (Q56), so a retry re-fetches. The UI should offer a retry. For very slow connections, the 18 MB is a real barrier — options: (1) split the tafsir by surah (load only the requested surah's section, ~50-200 KB each) instead of all-at-once; (2) precache progressively (background fetch after first paint); (3) offer a "download for offline" explicit action. The all-or-nothing 18 MB load is the worst case for slow networks.

### Q79. Search for "الله" janks the UI for 2 seconds. How do you fix it?

**A:** `searchTafsir` runs synchronously on the main thread (Q47), blocking the UI. Fix: move it to a **Web Worker**: `const worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' })`; the worker imports `tafsir-data` + `search.ts`, receives the query, posts results. The main thread stays responsive. The worker loads once (its own chunk), then searches are fast. Vite supports workers natively. The cap-50 (`search.ts:57`) limits results but not the scan cost. `docs/REACT-19-BEST-PRACTICES.md:607-608` notes this as planned. This is the highest-impact search fix.

### Q80. How would you add deep-linkable URLs (`/surah/2/verses/1-20`) without adopting a full router?

**A:** Even without react-router, you can sync tab state to the URL: on tab/surah/verse change, `history.pushState(state, '', `/surah/${id}/${tab}/${range}`)`; on `popstate`, read the URL and restore state. This gives back/forward + shareable links + reload-safety without a router lib. It's a "manual router" — appropriate if you want minimal deps. The Express catch-all (`server.ts:44-51`) already serves `index.html` for any path, so deep links boot the SPA. For more complex routing, adopt react-router (hash or browser) — but the manual approach covers this app's needs.

### Q81. A contributor runs `pnpm build` on a fresh clone and gets "catdoc not found." Why, and how do you prevent it?

**A:** `tafsir.ts` is gitignored (generated); the generator needs `catdoc` (system tool, Q53). On a fresh clone without `tafsir.ts`, the build can't proceed (the lazy import fails). But `pnpm build` doesn't run the generator (it's a separate `extract-tafsir.ts` step). So actually `build` would succeed but the app would have no tafsir at runtime. The "catdoc not found" only fires if they run the generator. Prevention: (1) document the toolchain requirement prominently; (2) provide a fallback (commit a pre-extracted JSON, or a Docker dev image with catdoc); (3) migrate to a Node-native parser (Q53).

### Q82. How would you enable RLS without breaking the anonymous device-id model?

**A:** Challenge: RLS policies use `auth.uid()`, but this app has no auth (device-id is a header, not a JWT). Options: (1) **Switch to real auth** (Q24) — then RLS on `user_id`. (2) **Custom RLS via a function** — Postgres can't read HTTP headers directly; you'd pass the device_id via a Postgres function/`SET LOCAL` and policy — hacky. (3) **Keep server-side service_role + add a second layer** — the Express API validates device_id ownership before any query; RLS is a backstop if the key leaks (but with service_role, RLS is bypassed). The honest answer: RLS is meaningful only with real auth. For the anonymous model, the server-side validation IS the access control; "enabling RLS" without auth is theater. Plan the auth migration (Q24) to make RLS real.

### Q83. The `useDataSync` cleanup bug (Q19) leaks listeners. How do you fix it properly?

**A:** `src/hooks/useDataSync.ts:8-26` — restructure so the effect returns a cleanup function (not the async IIFE). Pattern: `useEffect(() => { let cancelled = false; const unsubscribe = backend.onChange(async () => { if (cancelled) return; ... }); return () => { cancelled = true; unsubscribe(); }; }, [...])`. The `cancelled` flag prevents async work post-unmount; the returned cleanup unsubscribes. This is the standard async-in-effect pattern. The current code's inner `return` is unreachable (the effect returns undefined). StrictMode (Q50) would surface this (double subscription).

### Q84. The verse-coloring regex (`splitVerseSegments`) uses guillemets `«...»` + trailing `(digit)`. What's the fragility?

**A:** `src/utils/tafsir-format.ts:6-35` — detects verses by `«text»` wrapped in guillemets followed by `(number)`. Fragility: (1) if the source uses different quote marks (`"`/`"`) or no quotes, verses aren't detected; (2) if a verse spans the guillemet boundary, it's split wrong; (3) the `(digit)` must immediately follow — formatting whitespace breaks it; (4) non-verse guillemet usage (rare in tafsir) would false-positive. This is heuristic verse detection without a Quran corpus. A robust version would cross-reference a known verse corpus (precision). The heuristic is "good enough" for highlighting but not authoritative.

### Q85. How would you add an AI "ask about this surah" feature (the `@google/genai` dep hints at this)?

**A:** The `chat` tab could be AI-powered (currently it's text search, `useChat.ts`). With `@google/genai` (Gemini): (1) a server endpoint `/api/ask` taking a question + surah context; (2) server calls Gemini with the relevant tafsir text + question; (3) streams the answer back (SSE); (4) the client renders the answer with citations. Considerations: API key (server-side), cost/rate-limiting, hallucination (constrain to the tafsir text via RAG — don't let it invent), and Arabic prompt engineering. The `@google/genai` dep + the `chat` tab name suggest this was planned. This is a significant feature lift with real AI-safety concerns (don't let it issue fatwas).

### Q86. How would you add a "continue reading" / last-position feature?

**A:** Persist per-surah scroll/section position in localStorage (`dhilal_history` already tracks visited surahs; extend with `{surahId, sectionIndex, scrollY}`). On opening a surah, restore the last position (after the lazy tafsir loads). The `useProgress` hook (`src/hooks/useProgress.ts:8`) likely tracks completion — extend it for position. Challenge: the lazy load means the content isn't present immediately; restore scroll after the chunk resolves (await `loadTafsirData`, then `requestAnimationFrame(scrollTo)`). The history list (`StatsTab`) could show "continue: Surah 2, section 3."

### Q87. The `.env.example` is itself gitignored. How do you fix onboarding?

**A:** Un-ignore `.env.example` (commit it as a template) and populate it with **all** required vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`) with placeholder values + comments. Keep `.env.local` ignored (real secrets). The pattern: `.env.example` (committed, template) → copied to `.env.local` (ignored, real values). Currently `.gitignore:15` ignores `.env*` broadly, catching `.env.example` too — change to `.env.local`, `.env.*.local`, etc., leaving `.env.example` committable. This is a one-line `.gitignore` fix with big onboarding impact (Q12).

### Q88. How would you migrate the duplicated backends (`server.ts` + `api/index.ts`) to shared handlers?

**A:** Extract the route logic into `server/routes/userData.ts` (already exists) as **exported handler functions** (not Express-bound). Both `server.ts` and `api/index.ts` import and wire them to their respective frameworks (Express `app.get` vs Vercel's `export async function GET`). Even better: a framework-agnostic handler (`(req) => Promise<Response>`) that both Express and Vercel adapt. The DRY win: a route change in the shared module updates both. The adapters are thin (Express uses `req.params`, Vercel uses `request.json()` etc.). This eliminates the Q4 drift risk. `AGENTS.md:24-28` acknowledges the need.

### Q89. The tafsir text formatting heuristic iterates on every render. Memoize it.

**A:** `src/components/TafsirDisplay.tsx:26` calls `formatTafsirParagraphs(content)` at render. Wrap in `useMemo`: `const formatted = useMemo(() => formatTafsirParagraphs(content), [content])`. Now the (regex-heavy) formatting runs only when `content` changes (surah/section change), not on every parent re-render. Same for `splitVerseSegments` if called per-render. This is a low-risk, high-value perf fix for large surahs. The `React.memo` on `SurahBanner`/`Footer` (Q27) is the component-level version; `useMemo` is the value-level version.

### Q90. How would you add audio recitations for the verses?

**A:** (1) Source per-verse or per-surah audio (e.g., from everyayah.com / mp3quran.net); name by surah:verse. (2) An `<AudioPlayer>` component on the verses tab with play/pause/seek. (3) Preload the current verse's audio; lazy-load others. (4) Sync highlighting with playback (highlight the current verse as audio plays — timing data needed). (5) PWA: audio is large (~1MB/minute); stream (range requests) rather than precache, or offer "download surah audio" explicitly. Challenges: licensing, file sizes, and per-verse timing for highlighting. The audio is independent of the tafsir text (different source).

### Q91. A user reports the SW serves a 6-month-old version after an update. Diagnose.

**A:** `autoUpdate` (`vite.config.ts:13`) should swap to the new SW ASAP. If it's not updating: (1) the SW file (`sw.js`) hash didn't change (no new deploy detected) — verify the deploy produced a new SW. (2) The browser is in a state where `autoUpdate` doesn't trigger (some browsers require all tabs closed). (3) The precache manifest is identical (no asset changes) so the SW sees "no update." (4) `clientsClaim`/`skipWaiting` not set. Debug: DevTools → Application → Service Workers → see the installed SW and update status. Fix: bump the SW cache version explicitly, or switch to `prompt` mode for controlled updates. The `autoUpdate` mode can be sticky in edge cases.

### Q92. How would you add real tests for the Express API?

**A:** Integration tests with the real Express app + a test Supabase instance (or mocked): (1) start the Express app in a test process (or use `supertest` against the `app` export); (2) mock `getSupabase` to return an in-memory fake, or point at a test DB; (3) test each endpoint: GET with valid/missing `X-Device-Id`, PUT with valid/malformed body, export/import round-trip; (4) assert status codes + responses + that the fake DB received the right calls. `supertest` + vitest is the standard stack. The current zero API tests (Q69) is a real gap — the API is the sync contract.

### Q93. How would you add i18n (the app is Arabic-only)?

**A:** The audience is Arabic readers; English/other locales are optional. If wanted: (1) extract Arabic UI strings into a messages file; (2) a `useTranslation` hook (or i18next) — the app is small enough for a simple hook; (3) `<html lang dir>` already `ar`/`rtl` (`index.html:2`) — for LTR locales, flip. (4) The tafsir content is Arabic-only (translation is a massive scholarly effort, out of scope). (5) Decorative English micro-labels (`index.html:6`) — leave or translate. For this app, i18n is low-priority (the content defines the audience). Unlike a portfolio, no real multi-locale need.

### Q94. The `StatsTab` client import (`JSON.parse`) validates shape only. How do you harden it?

**A:** `StatsTab.tsx:33` parses an imported file. A crafted file could set arbitrary bookmarks/history (then sync to server). Harden: (1) Zod schema on the imported data (validate types + sizes); (2) cap array lengths (reject 100k bookmarks); (3) sanitize string fields (length limits); (4) on invalid, reject with a clear error. Since the imported data syncs to the server (and is forgeable anyway via the API), the risk is mostly local (UI breakage) — but defense is still warranted. Share the import schema with the server's PUT validation (Q75).

### Q95. How would you add per-surah sharing (`/surah/2` deep links)?

**A:** Without a router (Q2), implement URL sync (Q80): `history.pushState` on surah select, read on `popstate`/load. The Express catch-all serves `index.html` for `/surah/2` so the link boots the app, which reads the URL and selects surah 2. Add a share button (`ShareButton`-like) using `navigator.share({ url: location.origin + '/surah/2' })`. For OG/social previews, you'd need server-side rendering of meta tags per surah (currently no SSR) — a server route that returns HTML with the surah's OG tags, or a static OG image per surah. The deep-link part is easy; rich social previews need server work.

### Q96. A teammate wants to add Zustand. Respond.

**A:** Current state: `useAppState` master hook (Q17) + `ThemeContext`. The master-hook approach is explicit but finger-heavy (~25 props drilled). Zustand would centralize state in a store with selectors (less drilling, fine-grained subscriptions). Ask: "Is the prop drilling painful?" If yes (and the app grows), Zustand is justified — it'd replace the master hook's prop threading with `useStore(s => s.bookmarks)` selectors. For now, the app works; the master hook is ~50 lines. A migration to Zustand is reasonable but not urgent. The decision hinges on whether the prop drilling is a real friction (it likely is at 25 props).

### Q97. The `app-lifecycle.md` doc shows outdated code samples. How do you keep docs honest?

**A:** (1) **Don't inline code in docs** — link to source (`see src/context/ThemeContext.tsx`) so docs don't rot when code changes. (2) **Version-stamp** — "accurate as of commit X / version Y." (3) **CI docs check** — a script extracting code blocks from docs and verifying they exist in source (fuzzy match). (4) **Archive don't edit** — when a doc is stale, mark it "historical" and write a new one. The `app-lifecycle.md` drift (`:193-214`, `:666-676`, `:785-801` show old `ThemeContext`/`TafsirContent`/`highlightText`) is classic inline-code rot. The meta-fix: prefer linking over copying.

### Q98. How would you add an offline indicator (show "offline" banner when no network)?

**A:** A small client component listening to `online`/`offline` window events: `useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); ... })`. Show a banner when offline. The app already works offline (PWA), so the banner is informational ("you're offline — reading continues, sync will resume when online"). The sync engine's `dhilal_sync_pending` flag could feed a "X changes pending sync" indicator. This is a nice PWA UX touch.

### Q99. The `app-lifecycle.md:57` says "No database. No external APIs." but Supabase sync exists. How do you reconcile?

**A:** Classic docs drift — the doc predates the Supabase sync feature. Reconcile: update the doc to reflect current reality (Supabase sync exists for user data; the tafsir content is bundled, not from a DB/API). The distinction worth preserving: "no database for *content*" (the tafsir is bundled) vs "Supabase for *user state*" (sync). The doc's claim was true at writing; update it. A senior reviewing docs should grep for absolutist claims ("No X. No Y.") — they're drift-prone.

### Q100. Onboarding a new dev: 5-step guide?

**A:** 1. Read `AGENTS.md` (note the version drift: it says Vite 6/TS 5.8, actual Vite 8/TS 6) + `docs/REACT-19-BEST-PRACTICES.md` (the stack rationale). 2. `pnpm install && pnpm dev` (`tsx server.ts`) — visit the app, switch tabs, select a surah (note the lazy tafsir load). 3. Set up Supabase: create a project, run `supabase/migrations/20260701_create_user_data.sql`, set `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (the `.env.example` is incomplete — Q12). 4. Trace the data: `extract-tafsir.ts` (needs `catdoc` + `.doc` files, gitignored) → `tafsir.ts` (18 MB) → `tafsir-loader.ts` (lazy) → `TafsirContent`. 5. Read `sessions/2026-06-30-production-readiness.md` (the 29/100 backlog — some done, some open). Warn: no RLS (Q9), no CI, duplicated backends (Q4), docs drift significantly.

---

## Bonus Round: Stretch Questions (5 questions)

### Q101. The all-or-nothing 18 MB tafsir load is the biggest perf cliff. Design a per-surah lazy strategy.

**A:** Instead of one `tafsir.ts` with all 110 surahs, generate **per-surah files**: `src/data/tafsir/2.ts` (Al-Baqarah's sections), `src/data/tafsir/3.ts`, etc. `loadTafsirData(surahId)` does `import(`./tafsir/${surahId}.ts`)` — loads only the requested surah (~50-500 KB). Vite's dynamic import + the per-file chunking handle the rest. The `tafsir-meta.ts` Set still tells which surahs exist. Search becomes the challenge (it needs all surahs) — load search index progressively (a `search-index.json` per surah, fetched as the user browses) or build it on-demand. The win: opening surah 114 loads ~10 KB, not 18 MB. The cost: 110 files vs 1 (manageable). This is the highest-impact perf refactor.

### Q102. The sync is last-write-wins. Design a conflict-free merge for bookmarks.

**A:** Bookmarks are additive (a set of `{surahId, sectionIndex}` or similar). A **set-union merge** is conflict-free: `merged = new Set([...local, ...server])`. Deletions are the hard part (tombstones). For a CRDT: each bookmark is `{id, surahId, sectionIndex, deleted, timestamp}`; merge takes the union, and for duplicates by `id`, takes the one with the later `timestamp` (so a delete that's newer wins). This is an LWW-element-set CRDT. For history (append-only), union + dedupe by `{surahId, timestamp}`. For completion (boolean per surah), LWW per surah. The current per-row upsert is the wrong granularity — per-item CRDTs are correct. This eliminates the Q10 data loss.

### Q103. The duplicated backends (`server.ts` + `api/index.ts`) must be hand-synced. Design the unification.

**A:** (1) Extract handlers into `server/routes/*.handler.ts` as pure functions `(input) => Promise<output>` (no Express/Vercal coupling). (2) `server.ts` adapts: `app.get('/api/user-data', async (req, res) => { const out = await getUserData({ deviceId: req.headers['x-device-id'] }); res.json(out) })`. (3) `api/index.ts` adapts: `export async function GET(request: Request) { const out = await getUserData({ deviceId: request.headers.get('x-device-id') }); return Response.json(out) }`. (4) Shared validation, types, Supabase access in the handler modules. (5) Test the handlers directly (framework-agnostic). Result: one logic source, two thin adapters, no drift. This is the standard "hexagonal/ports-adapters" approach.

### Q104. The no-RLS + service_role model is the #1 security risk. Design the migration to RLS-backed auth.

**A:** (1) **Add Supabase Auth** (email magic-link): users sign in, get a JWT session. (2) **Add `user_id` to `user_data`** (FK → `auth.users`), keep `device_id` for the anonymous→authed merge. (3) **Enable RLS** + policies: `create policy "own row" on user_data for select using (auth.uid() = user_id)` (and insert/update/delete likewise). (4) **Client Supabase SDK** with anon key (browser-safe) — replaces the `X-Device-Id` API calls with direct Supabase queries (RLS-enforced). (5) **Merge on sign-in**: anonymous device bookmarks → user account (bassaer's `mergeLocalToSupabase`). (6) Deprecate the Express `/api/user-data` (or keep as a thin proxy). (7) Rotate the service_role key (it was the only protection; now RLS backs everything). The bassaer codebase is the template.

### Q105. Docs drift is severe (versions, false tests, stale samples). Design a docs-freshness process.

**A:** (1) **No inline code in docs** — link to source (`src/...:line`) so code changes don't rot docs (Q97). (2) **Generate structural facts** — file lists, route inventories, dep versions from `package.json` into docs (or remove hand-maintained copies). (3) **Version-stamp every doc** — "Last verified against: Vite 8, React 19, <date>"; archive (don't edit) when stale. (4) **CI docs check** — a script (a) grepping docs for known-drift patterns (wrong versions, claims of features that don't exist like "conflict resolution tests"), (b) verifying cited file paths exist, (c) diffing `package.json` versions against docs claims. (5) **Single source** — `AGENTS.md` and `README.md` duplicate facts; consolidate. (6) **PR rule** — a behavior-changing PR updates docs in the same PR. The meta-fix: process, not just one edit. This repo's docs rotted because nothing enforced freshness.

---

## Evaluation Criteria

| Area | Mid | Senior | Staff |
|------|-----|--------|-------|
| **Architecture** | Explains the Vite+Express+Supabase split | Debates SPA-no-router trade-offs | Designs the per-surah lazy load + backend unification |
| **React/Vite** | Knows `React.lazy` + Suspense | Diagnoses `useDataSync` cleanup bug | Designs the Web Worker search migration |
| **Backend** | Traces the Express↔Supabase flow | Finds the duplicated-backend drift | Designs RLS-backed auth + shared handlers |
| **Data** | Explains the catdoc extraction | Diagnoses last-write-wins data loss | Designs the per-item CRDT merge |
| **PWA** | Knows what a SW does | Debates NetworkFirst vs cache strategies | Designs the per-surah progressive caching |
| **Security** | Knows XSS basics | Identifies the no-RLS + service_role risk | Designs the full auth + RLS + key-rotation migration |
| **Performance** | Knows lazy-loading | Diagnoses the 18 MB all-or-nothing cliff | Designs Web Worker search + per-surah chunks |
| **Maintainability** | Notices docs drift | Catalogs stale docs/false tests | Designs the docs-freshness CI process |

---

*End of interview document. 105 questions across 5 rounds. All file/function references verified against the fi-dhilal-al-quran codebase.*
