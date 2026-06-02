# في ظلال القرآن — Agent Guide

## Stack
- React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Express 4
- `@google/genai` for AI tafsir/chat; `motion` for animations
- pnpm (single-project workspace)

## Commands
- **Dev:** `npm run dev` (runs `tsx server.ts` — Vite middleware, no separate frontend server)
- **Build:** `npm run build` (vite build + esbuild server bundle → `dist/`)
- **Start (prod):** `npm run start` (`node dist/server.cjs`)
- **Lint:** `npm run lint` (`tsc --noEmit`)
- **Clean:** `npm run clean`

## Dev Server
- Single Express process at `http://0.0.0.0:3000`
- Vite runs in middleware mode (no separate HMR server)
- Set `DISABLE_HMR=true` to disable file watching/HMR (AI Studio default)
- RTL (`dir="rtl"`) — mind CSS logical properties; use `border-r` / `border-l` with care

## Build
- Client: Vite builds to `dist/assets/`
- Server: esbuild bundles `server.ts` → `dist/server.cjs`
- `dist/` is gitignored

## API Endpoints
- `POST /api/tafsir` — body: `{ surahId, surahName, verseRange }` → `TafsirResponse` JSON
- `POST /api/chat` — body: `{ messages, selectedSurah }` → `{ reply }` JSON
- `GET /api/health` — healthcheck

## AI Studio Quirks
- `GEMINI_API_KEY` auto-injected at runtime; local dev needs `.env.local` with real key
- Offline fallback: surahs 1, 19, 112 have hardcoded tafsir; others get dynamic placeholder
- Model: `gemini-3.5-flash` with structured output (`responseSchema`)
- `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`

## Key Paths & Aliases
- `@/` → project root (e.g., `@/src/types` works; `@/server.ts` works too)
- Data: `src/data/surahs.ts` (114 surahs + juz index)

## Theme
- localStorage keys: `thilal_theme`, `thilal_bookmarks`, `thilal_history`, `thilal_completed`
- Default: dark mode. Brand accent: `#F27D26` (gilded gold)

## Notable
- No test framework or test files
- No CI/CD, Docker, or GitHub Actions
- Arabic-first; all user-facing text is Arabic
