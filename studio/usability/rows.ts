/**
 * Friendlier rows in a section's lists of cards, questions, photos and so on.
 *
 *  - a card or feature row shows a one-line summary of its text under its title (and says plainly when it is empty)
 *  - the "Add" button of each list says what it adds: "Add card", "Add question" …
 *
 * Display only: the row summaries read fields that already exist and the buttons add exactly the row the default button
 * adds. No field is touched. Pure data + functions (no Studio imports).
 */

/** The label of the Add button, by section and the list field it belongs to. */
export const ADD_LABELS: Record<string, Record<string, string>> = {
  cardsGridSection: {cards: 'Add card'},
  featureGridSection: {features: 'Add feature card'},
  accordionSection: {items: 'Add question'},
  linkListSection: {listItems: 'Add row'},
  photoGallerySection: {photos: 'Add photo'},
  bannerSection: {images: 'Add image'},
}

/** The row types whose subtitle becomes a summary of their text. */
export const SUMMARY_ROW_TYPES = new Set(['cardItem', 'featureCardItem'])

/** Plain text from a Portable Text value (or a string), words only. */
export function plainText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value
    .map((block: {children?: {text?: string}[]}) =>
      (block.children ?? []).map((c) => c.text ?? '').join(''),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The first `max` characters, cut at a word and ended with "…" when something was left out. */
export function summarize(text: string, max = 80): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).trimEnd()}…`
}

/** What shown under the title of an EMPTY row. */
export const EMPTY_ROW_HINT = 'Empty: add a title or a picture'

type Row = Record<string, unknown>
interface PreviewLike {
  select?: Record<string, string>
  prepare?: (selection: Row) => Row
}
interface TypeLike {
  name: string
  preview?: PreviewLike
}

/** The key the description is selected under (so it cannot clash with one the row already selects). */
export const SUMMARY_KEY = '__rowDescription'

/** A card or feature row type whose subtitle is a short summary of its text instead of just "Card item". */
export function withRowSummary<T extends TypeLike>(type: T): T {
  const preview = type.preview
  if (!SUMMARY_ROW_TYPES.has(type.name) || !preview?.prepare || !preview.select) return type
  const original = preview.prepare
  return {
    ...type,
    preview: {
      ...preview,
      select: {...preview.select, [SUMMARY_KEY]: 'description'},
      prepare: (selection: Row) => {
        const row = original(selection)
        const summary = summarize(plainText(selection[SUMMARY_KEY]))
        const hasTitle = Boolean(selection.title)
        const hasPicture = Boolean(selection.media || selection.thumb)
        if (!hasTitle && !hasPicture && !summary) return {...row, subtitle: EMPTY_ROW_HINT}
        return summary ? {...row, subtitle: summary} : row
      },
    },
  }
}
