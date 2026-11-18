import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {dataSanity, itemPath, sanityDocOf, sectionPath} from './sanityDoc'

// Run with: npm run test:preview

describe('sanityDocOf — markers exist only in preview', () => {
  it('returns the document in preview', () => {
    assert.deepEqual(sanityDocOf({_id: 'homePage', _type: 'homePage', preview: true}), {
      id: 'homePage',
      type: 'homePage',
    })
  })
  it('returns nothing on the live site (preview false or missing)', () => {
    assert.equal(sanityDocOf({_id: 'homePage', _type: 'homePage', preview: false}), undefined)
    assert.equal(sanityDocOf({_id: 'homePage', _type: 'homePage'}), undefined)
  })
  it('returns nothing without an id/type, or for a missing page', () => {
    assert.equal(sanityDocOf({preview: true, _type: 'x'}), undefined)
    assert.equal(sanityDocOf({preview: true, _id: 'x'}), undefined)
    assert.equal(sanityDocOf(null), undefined)
    assert.equal(sanityDocOf(undefined), undefined)
  })
})

describe('paths use keys, never positions', () => {
  it('addresses a section by _key', () => {
    assert.equal(sectionPath('abc123'), 'sections[_key=="abc123"]')
  })
  it('addresses a field and an array item inside a section', () => {
    assert.equal(sectionPath('abc', 'heading'), 'sections[_key=="abc"].heading')
    assert.equal(itemPath('abc', 'cards', 'c1'), 'sections[_key=="abc"].cards[_key=="c1"]')
  })
  it('strips anything that could break out of the path string', () => {
    assert.equal(sectionPath('a"]; drop'), 'sections[_key=="adrop"]')
    assert.equal(itemPath('a', 'cards', 'x"]'), 'sections[_key=="a"].cards[_key=="x"]')
  })
})

describe('dataSanity', () => {
  const doc = {id: 'homePage', type: 'homePage'}
  it('is empty outside preview, so it is always safe to spread', () => {
    assert.deepEqual(dataSanity(undefined, sectionPath('a')), {})
    assert.deepEqual(dataSanity(doc, undefined), {})
  })
  it('builds a marker that names the document, type and path', () => {
    const attr = dataSanity(doc, sectionPath('abc'))['data-sanity']
    assert.ok(attr, 'marker present')
    assert.ok(attr.includes('id=homePage'), attr)
    assert.ok(attr.includes('type=homePage'), attr)
    // Sanity writes a keyed array item as `sections:<key>` in the attribute.
    assert.ok(attr.includes('path=sections:abc'), attr)
  })
  it('points at a field or item inside the section', () => {
    const field = dataSanity(doc, sectionPath('abc', 'heading'))['data-sanity']
    assert.ok(field?.includes('path=sections:abc.heading'), field)
    const item = dataSanity(doc, itemPath('abc', 'cards', 'c1'))['data-sanity']
    assert.ok(item?.includes('path=sections:abc.cards:c1'), item)
  })
})
