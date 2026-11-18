import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {evaluate, parse} from 'groq-js'
import {
  buildStructure,
  LANDING_PAGES_WITH_POSTS,
  POSTS_OF_LANDING_PAGE,
  SIDEBAR,
  VEHICLE_VIEWS,
} from './structure'
import {SINGLETON_PAGES} from '../singletonPages'

// Run with: npm run test:usability

/** A stand-in for Sanity's structure builder that records what was asked for. */
type Spec = Record<string, unknown> & {kind: string}
function builder(kind: string, init: Record<string, unknown> = {}) {
  const spec: Spec = {kind, ...init}
  const b: unknown = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === 'spec') return spec
        return (...args: unknown[]) => {
          spec[String(prop)] = args.length <= 1 ? args[0] : args
          return b
        }
      },
    },
  )
  return b as {spec: Spec}
}
const S = {
  list: () => builder('list'),
  listItem: () => builder('item'),
  divider: () => builder('divider'),
  document: () => builder('document'),
  documentTypeList: (type: string) => builder('typeList', {type}),
  documentList: () => builder('documentList'),
  component: () => builder('component'),
  initialValueTemplateItem: (id: string) => ({id}),
}
const context = {
  schema: {get: () => ({icon: () => null})},
  getClient: () => ({fetch: async () => []}),
}

const root = buildStructure(S as never, context as never) as unknown as {spec: Spec}
const items = (root.spec.items as {spec: Spec}[]).map((i) => i.spec)
const rows = items.filter((i) => i.kind === 'item')
const dividers = items.filter((i) => i.kind === 'divider')

describe('the sidebar', () => {
  it('is grouped by task, with a heading for each group', () => {
    assert.deepEqual(
      items.map((i) => i.title),
      [
        'Pages',
        'Pages',
        'Landing Pages',
        'Create',
        'New page from a template',
        'Content',
        'Blog Posts',
        'Educational Articles',
        'Categories',
        'Vehicles',
        'Vehicles',
        'Library',
        'Page Templates',
        'Settings',
        'Site Settings',
        'Navigation',
        'Redirects',
      ],
    )
    assert.equal(dividers.length, 6)
  })

  it('every entry has an icon and a unique id', () => {
    for (const row of rows) assert.ok(row.icon, `${row.title} has no icon`)
    const ids = rows.map((r) => r.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('uses plain names (no "Listing", no "New Template Page")', () => {
    const titles = rows.map((r) => String(r.title))
    assert.ok(!titles.includes('Vehicle Listing'))
    assert.ok(!titles.includes('New Template Page'))
    assert.ok(titles.includes('Vehicles') && titles.includes('New page from a template'))
  })

  it('keeps the Pages entry id, so existing links like /studio/structure/pages;homePage still work', () => {
    assert.equal(rows.find((r) => r.title === SIDEBAR.pages)?.id, 'pages')
  })

  it('Pages lists the nine fixed pages, in the same order as before', () => {
    const pages = rows.find((r) => r.title === 'Pages')!
    const child = (pages.child as {spec: Spec}).spec
    const titles = (child.items as {spec: Spec}[]).map((i) => i.spec.title)
    assert.deepEqual(
      titles,
      SINGLETON_PAGES.map((p) => p.title),
    )
  })

  it('Landing Pages keeps its list (so the "+" works) and its create templates', () => {
    const child = (rows.find((r) => r.title === 'Landing Pages')!.child as {spec: Spec}).spec
    assert.equal(child.kind, 'typeList')
    assert.equal(child.type, 'customPage')
    assert.ok(Array.isArray(child.initialValueTemplates))
  })

  it('every kind of content that was reachable before still is', () => {
    const reachable = new Set<string>()
    const walk = (spec: Spec) => {
      if (spec.kind === 'typeList') reachable.add(String(spec.type))
      if (spec.kind === 'documentList') reachable.add(String(spec.schemaType))
      if (spec.kind === 'document') reachable.add(String(spec.schemaType))
      // A page that is opened by looking its document up when clicked (the fixed pages) has a function here.
      const raw = spec.child as {spec?: Spec} | (() => {spec?: Spec}) | undefined
      // A child may be a builder, or a function that makes one (the vehicle views and the fixed pages are looked up on click).
      const child = typeof raw === 'function' ? (raw as () => {spec?: Spec})() : raw
      if (spec.kind === 'item' && child?.spec) walk(child.spec)
      if (Array.isArray(spec.items)) for (const i of spec.items as {spec: Spec}[]) walk(i.spec)
    }
    for (const row of rows) walk(row)
    for (const type of [
      'customPage',
      'blogPost',
      'educationalArticle',
      'category',
      'vehicle',
      'pageTemplate',
      'redirect',
      'siteSettings',
      'navigationSettings',
    ]) {
      assert.ok(reachable.has(type), `${type} is no longer reachable from the sidebar`)
    }
  })

  it('the template picker is still there', () => {
    const picker = rows.find((r) => r.title === SIDEBAR.newFromTemplate)!
    assert.equal((picker.child as {spec: Spec}).spec.kind, 'component')
  })
})

/** Runs a GROQ filter over sample documents, the way the Studio's lists do. */
async function ids(
  filter: string,
  dataset: Record<string, unknown>[],
  params: Record<string, unknown> = {},
) {
  const result = await (await evaluate(parse(`*[${filter}]._id`), {dataset, params})).get()
  return (result as string[]).sort()
}

describe('the Vehicles list has useful views', () => {
  const vehicles = [
    {_id: 'on', _type: 'vehicle', isAvailable: true},
    {_id: 'unset', _type: 'vehicle'}, // never switched off, so it is available (as on the website)
    {_id: 'off', _type: 'vehicle', isAvailable: false},
    {_id: 'star', _type: 'vehicle', isAvailable: true, isFeatured: true},
    {_id: 'page', _type: 'customPage'},
  ]
  const view = (id: string) => VEHICLE_VIEWS.find((v) => v.id === id)!

  it('lists five views, in a sensible order', () => {
    assert.deepEqual(
      VEHICLE_VIEWS.map((v) => v.title),
      ['All vehicles', 'Available', 'Not available', 'Featured', 'Recently added'],
    )
  })
  it('All vehicles = every vehicle and nothing else', async () => {
    assert.deepEqual(await ids(view('vehicles-all').filter, vehicles), [
      'off',
      'on',
      'star',
      'unset',
    ])
  })
  it('Available includes a vehicle whose switch was never set (the website does the same)', async () => {
    assert.deepEqual(await ids(view('vehicles-available').filter, vehicles), [
      'on',
      'star',
      'unset',
    ])
  })
  it('Not available = only those switched off', async () => {
    assert.deepEqual(await ids(view('vehicles-unavailable').filter, vehicles), ['off'])
  })
  it('Available and Not available never overlap, and together are all vehicles', async () => {
    const a = await ids(view('vehicles-available').filter, vehicles)
    const b = await ids(view('vehicles-unavailable').filter, vehicles)
    assert.equal(a.filter((x) => b.includes(x)).length, 0)
    assert.deepEqual([...a, ...b].sort(), await ids(view('vehicles-all').filter, vehicles))
  })
  it('Featured = only featured vehicles', async () => {
    assert.deepEqual(await ids(view('vehicles-featured').filter, vehicles), ['star'])
  })
  it('only "Recently added" is newest-first', () => {
    assert.deepEqual(
      VEHICLE_VIEWS.filter((v) => v.newest).map((v) => v.id),
      ['vehicles-recent'],
    )
  })
  it('the sidebar builds one list item per view, each with an icon', () => {
    const vehiclesRow = rows.find((r) => r.id === 'vehicles')!
    const list = (vehiclesRow.child as {spec: Spec}).spec
    const listItems = (list.items as {spec: Spec}[]).map((i) => i.spec)
    assert.deepEqual(
      listItems.map((i) => i.title),
      VEHICLE_VIEWS.map((v) => v.title),
    )
    for (const item of listItems) assert.ok(item.icon)
  })
})

describe('Blog Posts can be browsed by landing page', () => {
  const data = [
    {_id: 'L1', _type: 'customPage'},
    {_id: 'L2', _type: 'customPage'}, // no posts
    {_id: 'L3', _type: 'customPage'},
    {_id: 'p1', _type: 'blogPost', landingPage: {_ref: 'L1'}},
    {_id: 'p2', _type: 'blogPost', landingPage: {_ref: 'L1'}},
    {_id: 'p3', _type: 'blogPost', landingPage: {_ref: 'L3'}},
  ]
  it('step 1 lists only the landing pages that have posts', async () => {
    assert.deepEqual(await ids(LANDING_PAGES_WITH_POSTS, data), ['L1', 'L3'])
  })
  it('step 2 lists the posts of the chosen landing page only', async () => {
    assert.deepEqual(await ids(POSTS_OF_LANDING_PAGE, data, {id: 'L1'}), ['p1', 'p2'])
    assert.deepEqual(await ids(POSTS_OF_LANDING_PAGE, data, {id: 'L3'}), ['p3'])
    assert.deepEqual(await ids(POSTS_OF_LANDING_PAGE, data, {id: 'L2'}), [])
  })
  it('the sidebar offers "All posts" and "By landing page"', () => {
    const blog = rows.find((r) => r.id === 'blog-posts')!
    const titles = ((blog.child as {spec: Spec}).spec.items as {spec: Spec}[]).map(
      (i) => i.spec.title,
    )
    assert.deepEqual(titles, ['All posts', 'By landing page'])
  })
})
