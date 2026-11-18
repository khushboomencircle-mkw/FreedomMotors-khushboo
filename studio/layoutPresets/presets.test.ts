import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
  activePresetId,
  changesFor,
  effectiveValues,
  LAYOUT_PRESETS,
  perRowChange,
  perRowValue,
  showsPerRow,
  type FieldValues,
  type SectionPresetConfig,
} from './presets'
import {
  bannerSectionType,
  cardsGridSectionType,
  featureGridSectionType,
  linkListSectionType,
  photoGallerySectionType,
} from '../schemaTypes/sections'

// Run with: npm run test:layouts

/** The REAL section schemas, so a preset can never name a field or value the section doesn't have. */
const SCHEMAS: Record<string, {fields: unknown[]}> = {
  cardsGridSection: cardsGridSectionType as never,
  featureGridSection: featureGridSectionType as never,
  bannerSection: bannerSectionType as never,
  linkListSection: linkListSectionType as never,
  photoGallerySection: photoGallerySectionType as never,
}

interface SchemaField {
  name: string
  type: string
  initialValue?: unknown
  options?: {list?: {value: string}[]}
}
const fieldOf = (sectionType: string, name: string): SchemaField | undefined =>
  (SCHEMAS[sectionType].fields as SchemaField[]).find((f) => f.name === name)

/** All legal values of a field: its option list, or true/false for a toggle. */
function legalValues(sectionType: string, name: string): (string | boolean)[] {
  const field = fieldOf(sectionType, name)
  assert.ok(field, `${sectionType} has no field "${name}"`)
  if (field.type === 'boolean') return [true, false]
  const list = field.options?.list
  assert.ok(list, `${sectionType}.${name} has no option list`)
  return list.map((o) => o.value)
}

/** Every combination of legal values of the section's layout fields (plus "empty" for each). */
function allStates(config: SectionPresetConfig): FieldValues[] {
  let states: FieldValues[] = [{}]
  for (const name of config.fields) {
    const options = [undefined, ...legalValues(config.sectionType, name)]
    states = states.flatMap((s) => options.map((o) => ({...s, [name]: o})))
  }
  return states
}

const configs = Object.values(LAYOUT_PRESETS)

describe('presets agree with the real section schemas', () => {
  for (const config of configs) {
    it(`${config.sectionType}: every field exists`, () => {
      for (const name of config.fields) assert.ok(fieldOf(config.sectionType, name), name)
    })

    it(`${config.sectionType}: defaults equal the schema's initial values`, () => {
      for (const [name, value] of Object.entries(config.defaults)) {
        assert.equal(fieldOf(config.sectionType, name)?.initialValue, value, name)
      }
    })

    it(`${config.sectionType}: every value a preset writes is a legal option`, () => {
      for (const state of allStates(config)) {
        for (const preset of config.presets) {
          const target = preset.apply(effectiveValues(config, state))
          for (const [name, value] of Object.entries(target)) {
            assert.ok(config.fields.includes(name), `${preset.id} writes unknown field ${name}`)
            assert.ok(
              legalValues(config.sectionType, name).includes(value as string | boolean),
              `${config.sectionType}/${preset.id} writes illegal ${name}=${String(value)}`,
            )
          }
        }
      }
    })
  }
})

describe('picking a preset always lands on that preset', () => {
  for (const config of configs) {
    it(`${config.sectionType}: from every possible starting state`, () => {
      for (const state of allStates(config)) {
        for (const preset of config.presets) {
          const changes = changesFor(config, preset, state)
          // Apply the changes the way Studio would, then ask which preset is showing.
          const after: FieldValues = {...state, ...changes}
          assert.equal(
            activePresetId(config, after),
            preset.id,
            `${config.sectionType}: ${JSON.stringify(state)} → ${preset.id} gave ${activePresetId(config, after)}`,
          )
        }
      }
    })

    it(`${config.sectionType}: choosing the layout already showing writes nothing`, () => {
      for (const state of allStates(config)) {
        const id = activePresetId(config, state)
        const preset = config.presets.find((p) => p.id === id)
        if (!preset) continue
        assert.deepEqual(changesFor(config, preset, state), {}, JSON.stringify(state))
      }
    })
  }
})

describe('existing pages show the right layout without being touched', () => {
  it('a section with no layout values set shows the website default', () => {
    assert.equal(activePresetId(LAYOUT_PRESETS.cardsGridSection, {}), 'grid')
    assert.equal(activePresetId(LAYOUT_PRESETS.featureGridSection, {}), 'grid')
    assert.equal(activePresetId(LAYOUT_PRESETS.photoGallerySection, {}), 'grid')
    assert.equal(activePresetId(LAYOUT_PRESETS.linkListSection, {}), 'left')
  })

  it('a Banner with no Text Position is "not chosen" — never guessed', () => {
    assert.equal(activePresetId(LAYOUT_PRESETS.bannerSection, {}), 'unset')
    assert.equal(
      activePresetId(LAYOUT_PRESETS.bannerSection, {textPosition: 'overImage'}),
      'overImage',
    )
  })

  it('a value outside the known list shows "custom" instead of a wrong preset', () => {
    assert.equal(activePresetId(LAYOUT_PRESETS.cardsGridSection, {columns: '7'}), 'custom')
    assert.equal(activePresetId(LAYOUT_PRESETS.bannerSection, {textPosition: 'weird'}), 'custom')
  })
})

describe('Cards Grid in detail', () => {
  const cards = LAYOUT_PRESETS.cardsGridSection
  const preset = (id: string) => cards.presets.find((p) => p.id === id)!

  it('Slider sets exactly Columns 1 and Display as Slider', () => {
    assert.deepEqual(changesFor(cards, preset('slider'), {}), {
      columns: '1',
      oneColumnDisplayMode: 'slider',
    })
  })
  it('Grid from a slider goes back to rows of 3 (the website default)', () => {
    const changes = changesFor(cards, preset('grid'), {
      columns: '1',
      oneColumnDisplayMode: 'slider',
    })
    assert.deepEqual(changes, {columns: '3'})
  })
  it('Grid keeps the number of cards per row the editor already chose', () => {
    assert.deepEqual(changesFor(cards, preset('grid'), {columns: '4', mosaicView: true}), {
      mosaicView: false,
    })
  })
  it('Mosaic keeps the editor’s column count', () => {
    assert.deepEqual(changesFor(cards, preset('mosaic'), {columns: '4'}), {mosaicView: true})
  })
  it('never touches a field outside the layout fields', () => {
    for (const p of cards.presets) {
      for (const key of Object.keys(changesFor(cards, p, {columns: '1'}))) {
        assert.ok(cards.fields.includes(key), key)
      }
    }
  })
})

describe('the "cards per row" number input', () => {
  const withInput = configs.filter((c) => c.perRow)

  it('exists for Cards Grid, Feature Grid and Photo Gallery only', () => {
    assert.deepEqual(withInput.map((c) => c.sectionType).sort(), [
      'cardsGridSection',
      'featureGridSection',
      'photoGallerySection',
    ])
  })

  for (const config of withInput) {
    const perRow = config.perRow!

    it(`${config.sectionType}: it writes the existing Columns field, within the schema's options`, () => {
      assert.equal(perRow.field, 'columns')
      const legal = legalValues(config.sectionType, perRow.field)
      for (let n = perRow.min; n <= perRow.max; n++) assert.ok(legal.includes(String(n)), String(n))
    })

    it(`${config.sectionType}: changing the number keeps the same layout and never leaves the list`, () => {
      const legal = legalValues(config.sectionType, perRow.field)
      for (const state of allStates(config)) {
        if (!showsPerRow(config, state)) continue
        const before = activePresetId(config, state)
        for (let n = perRow.min; n <= perRow.max; n++) {
          const change = perRowChange(config, state, n)
          for (const value of Object.values(change)) assert.ok(legal.includes(value as string))
          const after = {...state, ...change}
          assert.equal(activePresetId(config, after), before, JSON.stringify([state, n]))
          assert.equal(perRowValue(config, after), n)
        }
      }
    })

    it(`${config.sectionType}: numbers outside the range or not whole numbers write nothing`, () => {
      for (const bad of [0, 1, perRow.max + 1, 7, 2.5, -3, NaN, Infinity]) {
        assert.deepEqual(perRowChange(config, {}, bad), {}, String(bad))
      }
    })

    it(`${config.sectionType}: typing the number already showing writes nothing`, () => {
      assert.deepEqual(perRowChange(config, {}, 3), {})
      assert.deepEqual(perRowChange(config, {columns: '4'}, 4), {})
    })
  }

  it('is shown for Grid and Mosaic on cards, but not for a slider or list', () => {
    const cards = LAYOUT_PRESETS.cardsGridSection
    assert.equal(showsPerRow(cards, {}), true)
    assert.equal(showsPerRow(cards, {mosaicView: true}), true)
    assert.equal(showsPerRow(cards, {columns: '1', oneColumnDisplayMode: 'slider'}), false)
    assert.equal(showsPerRow(cards, {columns: '1'}), false)
  })

  it('is shown for a gallery Grid only (its Columns field applies to Grid alone)', () => {
    const gallery = LAYOUT_PRESETS.photoGallerySection
    assert.equal(showsPerRow(gallery, {layout: 'grid'}), true)
    assert.equal(showsPerRow(gallery, {layout: 'mosaic'}), false)
    assert.equal(showsPerRow(gallery, {layout: 'slider'}), false)
  })

  it('there are no separate Grid 2 / Grid 3 / Grid 4 presets any more', () => {
    for (const config of configs) {
      assert.ok(!config.presets.some((p) => /^grid\d$/.test(p.id)), config.sectionType)
    }
  })
})
