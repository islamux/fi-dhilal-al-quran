<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/257e67f6-0495-4bba-9c2f-7f5458829973

## Run Locally

**Prerequisites:**  Node.js + pnpm


1. Install dependencies:
   `pnpm install`
2. Set the `TAFSIR_DATA_PATH` in [.env.local](.env.local) if needed (default: `src/data/tafsir.ts`)
3. Extract tafsir data:
   `pnpm exec tsx scripts/extract-tafsir.ts`
4. Run the app:
   `pnpm run dev`
