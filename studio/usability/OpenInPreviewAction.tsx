import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {useClient} from 'sanity'
import type {DocumentActionComponent} from 'sanity'
import {previewPathFor, previewToolUrl} from './previewPaths'
import {STUDIO_BASE} from './StartHere'

/**
 * "Preview on site": opens the page in the Studio's live preview (click-to-edit), whether or not it is published yet.
 * Added to the ⋯ menu of every page-like document. A page with no address yet (no slug) says so instead of failing.
 */
export const OpenInPreviewAction: DocumentActionComponent = (props) => {
  const {type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-02-19'})
  const doc = (draft ?? published) as
    {slug?: {current?: string}; landingPage?: {_ref?: string}} | null | undefined

  return {
    label: 'Preview on site',
    title: 'Open this page in the live preview, where you can click any text to edit it',
    icon: EyeOpenIcon,
    disabled: !doc,
    onHandle: async () => {
      let landingSlug: string | undefined
      if (type === 'blogPost' && doc?.landingPage?._ref) {
        // The landing page may only exist as a draft, so look at both.
        landingSlug = await client.fetch<string | undefined>(
          `*[_id in [$id, "drafts." + $id]][0].slug.current`,
          {id: doc.landingPage._ref},
        )
      }
      const path = previewPathFor(type, doc ?? undefined, landingSlug)
      if (path) window.location.assign(previewToolUrl(STUDIO_BASE, path))
      else window.alert('This page has no web address yet. Add its slug first, then try again.')
      onComplete()
    },
  }
}
