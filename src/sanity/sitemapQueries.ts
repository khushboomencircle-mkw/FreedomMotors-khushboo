import {cacheLife} from 'next/cache'
import {client} from './client'
import {BLOG_POST_VISIBLE} from './blogQueries'
import {VEHICLE_AVAILABLE} from './vehicleQueries'
import {FIXED_PAGE_PATHS, type SitemapSource} from '@/lib/sitemapEntries'

/** What the sitemap needs from every document: its address part, last edit, and the two SEO settings that can exclude it. */
const SEO_FIELDS = `
  "updatedAt": _updatedAt,
  "noIndex": seo.noIndex,
  "canonicalUrl": seo.canonicalUrl`

/**
 * Everything the sitemap lists, in ONE query, read from the published content only (never drafts). Each rule is the
 * same one the page itself uses to decide whether to show:
 *  - custom pages: Page Active is not switched off (the page route would open an inactive page, but it is hidden from
 *    the site's menus, so it is kept out of search too);
 *  - vehicles: the same "Available" rule as the /vehicles list (vehicleQueries.ts);
 *  - educational articles: Active is not switched off;
 *  - blog posts: the shared visibility rule (blogQueries.ts), evaluated as a live read ($preview = false);
 *  - categories: every category with a slug.
 */
const SITEMAP_QUERY = `{
  "fixedPages": *[_id == "homePage" || _type in ${JSON.stringify(
    Object.keys(FIXED_PAGE_PATHS).filter((t) => t !== 'homePage'),
  )}]{
    "type": _type,
    ${SEO_FIELDS}
  },
  "customPages": *[_type == "customPage" && defined(slug.current) && isActive != false]{
    "slug": slug.current,
    ${SEO_FIELDS}
  },
  "vehicles": *[_type == "vehicle" && defined(slug.current) && ${VEHICLE_AVAILABLE}]{
    "slug": slug.current,
    ${SEO_FIELDS}
  },
  "educationalArticles": *[_type == "educationalArticle" && isActive != false && defined(slug.current)]{
    "slug": slug.current,
    ${SEO_FIELDS}
  },
  "categories": *[_type == "category" && defined(slug.current)]{
    "slug": slug.current,
    ${SEO_FIELDS}
  },
  "blogPosts": *[_type == "blogPost" && defined(slug.current) && ${BLOG_POST_VISIBLE}]{
    "slug": slug.current,
    "landing": landingPage->slug.current,
    ${SEO_FIELDS}
  }
}`

/**
 * The published content behind sitemap.xml. Kept for an hour, so a page published in Studio appears in the sitemap
 * within the hour with no redeploy, and crawlers never cause a burst of Sanity reads.
 *
 * It reads straight from the published-content client (not sanityFetch), so it never depends on the visitor's
 * cookies and can be cached. If Sanity cannot be reached this throws, which is deliberate: an error is not cached, so
 * a failed read can never leave an empty sitemap in place; the crawler simply tries again later.
 */
export async function getSitemapSource(): Promise<SitemapSource> {
  'use cache'
  cacheLife('hours')
  return client.fetch<SitemapSource>(SITEMAP_QUERY, {preview: false})
}
