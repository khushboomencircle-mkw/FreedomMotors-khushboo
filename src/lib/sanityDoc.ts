import {createDataAttribute} from 'next-sanity'

/**
 * Click-to-edit targets for the Studio's live preview (Presentation tool).
 *
 * Text is made clickable by Sanity's hidden "stega" characters, but images, buttons and empty areas can't carry
 * them. A `data-sanity` attribute fills that gap: it tells the preview exactly which document and field to open.
 *
 * Attributes are produced ONLY in draft/preview mode (see `sanityDocOf`), so the public HTML never contains them.
 */

/** The page document the sections belong to. */
export interface SanityDoc {
  id: string
  type: string
}

/** What a page query returns for this feature: the document's id/type and whether it was read in preview. */
interface PageDocFields {
  _id?: string
  _type?: string
  preview?: boolean
}

/** The document to point markers at — or undefined on the live site, which switches every marker off. */
export function sanityDocOf(page: PageDocFields | null | undefined): SanityDoc | undefined {
  if (!page?.preview || !page._id || !page._type) return undefined
  return {id: page._id, type: page._type}
}

/** A Sanity _key is plain alphanumeric; strip anything else so a key can never break out of the path string. */
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, '')

/** `sections[_key=="abc"]` — always addressed by key, never by position, so reordering can't misdirect a click. */
export function sectionPath(sectionKey: string, ...field: string[]): string {
  const base = `sections[_key=="${safeKey(sectionKey)}"]`
  return field.length ? `${base}.${field.join('.')}` : base
}

/**
 * Spread onto an element: `<div {...dataSanity(doc, sectionPath(key, 'cards[_key=="x"]'))}>`.
 * Returns nothing outside preview, so it is always safe to spread.
 */
export function dataSanity(
  doc: SanityDoc | undefined,
  path: string | undefined,
): {'data-sanity'?: string} {
  if (!doc || !path) return {}
  return {'data-sanity': createDataAttribute({id: doc.id, type: doc.type, path}).toString()}
}

/** Path to one item of an array field inside a section, e.g. a card or FAQ item. */
export function itemPath(sectionKey: string, arrayField: string, itemKey: string): string {
  return sectionPath(sectionKey, `${arrayField}[_key=="${safeKey(itemKey)}"]`)
}
