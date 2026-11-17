import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import {getAllBlogPostPaths, getBlogPostByPath} from '@/sanity/queries'
import BlogPostView from '@/components/BlogPostView'
import SanityErrorState from '@/components/SanityErrorState'
import {seoToMetadata} from '@/lib/seo'

type Params = Promise<{slug: string; post: string}>

// Cache Components rejects an empty generateStaticParams, and a site with no blog posts yet is a
// normal state. In that case one placeholder address is returned, and it always renders a 404.
const PLACEHOLDER = '__no-blog-posts__'

// A two-segment path /<landing page>/<post>. Routes with their own first segment
// (/educational/[slug], /category/[slug], /vehicles/[slug], ...) are more specific and win.
export async function generateStaticParams() {
  const paths = await getAllBlogPostPaths()
  return paths.length > 0
    ? paths.map(({landing, post}) => ({slug: landing, post}))
    : [{slug: PLACEHOLDER, post: PLACEHOLDER}]
}

export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
  const {slug, post: postSlug} = await params
  if (slug === PLACEHOLDER) return {}

  try {
    const post = await getBlogPostByPath(slug, postSlug)
    if (!post) return {}
    return seoToMetadata(post.seo)
  } catch (error) {
    console.error('[Sanity] Metadata fetch failed:', error)
    return {}
  }
}

async function PageContent({landingSlug, postSlug}: {landingSlug: string; postSlug: string}) {
  if (landingSlug === PLACEHOLDER) notFound()

  let post

  try {
    post = await getBlogPostByPath(landingSlug, postSlug)
  } catch (error) {
    console.error('[Sanity] Failed to fetch Blog Post:', error)
    return <SanityErrorState />
  }

  if (!post) {
    notFound()
  }

  return <BlogPostView post={post} />
}

export default async function BlogPostPage({params}: {params: Params}) {
  const {slug, post} = await params

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-[var(--theme-muted,#9ca3af)] text-center py-24">Loading...</p>}>
        <PageContent landingSlug={slug} postSlug={post} />
      </Suspense>
    </div>
  )
}
