import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Fragment, Suspense} from 'react'
import Link from 'next/link'
import {getAllEducationalArticleSlugs, getEducationalArticleBySlug} from '@/sanity/queries'
import RichText from '@/components/RichText'
import SanityErrorState from '@/components/SanityErrorState'
import {NO_IMAGE_FALLBACK_URL} from '@/components/PageSection'
import SiteImage from '@/components/SiteImage'
import {seoToMetadata} from '@/lib/seo'

// Independent of /[slug]'s own generateStaticParams — a separate document
// type with its own slug namespace, so there's no shared list to merge and
// no collision risk with customPage (the route paths never overlap).
export async function generateStaticParams() {
  const slugs: {slug: string}[] = await getAllEducationalArticleSlugs()
  return slugs.map(({slug}) => ({slug}))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const {slug} = await params

  try {
    const article = await getEducationalArticleBySlug(slug)
    if (!article) return {}
    return seoToMetadata(article.seo)
  } catch (error) {
    console.error('[Sanity] Metadata fetch failed:', error)
    return {}
  }
}

async function PageContent({slug}: {slug: string}) {
  let article

  try {
    article = await getEducationalArticleBySlug(slug)
  } catch (error) {
    console.error('[Sanity] Failed to fetch Educational Article:', error)
    return <SanityErrorState />
  }

  if (!article) {
    notFound()
  }

  return (
    <Fragment>
      <nav aria-label="Breadcrumb" className="w-full mb-14 px-6 py-5">
        <ol className="flex flex-wrap items-center gap-3 text-sm text-[var(--theme-muted,#9ca3af)]">
          <li>
            <Link
              href="/"
              className="tap-target inline-block pointer-coarse:inline-flex pointer-coarse:items-center hover:text-[var(--theme-text,#ffffff)]"
            >
              Home
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li>
            <Link
              href="/educational/"
              className="tap-target inline-block pointer-coarse:inline-flex pointer-coarse:items-center hover:text-[var(--theme-text,#ffffff)]"
            >
              Educational
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li aria-current="page" className="min-w-0 font-bold text-[var(--theme-text,#ffffff)]">
            {article.title}
          </li>
        </ol>
      </nav>
      <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* The lead picture is the largest thing above the fold, so it is the one preloaded image on this page. */}
        <div className="relative w-full aspect-video overflow-hidden rounded-xl mb-8">
          <SiteImage
            src={article.image?.url || NO_IMAGE_FALLBACK_URL}
            alt={article.image?.alt || article.title || ''}
            sizes="article"
            fill
            preload
            className="object-cover"
          />
        </div>

        {article.eyebrow && (
          <span className="inline-block mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">
            {article.eyebrow}
          </span>
        )}

        {article.title && (
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--theme-text,#ffffff)] mb-6">
            {article.title}
          </h1>
        )}

        {article.description && (
          <RichText
            value={article.description}
            className="text-lg text-[var(--theme-muted,#d1d5db)] leading-relaxed"
          />
        )}

        {article.categories && article.categories.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--theme-text,#101820)] mb-4">
              Categories (tags):
            </h2>

            <div className="flex flex-wrap gap-2">
              {article.categories.map((cat: {slug: string; title?: string}) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="inline-flex min-w-[183px] min-h-[42px] pointer-coarse:min-h-11 items-center justify-center rounded-md bg-[#f3f4fa] px-6 text-sm font-medium text-[#e9432b] transition-colors hover:bg-[#e8eaf3]"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Fragment>
  )
}

export default async function EducationalArticlePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params

  return (
    <div
      className="min-h-dvh overflow-x-hidden"
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
