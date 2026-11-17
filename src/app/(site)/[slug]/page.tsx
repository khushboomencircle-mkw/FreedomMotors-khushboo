import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import {getAllCustomPageSlugs, getCustomPageBySlug} from '@/sanity/queries'
import PageSection, {Section} from '@/components/PageSection'
import PageCss from '@/components/PageCss'
import {pageCssId} from '@/lib/cssPolicy'
import RichText from '@/components/RichText'
import {seoToMetadata} from '@/lib/seo'

export async function generateStaticParams() {
  const slugs: {slug: string}[] = await getAllCustomPageSlugs()
  return slugs.map(({slug}) => ({slug}))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const {slug} = await params
  const page = await getCustomPageBySlug(slug)

  if (!page) return {}

  return seoToMetadata(page.seo)
}

async function PageContent({slug}: {slug: string}) {
  const page = await getCustomPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="w-full">
      <PageCss id={`page-${slug}`} css={page.customCss} />
      {page.title && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
          {page.pageDescription && (
            <RichText
              value={page.pageDescription}
              className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto"
            />
          )}
        </div>
      )}

      <div className="w-full">
        {page.sections?.map((section: Section) => (
          <PageSection key={section._key} section={section} />
        ))}
      </div>
    </div>
  )
}

export default async function CustomPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params

  return (
    <div
      data-page-css={pageCssId(`page-${slug}`)}
      className="min-h-screen overflow-x-hidden"
      style={{background: 'var(--theme-bg, #121212)', color: 'var(--theme-text, #ffffff)'}}
    >
      <Suspense fallback={<p className="text-gray-400 text-center py-24">Loading...</p>}>
        <PageContent slug={slug} />
      </Suspense>
    </div>
  )
}
