import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
  activePresetId,
  changesFor,
  effectiveValues,
  LAYOUT_PRESETS,
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
    assert.equal(activePresetId(LAYOUT_PRESETS.cardsGridSection, {}), 'grid3')
    assert.equal(activePresetId(LAYOUT_PRESETS.featureGridSection, {}), 'grid3')
    assert.equal(activePresetId(LAYOUT_PRESETS.photoGallerySection, {}), 'grid3')
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
  it('Grid 4 from a slider resets to rows', () => {
    const changes = changesFor(cards, preset('grid4'), {
      columns: '1',
      oneColumnDisplayMode: 'slider',
    })
    assert.deepEqual(changes, {columns: '4'})
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
