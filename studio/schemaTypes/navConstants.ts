export const BUILT_IN_NAV_HREFS = new Set([
  '/vehicles',
  '/drivers',
  '/convert-your-vehicle',
  '/commercial',
  '/our-story',
  '/contact',
  '/educational',
])

/** Lower-cased, trimmed, no trailing slash — so "/Contact/" and "/contact" compare equal. */
export const normalizeNavHref = (href?: string | null): string =>
  (href ?? '').trim().toLowerCase().replace(/\/+$/, '')

/** True when the href points at a page built in code. */
export const isBuiltInNavHref = (href?: string | null): boolean =>
  BUILT_IN_NAV_HREFS.has(normalizeNavHref(href))

// Routes with no nav link of their own that a custom page must also never take.
// Keep in sync with the folders in src/app/(site).
const SYSTEM_SLUGS = ['category', 'api', 'studio', '_next']

/** First URL segments owned by code: every built-in page above, plus the system routes. */
export const RESERVED_SLUGS = new Set([
  ...Array.from(BUILT_IN_NAV_HREFS, (href) => href.slice(1)),
  ...SYSTEM_SLUGS,
])

/** True when a slug or href starts with a segment owned by a built-in page or system route. */
export function isReservedSlug(slugOrHref: string): boolean {
  return RESERVED_SLUGS.has(slugOrHref.trim().replace(/^\/+/, '').split('/')[0].toLowerCase())
}
