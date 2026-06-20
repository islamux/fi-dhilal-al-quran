<div align="center">
<h1>في ظلال القرآن</h1>
<p><strong>Fi Thilal al-Quran</strong> — A digital reader for Sayyid Qutb's monumental tafsir.</p>
</div>

## About

A fully offline web application for reading **في ظلال القرآن** by Sayyid Qutb. Contains 110 surahs with 305 verse-range sections of tafsir text, fully local with no external API dependencies.

**Features:**
- Full-text search across all tafsir content
- Dark/light theme with gilded gold (`#F27D26`) accents
- Bookmark surahs and track study completion
- Verse text highlighted in gold to distinguish from commentary
- Responsive RTL layout
- Juz navigation

**Missing surahs** (no source text): 44 (الدخان), 50 (ق), 76 (الإنسان), 89 (الفجر)

## Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Tailwind CSS v4, Vite 6
- **Backend:** Express 4 (single process, Vite middleware)
- **Testing:** Vitest + Testing Library
- **Package manager:** pnpm

## Getting Started

**Prerequisites:** Node.js + pnpm

```bash
pnpm install
pnpm run dev
```

Opens at `http://0.0.0.0:3000`.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start dev server |
| `pnpm run build` | Build for production → `dist/` |
| `pnpm run start` | Run production server |
| `pnpm run lint` | TypeScript type check |
| `pnpm test` | Run tests |
| `pnpm exec tsx scripts/extract-tafsir.ts` | Regenerate `src/data/tafsir.ts` from `.doc` sources |

## Data

All tafsir content is extracted from `fi-thila-al-quran-word-src/*.doc` files and compiled into `src/data/tafsir.ts` (~18 MB). No AI or network APIs are used for tafsir or search — everything runs locally.

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).

The tafsir text remains the work of Sayyid Qutb (شهيد الفكرة).
