import {parse} from 'postcss'
import type {AtRule, ChildNode, Container, Declaration, Root, Rule} from 'postcss'
import {
  CSS_ALLOWED_URL_SCHEMES,
  CSS_BLOCKED_PROPERTIES,
  CSS_KEYFRAMES_AT_RULES,
  CSS_KEYFRAMES_PREFIX,
  CSS_SCOPED_AT_RULES,
  CSS_UNSAFE_RULES,
  MAX_PAGE_CSS_DEPTH,
  MAX_PAGE_CSS_LENGTH,
  MAX_PAGE_CSS_NODES,
  pageCssScope,
  decodeCssEscapes,
  type CssUnsafeRule,
} from './cssPolicy'

/**
 * Page-wide custom CSS: parse it, keep only what is safe, and confine every rule to the page content area.
 *
 * Why a real parser and not regex (the approach Custom HTML's <style> cleanup takes): regex cannot reliably
 * find selectors to scope, cannot see through CSS escapes ("\6a avascript:"), and cannot tell a string or
 * comment from real syntax. postcss gives us a proper tree to walk.
 *
 * Scoping is done by PREFIXING every selector with the scope (`[data-page-css] .title`), not with native
 * @scope or CSS nesting: it is plain CSS that every browser understands, and — unlike nesting — a
 * descendant prefix cannot be talked out of with `:has(&)`, `& ~ footer` or `html:has(&)` tricks. Selectors
 * that start with a combinator or use `&` are refused for the same reason.
 *
 * This runs on the website when the page renders (the real protection) and in the Studio when an editor
 * types (a friendly warning). The rules it applies are in lib/cssPolicy.ts, shared with Custom HTML.
 */

export interface CssProblem {
  message: string
  /** 1-based line in the editor's CSS, when known. */
  line?: number
}

export interface SanitizedCss {
  /** Safe, scoped CSS, ready to place inside a <style> element. Empty when nothing usable was left. */
  css: string
  /** Everything that was refused or dropped, in plain language. */
  problems: CssProblem[]
}

const RULE_MESSAGES: Record<CssUnsafeRule['id'], string> = {
  import: '@import isn’t allowed — it loads other CSS files.',
  expression: 'CSS expression() isn’t allowed.',
  scriptScheme: 'javascript: and vbscript: aren’t allowed.',
  unsafeUrlScheme: 'That url() address isn’t allowed.',
}

interface State {
  /** The selector prefix every rule is confined to — one specific page's wrapper. */
  scope: string
  problems: CssProblem[]
  nodes: number
  aborted: boolean
  /** Names of @keyframes defined in this CSS → the prefixed name they are renamed to. */
  keyframes: Map<string, string>
}

const KEYFRAME_NAME = /^[A-Za-z_][\w-]*$/
const KEYFRAME_SELECTOR = /^(?:from|to|\d+(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d+(?:\.\d+)?%))*$/i

function report(
  state: State,
  node: {source?: {start?: {line?: number}}} | undefined,
  message: string,
) {
  const line = node?.source?.start?.line
  // One message per kind of problem per line is plenty.
  if (state.problems.some((p) => p.message === message && p.line === line)) return
  state.problems.push({message, line})
}

// ─── Selectors ───

/** Split on a separator that is not inside (), [] or a quoted string. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\') {
      current += ch + (text[i + 1] ?? '')
      i++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '(' || ch === '[') {
      depth++
    } else if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1)
    } else if (ch === separator && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts
}

/** True when one of `chars` appears outside quoted strings (escaped characters are skipped). */
function hasUnquoted(selector: string, chars: string): boolean {
  let quote = ''
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '\\') {
      i++
    } else if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (chars.includes(ch)) {
      return true
    }
  }
  return false
}

/**
 * Confine one selector to the scope. `html`, `body` and `:root` at the start mean "the whole page area",
 * so they become the scope itself; anything else is prefixed as a descendant of it.
 */
function scopeOne(selector: string, scope: string): string | {error: string} {
  let s = selector.trim()
  if (!s) return {error: ''}
  if (/^[>+~]/.test(s)) return {error: 'Selectors can’t start with >, + or ~.'}
  if (hasUnquoted(s, '&'))
    return {error: 'The & nesting selector isn’t supported — write the full selector.'}
  // "<" is never valid in a selector. Seeing one usually means HTML was pasted into the CSS box.
  if (hasUnquoted(s, '<'))
    return {error: 'Selectors can’t contain “<”. Is there HTML mixed in with the CSS?'}

  let touchedRoot = false
  let descendant = false
  // "html body .x" → strip the leading page-level tokens, remembering whether a space followed them.
  for (;;) {
    const m = /^(?:html|body|:root)(?![\w-])/i.exec(s)
    if (!m) break
    touchedRoot = true
    const rest = s.slice(m[0].length)
    const trimmed = rest.replace(/^\s+/, '')
    descendant = trimmed !== rest
    s = trimmed
    if (!descendant) break // e.g. "body.home" — what follows attaches to the scope itself
  }
  if (!touchedRoot) return `${scope} ${s}`
  if (!s) return scope
  return descendant || /^[>+~]/.test(s) ? `${scope} ${s}` : `${scope}${s}`
}

function scopeSelectorList(list: string, scope: string): {selectors: string[]; errors: string[]} {
  const selectors: string[] = []
  const errors: string[] = []
  for (const part of splitTopLevel(list, ',')) {
    const scoped = scopeOne(part, scope)
    if (typeof scoped === 'string') selectors.push(scoped)
    else if (scoped.error) errors.push(scoped.error)
  }
  return {selectors, errors}
}

// ─── Declarations ───

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every address a value would load: url(...) arguments, plus the strings inside image-set()/src(). */
function referencedAddresses(value: string): string[] {
  const refs: string[] = []
  for (const m of value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    refs.push((m[1] ?? m[2] ?? m[3] ?? '').trim())
  }
  if (/(?:image-set|src|cross-fade|element)\s*\(/i.test(value)) {
    for (const m of value.matchAll(/"([^"]*)"|'([^']*)'/g)) refs.push((m[1] ?? m[2] ?? '').trim())
  }
  return refs
}

/** The offending scheme (or "//") when an address isn't http(s) or relative, else null. */
function disallowedAddress(ref: string): string | null {
  // Browsers ignore tabs/newlines inside a scheme ("jav\tascript:"), so ignore them too.
  const cleaned = ref.replace(/[\s\u0000-\u001F]+/g, '')
  if (cleaned.startsWith('//')) return '//'
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned)
  if (!m) return null
  const scheme = m[1].toLowerCase()
  return CSS_ALLOWED_URL_SCHEMES.includes(scheme) ? null : scheme
}

/** Check one declaration; remove it (with a message) when unsafe. */
function cleanDeclaration(decl: Declaration, state: State): void {
  const prop = decodeCssEscapes(decl.prop).trim().toLowerCase()
  if (CSS_BLOCKED_PROPERTIES.includes(prop)) {
    report(state, decl, `“${prop}” isn’t allowed.`)
    decl.remove()
    return
  }

  const value = stripComments(decodeCssEscapes(decl.value))
  const unsafe = CSS_UNSAFE_RULES.find((rule) => rule.test.test(value))
  if (unsafe) {
    report(state, decl, RULE_MESSAGES[unsafe.id])
    decl.remove()
    return
  }
  for (const ref of referencedAddresses(value)) {
    const bad = disallowedAddress(ref)
    if (bad) {
      report(
        state,
        decl,
        bad === '//'
          ? 'Addresses must start with https:// or be a path on this site (not //).'
          : `Addresses can only start with https://, http:// or be a path on this site — “${bad}:” isn’t allowed.`,
      )
      decl.remove()
      return
    }
  }

  if (prop === 'position' && /^fixed$/i.test(value.trim())) {
    report(
      state,
      decl,
      'position: fixed isn’t allowed — it can cover the site header and footer. Use sticky or absolute instead.',
    )
    decl.remove()
    return
  }

  // Animations: point at the renamed keyframes.
  if (state.keyframes.size && /^(?:-webkit-)?animation(?:-name)?$/.test(prop)) {
    decl.value = decl.value.replace(
      /[A-Za-z_][\w-]*/g,
      (token) => state.keyframes.get(token) ?? token,
    )
  }
}

// ─── Walking the tree ───

function countNode(state: State): boolean {
  if (++state.nodes > MAX_PAGE_CSS_NODES) {
    if (!state.aborted) {
      state.problems.push({
        message: `The CSS has too many rules (the limit is ${MAX_PAGE_CSS_NODES}).`,
      })
    }
    state.aborted = true
    return false
  }
  return true
}

function cleanRule(rule: Rule, state: State): void {
  const {selectors, errors} = scopeSelectorList(rule.selector, state.scope)
  for (const message of errors) report(state, rule, message)
  if (selectors.length === 0) {
    rule.remove()
    return
  }
  rule.selector = selectors.join(', ')

  for (const child of [...(rule.nodes ?? [])]) {
    if (!countNode(state)) return
    if (child.type === 'comment') child.remove()
    else if (child.type === 'decl') cleanDeclaration(child, state)
    else {
      report(state, child, 'Nested rules aren’t supported — write each rule on its own.')
      child.remove()
    }
  }
  if (!rule.nodes?.length) rule.remove()
}

function cleanKeyframes(at: AtRule, state: State): void {
  const name = decodeCssEscapes(at.params).trim()
  if (!KEYFRAME_NAME.test(name)) {
    report(state, at, '@keyframes names can only use letters, numbers, - and _.')
    at.remove()
    return
  }
  at.params = state.keyframes.get(name) ?? `${CSS_KEYFRAMES_PREFIX}${name}`

  for (const step of [...(at.nodes ?? [])]) {
    if (!countNode(state)) return
    if (step.type === 'comment') {
      step.remove()
    } else if (step.type === 'rule' && KEYFRAME_SELECTOR.test(step.selector.trim())) {
      for (const child of [...(step.nodes ?? [])]) {
        if (child.type === 'decl') cleanDeclaration(child, state)
        else child.remove()
      }
    } else {
      report(state, step, 'Only from, to and percentage steps are allowed inside @keyframes.')
      step.remove()
    }
  }
}

function cleanAtRule(at: AtRule, depth: number, state: State): void {
  const name = decodeCssEscapes(at.name).trim().toLowerCase()

  if (CSS_KEYFRAMES_AT_RULES.includes(name)) {
    cleanKeyframes(at, state)
    return
  }

  if (CSS_SCOPED_AT_RULES.includes(name)) {
    const params = stripComments(decodeCssEscapes(at.params))
    const unsafe = CSS_UNSAFE_RULES.find((rule) => rule.test.test(params))
    if (!at.nodes) {
      report(state, at, `@${name} needs a { … } block.`)
      at.remove()
    } else if (unsafe) {
      report(state, at, RULE_MESSAGES[unsafe.id])
      at.remove()
    } else if (depth + 1 > MAX_PAGE_CSS_DEPTH) {
      report(state, at, 'At-rules are nested too deeply.')
      at.remove()
    } else {
      cleanContainer(at, depth + 1, state)
      if (!at.nodes?.length) at.remove()
    }
    return
  }

  report(
    state,
    at,
    name === 'import'
      ? RULE_MESSAGES.import
      : name === 'font-face'
        ? '@font-face isn’t allowed — fonts come from the site theme.'
        : `@${name} isn’t supported in page CSS. You can use @media, @supports, @container and @keyframes.`,
  )
  at.remove()
}

function cleanContainer(container: Container<ChildNode>, depth: number, state: State): void {
  for (const node of [...(container.nodes ?? [])]) {
    if (state.aborted) return
    if (!countNode(state)) return
    if (node.type === 'comment') {
      node.remove()
    } else if (node.type === 'decl') {
      report(state, node, 'Styles must be inside a rule, like .title { color: red; }.')
      node.remove()
    } else if (node.type === 'atrule') {
      cleanAtRule(node, depth, state)
    } else if (node.type === 'rule') {
      cleanRule(node, state)
    }
  }
}

/** The names of every @keyframes in the CSS, mapped to the prefixed name each will be renamed to. */
function collectKeyframes(root: Root): Map<string, string> {
  const names = new Map<string, string>()
  root.walkAtRules((at) => {
    if (!CSS_KEYFRAMES_AT_RULES.includes(decodeCssEscapes(at.name).trim().toLowerCase())) return
    const name = decodeCssEscapes(at.params).trim()
    if (KEYFRAME_NAME.test(name)) names.set(name, `${CSS_KEYFRAMES_PREFIX}${name}`)
  })
  return names
}

/**
 * Nothing in the output can end the HTML <style> element it is placed in: every "<" — the only character
 * that can start "</style" — is replaced with its CSS escape. In real CSS "<" only ever appears inside a
 * string or a comment, and the escape means the same thing there.
 */
function escapeForStyleElement(css: string): string {
  return css.replace(/</g, '\\3c ')
}

export function sanitizeCss(input: string | null | undefined, pageId: string): SanitizedCss {
  if (!input || !input.trim()) return {css: '', problems: []}

  if (input.length > MAX_PAGE_CSS_LENGTH) {
    return {
      css: '',
      problems: [
        {
          message: `The CSS is ${input.length.toLocaleString('en-US')} characters long — the limit is ${MAX_PAGE_CSS_LENGTH.toLocaleString('en-US')}. Remove some rules.`,
        },
      ],
    }
  }

  // Control characters (except tab, newline, carriage return, form feed) have no place in CSS.
  const text = input.replace(/[\u0000-\u0008\u000B\u000E-\u001F\u007F]/g, '')

  let root: Root
  try {
    root = parse(text)
  } catch (error) {
    const e = error as {reason?: string; line?: number}
    return {
      css: '',
      problems: [
        {message: `The CSS could not be read: ${e.reason ?? 'syntax error'}.`, line: e.line},
      ],
    }
  }

  const state: State = {
    scope: pageCssScope(pageId),
    problems: [],
    nodes: 0,
    aborted: false,
    keyframes: collectKeyframes(root),
  }
  cleanContainer(root, 0, state)
  if (state.aborted) return {css: '', problems: state.problems}

  return {css: escapeForStyleElement(root.toString().trim()), problems: state.problems}
}

/**
 * Studio validation for the Custom CSS field: `true` when the CSS is fully usable, otherwise a plain-language
 * message about the first problem. Uses the very same sanitiser the website renders with, so what the editor is
 * told always matches what the site would do. This is a warning to editors, never the only protection.
 */
export function validatePageCss(value?: string | null): true | string {
  // Validation only needs the problems, which don't depend on which page the CSS is for.
  const {problems} = sanitizeCss(value, 'validation')
  if (problems.length === 0) return true
  const [first, ...others] = problems
  const where = first.line ? `Line ${first.line}: ` : ''
  const more = others.length
    ? ` (${others.length} more ${others.length === 1 ? 'issue' : 'issues'})`
    : ''
  return `${where}${first.message}${more}`
}
