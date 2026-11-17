import {Fragment} from 'react'
import Link from 'next/link'
import RichText from '@/components/RichText'
import PageSection, {NO_IMAGE_FALLBACK_URL, type Section} from '@/components/PageSection'
import SiteImage from '@/components/SiteImage'

export interface BlogPost {
  title?: string
  eyebrow?: string
  landingTitle?: string
  landingSlug?: string
  categories?: {slug: string; title?: string}[]
  image?: {url?: string; alt?: string}
  description?: unknown
  sections?: Section[]
}

/**
 * A blog post's page body: breadcrumb, image, eyebrow, title and rich text, then the post's own
 * sections, then its category tags. Same layout as an educational article, with the extra
 * sections in between. Colors come from the Site Theme variables (Section Theme applies inside
 * each section through PageSection), with the same fallbacks the article page uses.
 */
export default function BlogPostView({post}: {post: BlogPost}) {
  const sections = post.sections ?? []

  return (
    <Fragment>
      <nav aria-label="Breadcrumb" className="w-full mb-14 px-6 py-5">
        <ol className="flex flex-wrap items-center gap-3 text-sm text-[var(--theme-muted,#9ca3af)]">
          <li>
            <Link href="/" className="hover:text-[var(--theme-text,#ffffff)]">
              Home
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li>
            <Link href={`/${post.landingSlug}`} className="hover:text-[var(--theme-text,#ffffff)]">
              {post.landingTitle || post.landingSlug}
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li aria-current="page" className="font-bold text-[var(--theme-text,#ffffff)]">
            {post.title}
          </li>
        </ol>
      </nav>

      <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* The lead picture is the largest thing above the fold, so it is the one preloaded image on this page. */}
        <div className="relative w-full aspect-video overflow-hidden rounded-xl mb-8">
          <SiteImage
            src={post.image?.url || NO_IMAGE_FALLBACK_URL}
            alt={post.image?.alt || post.title || ''}
            sizes="article"
            fill
            preload
            className="object-cover"
          />
        </div>

        {post.eyebrow && (
          <span className="inline-block mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary,#4ade80)]">
            {post.eyebrow}
          </span>
        )}

        {post.title && (
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--theme-text,#ffffff)] mb-6">
            {post.title}
          </h1>
        )}

        {/* RichText renders nothing for an empty value, so no guard is needed. */}
        <RichText
          value={post.description}
          className="text-lg text-[var(--theme-muted,#d1d5db)] leading-relaxed"
        />
      </article>

      {sections.length > 0 && (
        <div className="w-full">
          {sections.map((section) => (
            <PageSection key={section._key} section={section} />
          ))}
        </div>
      )}

      {post.categories && post.categories.length > 0 && (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-12">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--theme-text,#ffffff)] mb-4">
            Categories (tags):
          </h2>

          <div className="flex flex-wrap gap-2">
            {post.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="inline-flex min-w-[183px] h-[42px] items-center justify-center rounded-md bg-[var(--theme-surface,#f3f4fa)] px-6 text-sm font-medium text-[var(--theme-primary,#e9432b)] transition-opacity hover:opacity-80"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Fragment>
  )
}
