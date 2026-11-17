import type {Metadata} from 'next'
import type {Seo} from '@/sanity/queries'
import {ogImageUrl} from '@/lib/imageUrl'

/**
 * Converts a page's `seo` field into Next.js `Metadata`, omitting any key
 * whose underlying seo field isn't set — not just setting it to
 * `undefined`. Next's own metadata merge (node_modules/next/dist/lib/
 * metadata/metadata-resolution-primitives.js, mergeMetadata) walks
 * `for (const key in metadata)`, which still runs for a key that's present
 * with an `undefined` value, overwriting whatever the parent layout
 * resolved for that field with nothing. Omitting the key entirely is the
 * only way an unset seo field actually falls through to the layout's
 * default instead of rendering blank — confirmed by loading a page with no
 * seo set before fixing this: the title rendered as an empty string, not
 * the layout's "Freedom Motors" default.
 */
export function seoToMetadata(seo: Seo | undefined): Metadata {
  return {
    ...(seo?.title ? {title: seo.title} : {}),
    ...(seo?.description ? {description: seo.description} : {}),
    ...(seo?.noIndex ? {robots: {index: false, follow: false}} : {}),
    ...(seo?.canonicalUrl ? {alternates: {canonical: seo.canonicalUrl}} : {}),
    // Social-share image: an absolute URL that bypasses /_next/image (crawlers need a stable public URL), capped at 1200px wide.
    ...(seo?.image ? {openGraph: {images: [{url: ogImageUrl(seo.image)}]}} : {}),
  }
}
