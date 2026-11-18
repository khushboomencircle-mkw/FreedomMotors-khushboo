import {dom} from '../layoutPresets/domSetup' // a browser-like page; must load before React
import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, it} from 'node:test'
import {act} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {FormValueProvider} from 'sanity'
import type {StringInputProps} from 'sanity'
import {schemaTypes} from '../schemaTypes'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {INTRO_FIELD, POSITION_FIELD, withSectionGuide} from './withSectionGuide'
import {positionOnPage, SECTION_GUIDE} from './sectionGuide'
import {SectionIntroInput, SectionPositionInput} from './SectionIntroInput'

// Run with: npm run test:usability

void dom

type F = {name?: string; type?: string; readOnly?: boolean; group?: string; fieldset?: string}
type T = {name: string; groups?: unknown[]; fields?: F[]}
const live = (name: string) => (schemaTypes as unknown as T[]).find((t) => t.name === name)!
const SECTIONS = LIBRARY_GROUPS.flatMap((g) => g.of).filter((n) => n !== 'staticSection')

describe('what each section is for', () => {
  it('every section in the Add menu has a guide, with a name, a sentence and a tip', () => {
    for (const name of SECTIONS) {
      const g = SECTION_GUIDE[name]
      assert.ok(g, name)
      assert.ok(g.name.length > 2 && g.description.length > 20 && g.tip.length > 20, name)
      assert.ok(
        g.description.endsWith('.') && g.tip.endsWith('.'),
        `${name}: ends with a full stop`,
      )
    }
  })
  it('names are unique', () => {
    const names = Object.values(SECTION_GUIDE).map((g) => g.name)
    assert.equal(new Set(names).size, names.length)
  })
})

describe('position on the page (the same order the website uses)', () => {
  const a = {_key: 'a', sequence: 20}
  const b = {_key: 'b', sequence: 10}
  const c = {_key: 'c', sequence: 30}
  it('lowest Display Order first', () => {
    const sections = [a, b, c]
    assert.deepEqual(positionOnPage(sections, 'b'), {position: 1, total: 3})
    assert.deepEqual(positionOnPage(sections, 'a'), {position: 2, total: 3})
    assert.deepEqual(positionOnPage(sections, 'c'), {position: 3, total: 3})
  })
  it('a section with no number comes last, as on the live site', () => {
    assert.deepEqual(positionOnPage([a, {_key: 'new'}, b], 'new'), {position: 3, total: 3})
  })
  it('equal numbers keep the order they were added', () => {
    const s = [
      {_key: 'x', sequence: 5},
      {_key: 'y', sequence: 5},
    ]
    assert.equal(positionOnPage(s, 'x')!.position, 1)
    assert.equal(positionOnPage(s, 'y')!.position, 2)
  })
  it('unknown, missing or empty gives nothing (never a wrong number)', () => {
    assert.equal(positionOnPage([a], 'zzz'), undefined)
    assert.equal(positionOnPage(undefined, 'a'), undefined)
    assert.equal(positionOnPage([a], undefined), undefined)
  })
})

describe('the two display-only fields in the real schema', () => {
  it('every section gets the intro card first and the position beside Display Order', () => {
    for (const name of SECTIONS) {
      const fields = live(name).fields!
      assert.equal(fields[0].name, INTRO_FIELD, name)
      const seq = fields.findIndex((f) => f.name === 'sequence')
      assert.equal(fields[seq + 1].name, POSITION_FIELD, name)
      assert.equal(fields[seq + 1].fieldset, 'status', name)
    }
  })
  it('they are read-only and sit in the Content tab', () => {
    for (const name of SECTIONS) {
      for (const key of [INTRO_FIELD, POSITION_FIELD]) {
        const f = live(name).fields!.find((x) => x.name === key)!
        assert.equal(f.readOnly, true, `${name}.${key}`)
        assert.equal(f.group, 'content', `${name}.${key}`)
        assert.equal(f.type, 'string', `${name}.${key}`)
      }
    }
  })
  it('applying the guide twice adds nothing more', () => {
    const once = live('cardsGridSection')
    assert.equal(withSectionGuide(once), once)
  })
  it('a section with no tabs (Static) gets nothing', () => {
    const fields = live('staticSection').fields!.map((f) => f.name)
    assert.ok(!fields.includes(INTRO_FIELD) && !fields.includes(POSITION_FIELD))
  })
})

// ── The components, in a browser-like page, inside Sanity's own form-value context ──
let root: Root
beforeEach(() => {
  root = createRoot(document.getElementById('root')!)
})
afterEach(() => act(() => root.unmount()))

const documentValue = {
  _id: 'home',
  _type: 'homePage',
  sections: [
    {_key: 'k1', _type: 'cardsGridSection', sequence: 30},
    {_key: 'k2', _type: 'accordionSection', sequence: 10},
    {_key: 'k3', _type: 'bannerSection'},
  ],
}
const show = (node: React.ReactNode, value: unknown = documentValue) =>
  act(() => {
    root.render(<FormValueProvider value={value as never}>{node}</FormValueProvider>)
  })
const pathOf = (key: string, field: string) => ['sections', {_key: key}, field]
/** The props Sanity gives an input; only `path` is used by these two. */
const inputProps = (path: unknown[]) => ({path}) as unknown as StringInputProps

describe('the intro card', () => {
  it('shows the section’s name, what it is for, a tip and its picture', () => {
    show(<SectionIntroInput {...inputProps(pathOf('k1', INTRO_FIELD))} />)
    const text = document.body.textContent!
    assert.ok(
      text.includes('Cards Grid') && text.includes(SECTION_GUIDE.cardsGridSection.description),
    )
    assert.ok(text.includes(SECTION_GUIDE.cardsGridSection.tip))
    assert.equal(
      document.querySelector('img')!.getAttribute('src'),
      '/studio-assets/sections/cardsGridSection.svg',
    )
  })
  it('shows a different section’s own text', () => {
    show(<SectionIntroInput {...inputProps(pathOf('k2', INTRO_FIELD))} />)
    assert.ok(document.body.textContent!.includes('Accordion (FAQ)'))
  })
  it('draws nothing for a type without a guide', () => {
    show(<SectionIntroInput {...inputProps(pathOf('z', INTRO_FIELD))} />, {
      sections: [{_key: 'z', _type: 'somethingElse'}],
    })
    assert.equal(document.body.textContent, '')
  })
})

describe('position on the page, drawn', () => {
  it('shows "#n of total" using the site’s order', () => {
    show(<SectionPositionInput {...inputProps(pathOf('k2', POSITION_FIELD))} />)
    assert.equal(document.body.textContent, '#1 of 3')
    show(<SectionPositionInput {...inputProps(pathOf('k1', POSITION_FIELD))} />)
    assert.equal(document.body.textContent, '#2 of 3')
    show(<SectionPositionInput {...inputProps(pathOf('k3', POSITION_FIELD))} />)
    assert.equal(document.body.textContent, '#3 of 3')
  })
  it('says "Not placed yet" when the section cannot be found', () => {
    show(<SectionPositionInput {...inputProps(pathOf('nope', POSITION_FIELD))} />)
    assert.equal(document.body.textContent, 'Not placed yet')
  })
  it('never writes anything: neither component has a way to change a value', () => {
    assert.ok(!SectionPositionInput.toString().includes('onChange'))
    assert.ok(!SectionIntroInput.toString().includes('onChange'))
  })
})
