import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {describe, it} from 'node:test'
import {schemaTypes} from '../schemaTypes'
import {allSectionMembers, driverSections, sectionObjectTypes} from '../schemaTypes/sections'
import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {
  compareToLock,
  describeSchema,
  identityChanges,
  sameValue,
  type TypeLike,
} from './fieldIntegrity'
import {projectedFields} from './groqFields'

// Run with: npm run test:usability
//
// THE STRICT RULE: no existing field is ever removed, and no field's key (name) ever changes. The website's GROQ
// queries and every saved document depend on those names. These tests are what enforce it.

const registered = schemaTypes as unknown as TypeLike[]
const current = describeSchema(registered)
const lock: string[] = JSON.parse(fs.readFileSync('studio/usability/fieldLock.json', 'utf8'))

describe('the field lock (no field removed, none renamed, none retyped)', () => {
  it('is present and covers the whole schema', () => {
    assert.ok(lock.length > 600, `only ${lock.length} fields locked`)
    for (const type of [
      'homePage',
      'cardsGridSection',
      'vehicle',
      'blogPost',
      'siteSettings',
      'photoWithAlt',
    ]) {
      assert.ok(
        lock.some((l) => l.startsWith(`${type}.`)),
        `${type} is not in the lock`,
      )
    }
  })

  it('every locked field still exists', () => {
    const {missing} = compareToLock(lock, current)
    assert.deepEqual(
      missing,
      [],
      `Fields were removed or renamed. Put them back:\n  ${missing.join('\n  ')}`,
    )
  })

  it('every locked field still has the same type', () => {
    const {changed} = compareToLock(lock, current)
    assert.deepEqual(changed, [], `Field types changed:\n  ${changed.join('\n  ')}`)
  })

  it('the lock is up to date: every current field is locked (run `npm run schema:lock` after adding one)', () => {
    const locked = new Set(lock.map((l) => l.split(' :: ')[0]))
    const unlocked = current.map((l) => l.split(' :: ')[0]).filter((p) => !locked.has(p))
    assert.deepEqual(
      unlocked,
      [],
      `New fields are not locked yet. Run: npm run schema:lock\n  ${unlocked.join('\n  ')}`,
    )
  })
})

describe('Studio-only wrappers change presentation, never what a field IS', () => {
  type F = {name?: string} & Record<string, unknown>
  const SECTION_NAMES = LIBRARY_GROUPS.flatMap((g) => g.of)
  const originals = sectionObjectTypes as unknown as {name: string; fields?: F[]}[]

  it('every section field that existed before still exists, with identical name, type, options, validation and default', () => {
    for (const name of SECTION_NAMES) {
      const before = originals.find((t) => t.name === name)!
      const after = registered.find((t) => t.name === name)! as unknown as {fields?: F[]}
      for (const field of before.fields ?? []) {
        const now = (after.fields ?? []).find((f) => f.name === field.name)
        assert.ok(now, `${name}.${field.name} was removed`)
        const changes = identityChanges(field, now)
        assert.deepEqual(changes, [], `${name}.${field.name}: ${changes.join(', ')} changed`)
      }
    }
  })

  it('a page’s sections array keeps the same section types; the only addition is the Add menu', () => {
    const pages = registered.filter((t) =>
      ((t.fields ?? []) as F[]).some((f) => f.name === 'sections' && f.type === 'array'),
    )
    assert.ok(pages.length >= 11)
    const offered = [allSectionMembers, driverSections].map((m) =>
      m.map((x) => (x as {type: string}).type).sort(),
    )
    for (const page of pages) {
      const field = ((page.fields ?? []) as F[]).find((f) => f.name === 'sections')!
      const types = ((field.of ?? []) as {type: string}[]).map((m) => m.type).sort()
      if (types.some((t) => LIBRARY_GROUPS.flatMap((g) => g.of).includes(t))) {
        assert.ok(
          offered.some((o) => sameValue(o, types)),
          `${page.name}.sections offers a different list of sections`,
        )
      }
      // besides the menu, an array keeps only the options it already had (Page Templates: drag handles off)
      const {insertMenu, ...rest} = (field.options ?? {}) as Record<string, unknown>
      assert.ok(insertMenu === undefined || typeof insertMenu === 'object')
      assert.ok(
        Object.keys(rest).every((k) => k === 'sortable'),
        `${page.name}.sections has unexpected options: ${Object.keys(rest)}`,
      )
    }
  })
})

/**
 * Fields the website still asks for that the CURRENT schema does not have. They are old keys from earlier versions of the
 * sections (an older document may still hold them), so the site keeps reading them. They are listed here on purpose: this
 * list must never grow. Anything new the site asks for has to exist in the schema.
 */
const LEGACY_QUERIED: Record<string, string[]> = {
  section: ['sectionType'],
  cards: ['stepBadge'],
  items: ['isExpandedByDefault'],
  features: [],
  listItems: [],
}

describe('everything the website asks for still exists (its GROQ projection)', () => {
  const source = fs.readFileSync('src/sanity/queries.ts', 'utf8')
  const match = /const SECTION_PROJECTION = `([\s\S]*?)`\n/.exec(source)
  assert.ok(match, 'could not find SECTION_PROJECTION in src/sanity/queries.ts')
  const projected = projectedFields(match[1].trim().replace(/^\{/, '').replace(/\}$/, ''))

  const sectionFields = (name: string) =>
    new Set(((registered.find((t) => t.name === name)?.fields ?? []) as F[]).map((f) => f.name))
  type F = {name?: string}
  const everySectionField = new Set(SECTION_TYPES().flatMap((n) => [...sectionFields(n)]))
  function SECTION_TYPES() {
    return LIBRARY_GROUPS.flatMap((g) => g.of)
  }

  it('reads a good number of fields (the parser works)', () => {
    assert.ok(projected.length > 60, `parsed only ${projected.length}`)
  })

  it('every section field the site queries exists on at least one section', () => {
    const unknown = projected
      .map((p) => p.name)
      .filter(
        (n) =>
          !n.startsWith('_') && !everySectionField.has(n) && !LEGACY_QUERIED.section.includes(n),
      )
    assert.deepEqual(unknown, [], `The site asks for fields no section has: ${unknown.join(', ')}`)
  })

  it('the fields of cards, FAQ items, features and link rows still exist', () => {
    const rows: Record<string, string> = {
      cards: 'cardItem',
      items: 'accordionItem',
      features: 'featureCardItem',
      listItems: 'linkListItem',
    }
    for (const [field, type] of Object.entries(rows)) {
      const known = sectionFields(type)
      const asked = projected.find((p) => p.name === field)?.nested ?? []
      const unknown = asked
        .map((n) => n.name)
        .filter((n) => !n.startsWith('_') && !known.has(n) && !LEGACY_QUERIED[field].includes(n))
      assert.deepEqual(
        unknown,
        [],
        `${field}[] asks for fields ${type} does not have: ${unknown.join(', ')}`,
      )
    }
  })
})

describe('the legacy list stays honest', () => {
  it('every entry is still really missing from the schema (if one is added back, remove it from the list)', () => {
    const rowTypes: Record<string, string> = {
      cards: 'cardItem',
      items: 'accordionItem',
      features: 'featureCardItem',
      listItems: 'linkListItem',
    }
    const has = (type: string, name: string) =>
      ((registered.find((t) => t.name === type)?.fields ?? []) as {name?: string}[]).some(
        (f) => f.name === name,
      )
    for (const [group, names] of Object.entries(LEGACY_QUERIED)) {
      for (const name of names) {
        const inSchema =
          group === 'section'
            ? LIBRARY_GROUPS.flatMap((g) => g.of).some((t) => has(t, name))
            : has(rowTypes[group], name)
        assert.equal(
          inSchema,
          false,
          `${group}.${name} is in the schema now: remove it from LEGACY_QUERIED`,
        )
      }
    }
  })
})

describe('the guard really fires (it is tested against deliberate breakage)', () => {
  const locked = ['card.title :: string', 'card.image :: photoWithAlt', 'card.items :: array<row>']

  it('a removed field is reported', () => {
    const now = ['card.image :: photoWithAlt', 'card.items :: array<row>']
    assert.deepEqual(compareToLock(locked, now).missing, ['card.title'])
  })

  it('a renamed field is reported as removed (its old key is gone)', () => {
    const now = ['card.heading :: string', 'card.image :: photoWithAlt', 'card.items :: array<row>']
    assert.deepEqual(compareToLock(locked, now).missing, ['card.title'])
  })

  it('a retyped field is reported', () => {
    const now = ['card.title :: text', 'card.image :: photoWithAlt', 'card.items :: array<row>']
    assert.deepEqual(compareToLock(locked, now).changed, ['card.title: was string, now text'])
  })

  it('a new field is fine for the lock itself (the lock-is-current test then asks to re-lock)', () => {
    const now = [...locked, 'card.extra :: string']
    assert.deepEqual(compareToLock(locked, now), {missing: [], changed: []})
  })

  it('a field whose key was changed is caught by identity checks', () => {
    assert.deepEqual(
      identityChanges({name: 'title', type: 'string'}, {name: 'heading', type: 'string'}),
      ['name'],
    )
  })

  it('a changed type, options, validation or default is caught', () => {
    const v1 = () => true
    const v2 = () => true
    assert.deepEqual(identityChanges({name: 'a', type: 'string'}, {name: 'a', type: 'text'}), [
      'type',
    ])
    assert.deepEqual(identityChanges({name: 'a', options: {x: 1}}, {name: 'a', options: {x: 2}}), [
      'options',
    ])
    // the same options written out again (a copy) are NOT a change
    assert.deepEqual(
      identityChanges({name: 'a', options: {list: [1, 2]}}, {name: 'a', options: {list: [1, 2]}}),
      [],
    )
    assert.deepEqual(identityChanges({name: 'a', validation: v1}, {name: 'a', validation: v2}), [
      'validation',
    ])
    assert.deepEqual(identityChanges({name: 'a', initialValue: 1}, {name: 'a', initialValue: 2}), [
      'initialValue',
    ])
  })

  it('presentation-only changes are allowed: title, description, group, fieldset, hidden, components, placeholder', () => {
    const before = {name: 'a', type: 'string', title: 'A', group: 'content'}
    const after = {
      ...before,
      title: 'Heading',
      description: 'Plain words',
      group: 'behavior',
      fieldset: 'status',
      hidden: true,
      components: {},
      placeholder: 'e.g.',
    }
    assert.deepEqual(identityChanges(before, after), [])
  })

  it('the very same field object is, trivially, unchanged', () => {
    const field = {name: 'a', type: 'string', validation: () => true}
    assert.deepEqual(identityChanges(field, {...field}), [])
  })
})
