import '../layoutPresets/domSetup' // the Studio config expects a browser-like page; must load first
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {describe, it} from 'node:test'
import config from '../../sanity.config'
import {OpenInPreviewAction} from './OpenInPreviewAction'
import {
  FIXED_PAGE_ROUTES,
  cleanSlug,
  isPreviewable,
  previewPathFor,
  previewToolUrl,
} from './previewPaths'
import {SINGLETON_PAGES} from '../singletonPages'

// Run with: npm run test:usability

describe('where each kind of document lives on the site', () => {
  it('every fixed page has an address, matching the real routes', () => {
    for (const {type} of SINGLETON_PAGES) assert.ok(FIXED_PAGE_ROUTES[type], type)
    assert.equal(previewPathFor('homePage', undefined), '/')
    assert.equal(previewPathFor('commercialPage', undefined), '/commercial')
    assert.equal(previewPathFor('driver', undefined), '/drivers')
    assert.equal(previewPathFor('convertVehicle2Page', undefined), '/convert-your-vehicle')
  })

  it('agrees with the Presentation tool (one source of truth for the addresses)', () => {
    const presentation = fs.readFileSync('studio/presentation.ts', 'utf8')
    for (const [type, route] of Object.entries(FIXED_PAGE_ROUTES)) {
      assert.ok(
        new RegExp(`${type}:\\s*singleton\\('${route}'\\)`).test(presentation),
        `${type} → ${route} is different in presentation.ts`,
      )
    }
  })

  it('Landing Pages, articles, vehicles and categories come from their slug', () => {
    const doc = {slug: {current: 'spring-sale'}}
    assert.equal(previewPathFor('customPage', doc), '/spring-sale')
    assert.equal(previewPathFor('educationalArticle', doc), '/educational/spring-sale')
    assert.equal(previewPathFor('vehicle', doc), '/vehicles/spring-sale')
    assert.equal(previewPathFor('category', doc), '/category/spring-sale')
  })

  it('stray slashes in older slugs never reach the address', () => {
    assert.equal(previewPathFor('customPage', {slug: {current: '/spring-sale/'}}), '/spring-sale')
    assert.equal(cleanSlug('//a//'), 'a')
    assert.equal(cleanSlug(undefined), '')
  })

  it('a blog post lives under its landing page', () => {
    assert.equal(
      previewPathFor('blogPost', {slug: {current: 'testing-1212'}}, 'services'),
      '/services/testing-1212',
    )
    assert.equal(
      previewPathFor('blogPost', {slug: {current: '/testing-1212/'}}, '/services/'),
      '/services/testing-1212',
    )
  })

  it('no slug, or a blog post with no landing page, means "no address yet" (never a broken link)', () => {
    assert.equal(previewPathFor('customPage', {}), undefined)
    assert.equal(previewPathFor('customPage', {slug: {current: ''}}), undefined)
    assert.equal(previewPathFor('blogPost', {slug: {current: 'x'}}), undefined)
    assert.equal(previewPathFor('somethingElse', {slug: {current: 'x'}}), undefined)
  })

  it('opens the Presentation tool with the path encoded', () => {
    assert.equal(
      previewToolUrl('/studio', '/services/a b'),
      '/studio/preview?preview=%2Fservices%2Fa%20b',
    )
  })

  it('only page-like documents are previewable', () => {
    for (const t of [
      'homePage',
      'customPage',
      'blogPost',
      'vehicle',
      'category',
      'educationalArticle',
    ]) {
      assert.equal(isPreviewable(t), true, t)
    }
    for (const t of ['siteSettings', 'navigationSettings', 'redirect', 'pageTemplate', undefined]) {
      assert.equal(isPreviewable(t as string | undefined), false, String(t))
    }
  })
})

describe('the real Studio configuration', () => {
  const actions = (
    config as unknown as {
      document: {actions: (prev: unknown[], c: {schemaType: string}) => unknown[]}
    }
  ).document.actions
  const prev = [{action: 'publish'}]

  it('page-like documents get "Preview on site" as their last action', () => {
    for (const schemaType of [
      'homePage',
      'commercialPage',
      'customPage',
      'blogPost',
      'vehicle',
      'category',
    ]) {
      const list = actions(prev, {schemaType})
      assert.equal(list[list.length - 1], OpenInPreviewAction, schemaType)
    }
  })

  it('other documents do not', () => {
    for (const schemaType of ['siteSettings', 'navigationSettings', 'redirect', 'pageTemplate']) {
      assert.ok(!actions(prev, {schemaType}).includes(OpenInPreviewAction), schemaType)
    }
  })
})

describe('developer tools stay available', () => {
  it('the Vision (inspect / query) tool is still in the Studio, and the standard document Inspect action is untouched', () => {
    const names = (config as unknown as {plugins: {name?: string}[]}).plugins.map((p) =>
      String(p.name),
    )
    assert.ok(
      names.some((n) => /vision/i.test(n)),
      `plugins: ${names.join(', ')}`,
    )
    // No action filter in the Studio config removes "inspect"
    const source = fs.readFileSync('sanity.config.ts', 'utf8')
    assert.ok(source.includes('visionTool()'))
    assert.ok(!/['"]inspect['"]/.test(source))
  })
})
