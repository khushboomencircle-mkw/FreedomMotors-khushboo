import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import Link from 'next/link'
import {getAllCategorySlugs, getCategoryBySlug} from '@/sanity/queries'
import SanityErrorState from '@/components/SanityErrorState'
import {seoToMetadata} from '@/lib/seo'

// Independent of /[slug]'s own generateStaticParams, and of /educational/
// [slug]'s — a separate document type with its own slug namespace. A
// two-segment path (/category/<slug>) never collides with the root
// catch-all (/[slug], customPage), which only ever matches one segment.
export async function generateStaticParams() {
  const slugs: {slug: string}[] = await getAllCategorySlugs()
  return slugs.map(({slug}) => ({slug}))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const {slug} = await params

  try {
    const category = await getCategoryBySlug(slug)
    if (!category) return {}
    return seoToMetadata(category.seo)
  } catch (error) {
    console.error('[Sanity] Metadata fetch failed:', error)
    return {}
  }
}

async function PageContent({slug}: {slug: string}) {
  let category

  try {
    category = await getCategoryBySlug(slug)
  } catch (error) {
    console.error('[Sanity] Failed to fetch Category:', error)
    return <SanityErrorState />
  }

  if (!category) {
    notFound()
  }

  type Teaser = {
    slug: string
    title?: string
    eyebrow?: string
    image?: {url?: string; alt?: string}
  }
  const articles: Teaser[] = category.articles ?? []
  const posts: (Teaser & {landingSlug: string})[] = category.posts ?? []

  // Educational articles first, then blog posts (each at its own /<landing page>/<slug> address).
  const items = [
    ...articles.map((article) => ({...article, href: `/educational/${article.slug}`})),
    ...posts.map((post) => ({...post, href: `/${post.landingSlug}/${post.slug}`})),
  ]

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {category.title && (
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--theme-text,#ffffff)] mb-4">
          {category.title}
        </h1>
      )}

      {category.description && (
        <p className="text-lg text-[var(--theme-muted,#d1d5db)] leading-relaxed max-w-3xl mb-10">
          {category.description}
        </p>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((article) => (
            <Link key={article.href} href={article.href} className="group block">
              {article.image?.url && (
                <div className="overflow-hidden rounded-xl mb-4">
                  <img
                    src={article.image.url}
                    alt={article.image.alt || article.title || ''}
                    className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              {article.eyebrow && (
                <span className="inline-block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary,#4ade80)]">
                  {article.eyebrow}
                </span>
              )}

              {article.title && (
                <h2 className="text-xl font-bold text-[var(--theme-text,#ffffff)] transition-colors group-hover:text-[var(--theme-primary,#4ade80)]">
                  {article.title}
                </h2>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[var(--theme-muted,#9ca3af)]">No articles in this category yet.</p>
      )}
    </div>
  )
}

export default async function CategoryPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense
        fallback={<p className="text-[var(--theme-muted,#9ca3af)] text-center py-24">Loading...</p>}
      >
        <PageContent slug={slug} />
      </Suspense>
    </div>
  )
}
