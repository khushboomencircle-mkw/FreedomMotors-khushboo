/**
 * Where the website lives, and whether search engines should be let in.
 *
 * Plain functions that take the environment as an argument (no imports), so they can be tested alone.
 * Used by robots.ts and sitemap.ts.
 */

type Env = Record<string, string | undefined>

const LOCAL_URL = 'http://localhost:3000'

/** "example.com" or "https://example.com/" -> "https://example.com" (no trailing slash). */
function toOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

/**
 * The public address of this site, with no trailing slash. A sitemap needs full addresses (https://...).
 *
 * 1. NEXT_PUBLIC_SITE_URL: set it to the live domain; this is the one to rely on.
 * 2. On Vercel, the project's production domain (VERCEL_PROJECT_PRODUCTION_URL) for the live site, or
 *    the deployment's own address (VERCEL_URL) for staging and previews.
 * 3. http://localhost:3000 when running on a developer's machine.
 */
export function getSiteUrl(env: Env): string {
  const configured = toOrigin(env.NEXT_PUBLIC_SITE_URL)
  if (configured) return configured
  const vercel =
    env.VERCEL_ENV === 'production'
      ? toOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)
      : toOrigin(env.VERCEL_URL)
  return vercel ?? LOCAL_URL
}

/**
 * True only for the real, live website. Staging, previews and local builds are told to stay out of search engines,
 * so a test copy of the site never shows up in Google beside the real one.
 *
 * On Vercel, VERCEL_ENV is "production" only for the production environment (staging counts as "preview").
 * Anywhere else (another host), a production build is treated as the live site.
 */
export function isLiveSite(env: Env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production'
  return env.NODE_ENV === 'production'
}
