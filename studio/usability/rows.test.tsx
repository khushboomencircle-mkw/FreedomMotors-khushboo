import {dom} from '../layoutPresets/domSetup' // a browser-like page; must load before React
import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, it} from 'node:test'
import {act, createElement} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {createSchema} from 'sanity'
import {schemaTypes} from '../schemaTypes'
import {makeAddRowButton} from './AddRowButton'
import {ADD_LABELS, EMPTY_ROW_HINT, plainText, SUMMARY_KEY, summarize} from './rows'

// Run with: npm run test:usability

void dom

type Sel = Record<string, unknown>
type T = {
  name: string
  fields?: {
    name?: string
    type?: string
    of?: unknown[]
    components?: {arrayFunctions?: {displayName?: string}}
  }[]
  preview?: {select?: Record<string, string>; prepare?: (s: Sel) => Sel}
}
const live = (name: string) => (schemaTypes as unknown as T[]).find((t) => t.name === name)!
const block = (text: string) => [{_type: 'block', children: [{_type: 'span', text}]}]

describe('summaries', () => {
  it('plainText reads the words of rich text', () => {
    assert.equal(plainText(block('Hello   world')), 'Hello world')
    assert.equal(plainText([...block('One'), ...block('Two')]), 'One Two')
    assert.equal(plainText(undefined), '')
    assert.equal(plainText('  plain '), 'plain')
  })
  it('summarize cuts at a word and says so', () => {
    assert.equal(summarize('short'), 'short')
    const long = 'word '.repeat(40)
    const out = summarize(long, 30)
    assert.ok(out.endsWith('…') && out.length <= 31 && !out.includes('wor…'))
  })
})

describe('card and feature rows', () => {
  for (const name of ['cardItem', 'featureCardItem']) {
    const prepare = () => live(name).preview!.prepare!

    it(`${name}: shows a summary of its text under the title`, () => {
      const row = prepare()({
        title: 'Choose your vehicle',
        [SUMMARY_KEY]: block('Browse new and pre-owned vans.'),
      })
      assert.equal(row.title, 'Choose your vehicle')
      assert.equal(row.subtitle, 'Browse new and pre-owned vans.')
    })

    it(`${name}: says plainly when the row is empty`, () => {
      assert.equal(prepare()({}).subtitle, EMPTY_ROW_HINT)
    })

    it(`${name}: a row with a title but no text keeps its usual subtitle, and its picture`, () => {
      const row = prepare()({title: 'Only a title', media: {asset: {_ref: 'x'}}})
      assert.notEqual(row.subtitle, EMPTY_ROW_HINT)
      assert.ok(row.media)
    })

    it(`${name}: the fields it already read are still read`, () => {
      assert.equal(live(name).preview!.select![SUMMARY_KEY], 'description')
      assert.equal(live(name).preview!.select!.title, 'title')
    })
  }

  it('other rows are left alone', () => {
    assert.equal(live('accordionItem').preview!.select![SUMMARY_KEY], undefined)
    assert.equal(live('linkListItem').preview!.select![SUMMARY_KEY], undefined)
  })
})

describe('the Add buttons in the real schema', () => {
  it('exactly the six lists get a labelled button, and nothing else changes on those fields', () => {
    let count = 0
    for (const [section, lists] of Object.entries(ADD_LABELS)) {
      for (const [field, label] of Object.entries(lists)) {
        const f = live(section).fields!.find((x) => x.name === field)!
        assert.equal(f.type, 'array', `${section}.${field}`)
        assert.equal(
          f.components?.arrayFunctions?.displayName,
          `AddRowButton(${label})`,
          `${section}.${field}`,
        )
        count++
      }
    }
    assert.equal(count, 6)
    const withButton = (schemaTypes as unknown as T[]).flatMap((t) =>
      (t.fields ?? [])
        .filter((f) => f.components?.arrayFunctions)
        .map((f) => `${t.name}.${f.name}`),
    )
    assert.deepEqual(withButton.sort(), [
      'accordionSection.items',
      'bannerSection.images',
      'cardsGridSection.cards',
      'featureGridSection.features',
      'linkListSection.listItems',
      'photoGallerySection.photos',
    ])
  })

  it('only lists with a single kind of row get one', () => {
    for (const [section, lists] of Object.entries(ADD_LABELS)) {
      for (const field of Object.keys(lists)) {
        assert.equal(
          live(section).fields!.find((x) => x.name === field)!.of!.length,
          1,
          `${section}.${field}`,
        )
      }
    }
  })

  it('Sanity accepts the whole schema', () => {
    assert.ok(createSchema({name: 'default', types: schemaTypes as never}).get('cardsGridSection'))
  })
})

// ── the button itself ──
let root: Root
beforeEach(() => {
  root = createRoot(document.getElementById('root')!)
})
afterEach(() => act(() => root.unmount()))

function mount(opts: {readOnly?: boolean; created?: unknown; of?: unknown[]} = {}) {
  const appended: unknown[] = []
  const asked: unknown[] = []
  const Button = makeAddRowButton('Add card')
  const props = {
    readOnly: opts.readOnly,
    schemaType: {of: opts.of ?? [{name: 'cardItem'}]},
    onValueCreate: (type: unknown) => (
      asked.push(type),
      opts.created ?? {_key: 'new1', _type: 'cardItem'}
    ),
    onItemAppend: (item: unknown) => appended.push(item),
  }
  act(() => root.render(createElement(Button as never, props)))
  return {appended, asked}
}
const buttonEl = () => document.querySelector('button')!

describe('the "Add card" button', () => {
  it('says what it adds', () => {
    mount()
    assert.equal(buttonEl().textContent, '+ Add card')
  })
  it('adds exactly the row Sanity creates for the list’s one row type', () => {
    const {appended, asked} = mount()
    act(() => {
      buttonEl().dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}))
    })
    assert.deepEqual(asked, [{name: 'cardItem'}])
    assert.deepEqual(appended, [{_key: 'new1', _type: 'cardItem'}])
  })
  it('does nothing, and is disabled, when the document is read-only', () => {
    const {appended} = mount({readOnly: true})
    assert.equal(buttonEl().disabled, true)
    act(() => {
      buttonEl().dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}))
    })
    assert.deepEqual(appended, [])
  })
})
