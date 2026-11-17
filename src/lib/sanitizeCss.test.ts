import assert from 'node:assert/strict'
import {readdirSync, readFileSync} from 'node:fs'
import {describe, it} from 'node:test'
import {MAX_PAGE_CSS_LENGTH, decodeCssEscapes, pageCssId, pageCssScope} from './cssPolicy'
import {sanitizeCss, validatePageCss} from './sanitizeCss'
import {sanitizeHtml} from './sanitizeHtml'
import {validateCss} from '../../studio/schemaTypes/sections/htmlValidation'

// Run with: npm run test:css
const PAGE = 'test-page'
const S = pageCssScope(PAGE) // [data-page-css="test-page"]
const sanitize = (css: string | null | undefined) => sanitizeCss(css, PAGE)

describe('scoping', () => {
  it('puts every rule inside the page scope', () => {
    assert.equal(sanitize('.title{color:red}').css, `${S} .title{color:red}`)
  })
  it('scopes every selector in a comma list', () => {
    assert.equal(
      sanitize('header,footer{display:none}').css,
      `${S} header, ${S} footer{display:none}`,
    )
  })
  it('turns html / body / :root into the page area itself', () => {
    assert.equal(sanitize('body{background:#000}').css, `${S}{background:#000}`)
    assert.equal(sanitize(':root{--a:1}').css, `${S}{--a:1}`)
    assert.equal(sanitize('html body .x{color:red}').css, `${S} .x{color:red}`)
  })
  it('scopes rules inside @media and @supports', () => {
    assert.equal(
      sanitize('@media (max-width:600px){.a{color:red}}').css,
      `@media (max-width:600px){${S} .a{color:red}}`,
    )
    assert.equal(
      sanitize('@supports (display:grid){.a{display:grid}}').css,
      `@supports (display:grid){${S} .a{display:grid}}`,
    )
  })
  it('refuses selectors that could reach outside the scope', () => {
    for (const bad of [
      '~ footer{display:none}',
      '+ footer{display:none}',
      '> footer{display:none}',
      '& ~ footer{display:none}',
      '.a &{color:red}',
    ]) {
      const r = sanitize(bad)
      assert.equal(r.css, '', bad)
      assert.ok(r.problems.length > 0, bad)
    }
  })
  it('keeps the good selectors when one in the list is refused', () => {
    const r = sanitize('~ footer{color:red} .ok{color:blue}')
    assert.equal(r.css, `${S} .ok{color:blue}`)
  })
  it('renames @keyframes so the site’s own animations cannot be replaced', () => {
    const r = sanitize(
      '@keyframes spin{to{transform:rotate(1turn)}} .l{animation:spin 1s linear infinite}',
    )
    assert.equal(
      r.css,
      `@keyframes pcss-spin{to{transform:rotate(1turn)}} ${S} .l{animation:pcss-spin 1s linear infinite}`,
    )
  })
  it('does not rewrite an animation name the page did not define', () => {
    assert.equal(
      sanitize('.l{animation:pulse 2s infinite}').css,
      `${S} .l{animation:pulse 2s infinite}`,
    )
  })
})

describe('breaking out of the <style> element', () => {
  const noBreakout = (css: string) => !/<\s*\/?\s*(?:style|script)/i.test(css) && !css.includes('<')

  it('rejects the exact string </style><script>alert(1)</script> (not CSS at all)', () => {
    const r = sanitize('</style><script>alert(1)</script>')
    assert.equal(r.css, '')
    assert.ok(r.problems.length > 0)
  })
  it('refuses it as a selector, and never emits a raw "<"', () => {
    const r = sanitize('</style><script>alert(1)</script> .a{color:red}')
    assert.equal(r.css, '')
    assert.match(r.problems[0].message, /can’t contain “<”/)
  })
  it('escapes it inside a string value', () => {
    const r = sanitize('a{content:"</style><script>alert(1)</script>"}')
    assert.ok(noBreakout(r.css), r.css)
    assert.equal(r.css, `${S} a{content:"\\3c /style>\\3c script>alert(1)\\3c /script>"}`)
  })
  it('drops it from a comment', () => {
    const r = sanitize('/* </style><script>alert(1)</script> */ .a{color:red}')
    assert.ok(noBreakout(r.css), r.css)
    assert.equal(r.css, `${S} .a{color:red}`)
  })
  it('never emits "<" for any variant', () => {
    for (const evil of ['</STYLE>', '</ style >', '<!--', '</style\n>', '<script>', 'a</style>b']) {
      for (const css of [
        `a{content:"${evil}"}`,
        `/*${evil}*/a{color:red}`,
        `${evil} a{color:red}`,
        `a{color:red}${evil}`,
      ]) {
        assert.ok(noBreakout(sanitize(css).css), css)
      }
    }
  })
})

describe('refused constructs', () => {
  it('drops @import (plain, uppercase, with url())', () => {
    for (const css of [
      '@import "x.css"; .a{color:red}',
      '@IMPORT url(https://evil.example/x.css); .a{color:red}',
    ]) {
      const r = sanitize(css)
      assert.equal(r.css, `${S} .a{color:red}`, css)
      assert.match(r.problems[0].message, /@import/)
    }
  })
  it('rejects an escaped @import (CSS cannot even be read)', () => {
    assert.equal(sanitize('@\\69mport "x.css"; .a{color:red}').css, '')
  })
  it('drops javascript:/vbscript: in url(), including escaped and mixed-case forms', () => {
    for (const v of [
      'url(javascript:alert(1))',
      'url("JaVaScRiPt:alert(1)")',
      'url(\\6a avascript:alert(1))',
      "url( 'vbscript:msgbox(1)' )",
    ]) {
      assert.equal(sanitize(`.a{background:${v}}`).css, '', v)
    }
  })
  it('drops data:, blob: and other schemes — only http(s) and relative paths are allowed', () => {
    for (const v of [
      'url("data:text/html;base64,PHNjcmlwdD4=")',
      'url(blob:https://x/y)',
      'url(file:///etc/passwd)',
      'url(//evil.example/a.png)',
      'image-set("ftp://x/a.png" 1x)',
    ]) {
      assert.equal(sanitize(`.a{background-image:${v}}`).css, '', v)
    }
  })
  it('allows https, http and relative url()s', () => {
    for (const v of [
      'url(https://example.com/a.png)',
      'url(http://example.com/a.png)',
      'url(/img/a.png)',
      'url(img/a.png)',
      'url("a.png")',
    ]) {
      assert.equal(sanitize(`.a{background:${v}}`).css, `${S} .a{background:${v}}`, v)
    }
  })
  it('drops expression(), behavior and -moz-binding', () => {
    for (const d of [
      'width:expression(alert(1))',
      'width:expression (alert(1))',
      'behavior:url(x.htc)',
      '-moz-binding:url(x.xml#y)',
      'b\\65 havior:url(x.htc)',
    ]) {
      assert.equal(sanitize(`.a{${d}}`).css, '', d)
    }
  })
  it('checks custom-property values too', () => {
    assert.equal(sanitize(':root{--x:url(javascript:alert(1))}').css, '')
  })
  it('drops position: fixed but keeps sticky and absolute', () => {
    assert.equal(sanitize('.a{position:fixed;top:0}').css, `${S} .a{top:0}`)
    assert.equal(
      sanitize('.a{position:sticky}.b{position:absolute}').css,
      `${S} .a{position:sticky}${S} .b{position:absolute}`,
    )
  })
  it('drops @font-face, @layer, @property and other global at-rules', () => {
    for (const css of [
      '@font-face{font-family:x;src:url(x.woff)}',
      '@layer base{.a{color:red}}',
      '@property --x{syntax:"<length>";inherits:false;initial-value:0px}',
      '@namespace url(http://x);',
    ]) {
      const r = sanitize(`${css} .keep{color:blue}`)
      assert.equal(r.css, `${S} .keep{color:blue}`, css)
      assert.ok(r.problems.length > 0, css)
    }
  })
  it('refuses nested rules and bare declarations', () => {
    assert.equal(sanitize('.a{color:red; .b{color:blue}}').css, `${S} .a{color:red}`)
    assert.equal(sanitize('color:red; .a{color:blue}').css, `${S} .a{color:blue}`)
  })
})

describe('limits and bad input', () => {
  it('returns nothing and a message for CSS that cannot be parsed', () => {
    const r = sanitize('.a{color:red')
    assert.equal(r.css, '')
    assert.ok(r.problems[0].message.includes('could not be read'))
  })
  it('rejects oversized CSS', () => {
    const r = sanitize(`.a{color:red}${' '.repeat(MAX_PAGE_CSS_LENGTH)}`)
    assert.equal(r.css, '')
    assert.match(r.problems[0].message, /characters long/)
  })
  it('handles empty, whitespace and null', () => {
    for (const v of [undefined, null, '', '   \n '])
      assert.deepEqual(sanitize(v), {css: '', problems: []})
  })
  it('strips control characters', () => {
    assert.equal(sanitize('.a{color:red\u0000}').css, `${S} .a{color:red}`)
  })
  it('refuses pathological numbers of rules', () => {
    const many = Array.from({length: 2500}, (_, i) => `.c${i}{color:red}`).join('')
    assert.equal(sanitize(many).css, '')
  })
  it('refuses at-rules nested too deeply', () => {
    const deep = '@media a{@media b{@media c{@media d{@media e{.a{color:red}}}}}}'
    assert.equal(sanitize(deep).css, '')
  })
})

describe('Studio message', () => {
  it('is true for good CSS and a plain message otherwise', () => {
    assert.equal(validatePageCss(''), true)
    assert.equal(validatePageCss('.a{color:red}'), true)
    const msg = validatePageCss('.a{color:red}\n@import "x.css";')
    assert.equal(typeof msg, 'string')
    assert.match(String(msg), /^Line 2: @import/)
  })
})

describe('shared policy stays shared', () => {
  it('decodes CSS escapes', () => {
    assert.equal(decodeCssEscapes('\\6a avascript:'), 'javascript:')
    assert.equal(decodeCssEscapes('\\000041'), 'A')
    assert.equal(decodeCssEscapes('a\\:b'), 'a:b')
  })
  it('Custom HTML <style> blocks still use the same rules (website strips, Studio rejects)', () => {
    const web = sanitizeHtml('<style>@import url(x.css); a{width:expression(alert(1))}</style>')
    assert.ok(!web.includes('@import'))
    assert.ok(!web.includes('expression('))
    assert.match(String(validateCss('@import "x.css";')), /@import/)
    assert.match(String(validateCss('a{width:expression (1)}')), /expression/)
    assert.equal(validateCss('a{color:red}'), null)
  })
  it('every route that renders <PageCss> marks its own wrapper with the SAME, unique page id', () => {
    const root = new URL('../app/(site)/', import.meta.url)
    const files = (readdirSync(root, {recursive: true}) as string[]).filter((p) =>
      /(^|\/)page\.tsx$/.test(p),
    )
    const seen = new Map<string, string>()
    let checked = 0
    for (const file of files) {
      const src = readFileSync(new URL(file, root), 'utf8')
      if (!src.includes('<PageCss')) continue
      checked++
      const css = /<PageCss\s+id=(?:"([^"]+)"|\{`([^`]+)`\})/.exec(src)
      const wrapper = /data-page-css=\{pageCssId\((?:'([^']+)'|`([^`]+)`)\)\}/.exec(src)
      assert.ok(css, `${file}: <PageCss> needs an id prop`)
      assert.ok(wrapper, `${file}: the route's outer wrapper needs data-page-css={pageCssId(...)}`)
      const [a, b] = [css[1] ?? css[2], wrapper[1] ?? wrapper[2]]
      assert.equal(a, b, `${file}: <PageCss id> (${a}) must equal the wrapper's page id (${b})`)
      assert.ok(
        !seen.has(a),
        `${file} reuses page id "${a}" already used by ${seen.get(a)} — two pages must never share a scope`,
      )
      seen.set(a, file)
    }
    assert.ok(checked >= 10, `expected to check at least the 10 page routes, checked ${checked}`)
  })
})

describe('one page can never style another', () => {
  it('different pages get different scopes', () => {
    const vehicles = sanitizeCss('.a{color:red}', 'vehicles').css
    const drivers = sanitizeCss('.a{color:red}', 'drivers').css
    assert.equal(vehicles, '[data-page-css="vehicles"] .a{color:red}')
    assert.equal(drivers, '[data-page-css="drivers"] .a{color:red}')
    assert.notEqual(vehicles, drivers)
  })
  it('a scope is an exact match, so it cannot hit a longer or shorter page id', () => {
    assert.ok(!sanitizeCss('.a{color:red}', 'vehicles').css.includes('vehicles-'))
  })
  it('page ids are reduced to safe characters, so they cannot break out of the selector', () => {
    assert.equal(pageCssId('page-about-us'), 'page-about-us')
    assert.equal(pageCssId('a"]{x}[b'), 'a___x__b')
    assert.equal(pageCssId(''), 'page')
    assert.ok(
      !/["\]\[{}, ]/.test(
        pageCssScope('x"] , body{display:none} [y="').slice('[data-page-css="'.length, -2),
      ),
    )
  })
  it('page-level selectors (html, body, :root) become that one page only', () => {
    assert.equal(
      sanitizeCss('body{color:red} :root{--a:1}', 'vehicles').css,
      '[data-page-css="vehicles"]{color:red} [data-page-css="vehicles"]{--a:1}',
    )
  })
})
