import {PortableText, type PortableTextComponents} from '@portabletext/react'
import type {CSSProperties} from 'react'

/** True if a block has at least one span with non-whitespace text. */
function hasVisibleText(block: unknown): boolean {
  const children = (block as {children?: unknown})?.children
  if (!Array.isArray(children)) return false
  return children.some((span) => typeof span?.text === 'string' && span.text.trim() !== '')
}

/**
 * Shared renderer for the description/subtitle fields that were converted
 * from plain `text` to a rich text (Portable Text) array in Sanity — bold,
 * italic, bullet/numbered lists, and links.
 *
 * Accepts either shape so already-published plain-string content keeps
 * rendering exactly as before, until an editor re-saves it as rich text:
 * `string` → unchanged, one plain paragraph. `array` → full rich text.
 *
 * `className`/`style` are applied to every paragraph, matching how the old
 * plain string was styled at each call site (so swapping to <RichText>
 * changes nothing visually for existing content, including sections that
 * compute inline styles for border/shadow/spacing/alignment).
 */
export default function RichText({
  value,
  className = '',
  style,
}: {
  value: unknown
  className?: string
  style?: CSSProperties
}) {
  if (!value) return null

  if (typeof value === 'string') {
    return (
      <p className={className} style={style}>
        {value}
      </p>
    )
  }

  if (!Array.isArray(value) || value.length === 0) return null

  const components: PortableTextComponents = {
    block: {
      normal: ({children, value}) => {
        // An editor pressing Enter on its own creates a block with no
        // visible text (one empty span) — meant as a deliberate blank line.
        // Left as `{children}` (nothing), the <p> has no content, so its
        // height collapses to 0 and its margin collapses straight through
        // into the next element's — several blank lines in a row end up
        // producing the exact same gap as one. A non-breaking space gives
        // the paragraph real text, so it keeps its own line height and
        // margin like any other line, and blank lines stack the way they
        // were typed.
        const isBlankLine = !hasVisibleText(value)
        return (
          <p className={`${className} mb-2 last:mb-0`} style={style}>
            {isBlankLine ? ' ' : children}
          </p>
        )
      },
    },
    list: {
      bullet: ({children}) => (
        <ul className={`list-disc list-inside mb-2 ${className}`}>{children}</ul>
      ),
      number: ({children}) => (
        <ol className={`list-decimal list-inside mb-2 ${className}`}>{children}</ol>
      ),
    },
    listItem: {
      bullet: ({children}) => <li className={className}>{children}</li>,
      number: ({children}) => <li className={className}>{children}</li>,
    },
    marks: {
      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
      em: ({children}) => <em className="italic">{children}</em>,
      link: ({value: link, children}) => {
        const href = link?.href || ''
        const isExternal = /^https?:\/\//.test(href)
        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            {children}
          </a>
        )
      },
    },
  }

  return <PortableText value={value} components={components} />
}
