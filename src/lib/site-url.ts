let cached: string | null = null;

/**
 * Resolve the canonical origin for the site (no trailing slash).
 *
 * Priority:
 * 1. `SITE_URL` — explicit override (set the production alias in Vercel env).
 * 2. Vercel's auto-injected `VERCEL_PROJECT_PRODUCTION_URL` (the production alias).
 * 3. Vercel's per-deployment `VERCEL_URL` (always set during builds/deploys).
 * 4. Local dev fallback.
 *
 * Environment fallbacks are read lazily on first call so this stays safe for
 * server-side only usage (metadata, sitemap, robots, OG/canonical URLs).
 */
export function getSiteUrl(): string {
  if (cached) return cached;

  const explicit = process.env.SITE_URL;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const deployment = process.env.VERCEL_URL;

  const base =
    explicit ||
    (production ? `https://${production}` : undefined) ||
    (deployment ? `https://${deployment}` : undefined) ||
    'http://localhost:3000';

  cached = base.replace(/\/+$/, '');
  return cached;
}
