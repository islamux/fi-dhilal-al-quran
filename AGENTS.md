# في ظلال القرآن — Agent Guide

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript 6 + Tailwind CSS v4
- `motion` for animations, `lucide-react` for icons
- pnpm, Vitest + Testing Library (117 tests across 13 files)
- `@serwist/next` + `serwist` for PWA (runtime cache: `/api/*` NetworkFirst)
- `@supabase/supabase-js` for user-data sync

## Commands
- **Dev:** `pnpm run dev` (`next dev --webpack` at `http://localhost:3000`)
- **Build:** `pnpm run build` (`next build --webpack` → `.next/`, emits `public/sw.js`)
- **Start (prod):** `pnpm run start` (`next start`)
- **Lint:** `pnpm run lint` (`tsc --noEmit`)
- **Test:** `pnpm test` (vitest run); `pnpm run test:watch` for watch mode
- **Clean:** `pnpm run clean` (`rm -rf .next`)
- **Extract tafsir:** `pnpm exec tsx scripts/extract-tafsir.ts` (regenerates `src/data/tafsir.ts` from `.doc` sources)

> **Note:** `--webpack` is required (NOT Turbopack) — `@serwist/next` only runs its
> service-worker build through the webpack hook. Turbopack bypasses it and no `sw.js`
> is emitted.

## Next.js 16 gotchas
- `params` / `searchParams` are **Promises** — always `await` them in server components/routes.
- `useSearchParams()` consumers must be wrapped in `<Suspense>` (root layout does this via the reader layout).
- `app/manifest.ts` auto-serves `/manifest.webmanifest` and injects its `<link>`; do not also set `metadata.manifest`.
- Server-render tafsir text at build time (SSG) — full Arabic text is in the HTML for SEO.

## Client architecture
- `src/app/(reader)/layout.tsx` → `AppStateProvider` + `WorkstationShell` (client shell)
- `src/app/(reader)/surah/[id]/page.tsx` → SSG ×114 (all surahs incl. the 4 without tafsir), `generateMetadata` + JSON-LD
- `src/components/SurahReader.tsx` → per-surah reader; tab via `?tab=overview|verses|chat|stats` (client)
- `src/context/AppStateContext.tsx` → cross-surah state (`useAppState`); must be inside `AppStateProvider`
- Sidebar navigation does not preserve tab (resets to overview); chat search results push `?tab=verses`

## Server Architecture
- **Unified:** Next.js Route Handlers serve the entire REST API — one code path for dev, prod, and Vercel (no `server.ts`, no separate `api/index.ts`)
- Security headers set in `next.config.ts` `headers()` (CSP limited to production builds)
- Route handlers: `src/app/api/*/route.ts`

## API Endpoints
- `GET /api/health` — healthcheck
- `GET /api/user-data` — fetch user data from Supabase (by `x-device-id` header)
- `PUT /api/user-data` — save user data to Supabase
- `GET /api/user-data/export` — export all user data as JSON
- `POST /api/user-data/import` — import user data from JSON backup

## Data Architecture
- All tafsir content is **local** — extracted from `fi-thila-al-quran-word-src/*.doc` files (Sayyid Qutb)
- `src/data/tafsir.ts` — 110 surahs, 305 verse-range sections, ~18 MB auto-generated (gitignored)
- Tafsir data is **lazy-loaded** via `src/data/tafsir-loader.ts` (dynamic import + singleton promise) to keep main bundle small
- `src/data/tafsir-meta.ts` — `SURAHS_WITH_TAFSIR` set for quick existence checks
- `src/data/surahs.ts` — 114 surah metadata + Juz index
- No AI/API dependency for tafsir or search — everything runs locally

## Missing Surahs (no tafsir in source)
44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر) — UI shows a graceful message

## Key Paths & Aliases
- `@/` → project root (e.g., `@/src/types` works)
- `app/manifest.ts` → web app manifest (Arabic, `#F27D26`, standalone, portrait)
- `src/app/sw.ts` → Serwist service worker source (built to `public/sw.js` by `@serwist/next`)
- `public/sw.js` — build artifact, gitignored

## Data Sync Architecture
- **localStorage** (immediate): keys `dhilal_theme`, `dhilal_bookmarks`, `dhilal_history`, `dhilal_completed`, `dhilal_device_id`
- **Supabase** (debounced 1.5s, up to 3 retries w/ exponential backoff): syncs via `src/utils/syncBackend.ts`
- Device ID generated via `crypto.randomUUID()` stored in localStorage
- Client sends `x-device-id` header for all user-data API calls
- Default theme: dark mode; brand accent: `#F27D26` (gilded gold)
- **Hydration-safe storage:** `localStorageBackend` is SSR-guarded and `useLocalStorageState`
  (mount-read + hydrated save-guard) is used in `useBookmarks`, `useProgress`, `ThemeContext`,
  `useDataSync`, `useDeviceId` — never read/write `localStorage` during SSR to avoid hydration mismatches.

## Tafsir Content Pipeline
- Raw text from `tafsir.ts` → `formatTafsirParagraphs()` (heuristic paragraph grouping) → `splitVerseSegments()` (verse highlighting)
- Verse text identified by: `«...»` (guillemets) or text ending with `(digit)`
- Verse segments rendered in gold (`text-gilded-gold`) to distinguish from commentary
- Formatting happens in render layer (not extraction script) for faster iteration

## PWA
- Service worker via `@serwist/next` (webpack `InjectManifest`) → `public/sw.js`
- `src/app/sw.ts` uses `Serwist` + `defaultCache` from `@serwist/next/worker`
- `defaultCache` runtime caching: pages (HTML) & `/api/*` are **NetworkFirst**; static JS/CSS/assets cached
- Disabled in dev (`disable: NODE_ENV !== 'production'`); test via `next build` + `next start`

## Build
- `next build` produces `.next/` static output; SSG for all 114 surah pages + `/`, sitemap, robots, manifest
- Tafsir data emitted as a separate lazy-loaded chunk (~19 MB)
- `public/sw.js` generated by the webpack build; `.next/` and `public/sw.js` are gitignored

## Deployment
- Vercel (auto-detected). **Note:** the Vercel project's *server-side* framework preset is still the stale `Vite`/`dist` from the pre-migration stack, so `vercel.json` pins `"framework": "nextjs"` + `"buildCommand": "pnpm run build"` to override it. Once the preset is switched to Next.js in the dashboard, `vercel.json` can be removed.
- **Env vars (Vercel Production):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-side, service-role — never ship to the browser), `SITE_URL` (canonical origin for metadata/sitemap/robots; set to the production alias).
- **Canonical URL:** `src/lib/site-url.ts` `getSiteUrl()` — resolves `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `http://localhost:3000`. Used by `layout.tsx`, `surah/[id]/page.tsx`, `sitemap.ts`, `robots.ts`. Do not hardcode the origin in those files.
- **`.vercelignore`** excludes stale artifacts (`dist/`, `.doc` sources, `graphify-out/`, `tsconfig.tsbuildinfo`) but **must keep `src/data/tafsir.ts`** (needed for the SSG build).
- Supabase migration: `supabase/migrations/20260701_create_user_data.sql`
- No CI/CD, Docker, or GitHub Actions

## Conventions
- Arabic-first; all user-facing text is Arabic
- Brand accent `#F27D26` throughout
- RTL layout — mind `start`/`end` properties over `left`/`right`

## Session History
- [`sessions/2026-06-19-tafsir-formatting.md`](sessions/2026-06-19-tafsir-formatting.md) — paragraph formatting heuristic for `.doc` text
- [`sessions/2026-06-19-ayah-coloring.md`](sessions/2026-06-19-ayah-coloring.md) — verse highlighting approach
- [`sessions/2026-06-30-production-readiness.md`](sessions/2026-06-30-production-readiness.md) — production hardening history
