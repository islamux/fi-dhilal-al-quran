# في ظلال القرآن — Agent Guide

## Stack
- React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Express 4
- `motion` for animations
- pnpm (single-project workspace)

## Commands
- **Dev:** `pnpm run dev` (runs `tsx server.ts` — Vite middleware, no separate frontend server)
- **Build:** `pnpm run build` (vite build + esbuild server bundle → `dist/`)
- **Start (prod):** `pnpm run start` (`node dist/server.cjs`)
- **Lint:** `pnpm run lint` (`tsc --noEmit`)
- **Clean:** `pnpm run clean`
- **Extract tafsir:** `pnpm exec tsx scripts/extract-tafsir.ts` (regenerates `src/data/tafsir.ts` from `.doc` sources)

## Dev Server
- Single Express process at `http://0.0.0.0:3000`
- Vite runs in middleware mode (no separate HMR server)
- Set `DISABLE_HMR=true` to disable file watching/HMR (AI Studio default)
- RTL (`dir="rtl"`) — mind CSS logical properties; use `border-r` / `border-l` with care

## Build
- Client: Vite builds to `dist/assets/`
- Server: esbuild bundles `server.ts` → `dist/server.cjs`
- `dist/` is gitignored

## Data Architecture
- All tafsir content is **local** — extracted from `fi-thila-al-quran-word-src/*.doc` files (Sayyid Qutb's "في ظلال القرآن")
- `src/data/tafsir.ts` — 110 surahs, 305 verse-range sections, ~18 MB auto-generated
- `src/data/surahs.ts` — 114 surah metadata + Juz index
- No AI/API dependency for tafsir or chat
- Chat tab → local full-text search across all tafsir text

## API Endpoints
- `GET /api/health` — healthcheck (only remaining endpoint)

## Missing Surahs (no tafsir in source)
44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر) — shown a graceful message

## Key Paths & Aliases
- `@/` → project root (e.g., `@/src/types` works; `@/server.ts` works too)

## Theme
- localStorage keys: `thilal_theme`, `thilal_bookmarks`, `thilal_history`, `thilal_completed`
- Default: dark mode. Brand accent: `#F27D26` (gilded gold)

## Notable
- No test framework or test files
- No CI/CD, Docker, or GitHub Actions
- Arabic-first; all user-facing text is Arabic
