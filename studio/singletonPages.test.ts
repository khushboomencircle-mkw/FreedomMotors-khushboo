import '../studio/layoutPresets/domSetup' // the Studio config expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import config from '../sanity.config'
import {
  isSingletonType,
  pickSingletonId,
  SINGLETON_PAGES,
  withoutSingletonActions,
  withoutSingletonCreateOptions,
} from './singletonPages'
import {schemaTypes} from './schemaTypes'

// Run with: npm run test:pages
// The fixed pages (Home, Commercial …) exist once each. Landing Pages can be created as often as you like.

const NINE = [
  'homePage',
  'vehiclesPage',
  'vehicleDetailPage',
  'convertVehicle2Page',
  'driver',
  'commercialPage',
  'ourStoryPage',
  'contactPage',
  'educationalPage',
]

describe('which pages are fixed', () => {
  it('exactly the nine fixed pages', () => {
    assert.deepEqual(SINGLETON_PAGES.map((p) => p.type).sort(), [...NINE].sort())
  })

  it('every one is a real document type in the schema', () => {
    const registered = new Map(
      (schemaTypes as unknown as {name: string; type: string}[]).map((t) => [t.name, t.type]),
    )
    for (const {type} of SINGLETON_PAGES) assert.equal(registered.get(type), 'document', type)
  })

  it('titles are unique, and unchanged from the sidebar before', () => {
    const titles = SINGLETON_PAGES.map((p) => p.title)
    assert.equal(new Set(titles).size, titles.length)
    assert.ok(titles.includes('Commercial Page') && titles.includes('Vehicle Page'))
  })

  it('Landing Pages, Blog Posts and everything else are NOT fixed (as many as you like)', () => {
    for (const type of [
      'customPage',
      'blogPost',
      'pageTemplate',
      'vehicle',
      'educationalArticle',
      'category',
      'redirect',
    ]) {
      assert.equal(isSingletonType(type), false, type)
    }
  })
})

describe('Duplicate and Delete', () => {
  const actions = [
    {action: 'publish'},
    {action: 'discardChanges'},
    {action: 'unpublish'},
    {action: 'duplicate'},
    {action: 'delete'},
    {action: 'restore'},
    {}, // an action without a name is kept
  ]
  const names = (list: {action?: string}[]) => list.map((a) => a.action)

  it('a fixed page loses Duplicate and Delete only', () => {
    for (const type of NINE) {
      assert.deepEqual(names(withoutSingletonActions(actions, type)), [
        'publish',
        'discardChanges',
        'unpublish',
        'restore',
        undefined,
      ])
    }
  })

  it('a Landing Page keeps every action', () => {
    assert.deepEqual(withoutSingletonActions(actions, 'customPage'), actions)
    assert.deepEqual(withoutSingletonActions(actions, 'blogPost'), actions)
  })
})

describe('the "+ New document" menus', () => {
  const options = [
    ...NINE.map((t) => ({templateId: t, schemaType: t, title: t})),
    {templateId: 'customPage-from-library', schemaType: 'customPage', title: 'Landing Page'},
    {templateId: 'blogPost', schemaType: 'blogPost', title: 'Blog Post'},
    {templateId: 'vehicle', schemaType: 'vehicle', title: 'Vehicle'},
  ]

  it('none of the nine fixed pages is offered', () => {
    const left = withoutSingletonCreateOptions(options).map((o) => o.templateId)
    for (const t of NINE) assert.ok(!left.includes(t), t)
  })

  it('Landing Page, Blog Post, Vehicle and the rest are still offered', () => {
    assert.deepEqual(
      withoutSingletonCreateOptions(options).map((o) => o.templateId),
      ['customPage-from-library', 'blogPost', 'vehicle'],
    )
  })

  it('a template for a fixed page is hidden even if only its template id names the type', () => {
    assert.deepEqual(withoutSingletonCreateOptions([{templateId: 'commercialPage'}]), [])
  })
})

describe('which document the sidebar opens', () => {
  it('the original page, not a stray copy made later', () => {
    const docs = [
      {_id: '51fdf1a7-new-copy', _createdAt: '2026-11-18T10:00:00Z'},
      {_id: '045a726d-original', _createdAt: '2026-11-02T05:13:00Z'},
    ]
    assert.equal(pickSingletonId(docs, 'commercialPage'), '045a726d-original')
  })

  it('a draft maps back to its published id', () => {
    assert.equal(
      pickSingletonId(
        [
          {_id: 'drafts.abc', _createdAt: '2026-01-01'},
          {_id: 'abc', _createdAt: '2026-01-01'},
        ],
        'driver',
      ),
      'abc',
    )
  })

  it('release versions are ignored', () => {
    assert.equal(
      pickSingletonId(
        [
          {_id: 'versions.rel.abc', _createdAt: '2020-01-01'},
          {_id: 'abc', _createdAt: '2026-01-01'},
        ],
        'driver',
      ),
      'abc',
    )
  })

  it('a page that does not exist yet opens with its type name as a stable id', () => {
    assert.equal(pickSingletonId([], 'homePage'), 'homePage')
  })
})

describe('the real Studio configuration', () => {
  const document = (config as unknown as {document: Record<string, (...a: never[]) => unknown>})
    .document

  it('removes Duplicate and Delete from a fixed page, keeps them for a Landing Page', () => {
    const prev = [
      {action: 'publish'},
      {action: 'duplicate'},
      {action: 'delete'},
      {action: 'unpublish'},
    ]
    const run = (schemaType: string) =>
      (
        document.actions as unknown as (
          p: unknown[],
          c: {schemaType: string},
        ) => {action?: string}[]
      )(prev, {schemaType}).map((a) => a.action)
    assert.deepEqual(run('commercialPage'), ['publish', 'unpublish'])
    assert.deepEqual(run('homePage'), ['publish', 'unpublish'])
    // Landing Pages keep Duplicate and Delete (as their own guarded versions) and Unpublish
    assert.equal(run('customPage').length, 4)
  })

  it('does not offer the fixed pages in a new-document menu', () => {
    const prev = [
      {templateId: 'commercialPage'},
      {templateId: 'homePage'},
      {templateId: 'customPage-from-library'},
      {templateId: 'blogPost'},
    ]
    const out = (
      document.newDocumentOptions as unknown as (p: unknown[]) => {templateId: string}[]
    )(prev)
    assert.deepEqual(
      out.map((o) => o.templateId),
      ['customPage-from-library', 'blogPost'],
    )
  })
})
