/**
 * Where each kind of document lives on the website, so the Studio can open it in the live preview with one click.
 * These are the same addresses the Presentation tool's "locations" use (studio/presentation.ts). Pure functions.
 */

/** The fixed pages: one address each. */
export const FIXED_PAGE_ROUTES: Record<string, string> = {
  homePage: '/',
  vehiclesPage: '/vehicles',
  // A shared template for every vehicle's page, not a page of its own: it points at the listing.
  vehicleDetailPage: '/vehicles',
  convertVehicle2Page: '/convert-your-vehicle',
  driver: '/drivers',
  commercialPage: '/commercial',
  ourStoryPage: '/our-story',
  contactPage: '/contact',
  educationalPage: '/educational',
}

/** Documents whose address comes from their slug. */
const SLUG_ROUTES: Record<string, (slug: string) => string> = {
  customPage: (slug) => `/${slug}`,
  educationalArticle: (slug) => `/educational/${slug}`,
  vehicle: (slug) => `/vehicles/${slug}`,
  category: (slug) => `/category/${slug}`,
}

/** The kinds of document that can be previewed. */
export const PREVIEWABLE_TYPES = new Set([
  ...Object.keys(FIXED_PAGE_ROUTES),
  ...Object.keys(SLUG_ROUTES),
  'blogPost',
])
export const isPreviewable = (type: string | undefined): boolean =>
  type !== undefined && PREVIEWABLE_TYPES.has(type)

/** A slug as stored can have stray slashes (older content); the website's address never does. */
export const cleanSlug = (slug: unknown): string =>
  typeof slug === 'string' ? slug.replace(/^\/+|\/+$/g, '').trim() : ''

interface DocumentLike {
  slug?: {current?: string}
}

/**
 * The website address of a document, or undefined when it cannot be worked out (no slug yet, or a blog post whose
 * landing page has none). A blog post lives under its landing page: /<landing page>/<post>.
 */
export function previewPathFor(
  type: string,
  doc: DocumentLike | undefined,
  landingPageSlug?: string,
): string | undefined {
  if (type in FIXED_PAGE_ROUTES) return FIXED_PAGE_ROUTES[type]
  const slug = cleanSlug(doc?.slug?.current)
  if (!slug) return undefined
  if (type === 'blogPost') {
    const landing = cleanSlug(landingPageSlug)
    return landing ? `/${landing}/${slug}` : undefined
  }
  return SLUG_ROUTES[type]?.(slug)
}

/** The Presentation tool's address for a site path (the tool is registered as "preview", under the Studio's base). */
export const previewToolUrl = (studioBase: string, sitePath: string): string =>
  `${studioBase}/preview?preview=${encodeURIComponent(sitePath)}`
