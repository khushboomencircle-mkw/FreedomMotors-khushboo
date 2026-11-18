import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {schemaTypes} from '../schemaTypes'
import {sectionObjectTypes} from '../schemaTypes/sections'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {
  BUTTON_FIELD_TITLES,
  BUTTON_STYLE_FIELDS,
  COMPACT_FIELDS,
  exampleFrom,
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
        t.fields!.slice(0, 4).map((f) => f.name),
        ['sectionIntro', 'isActive', 'sequence', 'sectionPosition'],
        name,
      )
      for (const key of ['isActive', 'sequence']) {
        assert.equal(groupsOf(field(t, key)!).join(), 'content', `${name}.${key} group`)
        assert.equal(field(t, key)!.fieldset, STATUS_FIELDSET, `${name}.${key} fieldset`)
      }
      assert.equal(t.fieldsets![0].name, STATUS_FIELDSET, name)
      assert.equal(t.fieldsets![0].options?.columns, 3, name)
    }
  })

  it('no block title starts with a number ("1. Header" is now "Heading & intro")', () => {
    for (const name of tabbed) {
      for (const fs of live(name).fieldsets ?? [])
        assert.doesNotMatch(String(fs.title), /^\s*\d+\./, `${name}.${fs.name}`)
    }
  })

  it('the heading block is called "Heading & intro" and starts folded', () => {
    for (const name of tabbed) {
      const header = fieldset(live(name), 'header')
      if (!header) continue
      assert.equal(header.title, 'Heading & intro', name)
      assert.equal(header.options?.collapsed, true, name)
    }
  })

  it('buttons are "Main button" and "Second button", both starting folded', () => {
    let seen = 0
    for (const name of tabbed) {
      const t = live(name)
      const main = fieldset(t, 'primaryButton')
      const second = fieldset(t, 'secondaryButton')
      if (main) {
        seen++
        assert.equal(main.title, 'Main button', name)
        assert.equal(main.options?.collapsed, true, name)
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

// ── The design pass: blocks that look like the approved mockup ──
const fieldNamesIn = (t: T, fieldsetName: string) =>
  t.fields!.filter((f) => f.fieldset === fieldsetName).map((f) => f.name)

describe('clean label-and-input blocks (no long helper text)', () => {
  it('the standard fields lose their helper text', () => {
    let checked = 0
    for (const name of tabbed) {
      for (const f of live(name).fields!) {
        if (COMPACT_FIELDS.has(f.name ?? '')) {
          assert.equal((f as {description?: unknown}).description, undefined, `${name}.${f.name}`)
          checked++
        }
      }
    }
    assert.ok(checked > 40, `only ${checked} fields checked`)
  })

  it('an example in the old helper text stays as a placeholder', () => {
    const banner = live('bannerSection').fields!.find((f) => f.name === 'eyebrow') as {
      placeholder?: string
    }
    assert.equal(banner.placeholder, 'e.g. What We Convert')
    const cards = live('cardsGridSection').fields!.find((f) => f.name === 'sectionHeading') as {
      placeholder?: string
    }
    assert.equal(cards.placeholder, 'e.g. How It Works')
  })

  it('exampleFrom only reads a quoted "e.g."', () => {
    assert.equal(exampleFrom('Big title (e.g. "How It Works").'), 'e.g. How It Works')
    assert.equal(exampleFrom('No example here'), undefined)
    assert.equal(exampleFrom(undefined), undefined)
  })

  it('fields outside the standard blocks keep their helper text', () => {
    const images = live('bannerSection').fields!.find((f) => f.name === 'images') as {
      description?: string
    }
    assert.ok(images.description, 'Banner images keeps its description')
  })
})

describe('the heading block shows the section’s real headline first', () => {
  const order = (name: string) => live(name).fields!.map((f) => f.name)

  it('Banner: Heading, Description, Eyebrow and Heading Style first; Title and Subtitle in "More heading options"', () => {
    const names = order('bannerSection')
    const seq = names.indexOf('sectionPosition')
    assert.deepEqual(names.slice(seq + 1, seq + 7), [
      'heading',
      'description',
      'eyebrow',
      'headerStyle',
      'sectionHeading',
      'sectionDescription',
    ])
    assert.deepEqual(fieldNamesIn(live('bannerSection'), 'header'), [
      'heading',
      'description',
      'eyebrow',
      'headerStyle',
    ])
    assert.deepEqual(fieldNamesIn(live('bannerSection'), 'headerMore'), [
      'sectionHeading',
      'sectionDescription',
    ])
    assert.equal(fieldset(live('bannerSection'), 'headerMore')!.title, 'More heading options')
  })

  it('Accordion: the same, with Heading, Description and Eyebrow first', () => {
    assert.deepEqual(fieldNamesIn(live('accordionSection'), 'header'), [
      'heading',
      'description',
      'eyebrow',
    ])
    assert.deepEqual(fieldNamesIn(live('accordionSection'), 'headerMore'), [
      'sectionHeading',
      'sectionDescription',
    ])
  })

  it('every other section keeps Title and Subtitle as its heading block, with no extra block', () => {
    for (const name of tabbed.filter((n) => n !== 'bannerSection' && n !== 'accordionSection')) {
      const t = live(name)
      if (!fieldset(t, 'header')) continue
      assert.deepEqual(fieldNamesIn(t, 'header'), ['sectionHeading', 'sectionDescription'], name)
      assert.equal(fieldset(t, 'headerMore'), undefined, name)
    }
  })

  it('nothing is hidden: both headline sets stay visible and in the Content tab', () => {
    for (const key of [
      'heading',
      'description',
      'eyebrow',
      'headerStyle',
      'sectionHeading',
      'sectionDescription',
    ]) {
      const f = live('bannerSection').fields!.find((x) => x.name === key) as {
        hidden?: unknown
        group?: string
      }
      assert.equal(f.hidden, undefined, key)
      assert.equal(f.group, 'content', key)
    }
  })
})

describe('buttons: what it says and where it goes, in one row', () => {
  const withButtons = tabbed.filter((n) => fieldset(live(n), 'primaryButton'))

  it('the Main button block holds only the switch, the text and the destination (plus the hidden old field)', () => {
    assert.ok(withButtons.length >= 4)
    for (const name of withButtons) {
      const names = fieldNamesIn(live(name), 'primaryButton')
      assert.deepEqual(
        names.filter((n) => n !== 'buttonLink'),
        ['showButton', 'buttonLabel', 'buttonLinkUrl'],
        name,
      )
      assert.equal(fieldset(live(name), 'primaryButton')!.options?.columns, 3, name)
    }
  })

  it('how a button looks moves to "Button style" in the Colors & Theme tab', () => {
    let moved = 0
    for (const name of withButtons) {
      const t = live(name)
      for (const f of t.fields!.filter((x) => BUTTON_STYLE_FIELDS.has(x.name ?? ''))) {
        assert.equal(f.group, 'sectionStyles', `${name}.${f.name}`)
        assert.equal(f.fieldset, 'buttonStyle', `${name}.${f.name}`)
        moved++
      }
      assert.equal(t.fieldsets!.filter((fs) => fs.name === 'buttonStyle').length, 1, name)
      assert.equal(fieldset(t, 'buttonStyle')!.title, 'Button style')
      assert.ok(
        !t.groups!.find((g) => g.name === 'sectionStyles')!.hidden,
        `${name}: Colors & Theme is shown`,
      )
    }
    assert.ok(moved >= 10, `only ${moved} style fields moved`)
  })

  it('the Second button block is a folded-away row with the same three fields', () => {
    const t = live('bannerSection')
    const second = fieldset(t, 'secondaryButton')!
    assert.equal(second.options?.collapsible, true)
    assert.equal(second.options?.collapsed, true)
    assert.deepEqual(
      fieldNamesIn(t, 'secondaryButton').filter((n) => n !== 'secondaryButtonLink'),
      ['showSecondaryButton', 'secondaryButtonLabel', 'secondaryButtonLinkUrl'],
    )
  })
})

describe('which blocks fold away', () => {
  it('Heading & intro, More heading options and Main button can be folded away, and start folded', () => {
    let seen = 0
    for (const name of tabbed) {
      for (const block of ['header', 'headerMore', 'primaryButton']) {
        const fs = fieldset(live(name), block)
        if (!fs) continue
        assert.equal(fs.options?.collapsible, true, `${name}.${block} can be folded`)
        assert.equal(fs.options?.collapsed, true, `${name}.${block} starts folded`)
        seen++
      }
    }
    assert.ok(seen >= 10, `only ${seen} blocks checked`)
  })

  it('Second button can be folded and starts folded away', () => {
    const second = fieldset(live('bannerSection'), 'secondaryButton')!
    assert.equal(second.options?.collapsible, true)
    assert.equal(second.options?.collapsed, true)
  })

  it('the small Status row is always shown', () => {
    for (const name of tabbed) {
      const status = fieldset(live(name), 'status')!
      assert.equal(status.options?.collapsible, false, name)
    }
  })
})

describe('every fold-away block starts folded', () => {
  it('in every section, on every tab: if a block can be folded, it starts folded', () => {
    let foldable = 0
    for (const name of tabbed) {
      for (const fs of live(name).fieldsets ?? []) {
        if (fs.options?.collapsible === true) {
          foldable++
          assert.equal(fs.options.collapsed, true, `${name}.${fs.name} starts open`)
        }
      }
    }
    assert.ok(foldable >= 25, `only ${foldable} foldable blocks found`)
  })

  it('the Status row is never folded away, so its switch is always in reach', () => {
    for (const name of tabbed)
      assert.notEqual(fieldset(live(name), 'status')!.options?.collapsed, true, name)
  })
})
