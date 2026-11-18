import {dom} from './domSetup'
import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, it} from 'node:test'
import {act} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import type {ObjectInputProps, PatchEvent} from 'sanity'
import LayoutPresetInput from './LayoutPresetInput'
import LayoutSectionInput from './LayoutSectionInput'

// Run with: npm run test:layouts
// Drives the real picker in a browser-like DOM, the way the Studio does: a section's value goes in, clicks and typing
// come out as patches. The patches must be relative to the SECTION ({path: ['columns']}), because that is what the
// section's own onChange expects — in the page editor and in the pop-up dialog alike. (A picker that built paths from
// the document root wrote a stray "sections" field when a section was edited in the dialog.)

type Patch = {type: string; path: unknown[]; value?: unknown}
let root: Root
let patches: Patch[][]

function mount(section: Record<string, unknown>, readOnly = false) {
  patches = []
  const props = {
    value: section,
    readOnly,
    onChange: (event: PatchEvent) =>
      // Keep only what matters; Sanity also tags each patch with an internal marker.
      patches.push((event.patches as Patch[]).map(({type, path, value}) => ({type, path, value}))),
    // The wrapper renders the form; here that is just the picker field.
    renderDefault: () => <LayoutPresetInput />,
  }
  act(() => {
    root.render(<LayoutSectionInput {...(props as unknown as ObjectInputProps)} />)
  })
}

const buttons = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
const button = (title: string) => {
  const found = buttons().find((b) => b.textContent === title)
  assert.ok(found, `no "${title}" button (found: ${buttons().map((b) => b.textContent)})`)
  return found
}
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}))
  })
const numberBox = () => document.querySelector<HTMLInputElement>('input[type="number"]')
function type(input: HTMLInputElement, text: string) {
  // React tracks the value itself; set it through the native setter, then fire the event React listens for.
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    'value',
  )!.set!
  act(() => {
    setter.call(input, text)
    input.dispatchEvent(new dom.window.Event('input', {bubbles: true}))
  })
}

beforeEach(() => {
  root = createRoot(document.getElementById('root')!)
})
afterEach(() => {
  act(() => root.unmount())
})

const cards = (extra: Record<string, unknown> = {}) => ({_type: 'cardsGridSection', ...extra})

describe('the layout picker in a section', () => {
  it('lists Grid, Mosaic, Vertical list and Slider for Cards Grid (no separate Grid 2/3/4)', () => {
    mount(cards())
    assert.deepEqual(
      buttons().map((b) => b.textContent),
      ['Grid', 'Mosaic', 'Vertical list', 'Slider'],
    )
  })

  it('highlights the current layout, from the existing fields', () => {
    mount(cards())
    assert.equal(button('Grid').getAttribute('aria-checked'), 'true')
    mount(cards({columns: '1', oneColumnDisplayMode: 'slider'}))
    assert.equal(button('Slider').getAttribute('aria-checked'), 'true')
    assert.equal(button('Grid').getAttribute('aria-checked'), 'false')
  })

  it('choosing Slider writes patches relative to the section — never a "sections" path', () => {
    mount(cards({columns: '4'}))
    click(button('Slider'))
    assert.equal(patches.length, 1, 'one patch event = one undo step')
    assert.deepEqual(patches[0], [
      {type: 'set', path: ['columns'], value: '1'},
      {type: 'set', path: ['oneColumnDisplayMode'], value: 'slider'},
    ])
    for (const patch of patches[0]) assert.notEqual(patch.path[0], 'sections')
  })

  it('choosing the layout already showing writes nothing', () => {
    mount(cards())
    click(button('Grid'))
    assert.equal(patches.length, 0)
  })

  it('does nothing when the section is read-only', () => {
    mount(cards(), true)
    click(button('Slider'))
    assert.equal(patches.length, 0)
  })
})

describe('the cards-per-row number input', () => {
  it('shows the current number for Grid, and hides for Slider', () => {
    mount(cards({columns: '4'}))
    assert.equal(numberBox()?.value, '4')
    mount(cards({columns: '1', oneColumnDisplayMode: 'slider'}))
    assert.equal(numberBox(), null)
  })

  it('typing 2 saves Columns 2 and stays on Grid', () => {
    mount(cards())
    type(numberBox()!, '2')
    assert.deepEqual(patches.at(-1), [{type: 'set', path: ['columns'], value: '2'}])
  })

  it('a number outside 2–4 saves nothing', () => {
    mount(cards())
    for (const bad of ['1', '5', '9', '2.5', '']) {
      type(numberBox()!, bad)
    }
    assert.equal(patches.length, 0)
  })

  it('is not shown for Banner (it has no "per row")', () => {
    mount({_type: 'bannerSection', textPosition: 'overImage'})
    assert.equal(numberBox(), null)
  })
})

describe('other sections', () => {
  it('Banner: choosing Side by side writes only Text Position', () => {
    mount({_type: 'bannerSection', textPosition: 'overImage'})
    click(button('Side by side'))
    assert.deepEqual(patches[0], [{type: 'set', path: ['textPosition'], value: 'besideImage'}])
  })

  it('a section with no presets renders nothing', () => {
    mount({_type: 'faqAccordionSection'})
    assert.equal(buttons().length, 0)
  })
})
