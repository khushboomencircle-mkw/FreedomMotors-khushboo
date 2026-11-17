import {Suspense} from 'react'
import {connection} from 'next/server'
import {NextStudio} from 'next-sanity/studio'
import config from '../../../../sanity.config'

// Sanity Studio at /studio. Studio itself runs entirely in the browser.
// Lives outside the (site) route group, so it gets no site header/footer.
export {metadata, viewport} from 'next-sanity/studio'

// The root layout's generateMetadata (Site Settings favicon) reads Sanity at request
// time; with Cache Components a fully static page can't wait on that, so this marker
// renders /studio per request instead (Next's documented "[dynamic]" fix).
async function RequestTimeMarker() {
  await connection()
  return null
}

export default function StudioPage() {
  return (
    <>
      <NextStudio config={config} />
      <Suspense>
        <RequestTimeMarker />
      </Suspense>
    </>
  )
}
