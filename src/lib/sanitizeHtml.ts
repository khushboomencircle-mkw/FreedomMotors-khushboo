import sanitizeHtmlLib from 'sanitize-html'
import {CSS_UNSAFE_RULES} from './cssPolicy'

/**
 * Frontend HTML sanitizer for the Custom HTML Section.
 *
 * This is the real security boundary — it runs independently of the Studio
 * validation because unsafe content could reach Sanity through the API,
 * migrations, imports, or direct document edits. Allowlist-based: anything not
 * explicitly permitted is removed before the HTML is rendered.
 *
 * `<script>` is a narrow, deliberate exception to "no scripting": it's kept
 * only as `<script src="...">` pointing at a host on TRUSTED_SCRIPT_HOSTS,
 * via sanitize-html's own `allowedScriptDomains` (proper hostname matching,
 * not a substring check) plus an `exclusiveFilter` that drops the whole tag
 * if no trusted src survives. This is a matched pair with
 * studio/schemaTypes/sections/htmlValidation.ts's
 * `isTrustedScriptUrl`/`validateScriptElement` — if you change one, change
 * the other the same way. Both read the same TRUSTED_SCRIPT_HOSTS env var,
 * so the host list itself is always shared.
 */

// Small, explicit allowlist of hosts a <script src="..."> may load from.
// Configured per-deployment via the TRUSTED_SCRIPT_HOSTS env var (see
// .env.local.example). This module only ever runs server-side; the
// Studio's htmlValidation.ts reads the same variable (next.config.ts passes it
// to the Studio in the browser — it's a list of hostnames, not a secret).
const TRUSTED_SCRIPT_HOSTS: string[] = (process.env.TRUSTED_SCRIPT_HOSTS || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean)

const ALLOWED_TAGS = [
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'strong',
  'b',
  'i',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'picture',
  'source',
  'br',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'button',
  'label',
  'small',
  // <style> is permitted so a section carries its own scoped CSS. The CSS text
  // is cleaned by cleanStyleBlocks() below (sanitize-html does not parse it).
  'style',
  // <script> is permitted only in the narrow src+trusted-host form enforced
  // below (allowedScriptDomains + the script transform + exclusiveFilter) —
  // this is NOT a general "scripts are fine" opt-in.
  'script',
]

// Safe CSS properties permitted inside inline style attributes. URL-bearing
// properties (background-image, etc.) are intentionally excluded to prevent
// uncontrolled external resource loading. All values reject url()/expression().
const SAFE_VALUE = [/^(?!.*(?:url\(|expression\(|javascript:|vbscript:|@import)).*$/i]
const ALLOWED_STYLE_PROPS = [
  'color',
  'background-color',
  'background',
  'text-align',
  'text-decoration',
  'text-transform',
  'letter-spacing',
  'line-height',
  'font',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-radius',
  'border-color',
  'border-width',
  'border-style',
  'width',
  'max-width',
  'min-width',
  'height',
  'max-height',
  'min-height',
  'display',
  'flex',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'justify-content',
  'gap',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-gap',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'opacity',
  'box-shadow',
  'object-fit',
  'overflow',
  'vertical-align',
  'list-style',
]

const allowedStyles: Record<string, Record<string, RegExp[]>> = {
  '*': Object.fromEntries(ALLOWED_STYLE_PROPS.map((prop) => [prop, SAFE_VALUE])),
}

const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ['class', 'id', 'title', 'style', 'width', 'height', 'aria-*', 'data-*'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    source: ['srcset', 'src', 'type', 'media', 'sizes'],
    picture: [],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    button: ['type'],
    label: ['for'],
    // Only src/async/defer — never the '*' wildcard's class/id/style/data-*/
    // aria-*, and never onload. The transformTags.script hook below strips
    // everything else before this list even gets consulted, since the '*'
    // wildcard is additive and allowedAttributes alone can't take it away.
    script: ['src', 'async', 'defer'],
  },
  // <style>/<script> are allowed intentionally; <style> CSS is cleaned by
  // cleanStyleBlocks(), <script> is restricted to trusted-host src below.
  allowVulnerableTags: true,
  // Restrict URL protocols; blocks javascript:, vbscript:, data:, etc.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
  allowedStyles,
  // Hostname-based allowlist for <script src>: exact match or subdomain of
  // an entry (sanitize-html compares `hostname === domain ||
  // hostname.endsWith('.' + domain)` — proper hostname comparison, not a
  // substring check, so "trusted.com.evil.com" doesn't match "trusted.com").
  // Setting this also makes sanitize-html discard any inline <script> body
  // text, so a `<script src="...">inline code</script>` is reduced to just
  // the src — never "valid src + bonus inline code".
  allowedScriptDomains: TRUSTED_SCRIPT_HOSTS,
  // Force rel on target=_blank links to avoid reverse-tabnabbing. Also
  // reduces <script> down to only src/async/defer, discarding onload,
  // class, id, style, data-*, or anything else someone tried to attach —
  // allowedAttributes' '*' wildcard would otherwise still let several of
  // those through since it's additive, not a ceiling.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        const rel = new Set((attribs.rel || '').split(/\s+/).filter(Boolean))
        rel.add('noopener')
        rel.add('noreferrer')
        attribs.rel = Array.from(rel).join(' ')
      }
      return {tagName, attribs}
    },
    script: (tagName, attribs) => {
      const next: Record<string, string> = {}
      if (typeof attribs.src === 'string') next.src = attribs.src
      if ('async' in attribs) next.async = attribs.async ?? ''
      if ('defer' in attribs) next.defer = attribs.defer ?? ''
      return {tagName, attribs: next}
    },
  },
  // Belt-and-suspenders cleanup: allowedScriptDomains already strips an
  // untrusted/missing src (leaving an inert, src-less <script>), but drop
  // the whole element in that case instead of leaving a dead tag behind.
  exclusiveFilter: (frame) => frame.tag === 'script' && !frame.attribs.src,
  disallowedTagsMode: 'discard',
}

/**
 * Clean the CSS text inside <style> blocks. sanitize-html keeps the raw CSS,
 * so we strip anything that could load external resources or execute script:
 * @import, expression(), and javascript:/vbscript:/data: url() schemes.
 */
function cleanStyleBlocks(html: string): string {
  return html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    // The rules live in lib/cssPolicy.ts, shared with the Studio's check and the page-wide Custom CSS.
    const cleaned = CSS_UNSAFE_RULES.reduce(
      (text, rule) => text.replace(rule.strip, rule.replaceWith),
      css,
    )
    return `<style>${cleaned}</style>`
  })
}

/**
 * Returns sanitized, render-safe HTML. Never returns iframe/handlers, and
 * never a <script> other than `<script src="...">` on a trusted host.
 */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty || !dirty.trim()) return ''
  return cleanStyleBlocks(sanitizeHtmlLib(dirty, OPTIONS))
}
