import {stegaClean} from 'next-sanity'
import {sanitizeCss} from '@/lib/sanitizeCss'

/**
 * A page's Custom CSS, rendered as one <style> element, on the server, as part of the page itself — so it
 * arrives in the same HTML as the content it styles (no flash of unstyled content).
 *
 * The CSS is sanitized and scoped HERE, on the render path, every time: Studio validation is only a warning
 * to editors and can be bypassed (API, imports, direct edits), so nothing stored in Sanity is ever trusted.
 * Every rule is confined to `[data-page-css="<id>"]` — this one page's outer wrapper, which each route marks
 * with the same id (pageCssId) — so the header, footer and preview bar are out of reach, and so is every other
 * page: Next.js keeps recently visited pages mounted but hidden, so their <style> stays in the document, and only
 * a scope unique to this page stops it applying to the next one.
 *
 * Renders nothing when there is no CSS (pages without Custom CSS are untouched) or none of it is usable.
 */
export default function PageCss({id, css}: {id: string; css?: string | null}) {
  // stegaClean: draft reads can carry invisible editing markers; they are not valid CSS.
  const {css: safe} = sanitizeCss(typeof css === 'string' ? stegaClean(css) : css, id)
  if (!safe) return null
  // dangerouslySetInnerHTML so React does not HTML-escape the CSS text. `safe` can never end the element:
  // sanitizeCss escapes every "<" (see escapeForStyleElement).
  return <style data-page-css-style="" dangerouslySetInnerHTML={{__html: safe}} />
}
