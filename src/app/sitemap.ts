import type {MetadataRoute} from 'next'
import {getSitemapSource} from '@/sanity/sitemapQueries'
import {buildSitemapEntries} from '@/lib/sitemapEntries'
import {getSiteUrl} from '@/lib/siteUrl'

/**
 * /sitemap.xml: every public page, built from the published content in Sanity (so editors never maintain it by hand).
 * Pages marked "No index", switched-off pages and unavailable vehicles are left out; see src/lib/sitemapEntries.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const source = await getSitemapSource()
  return buildSitemapEntries(source, getSiteUrl(process.env))
}
