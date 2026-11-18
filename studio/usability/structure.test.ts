import '../layoutPresets/domSetup' // the Studio code expects a browser-like page; must load first
import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {buildStructure, SIDEBAR} from './structure'
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
      if (spec.kind === 'document') reachable.add(String(spec.schemaType))
      // A page that is opened by looking its document up when clicked (the fixed pages) has a function here.
      const child = spec.child as {spec?: Spec} | undefined
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
