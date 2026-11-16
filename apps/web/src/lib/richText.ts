/** Flattens a rich text (Portable Text) value to a plain string — for places
 * that can only take plain text (e.g. a <meta name="description"> tag).
 * Legacy plain-string values pass through unchanged. */
export function toPlainText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .map((block: any) => {
      if (block?._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children.map((child: any) => child?.text || '').join('')
    })
    .join(' ')
    .trim()
}
