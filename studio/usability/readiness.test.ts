import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {schemaTypes} from '../schemaTypes'
import {
  hasText,
  listItems,
  mergeValidation,
  sectionWarnings,
  seoWarnings,
  SECTION_CHECKS,
  withSeoWarnings,
} from './readiness'

// Run with: npm run test:usability

const block = (text: string) => [{_type: 'block', children: [{_type: 'span', text}]}]
const picture = {image: {asset: {_ref: 'image-abc'}}, alt: 'x'}

describe('wording', () => {
  it('lists rows naturally', () => {
    assert.equal(listItems('Card', [2]), 'Card 2')
    assert.equal(listItems('Card', [2, 4]), 'Cards 2 and 4')
    assert.equal(listItems('Card', [1, 3, 5]), 'Cards 1, 3 and 5')
  })
  it('hasText sees real words only', () => {
    assert.equal(hasText(block('Hello')), true)
    assert.equal(hasText(block('   ')), false)
    assert.equal(hasText([]), false)
    assert.equal(hasText(undefined), false)
    assert.equal(hasText('Hi'), true)
  })
})

describe('Cards Grid', () => {
  const warn = (cards: unknown[]) => sectionWarnings('cardsGridSection', {cards})
  it('a new section with empty starting cards is warned, by position', () => {
    const [message] = warn([{_key: 'a'}, {_key: 'b'}, {_key: 'c'}])
    assert.match(message, /^Cards 1, 2 and 3 are empty and will show as blank boxes/)
    assert.match(message, /Add a title or a picture, or delete them\.$/)
  })
  it('names a single card in the singular', () => {
    assert.match(warn([{title: 'Fine'}, {}])[0], /^Card 2 is empty .* or delete it\.$/)
  })
  it('a card with only a title, picture, text, badge or video is not empty', () => {
    for (const card of [
      {title: 'T'},
      {image: picture},
      {description: block('Words')},
      {badge: 'New'},
      {videoUrl: 'https://example.com/v'},
    ]) {
      assert.deepEqual(warn([card]), [], JSON.stringify(card))
    }
  })
  it('no cards at all is not a problem (nothing to show, nothing blank)', () => {
    assert.deepEqual(warn([]), [])
    assert.deepEqual(sectionWarnings('cardsGridSection', {}), [])
  })
})

describe('other sections', () => {
  it('Feature Grid: empty cards', () => {
    assert.match(
      sectionWarnings('featureGridSection', {features: [{}, {title: 'ok'}]})[0],
      /^Feature card 1 is empty/,
    )
  })
  it('Accordion: a question with no text, and an answer with no words, are separate messages', () => {
    const items = [
      {question: '', answer: block('x')},
      {question: 'Why?', answer: block(' ')},
    ]
    const messages = sectionWarnings('accordionSection', {items})
    assert.equal(messages.length, 2)
    assert.match(messages[0], /^Question 1 has no question text/)
    assert.match(messages[1], /^Question 2 has no answer/)
  })
  it('Link List: a row without a title', () => {
    assert.match(
      sectionWarnings('linkListSection', {listItems: [{title: 'A'}, {}]})[0],
      /^Row 2 has no title/,
    )
  })
  it('Vehicle Carousel: no vehicles means the section is hidden on the live site', () => {
    assert.match(
      sectionWarnings('vehicleCarouselSection', {vehicles: []})[0],
      /stays hidden on the live site/,
    )
    assert.deepEqual(sectionWarnings('vehicleCarouselSection', {vehicles: [{_ref: 'v1'}]}), [])
  })
  it('Google Reviews: needs the Trustindex widget id', () => {
    assert.match(sectionWarnings('googleReviewsSection', {})[0], /Trustindex widget ID/)
    assert.deepEqual(sectionWarnings('googleReviewsSection', {trustindexWidgetId: 'abc'}), [])
  })
  it('a section without checks, or no value, gives nothing', () => {
    assert.deepEqual(sectionWarnings('bannerSection', {}), [])
    assert.deepEqual(sectionWarnings('cardsGridSection', undefined), [])
  })
})

describe('SEO reminders', () => {
  it('asks for a title and a description, naming what happens without them', () => {
    const [title, description] = seoWarnings(undefined)
    assert.match(title, /site’s default title/)
    assert.match(description, /Google picks its own snippet/)
  })
  it('nothing to say when both are filled in', () => {
    assert.deepEqual(
      seoWarnings({title: 'Commercial vans', description: 'Wheelchair accessible vans'}),
      [],
    )
  })
  it('only the missing one is mentioned', () => {
    assert.equal(seoWarnings({title: 'x'}).length, 1)
    assert.equal(seoWarnings({description: 'x'}).length, 1)
  })
})

/** A stand-in for Sanity's validation rule: records each custom check and whether it was made a warning. */
function fakeRule() {
  const checks: {fn: (v: unknown) => unknown; level: string}[] = []
  const rule = {
    custom(fn: (v: unknown) => unknown) {
      const entry = {fn, level: 'error'}
      checks.push(entry)
      return {warning: () => ((entry.level = 'warning'), entry)}
    },
  }
  return {rule, checks}
}
type T = {
  name: string
  type?: string
  validation?: (r: unknown) => unknown
  fields?: {name?: string}[]
}
const live = (name: string) => (schemaTypes as unknown as T[]).find((t) => t.name === name)!
const run = (type: T, value: unknown) => {
  const {rule, checks} = fakeRule()
  const result = type.validation!(rule) as unknown[]
  return {
    rules: result,
    messages: checks.map((c) => c.fn(value)).filter((m) => m !== true),
    levels: checks.map((c) => c.level),
  }
}

describe('in the real schema', () => {
  it('every section with checks has them, and every one is a WARNING (publishing is never blocked)', () => {
    for (const name of Object.keys(SECTION_CHECKS)) {
      const {levels} = run(live(name), {})
      assert.ok(levels.length > 0 && levels.every((l) => l === 'warning'), name)
    }
  })

  it('a new Cards Grid with three empty cards shows the warning', () => {
    const {messages} = run(live('cardsGridSection'), {
      cards: [{_key: 'a'}, {_key: 'b'}, {_key: 'c'}],
    })
    assert.equal(messages.length, 1)
    assert.match(String(messages[0]), /^Cards 1, 2 and 3 are empty/)
  })

  it('a filled-in Cards Grid shows nothing', () => {
    assert.deepEqual(
      run(live('cardsGridSection'), {cards: [{title: 'A'}, {image: picture}]}).messages,
      [],
    )
  })

  it('real pages warn about a missing SEO title; templates, vehicles, categories and site settings do not', () => {
    for (const name of [
      'homePage',
      'commercialPage',
      'customPage',
      'blogPost',
      'educationalArticle',
    ]) {
      const {messages, levels} = run(live(name), {})
      assert.equal(messages.length, 2, `${name}: title and description`)
      assert.ok(
        levels.every((l) => l === 'warning'),
        name,
      )
    }
    for (const name of ['pageTemplate', 'category', 'siteSettings']) {
      assert.equal(live(name).validation, undefined, name)
    }
    // vehicles have their own validation already, and must not have gained any reminders
    assert.equal(
      (schemaTypes as unknown as T[]).find((t) => t.name === 'vehicle')!.validation,
      undefined,
    )
    assert.deepEqual(run(live('homePage'), {seo: {title: 'T', description: 'D'}}).messages, [])
  })

  it('the wrapper hands back a type without an SEO block untouched', () => {
    const plain = {name: 'plain', fields: [{name: 'title'}]}
    assert.equal(withSeoWarnings(plain), plain)
  })
})

describe('validation a type already has is kept', () => {
  const rule = {tag: 'rule'}
  it('a single function', () => {
    const merged = mergeValidation(
      (r: unknown) => ({own: r}),
      () => ({extra: true}),
    )
    assert.deepEqual(merged(rule as never), [{own: rule}, {extra: true}])
  })
  it('an array of functions', () => {
    const merged = mergeValidation([() => 'a', () => 'b'], () => 'c')
    assert.deepEqual(merged(rule as never), ['a', 'b', 'c'])
  })
  it('a function that already returns an array', () => {
    assert.deepEqual(
      mergeValidation(
        () => ['a', 'b'],
        () => ['c'],
      )(rule as never),
      ['a', 'b', 'c'],
    )
  })
  it('nothing before', () => {
    assert.deepEqual(mergeValidation(undefined, () => 'x')(rule as never), ['x'])
  })
})
