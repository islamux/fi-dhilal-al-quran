<div align="center">
<h1>في ظلال القرآن</h1>
<p><strong>Fi Dhilal al-Quran</strong> — An offline-first digital reader for Sayyid Qutb's monumental tafsir.</p>
</div>

## About

A progressive web app (PWA) for reading **في ظلال القرآن** by Sayyid Qutb. Contains 110 surahs with 305 verse-range sections of tafsir text, fully local with no external AI/API dependency for tafsir or search.

**Features:**
- Full-text search across all tafsir content (runs locally in the browser)
- Dark/light theme with gilded gold (`#F27D26`) accents
- Bookmark surahs and track study completion
- Verse text highlighted in gold to distinguish from commentary
- Responsive RTL layout
- Juz navigation
- **Offline-first** — installable PWA with Service Worker runtime caching (`/api/*` NetworkFirst)
- **SEO / static generation** — all 114 surah pages statically generated (SSG) with per-surah metadata, OpenGraph, canonical URLs, and JSON-LD

**Missing surahs** (no source text): 44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 6
- **Styling:** Tailwind CSS v4 + `motion` (animations) + `lucide-react` (icons)
- **PWA:** `@serwist/next` + `serwist` (Service Worker built via the webpack build)
- **Backend/API:** Next.js Route Handlers (`/api/*`) — one code path for dev, prod & Vercel
- **State sync:** `@supabase/supabase-js` (anonymous, device-keyed via `x-device-id` header)
- **Testing:** Vitest + Testing Library (117 tests across 13 files)
- **Package manager:** pnpm

## Getting Started

**Prerequisites:** Node.js + pnpm

```bash
pnpm install
pnpm run dev
```

Opens at `http://localhost:3000`.

> **Note:** dev/build use `next --webpack` (NOT Turbopack) — `@serwist/next` only emits the Service Worker through the webpack build hook.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start dev server (`next dev --webpack`) |
| `pnpm run build` | Build for production (`next build --webpack` → `.next/`, emits `public/sw.js`) |
| `pnpm run start` | Run production server |
| `pnpm run lint` | TypeScript type check (`tsc --noEmit`) |
| `pnpm test` | Run tests (vitest) |
| `pnpm exec tsx scripts/extract-tafsir.ts` | Regenerate `src/data/tafsir.ts` from `.doc` sources |

## Architecture

- **SSG ×114:** `src/app/(reader)/surah/[id]/page.tsx` statically renders every surah at build time (full Arabic tafsir prose in the HTML for SEO), with `generateMetadata` + JSON-LD.
- **Lazy tafsir data:** `src/data/tafsir.ts` (~18 MB) is lazy-loaded via `src/data/tafsir-loader.ts` (dynamic import + singleton promise) so it doesn't bloat the main bundle.
- **Client shell:** `src/app/(reader)/layout.tsx` → `AppStateProvider` + `WorkstationShell`; the per-surah reader tab UI (`?tab=overview|verses|chat|stats`) lives in `src/components/SurahReader.tsx`.
- **Hydration-safe storage:** solo `localStorage` + `useLocalStorageState` backend (SSR-guarded) keeps client state consistent with Next.js server rendering.
- **Unified API:** Next.js Route Handlers (`GET /api/user-data`, `PUT /api/user-data`, `/export`, `/import`, `GET /api/health`) call Supabase server-side with the `service_role` key.

## Data

All tafsir content is extracted from `fi-thila-al-quran-word-src/*.doc` files and compiled into `src/data/tafsir.ts` (~18 MB, gitignored). No AI or network APIs are used for tafsir or search — everything runs locally.

## Deployment

Deployed on **Vercel** — auto-detects Next.js (no `vercel.json`). Security headers (CSP, X-Frame-Options, etc.) are applied production-only via `next.config.ts` `headers()`.

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).
