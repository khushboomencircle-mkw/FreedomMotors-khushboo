import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {buildImagesConfig, sanityRemotePattern, supabaseRemotePattern} from './imageConfig'
import {ogImageUrl, resolveImageSrc, sanityImageDimensions, storagePublicUrl} from './imageUrl'
import {testEnv} from './testEnv'

// Run with: npm run test:images
const VEHICLE = '3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b'
const PATH = `vehicles/${VEHICLE}/${'ab'.repeat(32)}.jpg`

// Every project setting below comes from the real environment (.env.local) — nothing is hard-coded here.
const PROJECT_ID = testEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
const DATASET = testEnv('NEXT_PUBLIC_SANITY_DATASET')
const SUPABASE_URL = testEnv('SUPABASE_URL')
const BUCKET = testEnv('SUPABASE_STORAGE_BUCKET')
const SUPABASE_ORIGIN = new URL(SUPABASE_URL).origin
const SANITY_CDN_BASE = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}`
const SUPABASE = {baseUrl: SUPABASE_URL, bucket: BUCKET}
// Stands in for a developer's LOCAL Supabase stack. It is deliberately not a configured value: the point of the
// tests that use it is that a loopback address differs from the configured (cloud) one.
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

describe('storagePublicUrl', () => {
  it('builds the public object URL from the stored path', () => {
    assert.equal(
      storagePublicUrl(PATH, SUPABASE),
      `${SUPABASE_ORIGIN}/storage/v1/object/public/${BUCKET}/${PATH}`,
    )
  })
  it('ignores a path in the base URL (origin only)', () => {
    assert.ok(
      storagePublicUrl(PATH, {
        ...SUPABASE,
        baseUrl: `${SUPABASE_ORIGIN}/rest/v1/`,
      })!.startsWith(`${SUPABASE_ORIGIN}/storage/`),
    )
  })
  it('returns nothing for a malformed path or no configured host', () => {
    assert.equal(storagePublicUrl('vehicles/../../etc/passwd', SUPABASE), undefined)
    assert.equal(storagePublicUrl(PATH, {baseUrl: 'not a url'}), undefined)
  })
})

describe('resolveImageSrc', () => {
  it('passes Sanity URLs and local paths through, builds storage paths, rejects the rest', () => {
    const sanity = `${SANITY_CDN_BASE}/abc-100x100.jpg`
    assert.equal(resolveImageSrc(sanity), sanity)
    assert.equal(resolveImageSrc('/images/no-image.jpg'), '/images/no-image.jpg')
    assert.equal(resolveImageSrc(PATH, SUPABASE), storagePublicUrl(PATH, SUPABASE))
    for (const bad of [
      undefined,
      null,
      '',
      '  ',
      'javascript:alert(1)',
      '//evil.test/a.jpg',
      'data:image/png;base64,AAAA',
      'random/relative.jpg',
    ]) {
      assert.equal(
        resolveImageSrc(bad as string | null | undefined, SUPABASE),
        undefined,
        String(bad),
      )
    }
  })
})

describe('sanityImageDimensions / ogImageUrl', () => {
  it('reads the size from the file name', () => {
    assert.deepEqual(sanityImageDimensions(`${SANITY_CDN_BASE}/9f8e-2925x2194.jpg`), {
      width: 2925,
      height: 2194,
    })
    assert.equal(sanityImageDimensions('https://example.com/a-10x10.jpg'), undefined)
    assert.equal(sanityImageDimensions(`${SANITY_CDN_BASE}/no-size.jpg`), undefined)
  })
  it('OG images are absolute, capped to 1200px wide, and never go through the optimizer', () => {
    const og = ogImageUrl(`${SANITY_CDN_BASE}/9f8e-2925x2194.jpg`)
    assert.equal(og, `${SANITY_CDN_BASE}/9f8e-2925x2194.jpg?w=1200&fit=max`)
    assert.ok(og.startsWith('https://'))
    assert.ok(!og.includes('/_next/image'))
    assert.equal(ogImageUrl('https://other.test/a.jpg'), 'https://other.test/a.jpg')
  })
})

// The Sanity project and dataset have no built-in defaults, so every config built here is given them.
const SANITY_ENV = {NEXT_PUBLIC_SANITY_PROJECT_ID: PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET: DATASET}
// Likewise the Supabase bucket name has no default: it comes from SUPABASE_STORAGE_BUCKET.
const BUCKET_ENV = {SUPABASE_STORAGE_BUCKET: BUCKET}

describe('images config', () => {
  it('allows only this Sanity project/dataset and the one public Supabase bucket', () => {
    const cfg = buildImagesConfig({
      SUPABASE_URL,
      ...BUCKET_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: PROJECT_ID,
      NEXT_PUBLIC_SANITY_DATASET: DATASET,
    })
    assert.deepEqual(cfg.remotePatterns, [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: `/images/${PROJECT_ID}/${DATASET}/**`,
        search: '',
      },
      {
        protocol: 'https',
        hostname: new URL(SUPABASE_URL).hostname,
        port: new URL(SUPABASE_URL).port,
        pathname: `/storage/v1/object/public/${BUCKET}/**`,
        search: '',
      },
    ])
  })
  it('allows no Supabase host until SUPABASE_URL is set, and never the old website', () => {
    const cfg = buildImagesConfig(SANITY_ENV)
    assert.equal(cfg.remotePatterns?.length, 1)
    assert.ok(!JSON.stringify(cfg).includes('freedommotors.com'))
    assert.equal(supabaseRemotePattern({}), null)
    assert.equal(sanityRemotePattern(SANITY_ENV).pathname, `/images/${PROJECT_ID}/${DATASET}/**`)
  })
  it('has no fallback bucket: Supabase without SUPABASE_STORAGE_BUCKET is an error, and a bucket alone allows nothing', () => {
    assert.throws(() => supabaseRemotePattern({SUPABASE_URL}), /SUPABASE_STORAGE_BUCKET/)
    assert.equal(supabaseRemotePattern(BUCKET_ENV), null)
    assert.equal(storagePublicUrl(PATH, {baseUrl: SUPABASE_URL}), undefined)
  })
  it('has no fallback Sanity project or dataset: a missing variable is an error', () => {
    assert.throws(() => sanityRemotePattern({}), /NEXT_PUBLIC_SANITY_PROJECT_ID/)
    assert.throws(
      () => sanityRemotePattern({NEXT_PUBLIC_SANITY_PROJECT_ID: PROJECT_ID}),
      /NEXT_PUBLIC_SANITY_DATASET/,
    )
  })
  it('keeps the safety switches closed', () => {
    const cfg = buildImagesConfig({
      ...SANITY_ENV,
      ...BUCKET_ENV,
      SUPABASE_URL,
    })
    assert.equal(cfg.dangerouslyAllowSVG, false)
    assert.equal(cfg.dangerouslyAllowLocalIP, false)
    assert.equal(cfg.maximumRedirects, 0)
    assert.deepEqual(cfg.localPatterns, [{pathname: '/images/**', search: ''}])
  })
  it('allows a private IP only for a local Supabase stack, and never on Vercel', () => {
    assert.equal(
      buildImagesConfig({...SANITY_ENV, ...BUCKET_ENV, SUPABASE_URL: LOCAL_SUPABASE_URL})
        .dangerouslyAllowLocalIP,
      true,
    )
    assert.equal(
      buildImagesConfig({
        ...SANITY_ENV,
        ...BUCKET_ENV,
        SUPABASE_URL: LOCAL_SUPABASE_URL,
        VERCEL: '1',
      }).dangerouslyAllowLocalIP,
      false,
    )
    assert.equal(
      buildImagesConfig({...SANITY_ENV, ...BUCKET_ENV, SUPABASE_URL}).dangerouslyAllowLocalIP,
      false,
    )
  })
})
