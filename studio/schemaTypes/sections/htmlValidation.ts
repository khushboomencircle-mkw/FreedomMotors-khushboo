/**
 * Allowlist-based validation for the Custom HTML Section.
 *
 * Runs inside Sanity Studio (browser) on every keystroke / paste / save.
 * It mirrors the frontend sanitizer's allowlist so editors are told *why*
 * content is rejected instead of having it silently stripped on render.
 *
 * This is the editor guardrail. The frontend sanitizer (src/lib/sanitizeHtml.ts) is the
 * real security boundary and runs independently before anything is rendered.
 *
 * `<script>` is a narrow exception to the "no scripting" rule: it's allowed
 * ONLY as `<script src="...">` pointing at a host on TRUSTED_SCRIPT_HOSTS,
 * with no inline body and no attributes beyond src/async/defer — see
 * `isTrustedScriptUrl` below. This logic (the allowlist, the attribute
 * restriction, the inline-body rejection) is a matched pair with
 * src/lib/sanitizeHtml.ts's `allowedScriptDomains`/`exclusiveFilter`
 * setup — if you change one, change the other the same way. Both read the
 * same TRUSTED_SCRIPT_HOSTS env var, so the host list itself is always shared.
 */
import {CSS_UNSAFE_RULES, type CssUnsafeRule} from '../../../src/lib/cssPolicy'

export const ALLOWED_TAGS = new Set<string>([
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
  // <style> is allowed so a section can carry its own scoped CSS. Its CSS is
  // validated (no @import / expression() / script URLs) below.
  'style',
  // <script> is allowed only in the narrow src+allowlisted-host form the
  // dedicated check below enforces; it is NOT a general "scripts are fine" opt-in.
  'script',
])

export const ALLOWED_ATTRS = new Set<string>([
  'class',
  'id',
  'title',
  'alt',
  'href',
  'src',
  'srcset',
  'target',
  'rel',
  'width',
  'height',
  'style',
  'type',
  'media',
  'for',
])

const URL_ATTRS = new Set<string>(['href', 'src'])

// Tags that execute scripts or load uncontrolled embedded content.
// 'script' is deliberately NOT here — it gets its own conditional check
// (src + trusted host required) in the allowlist pass below instead of a
// blanket block, since that pass can inspect the src/hostname; this fast
// pass can't tell a trusted <script src> from a dangerous one from text alone.
const PROHIBITED_TAGS = [
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
  'form',
  'input',
  'textarea',
  'select',
  'option',
  'svg',
  'math',
  'portal',
]

// Only these attributes are ever allowed on <script> — not the general
// ALLOWED_ATTRS set (no class/id/style/data-*/etc.), and never an inline
// handler.
const SCRIPT_ALLOWED_ATTRS = new Set<string>(['src', 'async', 'defer'])

// Small, explicit allowlist of hosts a <script src="..."> may load from.
// Configured per-deployment via the TRUSTED_SCRIPT_HOSTS env var (see
// .env.local.example) — the same variable the website's sanitizer
// (src/lib/sanitizeHtml.ts) reads, so Studio and site share one list.
// It reaches this browser code via next.config.ts `env` (embedded /studio) and
// sanity.cli.ts `vite.define` (hosted Studio).
export const TRUSTED_SCRIPT_HOSTS: string[] = (process.env.TRUSTED_SCRIPT_HOSTS || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean)

// Editor-facing text for field help and error messages, read from the same list as the check.
export const TRUSTED_SCRIPT_HOSTS_LABEL = TRUSTED_SCRIPT_HOSTS.length
  ? TRUSTED_SCRIPT_HOSTS.join(', ')
  : 'none configured'

/**
 * A <script> src is trusted only when it's an absolute http(s) URL (this
 * also rejects protocol-relative and relative URLs — `new URL()` throws for
 * both without a base) whose hostname exactly matches, or is a subdomain
 * of, an entry in TRUSTED_SCRIPT_HOSTS. Hostname comparison, not a
 * substring/`.includes()` check, so "trusted.com.evil.com" does not match
 * an allowlisted "trusted.com".
 */
function isTrustedScriptUrl(raw: string): boolean {
  if (!isSafeUrl(raw)) return false
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const hostname = url.hostname.toLowerCase()
  return TRUSTED_SCRIPT_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

/**
 * Validates a parsed <script> element against the rules above. Returns an
 * error string for the first violation found, or null when it's a valid
 * `<script src="...">` pointing at a trusted host.
 */
function validateScriptElement(el: Element): string | null {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (!SCRIPT_ALLOWED_ATTRS.has(name)) {
      return `The "${name}" attribute is not allowed on <script>. Only src (and async/defer) may be used, and only with a trusted src.`
    }
  }
  const src = el.getAttribute('src')
  if (!src || !src.trim()) {
    return 'A <script> element must have a src pointing to an approved host — inline scripts are not allowed.'
  }
  if (!isTrustedScriptUrl(src.trim())) {
    return `"${src}" is not an approved script host. Allowed hosts: ${TRUSTED_SCRIPT_HOSTS_LABEL}.`
  }
  if ((el.textContent || '').trim()) {
    return 'A <script src="..."> element must not contain inline code — remove the text between the tags.'
  }
  return null
}

// Editor-facing wording for each shared rule. The rules themselves (what counts as unsafe) live in
// src/lib/cssPolicy.ts, shared with the website's sanitizer and the page-wide Custom CSS field.
const STYLE_BLOCK_MESSAGES: Record<CssUnsafeRule['id'], string> = {
  import: '@import is not allowed inside <style> (it loads external CSS).',
  expression: 'CSS expression() is not allowed inside <style>.',
  scriptScheme: 'javascript:/vbscript: URLs are not allowed inside <style>.',
  unsafeUrlScheme: 'Unsafe url() scheme inside <style>.',
}

/** Returns an error string if a <style> block's CSS is unsafe, else null. */
export function validateCss(css: string): string | null {
  const rule = CSS_UNSAFE_RULES.find((r) => r.test.test(css))
  return rule ? STYLE_BLOCK_MESSAGES[rule.id] : null
}

function isSafeUrl(raw: string): boolean {
  // Strip HTML entities / whitespace that could hide a scheme (e.g. "java&#09;script:").
  const value = raw.replace(/[\s\u0000-\u001F]+/g, '').toLowerCase()
  if (!value) return true
  if (value.startsWith('javascript:')) return false
  if (value.startsWith('vbscript:')) return false
  if (value.startsWith('data:')) return false
  return true
}

function isSafeStyle(style: string): boolean {
  const v = style.toLowerCase()
  if (v.includes('url(')) return false
  if (v.includes('expression(')) return false
  if (v.includes('javascript:')) return false
  if (v.includes('vbscript:')) return false
  if (/@import/.test(v)) return false
  return true
}

/**
 * Returns `true` when the HTML is safe, or an error string describing the first
 * violation found. Empty input is treated as valid (use Rule.required separately).
 */
export function validateHtmlContent(value?: string): true | string {
  if (!value || !value.trim()) return true

  // ── Fast blacklist pass — catches dangerous constructs even if a browser
  //    DOM parser would silently drop/normalize them. ──
  for (const tag of PROHIBITED_TAGS) {
    if (new RegExp(`<\\s*/?\\s*${tag}\\b`, 'i').test(value)) {
      return `The <${tag}> element is not allowed. Only static HTML markup is permitted.`
    }
  }
  if (/\son[a-z]+\s*=/i.test(value)) {
    return 'Inline event handlers (onclick, onload, onerror, …) are not allowed.'
  }
  if (
    /(href|src|xlink:href|action|formaction|background|poster)\s*=\s*["']?\s*(javascript|vbscript|data)\s*:/i.test(
      value,
    )
  ) {
    return 'javascript:, vbscript:, and data: URLs are not allowed.'
  }
  if (/(javascript|vbscript)\s*:/i.test(value)) {
    return 'javascript: and vbscript: URLs are not allowed.'
  }

  // ── Allowlist pass — walk the parsed DOM (Studio always runs in a browser). ──
  if (typeof DOMParser !== 'undefined') {
    let doc: Document
    try {
      doc = new DOMParser().parseFromString(value, 'text/html')
    } catch {
      return 'The HTML could not be parsed. Please check your markup.'
    }
    // A tag that's "metadata content" per the HTML parsing algorithm (script,
    // style, link, meta, title, base) lands in the parser's implied <head>
    // rather than <body> when it's the first/only thing in the fragment —
    // e.g. a bare `<script src="...">` with nothing before it. Walking only
    // doc.body would silently skip it (and any attributes/content inside
    // it), approving exactly the markup this allowlist exists to catch.
    const elements = [
      ...(doc.head ? Array.from(doc.head.querySelectorAll('*')) : []),
      ...(doc.body ? Array.from(doc.body.querySelectorAll('*')) : []),
    ]
    for (const el of elements) {
      const tag = el.tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) {
        return `The <${tag}> element is not allowed.`
      }
      if (tag === 'style') {
        const cssError = validateCss(el.textContent || '')
        if (cssError) return cssError
      }
      if (tag === 'script') {
        const scriptError = validateScriptElement(el)
        if (scriptError) return scriptError
        continue // <script> has its own attribute rules, not the generic ones below
      }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase()
        if (name.startsWith('on')) {
          return `Event handler attribute "${name}" is not allowed.`
        }
        const isAllowed =
          ALLOWED_ATTRS.has(name) || name.startsWith('aria-') || name.startsWith('data-')
        if (!isAllowed) {
          return `The "${name}" attribute is not allowed on <${tag}>.`
        }
        if (URL_ATTRS.has(name) && !isSafeUrl(attr.value)) {
          return `Unsafe URL in the "${name}" attribute. Use http, https, mailto, tel, or a relative path.`
        }
        if (name === 'style' && !isSafeStyle(attr.value)) {
          return 'Unsafe CSS in the style attribute (url(), expression(), @import, and script URLs are not allowed).'
        }
      }
    }
  }

  return true
}
