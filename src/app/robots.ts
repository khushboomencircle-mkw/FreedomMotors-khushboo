import type {MetadataRoute} from 'next'
import {getSiteUrl, isLiveSite} from '@/lib/siteUrl'

/**
 * /robots.txt: tells search engines what they may visit.
 *  - Live site: everything public is open; the editing screen (/studio) and the API (/api) are not.
 *  - Staging, previews and local builds: nothing is open, so a test copy never appears in search results.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isLiveSite(process.env)) {
    return {rules: {userAgent: '*', disallow: '/'}}
  }
  return {
    rules: {userAgent: '*', allow: '/', disallow: ['/studio', '/api/']},
    sitemap: `${getSiteUrl(process.env)}/sitemap.xml`,
  }
}
