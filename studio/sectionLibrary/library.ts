/**
 * The section library: how the "Add section" menu is organised.
 *
 * Pure data (no Studio imports) so it can be tested on its own. Nothing here changes what a section stores or how
 * the website renders it — it only decides how sections are grouped and pictured in the Add menu, and which empty
 * rows a brand-new section starts with.
 */

/** A heading in the Add menu and the sections under it. */
export interface LibraryGroup {
  name: string
  title: string
  /** Section schema type names, in the order they appear. */
  of: string[]
}

/**
 * Every section type belongs to exactly one group. A page that offers only some of the sections (for example the
 * Driver page) shows only those — groups with nothing in them are left out (see `groupsFor`).
 */
export const LIBRARY_GROUPS: LibraryGroup[] = [
  {name: 'hero', title: 'Hero & Banners', of: ['bannerSection']},
  {name: 'cards', title: 'Cards & Features', of: ['cardsGridSection', 'featureGridSection']},
  {
    name: 'content',
    title: 'Content',
    of: ['accordionSection', 'linkListSection', 'customHtmlSection'],
  },
  {name: 'media', title: 'Media', of: ['photoGallerySection']},
  {name: 'conversion', title: 'Calls to Action', of: ['callToActionSection']},
  {name: 'proof', title: 'Social Proof', of: ['googleReviewsSection']},
  {name: 'vehicles', title: 'Vehicles', of: ['vehicleCarouselSection']},
  {name: 'builtin', title: 'Built-in Page Content', of: ['staticSection']},
]

/** The groups for a page that offers only `available` section types; empty groups are dropped. */
export function groupsFor(available: string[]): LibraryGroup[] {
  return LIBRARY_GROUPS.map((g) => ({...g, of: g.of.filter((t) => available.includes(t))})).filter(
    (g) => g.of.length > 0,
  )
}

/** Where the picture for a section lives. The Studio is served by this same site, so a site-relative path works. */
export const PREVIEW_URL_BASE = '/studio-assets/sections'
export const previewUrlFor = (sectionType: string): string =>
  `${PREVIEW_URL_BASE}/${sectionType}.svg`

/**
 * Descriptions for sections that have none of their own. Only fills a gap: a section's own description always wins.
 */
export const MISSING_DESCRIPTIONS: Record<string, string> = {
  customHtmlSection:
    'Paste your own HTML for something the other sections cannot do. It is checked for safety before it is shown.',
}

/**
 * The empty rows a new section starts with, so the editor has something to fill in instead of a blank panel.
 * STRUCTURE ONLY: the rows are empty. No sample wording, so nothing placeholder-like can reach the live site.
 * `field` is the section's existing array field and `itemType` the type of one row.
 */
export interface StartingRows {
  field: string
  itemType: string
  count: number
}

export const STARTING_ROWS: Record<string, StartingRows> = {
  cardsGridSection: {field: 'cards', itemType: 'cardItem', count: 3},
  featureGridSection: {field: 'features', itemType: 'featureCardItem', count: 3},
  accordionSection: {field: 'items', itemType: 'accordionItem', count: 2},
  linkListSection: {field: 'listItems', itemType: 'linkListItem', count: 3},
}

/** A short random key (the same kind Sanity makes for array rows). Injectable so tests are deterministic. */
export type KeyMaker = () => string
const defaultKey: KeyMaker = () => Math.random().toString(16).slice(2, 14).padEnd(12, '0')

/** The starting value for a section's array field: `count` empty rows, each with its own unique key. */
export function startingRowsFor(
  sectionType: string,
  makeKey: KeyMaker = defaultKey,
): Record<string, unknown> | undefined {
  const rows = STARTING_ROWS[sectionType]
  if (!rows) return undefined
  const used = new Set<string>()
  const keyed = Array.from({length: rows.count}, () => {
    let key = makeKey()
    while (used.has(key)) key = makeKey() // never two rows with the same key
    used.add(key)
    return {_key: key, _type: rows.itemType}
  })
  return {[rows.field]: keyed}
}
