# في ظلال القرآن — Agent Guide

## Stack
- React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Express 4
- `motion` for animations, `lucide-react` for icons
- pnpm, Vitest + Testing Library (10 test files)
- `vite-plugin-pwa` with workbox (API cache: NetworkFirst)

## Commands
- **Dev:** `pnpm run dev` (runs `tsx server.ts` — Vite middleware, no separate frontend server)
- **Build:** `pnpm run build` (vite build + esbuild server bundle → `dist/`)
- **Start (prod):** `pnpm run start` (`node dist/server.cjs`)
- **Lint:** `pnpm run lint` (`tsc --noEmit`)
- **Test:** `pnpm test` (vitest run); `pnpm run test:watch` for watch mode
- **Clean:** `pnpm run clean`
- **Extract tafsir:** `pnpm exec tsx scripts/extract-tafsir.ts` (regenerates `src/data/tafsir.ts` from `.doc` sources)

## Dev Server
- Single Express process at `http://0.0.0.0:3000`
- Vite runs in middleware mode (no separate HMR server)
- Set `DISABLE_HMR=true` to disable file watching/HMR
- RTL (`dir="rtl"`) — use CSS logical properties; `border-r`/`border-l` with care

## Server Architecture (Dual Path)
- **Local/Prod:** `server.ts` + `server/routes/*` — Express server with Vite middleware or static file serving
- **Vercel:** `api/index.ts` — standalone serverless version (duplicates the same API routes)
- Both share the same REST API surface; keep routes in sync
- Helmet middleware with explicit CSP directives

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
- `@/` → project root (e.g., `@/src/types` works; `@/server.ts` works too)

## Data Sync Architecture
- **localStorage** (immediate): keys `dhilal_theme`, `dhilal_bookmarks`, `dhilal_history`, `dhilal_completed`, `dhilal_device_id`
- **Supabase** (debounced 1.5s, up to 3 retries w/ exponential backoff): syncs via `src/utils/syncBackend.ts`
- Device ID generated via `crypto.randomUUID()` stored in localStorage
- Client sends `x-device-id` header for all user-data API calls
- Default theme: dark mode; brand accent: `#F27D26` (gilded gold)

## Tafsir Content Pipeline
- Raw text from `tafsir.ts` → `formatTafsirParagraphs()` (heuristic paragraph grouping) → `splitVerseSegments()` (verse highlighting)
- Verse text identified by: `«...»` (guillemets) or text ending with `(digit)`
- Verse segments rendered in gold (`text-gilded-gold`) to distinguish from commentary
- Formatting happens in render layer (not extraction script) for faster iteration

## Build
- Client: Vite builds to `dist/assets/`; tafsir data emitted as separate chunk
- Server: esbuild bundles `server.ts` → `dist/server.cjs` (packages marked external)
- `dist/` is gitignored

## Deployment
- Vercel config in `vercel.json`: build via `pnpm run build`, output to `dist/`, API routes from `api/index.ts`
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
