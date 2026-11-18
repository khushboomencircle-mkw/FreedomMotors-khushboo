import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {cloneWithFreshKeys} from './cloneWithFreshKeys'

// Run with: npm run test:templates

/** Every _key found anywhere in a value. */
function allKeys(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, found))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === '_key' && typeof v === 'string') found.push(v)
      else allKeys(v, found)
    }
  }
  return found
}

/** A section shaped like the real ones: nested items, a rich-text block with a link, a reference and an image. */
const sample = () => ({
  _id: 'pageTemplate-x',
  _rev: 'abc',
  _createdAt: '2026-01-01',
  _updatedAt: '2026-01-02',
  sections: [
    {
      _key: 'sec1',
      _type: 'featureGridSection',
      sequence: 2,
      features: [
        {
          _key: 'f1',
          _type: 'featureCardItem',
          title: 'One',
          description: [
            {
              _key: 'b1',
              _type: 'block',
              style: 'normal',
              markDefs: [
                {_key: 'link1', _type: 'link', href: 'https://example.com'},
                {_key: 'link2', _type: 'link', href: 'https://example.org'},
              ],
              children: [
                {_key: 's1', _type: 'span', text: 'plain ', marks: []},
                {_key: 's2', _type: 'span', text: 'bold link', marks: ['strong', 'link1']},
                {_key: 's3', _type: 'span', text: 'both', marks: ['em', 'link1', 'link2']},
              ],
            },
          ],
          image: {
            _type: 'photoWithAlt',
            alt: 'x',
            image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-abc-100x100-jpg'}},
          },
        },
        {_key: 'f2', _type: 'featureCardItem', title: 'Two'},
      ],
    },
    {
      _key: 'sec2',
      _type: 'vehicleCarouselSection',
      sequence: 1,
      vehicles: [{_key: 'v1', _type: 'reference', _ref: 'vehicle-1', _weak: true}],
      tags: ['a', 'b'],
    },
  ],
  seo: {noIndex: true},
})

describe('cloneWithFreshKeys', () => {
  it('gives every keyed object a new key, and all new keys are unique', () => {
    const before = allKeys(sample())
    const copy = cloneWithFreshKeys(sample())
    const after = allKeys(copy)
    assert.equal(after.length, before.length, 'no key lost or added')
    assert.equal(new Set(after).size, after.length, 'keys are unique across the whole copy')
    assert.ok(
      after.every((k) => !before.includes(k)),
      'no old key is reused',
    )
  })

  it('keeps rich-text links working: marks follow the new markDef keys', () => {
    const block = cloneWithFreshKeys(sample()).sections[0].features![0].description![0]
    const [link1, link2] = block.markDefs.map((d: {_key: string}) => d._key)
    assert.notEqual(link1, 'link1')
    assert.notEqual(link1, link2)
    const [, s2, s3] = block.children
    assert.deepEqual(s2.marks, ['strong', link1])
    assert.deepEqual(s3.marks, ['em', link1, link2])
    // Every key a span points at exists as a link definition.
    const defined = new Set(block.markDefs.map((d: {_key: string}) => d._key))
    for (const span of block.children) {
      for (const mark of span.marks)
        assert.ok(['strong', 'em'].includes(mark) || defined.has(mark), `dangling mark ${mark}`)
    }
  })

  it('leaves references, assets, text and the Display Order (sequence) untouched', () => {
    const copy = cloneWithFreshKeys(sample())
    assert.equal(copy.sections[0]?.features?.[0]?.image?.image.asset._ref, 'image-abc-100x100-jpg')
    assert.equal(copy.sections[1]?.vehicles?.[0]?._ref, 'vehicle-1')
    assert.equal(copy.sections[1]?.vehicles?.[0]?._weak, true)
    assert.equal(copy.sections[0].sequence, 2)
    assert.equal(copy.sections[1].sequence, 1)
    assert.deepEqual(copy.sections[1].tags, ['a', 'b'])
    assert.deepEqual(copy.seo, {noIndex: true})
    assert.equal(copy.sections[0].features![0].title, 'One')
  })

  it('keeps the section order of the array', () => {
    const copy = cloneWithFreshKeys(sample())
    assert.deepEqual(
      copy.sections.map((s: {_type: string}) => s._type),
      ['featureGridSection', 'vehicleCarouselSection'],
    )
  })

  it('drops document system fields from the root only', () => {
    const copy = cloneWithFreshKeys(sample()) as Record<string, unknown>
    for (const field of ['_id', '_rev', '_createdAt', '_updatedAt'])
      assert.ok(!(field in copy), field)
  })

  it('does not add keys to objects that had none', () => {
    const copy = cloneWithFreshKeys({
      seo: {noIndex: true},
      sections: [{_key: 'a', _type: 'x', config: {size: 1}}],
    })
    assert.ok(!('_key' in copy.seo))
    assert.ok(!('_key' in copy.sections[0].config))
  })

  it('never modifies its input', () => {
    const input = sample()
    const snapshot = JSON.stringify(input)
    cloneWithFreshKeys(input)
    assert.equal(JSON.stringify(input), snapshot)
  })

  it('two copies of the same template share no keys (independent pages)', () => {
    const a = allKeys(cloneWithFreshKeys(sample()))
    const b = allKeys(cloneWithFreshKeys(sample()))
    assert.equal(a.filter((k) => b.includes(k)).length, 0)
  })

  it('stays unique even if the key generator repeats itself', () => {
    let n = 0
    const stuttering = () => `k${Math.floor(n++ / 2)}` // k0,k0,k1,k1,...
    const after = allKeys(cloneWithFreshKeys(sample(), stuttering))
    assert.equal(new Set(after).size, after.length)
  })

  it('handles empty and odd values', () => {
    assert.deepEqual(cloneWithFreshKeys({sections: []}), {sections: []})
    assert.deepEqual(cloneWithFreshKeys({sections: undefined, x: null}), {
      sections: undefined,
      x: null,
    })
    assert.equal(cloneWithFreshKeys('text'), 'text')
  })
})
