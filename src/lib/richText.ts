// Minimal shapes of the Portable Text pieces read below — only the fields
// this function touches, so unrecognized block types are still just skipped.
type PortableTextSpanLike = {text?: string}
type PortableTextBlockLike = {_type?: string; children?: PortableTextSpanLike[]}

/** Flattens a rich text (Portable Text) value to a plain string — for places
 * that can only take plain text (e.g. a <meta name="description"> tag).
 * Legacy plain-string values pass through unchanged. */
export function toPlainText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .map((block: PortableTextBlockLike) => {
      if (block?._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children.map((child) => child?.text || '').join('')
    })
    .join(' ')
    .trim()
}
