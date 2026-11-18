import type {Metadata} from 'next'
import {getCommercialPage} from '@/sanity/queries'
import {Suspense} from 'react'
import PageSection, {Section} from '@/components/PageSection'
import {sanityDocOf} from '@/lib/sanityDoc'
import PageCss from '@/components/PageCss'
import {pageCssId} from '@/lib/cssPolicy'
import RichText from '@/components/RichText'
import {seoToMetadata} from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCommercialPage()

  if (!page) return {}

  return seoToMetadata(page.seo)
}

async function PageContent() {
  const page = await getCommercialPage()

  if (!page) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-lg">Page not configured yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Create a &quot;Commercial Page&quot; document in Sanity Studio.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageCss id="commercial" css={page.customCss} />
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
          <PageSection
            key={section._key}
            section={section}
            isFirst={i === 0}
            doc={sanityDocOf(page)}
          />
        ))}
      </div>
    </div>
  )
}

export default function CommercialPage() {
  return (
    <div
      data-page-css={pageCssId('commercial')}
      className="min-h-dvh overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-gray-400 text-center py-24">Loading...</p>}>
        <PageContent />
      </Suspense>
    </div>
  )
}
