/**
 * Everything the Studio asks Sanity about page templates, in one place: the constants and the GROQ queries.
 *
 * The queries read the RAW perspective (published AND draft documents as stored) and resolve "latest version wins" in
 * resolve.ts. That keeps the rule explicit and independent of how a perspective names or overlays ids: for each template,
 * its draft (if one exists) is used, otherwise its published version.
 */

export const TEMPLATE_DOCUMENT_TYPE = 'pageTemplate'

/** The one template registered with Studio for "a page created from the library" (see libraryTemplate.ts). */
export const LIBRARY_TEMPLATE_ID = 'customPage-from-library'

export const TEMPLATE_API_VERSION = '2025-02-19'

/** Matches template documents only — not other types, and not Releases "versions.*" copies. */
const TEMPLATE_DOCUMENTS = `_type == "${TEMPLATE_DOCUMENT_TYPE}" && !(_id in path("versions.**"))`

/**
 * Cards for the picker. `isActive` is returned (not filtered here) because the activity of the LATEST version decides:
 * a draft that switched a template off must hide it even though its published version is still on.
 */
export const TEMPLATE_LIST_QUERY = `*[${TEMPLATE_DOCUMENTS}]{
  _id,
  title,
  description,
  category,
  isActive,
  "previewUrl": previewImage.asset->url,
  "sectionCount": count(sections)
}`

/** One template's copyable content, by its published id. Returns the draft and/or the published document. */
export const TEMPLATE_CONTENT_QUERY = `*[${TEMPLATE_DOCUMENTS} && _id in [$id, $draftId]]{
  _id,
  title,
  isActive,
  sections,
  seo,
  showHeader,
  showFooter
}`

export const TEMPLATE_CATEGORIES = [
  {title: 'General', value: 'general'},
  {title: 'Vehicle / Model Launch', value: 'vehicle'},
  {title: 'Campaign', value: 'campaign'},
  {title: 'Offer / Promotion', value: 'offer'},
  {title: 'Other', value: 'other'},
] as const

export const draftIdOf = (publishedId: string) => `drafts.${publishedId}`
export const publishedIdOf = (id: string) => id.replace(/^drafts\./, '')
