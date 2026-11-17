import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {buildImagesConfig, sanityRemotePattern, supabaseRemotePattern} from './imageConfig'
import {ogImageUrl, resolveImageSrc, sanityImageDimensions, storagePublicUrl} from './imageUrl'

// Run with: npm run test:images
const VEHICLE = '3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b'
const PATH = `vehicles/${VEHICLE}/${'ab'.repeat(32)}.jpg`
const SUPABASE = {baseUrl: 'https://abc.supabase.co', bucket: 'vehicle-photos'}

describe('storagePublicUrl', () => {
  it('builds the public object URL from the stored path', () => {
    assert.equal(
      storagePublicUrl(PATH, SUPABASE),
      `https://abc.supabase.co/storage/v1/object/public/vehicle-photos/${PATH}`,
    )
  })
  it('ignores a path in the base URL (origin only)', () => {
    assert.ok(
      storagePublicUrl(PATH, {
        ...SUPABASE,
        baseUrl: 'https://abc.supabase.co/rest/v1/',
      })!.startsWith('https://abc.supabase.co/storage/'),
    )
  })
  it('returns nothing for a malformed path or no configured host', () => {
    assert.equal(storagePublicUrl('vehicles/../../etc/passwd', SUPABASE), undefined)
    assert.equal(storagePublicUrl(PATH, {baseUrl: 'not a url'}), undefined)
  })
})

describe('resolveImageSrc', () => {
  it('passes Sanity URLs and local paths through, builds storage paths, rejects the rest', () => {
    const sanity = 'https://cdn.sanity.io/images/sp8bk444/production/abc-100x100.jpg'
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
    assert.deepEqual(sanityImageDimensions('https://cdn.sanity.io/images/p/d/9f8e-2925x2194.jpg'), {
      width: 2925,
      height: 2194,
    })
    assert.equal(sanityImageDimensions('https://example.com/a-10x10.jpg'), undefined)
    assert.equal(sanityImageDimensions('https://cdn.sanity.io/images/p/d/no-size.jpg'), undefined)
  })
  it('OG images are absolute, capped to 1200px wide, and never go through the optimizer', () => {
    const og = ogImageUrl('https://cdn.sanity.io/images/p/d/9f8e-2925x2194.jpg')
    assert.equal(og, 'https://cdn.sanity.io/images/p/d/9f8e-2925x2194.jpg?w=1200&fit=max')
    assert.ok(og.startsWith('https://'))
    assert.ok(!og.includes('/_next/image'))
    assert.equal(ogImageUrl('https://other.test/a.jpg'), 'https://other.test/a.jpg')
  })
})

describe('images config', () => {
  it('allows only this Sanity project/dataset and the one public Supabase bucket', () => {
    const cfg = buildImagesConfig({
      SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj',
      NEXT_PUBLIC_SANITY_DATASET: 'ds',
    })
    assert.deepEqual(cfg.remotePatterns, [
      {protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/proj/ds/**', search: ''},
      {
        protocol: 'https',
        hostname: 'abc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/vehicle-photos/**',
        search: '',
      },
    ])
  })
  it('allows no Supabase host until SUPABASE_URL is set, and never the old website', () => {
    const cfg = buildImagesConfig({})
    assert.equal(cfg.remotePatterns?.length, 1)
    assert.ok(!JSON.stringify(cfg).includes('freedommotors.com'))
    assert.equal(supabaseRemotePattern({}), null)
    assert.equal(sanityRemotePattern({}).pathname, '/images/sp8bk444/production/**')
  })
  it('keeps the safety switches closed', () => {
    const cfg = buildImagesConfig({SUPABASE_URL: 'https://abc.supabase.co'})
    assert.equal(cfg.dangerouslyAllowSVG, false)
    assert.equal(cfg.dangerouslyAllowLocalIP, false)
    assert.equal(cfg.maximumRedirects, 0)
    assert.deepEqual(cfg.localPatterns, [{pathname: '/images/**', search: ''}])
  })
  it('allows a private IP only for a local Supabase stack, and never on Vercel', () => {
    assert.equal(
      buildImagesConfig({SUPABASE_URL: 'http://127.0.0.1:54321'}).dangerouslyAllowLocalIP,
      true,
    )
    assert.equal(
      buildImagesConfig({SUPABASE_URL: 'http://127.0.0.1:54321', VERCEL: '1'})
        .dangerouslyAllowLocalIP,
      false,
    )
    assert.equal(
      buildImagesConfig({SUPABASE_URL: 'https://abc.supabase.co'}).dangerouslyAllowLocalIP,
      false,
    )
  })
})
