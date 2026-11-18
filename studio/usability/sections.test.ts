import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {createSchema} from 'sanity'
import {schemaTypes} from '../schemaTypes'
import {sectionObjectTypes} from '../schemaTypes/sections'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {ALL_FIELDS_GROUP, TAB_TITLES, everyFieldHasATab, withCalmTabs} from './tabs'
import {ACTIVE_KEY, hiddenSubtitle, withHiddenBadge} from './hiddenBadge'

// Run with: npm run test:usability

type Group = {name: string; title?: string; hidden?: boolean}
type Preview = {
  select?: Record<string, string>
  prepare?: (s: Record<string, unknown>) => Record<string, unknown>
}
type T = {
  name: string
  groups?: Group[]
  fields?: {name?: string; group?: string | string[]}[]
  preview?: Preview
}

const SECTION_NAMES = LIBRARY_GROUPS.flatMap((g) => g.of)
const originals = sectionObjectTypes as unknown as T[]
const registered = schemaTypes as unknown as T[]
const original = (name: string) => originals.find((t) => t.name === name)!
const live = (name: string) => registered.find((t) => t.name === name)!

describe('calmer tabs', () => {
  const tabbed = SECTION_NAMES.filter((n) => original(n).groups?.length)

  it('every tabbed section has plain tab names', () => {
    assert.ok(tabbed.length >= 10)
    for (const name of tabbed) {
      for (const g of live(name).groups!.filter((x) => x.name !== ALL_FIELDS_GROUP)) {
        assert.equal(
          g.title,
          TAB_TITLES[g.name] ?? original(name).groups!.find((o) => o.name === g.name)!.title,
          `${name}.${g.name}`,
        )
      }
    }
  })

  it('the tab NAMES and their order are unchanged (only the titles you read change)', () => {
    for (const name of tabbed) {
      const before = original(name).groups!.map((g) => g.name)
      const after = live(name)
        .groups!.map((g) => g.name)
        .filter((n) => n !== ALL_FIELDS_GROUP)
      assert.deepEqual(after, before, name)
    }
  })

  it('the "All fields" tab is hidden on every tabbed section', () => {
    for (const name of tabbed) {
      const all = live(name).groups!.find((g) => g.name === ALL_FIELDS_GROUP)
      assert.equal(all?.hidden, true, name)
    }
  })

  it('no field is lost or changed: the tab wrapper returns the very same fields', () => {
    for (const name of tabbed)
      assert.equal(withCalmTabs(original(name)).fields, original(name).fields, name)
  })

  it('every field is still in a visible tab, so nothing becomes unreachable', () => {
    for (const name of tabbed) {
      const visible = new Set(
        live(name)
          .groups!.filter((g) => !g.hidden)
          .map((g) => g.name),
      )
      for (const field of live(name).fields!) {
        const groups = Array.isArray(field.group) ? field.group : field.group ? [field.group] : []
        assert.ok(
          groups.length > 0 && groups.every((g) => visible.has(g)),
          `${name}.${field.name} has no visible tab`,
        )
      }
    }
  })

  it('the "All fields" tab is left alone if any field has no tab (it would otherwise vanish)', () => {
    const odd = {
      name: 'x',
      groups: [{name: 'content', title: 'Content'}],
      fields: [{name: 'a', group: 'content'}, {name: 'b'}],
    }
    assert.equal(everyFieldHasATab(odd), false)
    assert.equal(
      withCalmTabs(odd).groups!.some((g) => g.name === ALL_FIELDS_GROUP),
      false,
    )
  })

  it('a section without tabs (the Static section) is returned unchanged', () => {
    assert.equal(live('staticSection').groups, original('staticSection').groups)
  })

  it('Sanity accepts the schema with the hidden tab', () => {
    const schema = createSchema({name: 'default', types: schemaTypes as never})
    const groups = (schema.get('bannerSection') as unknown as {groups: Group[]}).groups
    assert.ok(groups.some((g) => g.name === ALL_FIELDS_GROUP && g.hidden))
  })
})

describe('the "Hidden" marker in the Page Sections list', () => {
  const withPreview = SECTION_NAMES.filter((n) => live(n).preview?.prepare)

  it('exists on every section that has a row preview, except the Static section (which says it itself)', () => {
    assert.ok(withPreview.length >= 9)
    for (const name of withPreview) {
      const badge = live(name).preview!.select![ACTIVE_KEY]
      assert.equal(badge, name === 'staticSection' ? undefined : 'isActive', name)
    }
  })

  it('a switched-off section says "Hidden", and its own subtitle is kept after it', () => {
    for (const name of withPreview.filter((n) => n !== 'staticSection')) {
      const prepare = live(name).preview!.prepare!
      const own = original(name).preview!.prepare!({})
      const row = prepare({[ACTIVE_KEY]: false})
      assert.equal(row.subtitle, hiddenSubtitle(own.subtitle), name)
      assert.equal(row.title, own.title, `${name}: title is unchanged`)
    }
  })

  it('a live section looks exactly as before', () => {
    for (const name of withPreview.filter((n) => n !== 'staticSection')) {
      const prepare = live(name).preview!.prepare!
      const own = original(name).preview!.prepare!({})
      assert.deepEqual(prepare({[ACTIVE_KEY]: true}), own, name)
      assert.deepEqual(prepare({}), own, name)
    }
  })

  it('"Hidden" alone when a row has no subtitle', () => {
    assert.equal(hiddenSubtitle(undefined), 'Hidden')
    assert.equal(hiddenSubtitle(''), 'Hidden')
  })

  it('a section without a row preview is returned unchanged', () => {
    const bare = {name: 'bare'}
    assert.equal(withHiddenBadge(bare), bare)
  })

  it('the section’s own selected values are all still selected', () => {
    for (const name of withPreview.filter((n) => n !== 'staticSection')) {
      for (const [key, path] of Object.entries(original(name).preview!.select!)) {
        assert.equal(live(name).preview!.select![key], path, `${name}.${key}`)
      }
    }
  })
})
