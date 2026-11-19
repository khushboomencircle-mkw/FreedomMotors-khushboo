/**
 * Turns the published content from Sanity into the list of pages for sitemap.xml.
 *
 * Plain data in, plain data out (no Sanity or Next imports), so it can be tested alone. The sitemap lists exactly what
 * a visitor can open and what search engines should index:
 *  - a page an editor marked "No index" in its SEO settings is left out (the page and the sitemap must agree);
 *  - a page whose "Canonical URL" points somewhere else is left out (the sitemap lists the preferred address only);
 *  - a switched-off page or vehicle is left out (the queries in sitemapQueries.ts apply the same visibility rules
 *    as the pages themselves).
 */
import {cleanSlug} from './slug'

/** One document as the sitemap query returns it. */
export interface SitemapDoc {
  slug?: string | null
  /** Blog posts only: the slug of the landing page the post lives under (/<landing>/<post>). */
  landing?: string | null
  updatedAt?: string | null
  noIndex?: boolean | null
  canonicalUrl?: string | null
}

/** A fixed page (one document per page, its address fixed by the website). */
export interface FixedPageDoc {
  type: string
  updatedAt?: string | null
  noIndex?: boolean | null
  canonicalUrl?: string | null
}

export interface SitemapSource {
  fixedPages: FixedPageDoc[]
  customPages: SitemapDoc[]
  vehicles: SitemapDoc[]
  educationalArticles: SitemapDoc[]
  categories: SitemapDoc[]
  blogPosts: SitemapDoc[]
}

export interface SitemapEntry {
  url: string
  lastModified?: string
}

/** The address of each fixed page, by its Sanity document type. Order here is the order in the sitemap. */
export const FIXED_PAGE_PATHS: Record<string, string> = {
  homePage: '/',
  vehiclesPage: '/vehicles',
  driver: '/drivers',
  commercialPage: '/commercial',
  convertVehicle2Page: '/convert-your-vehicle',
  educationalPage: '/educational',
  ourStoryPage: '/our-story',
  contactPage: '/contact',
}

/**
 * One address segment, or undefined when the document has no usable address.
 *  - Blog posts: the site tidies stray slashes ("/my-post" still opens at /<landing>/my-post), so the sitemap does too.
 *  - Everything else: the page looks the document up by its EXACT slug, so the slug is used as it is. A slug that
 *    contains a slash ("my-page/") has no reliable address (hosts drop a trailing slash, which would open a different
 *    document), so it is not listed.
 */
function segment(slug: string | null | undefined, tidy = false): string | undefined {
  if (!slug) return undefined
  if (tidy) {
    const clean = cleanSlug(slug.trim())
    return clean ? encodeURIComponent(clean) : undefined
  }
  return slug.trim() && !slug.includes('/') ? encodeURIComponent(slug) : undefined
}

/** "www.example.com" and "example.com" are the same site; a trailing slash does not change a page. */
const hostOf = (url: URL) => url.host.toLowerCase().replace(/^www\./, '')
const pathOf = (url: URL) => url.pathname.replace(/\/+$/, '')

/**
 * True when the editor chose a different "Canonical URL" for the page, so this address is not the preferred one.
 * A relative canonical ("/about") is read against the page's own address; one that cannot be read at all is ignored
 * (the page is listed rather than silently dropped).
 */
function pointsElsewhere(canonicalUrl: string | null | undefined, ownUrl: string): boolean {
  const value = canonicalUrl?.trim()
  if (!value) return false
  try {
    const canonical = new URL(value, ownUrl)
    const own = new URL(ownUrl)
    return hostOf(canonical) !== hostOf(own) || pathOf(canonical) !== pathOf(own)
  } catch {
    return false
  }
}

/** Only a real date is passed on; anything else is left out rather than written wrongly. */
const validDate = (value: string | null | undefined) =>
  value && !Number.isNaN(Date.parse(value)) ? value : undefined

export function buildSitemapEntries(source: SitemapSource, siteUrl: string): SitemapEntry[] {
  const base = siteUrl.replace(/\/+$/, '')
  const entries: SitemapEntry[] = []
  const seen = new Set<string>()

  const add = (
    path: string | undefined,
    doc: {updatedAt?: string | null; noIndex?: boolean | null; canonicalUrl?: string | null},
  ) => {
    if (path === undefined || doc.noIndex === true) return
    const url = path === '/' ? `${base}/` : `${base}${path}`
    if (pointsElsewhere(doc.canonicalUrl, url) || seen.has(url)) return
    seen.add(url)
    const lastModified = validDate(doc.updatedAt)
    entries.push(lastModified ? {url, lastModified} : {url})
  }

  // Fixed pages, in the website's own order. A page with no document yet is not listed.
  for (const [type, path] of Object.entries(FIXED_PAGE_PATHS)) {
    const doc = source.fixedPages.find((p) => p.type === type)
    if (doc) add(path, doc)
  }

  const under = (prefix: string, docs: SitemapDoc[]) => {
    for (const doc of docs) {
      const slug = segment(doc.slug)
      add(slug ? `${prefix}/${slug}` : undefined, doc)
    }
  }
  under('', source.customPages)
  under('/vehicles', source.vehicles)
  under('/educational', source.educationalArticles)
  under('/category', source.categories)

  // Blog posts live at /<landing page>/<post>; a post with no landing page has no address.
  for (const doc of source.blogPosts) {
    const landing = segment(doc.landing, true)
    const post = segment(doc.slug, true)
    add(landing && post ? `/${landing}/${post}` : undefined, doc)
  }

  return entries
}
