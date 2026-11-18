import '../layoutPresets/domSetup' // the Studio library expects a browser-like page; must load first
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {describe, it} from 'node:test'
import {createSchema, resolveInitialValueForType} from 'sanity'
import {
  groupsFor,
  LIBRARY_GROUPS,
  MISSING_DESCRIPTIONS,
  previewUrlFor,
  STARTING_ROWS,
  startingRowsFor,
} from './library'
import {PREVIEW_TYPES, sectionPreviewSvg} from './previews'
import {applySectionLibrary} from './index'
import {PREVIEW_DIR} from './generatePreviews'
import {schemaTypes} from '../schemaTypes'
import {allSectionMembers, driverSections, sectionObjectTypes} from '../schemaTypes/sections'

// Run with: npm run test:library

type TypeLike = {
  name: string
  fields?: {
    name?: string
    type?: string
    options?: Record<string, unknown>
    of?: {type?: string}[]
  }[]
  description?: string
  initialValue?: unknown
}
const memberNames = (members: unknown[]) => members.map((m) => (m as {type: string}).type)
const ALL = memberNames(allSectionMembers)

describe('groups', () => {
  const grouped = LIBRARY_GROUPS.flatMap((g) => g.of)

  it('every section the pages offer is in exactly one group', () => {
    assert.deepEqual([...grouped].sort(), [...ALL].sort())
    assert.equal(new Set(grouped).size, grouped.length, 'no section appears twice')
  })

  it('every name in a group is a real registered section type', () => {
    const registered = new Set((sectionObjectTypes as unknown as TypeLike[]).map((t) => t.name))
    for (const name of grouped) assert.ok(registered.has(name), name)
  })

  it('group names and titles are unique and readable', () => {
    assert.equal(new Set(LIBRARY_GROUPS.map((g) => g.name)).size, LIBRARY_GROUPS.length)
    for (const g of LIBRARY_GROUPS) assert.ok(g.title.length > 2 && g.of.length > 0, g.name)
  })

  it('a page with a shorter section list (Driver) shows only its own sections, with no empty groups', () => {
    const groups = groupsFor(memberNames(driverSections))
    assert.deepEqual(groups.flatMap((g) => g.of).sort(), memberNames(driverSections).sort())
    for (const g of groups) assert.ok(g.of.length > 0)
  })
})

describe('pictures', () => {
  it('every section type has a picture, and the picture file is in /public', () => {
    for (const type of ALL) {
      assert.ok(PREVIEW_TYPES.includes(type), `no picture drawn for ${type}`)
      assert.ok(fs.existsSync(path.join(PREVIEW_DIR, `${type}.svg`)), `${type}.svg is missing`)
    }
  })

  it('the committed files match the drawings (run `npm run sections:previews` after changing one)', () => {
    for (const type of PREVIEW_TYPES) {
      const onDisk = fs.readFileSync(path.join(PREVIEW_DIR, `${type}.svg`), 'utf8')
      assert.equal(onDisk, sectionPreviewSvg(type), type)
    }
  })

  it('each picture is a self-contained SVG with no scripts or external links', () => {
    for (const type of PREVIEW_TYPES) {
      const svg = sectionPreviewSvg(type)!
      assert.match(svg, /^<svg [^>]*viewBox="0 0 160 100"/)
      assert.match(svg, /<\/svg>\n$/)
      assert.doesNotMatch(svg, /<script|href=|onload|<image/i)
    }
  })

  it('a section without a picture has none (so the menu falls back to its icon)', () => {
    assert.equal(sectionPreviewSvg('somethingElse'), undefined)
  })

  it('the menu points at the file the generator writes', () => {
    assert.equal(previewUrlFor('bannerSection'), '/studio-assets/sections/bannerSection.svg')
  })
})

describe('the Add menu on every page type', () => {
  const withSections = (schemaTypes as unknown as TypeLike[]).filter((t) =>
    (t.fields ?? []).some((f) => f.name === 'sections' && f.type === 'array'),
  )

  it('every page type that has a sections array also has the visual menu', () => {
    assert.ok(withSections.length >= 11, `found ${withSections.length}`)
    for (const type of withSections) {
      const field = type.fields!.find((f) => f.name === 'sections')!
      const menu = field.options?.insertMenu as
        | {views: {name: string; previewImageUrl?: (n: string) => string}[]; groups: unknown[]}
        | undefined
      const offersSections = (field.of ?? []).some((m) => ALL.includes(m.type ?? ''))
      if (!offersSections) continue // a legacy page type that does not use the section list
      assert.ok(menu, `${type.name} has no menu`)
      assert.deepEqual(
        menu.views.map((v) => v.name),
        ['grid', 'list'],
        'picture grid first, with a plain list as the alternative',
      )
      assert.equal(
        menu.views[0].previewImageUrl?.('cardsGridSection'),
        previewUrlFor('cardsGridSection'),
      )
      assert.ok(menu.groups.length > 0)
    }
  })

  it('Page Templates keep their own array option (drag handles off)', () => {
    const template = (schemaTypes as unknown as TypeLike[]).find((t) => t.name === 'pageTemplate')!
    const field = template.fields!.find((f) => f.name === 'sections')!
    assert.equal(field.options?.sortable, false)
    assert.ok(field.options?.insertMenu)
  })

  it('the menu is the ONLY change to a page type: nothing else is touched, originals are not modified', () => {
    // Re-apply to the already-registered types: an option already present is never replaced, so nothing changes.
    const again = applySectionLibrary(schemaTypes as unknown as TypeLike[])
    again.forEach((t, i) => {
      const before = (schemaTypes as unknown as TypeLike[])[i]
      assert.equal(t.name, before.name)
      assert.equal(t.fields?.length, before.fields?.length)
    })
    // Types without a sections array come back as the very same object.
    const plain = {name: 'plain', fields: [{name: 'title', type: 'string'}]}
    assert.equal(applySectionLibrary([plain])[0], plain)
  })

  it('an insert menu a page already defined is never overridden', () => {
    const own = {
      name: 'x',
      type: 'document',
      fields: [
        {
          name: 'sections',
          type: 'array',
          of: [{type: 'bannerSection'}],
          options: {insertMenu: {filter: false}},
        },
      ],
    }
    const out = applySectionLibrary([own])[0] as unknown as TypeLike
    assert.deepEqual(out.fields![0].options, {insertMenu: {filter: false}})
  })

  it('other options on the array are kept next to the menu', () => {
    const page = {
      name: 'x',
      type: 'document',
      fields: [
        {
          name: 'sections',
          type: 'array',
          of: [{type: 'bannerSection'}],
          options: {sortable: false},
        },
      ],
    }
    const out = applySectionLibrary([page])[0] as unknown as TypeLike
    assert.equal(out.fields![0].options?.sortable, false)
    assert.ok(out.fields![0].options?.insertMenu)
  })
})

describe('starting rows: structure only, never sample wording', () => {
  it('the rows use fields and item types that really exist in the section schemas', () => {
    const sections = sectionObjectTypes as unknown as TypeLike[]
    for (const [sectionType, rows] of Object.entries(STARTING_ROWS)) {
      const field = sections
        .find((t) => t.name === sectionType)!
        .fields!.find((f) => f.name === rows.field)
      assert.ok(field, `${sectionType}.${rows.field} does not exist`)
      assert.equal(field.type, 'array')
      assert.ok(
        field.of?.some((m) => m.type === rows.itemType),
        `${rows.itemType} is not a member of ${rows.field}`,
      )
    }
  })

  it('every row is empty — just a key and a type, no text', () => {
    for (const sectionType of Object.keys(STARTING_ROWS)) {
      const value = startingRowsFor(sectionType)!
      for (const rows of Object.values(value) as {_key: string; _type: string}[][]) {
        for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ['_key', '_type'])
      }
    }
  })

  it('keys are unique even if the key maker repeats itself', () => {
    let n = 0
    const stuttering = () => `k${Math.floor(n++ / 3)}`
    const rows = (startingRowsFor('cardsGridSection', stuttering) as {cards: {_key: string}[]})
      .cards
    assert.equal(new Set(rows.map((r) => r._key)).size, rows.length)
  })

  it('a section with no starting rows has none', () => {
    assert.equal(startingRowsFor('bannerSection'), undefined)
  })

  it('the missing Custom HTML description is filled in, and no existing description is replaced', () => {
    const types = schemaTypes as unknown as TypeLike[]
    assert.equal(
      types.find((t) => t.name === 'customHtmlSection')!.description,
      MISSING_DESCRIPTIONS.customHtmlSection,
    )
    const own = applySectionLibrary([{name: 'customHtmlSection', description: 'mine'}])[0]
    assert.equal(own.description, 'mine')
  })
})

describe("Sanity's own initial value for a NEW section (what the editor actually gets)", () => {
  const schema = createSchema({name: 'default', types: schemaTypes as never})
  const ctx = {
    schema,
    currentUser: null,
    getClient: () => ({}),
    projectId: 'x',
    dataset: 'y',
  } as never
  const fresh = (name: string) =>
    resolveInitialValueForType(schema.get(name) as never, {}, 3, ctx) as Promise<
      Record<string, unknown>
    >

  const expectations: [string, string, string, number][] = [
    ['cardsGridSection', 'cards', 'cardItem', 3],
    ['featureGridSection', 'features', 'featureCardItem', 3],
    ['accordionSection', 'items', 'accordionItem', 2],
    ['linkListSection', 'listItems', 'linkListItem', 3],
  ]

  for (const [section, field, itemType, count] of expectations) {
    it(`${section} starts with ${count} empty ${itemType} rows`, async () => {
      const value = await fresh(section)
      const rows = value[field] as {_key: string; _type: string}[]
      assert.equal(rows.length, count)
      rows.forEach((r) => assert.equal(r._type, itemType))
      assert.equal(new Set(rows.map((r) => r._key)).size, count, 'unique keys')
    })
  }

  it('the section keeps all the defaults it already had (columns, active switch …)', async () => {
    const value = await fresh('cardsGridSection')
    assert.equal(value.columns, '3')
    assert.equal(value.isActive, true)
    assert.equal(value.mosaicView, false)
  })

  it('two new sections never share row keys', async () => {
    const a = ((await fresh('cardsGridSection')).cards as {_key: string}[]).map((r) => r._key)
    const b = ((await fresh('cardsGridSection')).cards as {_key: string}[]).map((r) => r._key)
    assert.equal(a.filter((k) => b.includes(k)).length, 0)
  })

  it('sections without starting rows get no rows (nothing new)', async () => {
    for (const name of [
      'bannerSection',
      'photoGallerySection',
      'vehicleCarouselSection',
      'callToActionSection',
    ]) {
      const value = await fresh(name)
      for (const field of ['cards', 'features', 'items', 'listItems']) {
        assert.equal(value[field], undefined, `${name}.${field}`)
      }
    }
  })
})
