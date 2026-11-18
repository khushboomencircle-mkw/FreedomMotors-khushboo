import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {schemaTypes} from '../schemaTypes'
import {sectionObjectTypes} from '../schemaTypes/sections'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {
  BUTTON_FIELD_TITLES,
  STATUS_FIELDSET,
  stripNumber,
  withStandardContent,
} from './contentLayout'

// Run with: npm run test:usability
// (That no field is removed or renamed is enforced for every field by fieldLock.test.ts.)

type F = {name?: string; title?: string; group?: string | string[]; fieldset?: string}
type FS = {name: string; title?: string; options?: Record<string, unknown>}
type G = {name: string; hidden?: boolean}
type T = {name: string; groups?: G[]; fieldsets?: FS[]; fields?: F[]}

const SECTIONS = LIBRARY_GROUPS.flatMap((g) => g.of)
const live = (name: string) => (schemaTypes as unknown as T[]).find((t) => t.name === name)!
const original = (name: string) =>
  (sectionObjectTypes as unknown as T[]).find((t) => t.name === name)!
const tabbed = SECTIONS.filter((n) => original(n).groups?.length)
const fieldset = (t: T, name: string) => t.fieldsets?.find((f) => f.name === name)
const field = (t: T, name: string) => t.fields?.find((f) => f.name === name)
const groupsOf = (f: F) => (Array.isArray(f.group) ? f.group : f.group ? [f.group] : [])

describe('the standard Content tab', () => {
  it('applies to every tabbed section', () => {
    assert.ok(tabbed.length >= 10)
  })

  it('Section Active and Display Order are one Status row at the top of Content', () => {
    for (const name of tabbed) {
      const t = live(name)
      assert.deepEqual(
        t.fields!.slice(0, 2).map((f) => f.name),
        ['isActive', 'sequence'],
        name,
      )
      for (const key of ['isActive', 'sequence']) {
        assert.equal(groupsOf(field(t, key)!).join(), 'content', `${name}.${key} group`)
        assert.equal(field(t, key)!.fieldset, STATUS_FIELDSET, `${name}.${key} fieldset`)
      }
      assert.equal(t.fieldsets![0].name, STATUS_FIELDSET, name)
      assert.equal(t.fieldsets![0].options?.columns, 2, name)
    }
  })

  it('no block title starts with a number ("1. Header" is now "Heading & intro")', () => {
    for (const name of tabbed) {
      for (const fs of live(name).fieldsets ?? [])
        assert.doesNotMatch(String(fs.title), /^\s*\d+\./, `${name}.${fs.name}`)
    }
  })

  it('the heading block is called "Heading & intro" and is open by default', () => {
    for (const name of tabbed) {
      const header = fieldset(live(name), 'header')
      if (!header) continue
      assert.equal(header.title, 'Heading & intro', name)
      assert.equal(header.options?.collapsed, false, name)
    }
  })

  it('buttons are "Main button" (open) and "Second button" (folded away)', () => {
    let seen = 0
    for (const name of tabbed) {
      const t = live(name)
      const main = fieldset(t, 'primaryButton')
      const second = fieldset(t, 'secondaryButton')
      if (main) {
        seen++
        assert.equal(main.title, 'Main button', name)
        assert.equal(main.options?.collapsed, false, name)
      }
      if (second) {
        assert.equal(second.title, 'Second button', name)
        assert.equal(second.options?.collapsed, true, name)
      }
    }
    assert.ok(seen >= 4, 'sections with buttons were found')
  })

  it('each "show" switch sits inside its own button block', () => {
    for (const name of tabbed) {
      const t = live(name)
      if (field(t, 'showButton') && fieldset(t, 'primaryButton'))
        assert.equal(field(t, 'showButton')!.fieldset, 'primaryButton', name)
      if (field(t, 'showSecondaryButton') && fieldset(t, 'secondaryButton')) {
        assert.equal(field(t, 'showSecondaryButton')!.fieldset, 'secondaryButton', name)
      }
    }
  })

  it('button fields get plain titles, only where the old title was exactly the expected one', () => {
    let renamed = 0
    for (const name of tabbed) {
      for (const [key, {from, to}] of Object.entries(BUTTON_FIELD_TITLES)) {
        const before = field(original(name), key)
        const after = field(live(name), key)
        if (!before || !after) continue
        assert.equal(after.title, before.title === from ? to : before.title, `${name}.${key}`)
        if (before.title === from) renamed++
      }
    }
    assert.ok(renamed > 0)
  })

  it('no visible tab is empty (a tab nothing is left in is hidden, not shown blank)', () => {
    for (const name of tabbed) {
      const t = live(name)
      const used = new Set(t.fields!.flatMap(groupsOf))
      for (const g of t.groups!) {
        if (g.name === 'all-fields') continue
        assert.equal(Boolean(g.hidden), !used.has(g.name), `${name}.${g.name} hidden state`)
      }
    }
  })

  it('every field is still in a tab that is shown', () => {
    for (const name of tabbed) {
      const t = live(name)
      const shown = new Set(t.groups!.filter((g) => !g.hidden).map((g) => g.name))
      for (const f of t.fields!)
        assert.ok(
          groupsOf(f).every((g) => shown.has(g)),
          `${name}.${f.name}`,
        )
    }
  })

  it('the Static section (no tabs) is returned unchanged', () => {
    assert.equal(withStandardContent(original('staticSection')), original('staticSection'))
  })

  it('the original section definitions are not modified', () => {
    for (const name of tabbed) {
      const isActive = field(original(name), 'isActive')!
      assert.notEqual(isActive.fieldset, STATUS_FIELDSET, name)
    }
  })

  it('applying it twice changes nothing more', () => {
    for (const name of tabbed) {
      const once = withStandardContent(original(name)) as T
      const twice = withStandardContent(once) as T
      assert.deepEqual(
        twice.fields!.map((f) => f.name),
        once.fields!.map((f) => f.name),
        name,
      )
      assert.equal(twice.fieldsets!.filter((f) => f.name === STATUS_FIELDSET).length, 1, name)
      assert.deepEqual(twice.fieldsets, once.fieldsets, name)
    }
  })
})

describe('numbers in titles', () => {
  it('stripNumber removes only a leading "N. "', () => {
    assert.equal(stripNumber('1. Header'), 'Header')
    assert.equal(stripNumber('12.  Play Button'), 'Play Button')
    assert.equal(stripNumber('Primary Button'), 'Primary Button')
    assert.equal(stripNumber('Top 3. things'), 'Top 3. things')
    assert.equal(stripNumber(undefined), undefined)
  })
})
