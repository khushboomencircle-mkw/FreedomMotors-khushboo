/** Keys used by the seeded built-in nav links — href is read-only for these. */
export const BUILT_IN_NAV_KEYS = new Set([
  'nav-vehicles',
  'nav-drivers',
  'nav-vehicle',
  'nav-commercial',
  'nav-our-story',
  'nav-contact',
])

/** Hrefs owned by code-built pages — never create a customPage for these. */
export const BUILT_IN_NAV_HREFS = new Set([
  '/vehicles',
  '/drivers',
  '/convert-your-vehicle',
  '/commercial',
  '/our-story',
  '/contact',
  '/educational',
])

// Routes with no nav link of their own that a custom page must also never take.
// Keep in sync with the folders in apps/web/src/app.
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
