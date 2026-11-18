import {dom} from '../layoutPresets/domSetup' // a browser-like page; must load before React
import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, it} from 'node:test'
import {act, createElement} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import type {PatchEvent} from 'sanity'
import LayoutPresetInput from '../layoutPresets/LayoutPresetInput'
import LayoutSectionInput from '../layoutPresets/LayoutSectionInput'
import {schemaTypes} from '../schemaTypes'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {
  CARD_BLOCK_FIELDSETS,
  CARD_BLOCKS_CSS,
  makeCardBlocksInput,
  WRAPPER_ATTRIBUTE,
} from './CardBlocks'
import {withCardBlocks} from './withCardBlocks'

// Run with: npm run test:usability

void dom

describe('the card-blocks style sheet', () => {
  it('boxes exactly our own six blocks', () => {
    assert.deepEqual([...CARD_BLOCK_FIELDSETS].sort(), [
      'buttonStyle',
      'header',
      'headerMore',
      'primaryButton',
      'secondaryButton',
      'status',
    ])
    for (const name of CARD_BLOCK_FIELDSETS) {
      assert.ok(CARD_BLOCKS_CSS.includes(`fieldset[data-testid="fieldset-${name}"]`), name)
    }
  })

  it('every selector is scoped to our wrapper, so no other form in the Studio is touched', () => {
    const selectors = CARD_BLOCKS_CSS.split('{')
      .filter((_part, i, all) => i < all.length)
      .flatMap((chunk) => chunk.split('}').pop()!.split(','))
      .map((s) => s.trim())
      .filter(Boolean)
    assert.ok(selectors.length >= 12)
    for (const selector of selectors)
      assert.ok(selector.startsWith(`[${WRAPPER_ATTRIBUTE}] `), selector)
  })

  it('uses only Sanity’s own theme colour (so light and dark mode both work); no colour is written out', () => {
    assert.ok(CARD_BLOCKS_CSS.includes('var(--card-border-color)'))
    assert.doesNotMatch(CARD_BLOCKS_CSS, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
    assert.doesNotMatch(CARD_BLOCKS_CSS, /!important/)
  })

  it('the thin left line is removed only on the block’s own last child, never on the fields inside', () => {
    assert.ok(CARD_BLOCKS_CSS.includes('> :last-child'))
    assert.doesNotMatch(CARD_BLOCKS_CSS, /fieldset\[[^\]]+\]\s+\*/)
  })
})

let root: Root
beforeEach(() => {
  root = createRoot(document.getElementById('root')!)
})
afterEach(() => act(() => root.unmount()))

const fakeProps = (extra: Record<string, unknown> = {}) =>
  ({
    value: {_type: 'cardsGridSection'},
    renderDefault: () => createElement('div', {id: 'default-form'}, 'default form'),
    onChange: () => {},
    ...extra,
  }) as never

describe('the wrapper component', () => {
  it('wraps the form in the scoped element and the style sheet', () => {
    const Wrapped = makeCardBlocksInput()
    act(() => root.render(createElement(Wrapped as never, fakeProps())))
    const wrapper = document.querySelector(`[${WRAPPER_ATTRIBUTE}]`)!
    assert.ok(wrapper)
    assert.equal(wrapper.querySelector('style')!.textContent, CARD_BLOCKS_CSS)
    assert.equal(wrapper.querySelector('#default-form')!.textContent, 'default form')
  })

  it('renders an input the section already had INSIDE itself, giving it the same props', () => {
    const received: unknown[] = []
    const Original = (props: unknown) => (
      received.push(props),
      createElement('span', {id: 'original'}, 'original')
    )
    const Wrapped = makeCardBlocksInput(Original as never)
    const props = fakeProps()
    act(() => root.render(createElement(Wrapped as never, props)))
    assert.ok(document.querySelector(`[${WRAPPER_ATTRIBUTE}] #original`))
    assert.ok(
      !document.querySelector('#default-form'),
      'the default form is the original’s job here',
    )
    // React hands the same values over in a fresh props object
    const got = received[0] as Record<string, unknown>
    const sent = props as unknown as Record<string, unknown>
    assert.equal(got.value, sent.value)
    assert.equal(got.renderDefault, sent.renderDefault)
    assert.equal(got.onChange, sent.onChange)
  })
})

describe('in the real schema', () => {
  const SECTIONS = LIBRARY_GROUPS.flatMap((g) => g.of).filter((n) => n !== 'staticSection')
  type T = {name: string; components?: {input?: {isCardBlocks?: boolean; original?: unknown}}}
  const live = (name: string) => (schemaTypes as unknown as T[]).find((t) => t.name === name)!

  it('every section with the standard Content tab gets the card look', () => {
    for (const name of SECTIONS)
      assert.equal(live(name).components?.input?.isCardBlocks, true, name)
  })

  it('the Static section (no standard tab) is left alone', () => {
    assert.equal(live('staticSection').components?.input, undefined)
  })

  it('the five sections with the layout picker keep it: it is rendered inside the wrapper', () => {
    for (const name of [
      'bannerSection',
      'cardsGridSection',
      'featureGridSection',
      'linkListSection',
      'photoGallerySection',
    ]) {
      assert.equal(live(name).components?.input?.original, LayoutSectionInput, name)
    }
    for (const name of ['accordionSection', 'callToActionSection', 'vehicleCarouselSection']) {
      assert.equal(live(name).components?.input?.original, undefined, name)
    }
  })

  it('the layout picker still works through the wrapper (it can still change the section)', () => {
    const Input = live('cardsGridSection').components!.input as never
    const patches: unknown[][] = []
    const props = fakeProps({
      value: {_type: 'cardsGridSection', columns: '4'},
      readOnly: false,
      onChange: (event: PatchEvent) => patches.push(event.patches),
      renderDefault: () => createElement(LayoutPresetInput),
    })
    act(() => root.render(createElement(Input, props)))
    const slider = [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find(
      (b) => b.textContent === 'Slider',
    )!
    act(() => {
      slider.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}))
    })
    assert.equal(patches.length, 1)
    assert.deepEqual(
      (patches[0] as {path: unknown[]; value: unknown}[]).map((p) => [p.path, p.value]),
      [
        [['columns'], '1'],
        [['oneColumnDisplayMode'], 'slider'],
      ],
    )
  })

  it('applying it twice changes nothing more', () => {
    const once = withCardBlocks(live('bannerSection') as never)
    assert.equal(withCardBlocks(once as never), once)
  })
})
