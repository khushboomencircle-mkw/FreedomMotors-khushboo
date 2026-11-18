import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {pageTemplates} from '../pageTemplates'
import {legacyTemplateDocuments} from './legacyTemplateDocuments'

// Run with: npm run test:templates

const legacyValue = (id: string) => {
  const t = pageTemplates.find((x) => x.id === id)!
  return (t.value as () => {sections: {_type: string; sequence?: number}[]; seo?: unknown})()
}

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

describe('migrating the four original templates', () => {
  const docs = legacyTemplateDocuments()

  it('produces all four, with fixed ids and the right titles', () => {
    assert.deepEqual(
      docs.map((d) => [d._id, d.title]),
      [
        ['pageTemplate-blank', 'Blank'],
        ['pageTemplate-model-launch', 'Model Launch'],
        ['pageTemplate-campaign', 'Campaign'],
        ['pageTemplate-offer-promotion', 'Offer / Promotion'],
      ],
    )
    assert.ok(docs.every((d) => d._type === 'pageTemplate' && d.isActive === true))
    assert.ok(
      docs.every((d) => !d._id.includes('.')),
      'ids with a dot would be private documents',
    )
  })

  it("keeps each template's sections, in the same types and Display Order as before", () => {
    for (const id of ['blank', 'model-launch', 'campaign', 'offer-promotion']) {
      const migrated = docs.find((d) => d._id === `pageTemplate-${id}`)!
      const original = legacyValue(id)
      assert.deepEqual(
        migrated.sections.map((s) => [
          (s as {_type: string})._type,
          (s as {sequence?: number}).sequence,
        ]),
        original.sections.map((s) => [s._type, s.sequence]),
        id,
      )
    }
  })

  it('keeps the placeholder text, SEO and header/footer switches', () => {
    const campaign = docs.find((d) => d._id === 'pageTemplate-campaign')!
    assert.deepEqual(campaign.seo, {noIndex: true})
    assert.match(JSON.stringify(campaign.sections), /Replace with your campaign headline/)
    assert.ok(docs.every((d) => d.showHeader && d.showFooter))
    assert.equal(docs.find((d) => d._id === 'pageTemplate-blank')!.sections.length, 0)
    assert.equal(docs.find((d) => d._id === 'pageTemplate-model-launch')!.sections.length, 6)
    assert.equal(docs.find((d) => d._id === 'pageTemplate-offer-promotion')!.sections.length, 1)
  })

  it('every template has unique keys, and nothing page-specific leaked in', () => {
    for (const doc of docs) {
      const keys = allKeys(doc)
      assert.equal(new Set(keys).size, keys.length, doc._id)
      assert.ok(!('slug' in doc) && !JSON.stringify(doc).includes('customPage'), doc._id)
    }
  })

  it('gives every template a category and a description', () => {
    assert.ok(docs.every((d) => d.category && d.description))
  })
})
