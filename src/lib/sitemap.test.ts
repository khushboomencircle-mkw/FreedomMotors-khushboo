import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {buildSitemapEntries, FIXED_PAGE_PATHS, type SitemapSource} from './sitemapEntries'
import {getSiteUrl, isLiveSite} from './siteUrl'

// Run with: npm run test:seo
// sitemap.xml lists exactly what visitors can open and search engines should index; robots.txt and the site address
// depend on whether this is the live site.

const SITE = 'https://example.com'
const empty: SitemapSource = {
  fixedPages: [],
  customPages: [],
  vehicles: [],
  educationalArticles: [],
  categories: [],
  blogPosts: [],
}
const urls = (source: Partial<SitemapSource>) =>
  buildSitemapEntries({...empty, ...source}, SITE).map((e) => e.url)

describe('sitemap: which pages are listed', () => {
  it('lists each fixed page at the address the website uses, home first', () => {
    const fixedPages = Object.keys(FIXED_PAGE_PATHS)
      .reverse()
      .map((type) => ({type}))
    assert.deepEqual(urls({fixedPages}), [
      'https://example.com/',
      'https://example.com/vehicles',
      'https://example.com/drivers',
      'https://example.com/commercial',
      'https://example.com/convert-your-vehicle',
      'https://example.com/educational',
      'https://example.com/our-story',
      'https://example.com/contact',
    ])
  })

  it('does not list a fixed page that has no document, or a document type that is not a page', () => {
    assert.deepEqual(urls({fixedPages: [{type: 'contactPage'}, {type: 'somethingElse'}]}), [
      'https://example.com/contact',
    ])
  })

  it('lists custom pages, vehicles, articles, categories and blog posts at their own addresses', () => {
    assert.deepEqual(
      urls({
        customPages: [{slug: 'services'}],
        vehicles: [{slug: 'ford-transit'}],
        educationalArticles: [{slug: 'ramps-explained'}],
        categories: [{slug: 'guides'}],
        blogPosts: [{slug: 'first-post', landing: 'blog'}],
      }),
      [
        'https://example.com/services',
        'https://example.com/vehicles/ford-transit',
        'https://example.com/educational/ramps-explained',
        'https://example.com/category/guides',
        'https://example.com/blog/first-post',
      ],
    )
  })

  it('leaves out a page the editor marked "No index"', () => {
    assert.deepEqual(
      urls({
        fixedPages: [
          {type: 'contactPage', noIndex: true},
          {type: 'driver', noIndex: false},
        ],
        customPages: [{slug: 'hidden', noIndex: true}, {slug: 'shown'}],
      }),
      ['https://example.com/drivers', 'https://example.com/shown'],
    )
  })

  it('leaves out a page whose canonical address is somewhere else, keeps one that points at itself', () => {
    assert.deepEqual(
      urls({
        customPages: [
          {slug: 'copy', canonicalUrl: 'https://other.com/original'},
          {slug: 'self', canonicalUrl: 'https://example.com/self/'},
          {slug: 'plain', canonicalUrl: ''},
        ],
      }),
      ['https://example.com/self', 'https://example.com/plain'],
    )
  })

  it('treats www and no-www, and a trailing slash, as the same address (the real home page canonical)', () => {
    const fixedPages = [{type: 'homePage', canonicalUrl: 'https://www.freedommotors.com/'}]
    const entries = (site: string) =>
      buildSitemapEntries({...empty, fixedPages}, site).map((e) => e.url)
    assert.deepEqual(entries('https://www.freedommotors.com'), ['https://www.freedommotors.com/'])
    assert.deepEqual(entries('https://freedommotors.com'), ['https://freedommotors.com/'])
    // a staging or local address is a different site: the home page there points at the live one
    assert.deepEqual(entries('https://staging.example.com'), [])
  })

  it('reads a relative canonical against the page itself, and ignores one it cannot read', () => {
    assert.deepEqual(
      urls({
        customPages: [
          {slug: 'self', canonicalUrl: '/self'},
          {slug: 'moved', canonicalUrl: '/somewhere-else'},
          {slug: 'garbled', canonicalUrl: 'http://'},
        ],
      }),
      ['https://example.com/self', 'https://example.com/garbled'],
    )
  })

  it('uses a slug exactly as the page looks it up: a slug with a slash is not listed (real data: "finance-car-buying-tips/")', () => {
    assert.deepEqual(
      urls({
        educationalArticles: [
          {slug: 'finance-car-buying-tips/'},
          {slug: 'finance-car-buying-tips'},
        ],
        customPages: [{slug: '/about'}],
      }),
      ['https://example.com/educational/finance-car-buying-tips'],
    )
  })

  it('cannot list a document with no usable slug, or a blog post with no landing page', () => {
    assert.deepEqual(
      urls({
        customPages: [{slug: ''}, {slug: null}, {slug: '/'}, {}],
        blogPosts: [
          {slug: 'orphan', landing: null},
          {slug: '', landing: 'blog'},
        ],
      }),
      [],
    )
  })

  it('tidies stray slashes for blog posts, as the site does, and encodes special characters', () => {
    assert.deepEqual(
      urls({
        blogPosts: [{slug: '/my-post', landing: '/blog/'}],
        vehicles: [{slug: 'van & more'}],
      }),
      ['https://example.com/vehicles/van%20%26%20more', 'https://example.com/blog/my-post'],
    )
  })

  it('lists an address once, even if two documents give the same one', () => {
    assert.deepEqual(urls({customPages: [{slug: 'a'}, {slug: 'a'}]}), ['https://example.com/a'])
  })

  it('never lists the editing screen, the API or the temporary image-check page', () => {
    const all = urls({
      fixedPages: Object.keys(FIXED_PAGE_PATHS).map((type) => ({type})),
      customPages: [{slug: 'services'}],
    })
    assert.ok(all.every((u) => !/\/(studio|api|zz-image-check)/.test(u)))
  })

  it('accepts a site address with a trailing slash', () => {
    assert.equal(
      buildSitemapEntries({...empty, customPages: [{slug: 'a'}]}, 'https://example.com/')[0].url,
      'https://example.com/a',
    )
  })
})

describe('sitemap: last changed date', () => {
  it('passes on a real date and drops one that is not', () => {
    const entries = buildSitemapEntries(
      {
        ...empty,
        customPages: [
          {slug: 'a', updatedAt: '2026-01-02T03:04:05Z'},
          {slug: 'b', updatedAt: 'not a date'},
          {slug: 'c'},
        ],
      },
      SITE,
    )
    assert.deepEqual(entries, [
      {url: 'https://example.com/a', lastModified: '2026-01-02T03:04:05Z'},
      {url: 'https://example.com/b'},
      {url: 'https://example.com/c'},
    ])
  })
})

describe('site address', () => {
  it('uses NEXT_PUBLIC_SITE_URL first, tidied (protocol added, trailing slash removed)', () => {
    assert.equal(
      getSiteUrl({NEXT_PUBLIC_SITE_URL: 'https://shop.example.com/'}),
      'https://shop.example.com',
    )
    assert.equal(getSiteUrl({NEXT_PUBLIC_SITE_URL: 'shop.example.com'}), 'https://shop.example.com')
    assert.equal(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://a.com',
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'b.vercel.app',
      }),
      'https://a.com',
    )
  })

  it('falls back to the Vercel production domain, or the deployment address for staging and previews', () => {
    assert.equal(
      getSiteUrl({
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'live.example.com',
        VERCEL_URL: 'x.vercel.app',
      }),
      'https://live.example.com',
    )
    assert.equal(
      getSiteUrl({
        VERCEL_ENV: 'preview',
        VERCEL_PROJECT_PRODUCTION_URL: 'live.example.com',
        VERCEL_URL: 'x-git-staging.vercel.app',
      }),
      'https://x-git-staging.vercel.app',
    )
  })

  it('is localhost when nothing is set, and ignores an empty value', () => {
    assert.equal(getSiteUrl({}), 'http://localhost:3000')
    assert.equal(getSiteUrl({NEXT_PUBLIC_SITE_URL: '  '}), 'http://localhost:3000')
  })
})

describe('live site or not (decides robots.txt)', () => {
  it('on Vercel, only the production environment is live; staging and previews are not', () => {
    assert.equal(isLiveSite({VERCEL_ENV: 'production', NODE_ENV: 'production'}), true)
    assert.equal(isLiveSite({VERCEL_ENV: 'preview', NODE_ENV: 'production'}), false)
    assert.equal(isLiveSite({VERCEL_ENV: 'development', NODE_ENV: 'development'}), false)
  })

  it('off Vercel, a production build is live and a dev server is not', () => {
    assert.equal(isLiveSite({NODE_ENV: 'production'}), true)
    assert.equal(isLiveSite({NODE_ENV: 'development'}), false)
    assert.equal(isLiveSite({}), false)
  })
})
