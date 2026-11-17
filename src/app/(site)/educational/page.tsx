import type {Metadata} from 'next'
import {
  getEducationalPage,
  getAllCategoriesForFilter,
  getAllEducationalArticlesForFilter,
} from '@/sanity/queries'
import {Suspense} from 'react'
import PageSection, {Section} from '@/components/PageSection'
import PageCss from '@/components/PageCss'
import {pageCssId} from '@/lib/cssPolicy'
import SanityErrorState from '@/components/SanityErrorState'
import RichText from '@/components/RichText'
import {seoToMetadata} from '@/lib/seo'
import {splitAroundStaticSection} from '@/lib/staticSection'
import EducationalArticleFilterGrid from '@/components/EducationalArticleFilterGrid'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getEducationalPage()

    if (!page) return {}

    return seoToMetadata(page.seo)
  } catch (error) {
    console.error('[Sanity] Metadata fetch failed:', error)

    // Return valid fallback metadata.
    return {
      title: 'Freedom Motors Blog',
      description: 'Find information and news regarding everything at Freedom Motors.',
    }
  }
}

async function PageContent() {
  let page

  try {
    page = await getEducationalPage()
  } catch (error) {
    console.error('[Sanity] Failed to fetch Educational page:', error)

    return <SanityErrorState />
  }

  if (!page) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-lg">Page not configured yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Create an &quot;Educational Page&quot; document in Sanity Studio.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageCss id="educational" css={page.customCss} />
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

      <StaticSectionContent sections={page.sections} />
    </div>
  )
}

/**
 * Splits around the "Static Section" placeholder and, only when it's
 * present and active, fetches categories + articles for the Filter &
 * Search grid — `defaultShow = false` (unlike Vehicles' listing grid, this
 * has no pre-placeholder history to stay backward-compatible with) so it
 * only ever appears once an editor explicitly adds the placeholder, at the
 * sequence position they put it.
 */
async function StaticSectionContent({sections}: {sections?: Section[]}) {
  const {before, after, showStatic} = splitAroundStaticSection<Section>(sections, false)

  let filterGrid = null
  if (showStatic) {
    const [categories] = await Promise.all([getAllCategoriesForFilter()])
    filterGrid = <EducationalArticleFilterGrid categories={categories} />
  }

  return (
    <div className="w-full">
      {before.map((section: Section, i: number) => (
        <PageSection key={section._key} section={section} isFirst={i === 0} />
      ))}

      {filterGrid}

      {after.map((section: Section) => (
        <PageSection key={section._key} section={section} />
      ))}
    </div>
  )
}

export default function EducationalPage() {
  return (
    <div
      data-page-css={pageCssId('educational')}
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-gray-400 text-center py-24">Loading...</p>}>
        <PageContent />
      </Suspense>
    </div>
  )
}
