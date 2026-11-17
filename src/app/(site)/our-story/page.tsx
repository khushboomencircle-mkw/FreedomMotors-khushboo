import type {Metadata} from 'next'
import {getOurStoryPage} from '@/sanity/queries'
import {Suspense} from 'react'
import PageSection, {Section} from '@/components/PageSection'
import PageCss from '@/components/PageCss'
import {pageCssId} from '@/lib/cssPolicy'
import SanityErrorState from '@/components/SanityErrorState'
import RichText from '@/components/RichText'
import {seoToMetadata} from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getOurStoryPage()

    if (!page) return {}

    return seoToMetadata(page.seo)
  } catch (error) {
    console.error('[Sanity] Metadata fetch failed:', error)

    // Return valid fallback metadata.
    return {
      title: 'Our Story',
      description: 'Learn more about our story.',
    }
  }
}

async function PageContent() {
  let page

  try {
    page = await getOurStoryPage()
  } catch (error) {
    console.error('[Sanity] Failed to fetch Our Story page:', error)

    return <SanityErrorState />
  }

  if (!page) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-lg">Page not configured yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Create an &quot;Our Story Page&quot; document in Sanity Studio.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageCss id="our-story" css={page.customCss} />
      {page.pageTitle && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {page.pageTitle}
          </h1>

          {page.pageDescription && (
            <RichText
              value={page.pageDescription}
              className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto"
            />
          )}
        </div>
      )}

      <div className="w-full">
        {page.sections?.map((section: Section, i: number) => (
          <PageSection key={section._key} section={section} isFirst={i === 0} />
        ))}
      </div>
    </div>
  )
}

export default function OurStoryPage() {
  return (
    <div
      data-page-css={pageCssId('our-story')}
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-gray-400 text-center py-24">Loading...</p>}>
        <PageContent />
      </Suspense>
    </div>
  )
}
