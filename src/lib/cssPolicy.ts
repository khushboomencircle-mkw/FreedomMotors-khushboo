/**
 * The one CSS safety policy for the whole platform. Plain TypeScript with no imports, so the website
 * (src/lib/sanitizeHtml.ts, src/lib/sanitizeCss.ts) and the Studio (htmlValidation.ts, the Custom CSS
 * field) all read the same lists — change a rule here and every enforcement point changes with it.
 *
 * Two different enforcement styles share these rules, on purpose:
 *  - the website STRIPS or drops what is unsafe (it must always render something safe);
 *  - the Studio REJECTS it with a message, so editors learn why instead of having content silently removed.
 */

// ─── The attribute that marks the page area one page's custom CSS is scoped to ───

/**
 * Each page's outermost wrapper carries `data-page-css="<page id>"`, and that page's CSS is limited to
 * exactly that value. It must be specific to the page, not a shared marker: with `cacheComponents` on,
 * Next.js keeps recently visited pages mounted (hidden) after you navigate away, and a hidden page's
 * <style> keeps applying to anything it matches. A scope only its own page carries means it can never
 * match the page you navigated to.
 */
export const PAGE_CSS_ATTRIBUTE = 'data-page-css'

/** Reduce a page id to safe characters (it is used in a CSS attribute selector). Lossless enough: other characters become "_". */
export function pageCssId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 96) || 'page'
}

/** The CSS selector that matches only the page with this id. */
export function pageCssScope(id: string): string {
  return `[${PAGE_CSS_ATTRIBUTE}="${pageCssId(id)}"]`
}

// ─── Limits for page-wide custom CSS ───

/** Longest custom CSS (characters) a page may carry. Generous for overrides, far below abuse. */
export const MAX_PAGE_CSS_LENGTH = 20_000
/** Safety valve against pathological input: most rules/declarations one page's CSS may contain. */
export const MAX_PAGE_CSS_NODES = 2_000
/** Deepest at-rule nesting allowed (e.g. @media inside @supports). */
export const MAX_PAGE_CSS_DEPTH = 4

// ─── Rules shared by Custom HTML <style> blocks AND page-wide custom CSS ───

export interface CssUnsafeRule {
  /** Stable id, so each enforcement point can attach its own wording. */
  id: 'import' | 'expression' | 'scriptScheme' | 'unsafeUrlScheme'
  /** Does this text contain the unsafe construct? (No `g` flag — safe to reuse with .test().) */
  test: RegExp
  /** Used by the website's strip-style cleanup, with `replaceWith`. */
  strip: RegExp
  replaceWith: string
}

/**
 * Unsafe constructs, in the order they are applied. The website's Custom HTML cleanup replaces them in
 * exactly this order; the Studio's Custom HTML check reports the first one that matches.
 */
export const CSS_UNSAFE_RULES: readonly CssUnsafeRule[] = [
  {id: 'import', test: /@import/i, strip: /@import[^;]*;?/gi, replaceWith: ''},
  {id: 'expression', test: /expression\s*\(/i, strip: /expression\s*\(/gi, replaceWith: 'invalid('},
  {
    id: 'scriptScheme',
    test: /(?:javascript|vbscript)\s*:/i,
    strip: /(javascript|vbscript)\s*:/gi,
    replaceWith: '',
  },
  {
    id: 'unsafeUrlScheme',
    test: /url\(\s*['"]?\s*(?:javascript|vbscript|data)\s*:/i,
    strip: /url\(\s*(['"]?)\s*(?:javascript|vbscript|data)\s*:/gi,
    replaceWith: 'url($1',
  },
]

// ─── Rules used only by page-wide custom CSS (it is parsed, so it can be held to a stricter standard) ───

/**
 * url() (and image-set(), src()) may only point at http(s) addresses or relative paths — an allow-list,
 * so blob:, file:, ftp:, about: and any scheme invented later are refused too. External http(s) loads are
 * allowed, matching Custom HTML; protocol-relative (//host) is refused, as Custom HTML refuses it.
 */
export const CSS_ALLOWED_URL_SCHEMES: readonly string[] = ['http', 'https']

/** Properties that execute or bind behaviour in some engines. Never allowed. */
export const CSS_BLOCKED_PROPERTIES: readonly string[] = [
  'behavior',
  '-ms-behavior',
  '-moz-binding',
]

/**
 * At-rules that are scoped by walking into them. Everything else (@import, @font-face, @layer,
 * @property, @page, @namespace, @charset, …) is dropped: it either loads external code/fonts or
 * registers something global that cannot be limited to one page.
 */
export const CSS_SCOPED_AT_RULES: readonly string[] = ['media', 'supports', 'container']
export const CSS_KEYFRAMES_AT_RULES: readonly string[] = ['keyframes', '-webkit-keyframes']

/** Prefix for @keyframes names, so a page's animation can never replace the site's own. */
export const CSS_KEYFRAMES_PREFIX = 'pcss-'

/**
 * Decode CSS escapes ("\6a avascript" → "javascript") so the rules above can't be dodged by writing a
 * dangerous word in escaped form. Used on values and at-rule names before they are checked.
 */
export function decodeCssEscapes(value: string): string {
  return value
    .replace(/\\([0-9a-fA-F]{1,6})(?:\r\n|[ \t\r\n\f])?/g, (_m, hex: string) => {
      const code = parseInt(hex, 16)
      const valid = code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      return String.fromCodePoint(valid ? code : 0xfffd)
    })
    .replace(/\\(?:\r\n|[\r\n\f])/g, '')
    .replace(/\\([^0-9a-fA-F\r\n\f])/g, '$1')
}
