import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {applyLayoutPickers, withLayoutPicker} from './index'
import {LAYOUT_PRESETS} from './presets'
import {sectionObjectTypes} from '../schemaTypes/sections'

// Run with: npm run test:layouts
// The strict rule for this feature: no existing section may change. These tests prove it — the only difference is
// one extra display-only field at the top of the Layout tab, and every other field is the very same object.

type TypeLike = {name: string; fields?: {name?: string; group?: string}[]}
const before = sectionObjectTypes as unknown as TypeLike[]
const after = applyLayoutPickers(before)

describe('the picker is purely additive', () => {
  it('registers the same section types in the same order', () => {
    assert.deepEqual(
      after.map((t) => t.name),
      before.map((t) => t.name),
    )
  })

  for (const type of before) {
    const wrapped = after.find((t) => t.name === type.name)!

    if (LAYOUT_PRESETS[type.name]) {
      it(`${type.name}: gets one picker field first, every other field untouched`, () => {
        const fields = wrapped.fields ?? []
        const hidden = new Set(LAYOUT_PRESETS[type.name].hideFields ?? [])
        assert.equal(fields.length, (type.fields ?? []).length + 1)
        assert.equal(fields[0].name, 'layoutPreset')
        assert.equal(fields[0].group, 'layout')
        fields.slice(1).forEach((field, i) => {
          const original = (type.fields ?? [])[i]
          if (hidden.has(original.name ?? '')) return // checked in its own test below
          // Every other field is the very same object, in the same order — nothing rewritten.
          assert.equal(field, original)
        })
      })

      it(`${type.name}: the original type object is not modified`, () => {
        assert.ok(!(type.fields ?? []).some((f) => f.name === 'layoutPreset'))
      })
    } else {
      it(`${type.name}: has no presets, so it is returned exactly as it was`, () => {
        assert.equal(wrapped, type)
      })
    }
  }

  it('Link List: the Image Side field is hidden in the Studio but still in the schema, with all its settings', () => {
    const original = before
      .find((t) => t.name === 'linkListSection')!
      .fields!.find((f) => f.name === 'imageSide') as Record<string, unknown>
    const wrapped = after
      .find((t) => t.name === 'linkListSection')!
      .fields!.find((f) => f.name === 'imageSide') as Record<string, unknown>
    assert.ok(wrapped, 'the field is still there, so its stored value keeps working')
    assert.equal(wrapped.hidden, true)
    // Same name, type, options, default and group — the only difference is `hidden`.
    assert.deepEqual({...wrapped, hidden: undefined}, {...original, hidden: undefined})
    assert.equal(original.hidden, undefined, 'the original definition is not modified')
  })

  it('the only fields newly hidden are the ones listed in hideFields (Link List: Image Side)', () => {
    const hiddenNames = (t: TypeLike) =>
      (t.fields ?? []).filter((f) => (f as {hidden?: unknown}).hidden === true).map((f) => f.name)
    for (const original of before) {
      const wrapped = after.find((t) => t.name === original.name)!
      const added = hiddenNames(wrapped).filter((name) => !hiddenNames(original).includes(name))
      assert.deepEqual(added, LAYOUT_PRESETS[original.name]?.hideFields ?? [], original.name)
    }
  })

  it('is safe to apply twice', () => {
    const once = applyLayoutPickers(before)
    const twice = applyLayoutPickers(once)
    twice.forEach((t, i) => assert.equal(t.fields?.length, once[i].fields?.length))
  })

  it('only the five sections with presets are affected', () => {
    const changed = after.filter((t, i) => t !== before[i]).map((t) => t.name)
    assert.deepEqual(changed.sort(), Object.keys(LAYOUT_PRESETS).sort())
  })

  it('withLayoutPicker leaves an unknown type alone', () => {
    const other = {name: 'somethingElse', fields: []}
    assert.equal(withLayoutPicker(other), other)
  })
})
