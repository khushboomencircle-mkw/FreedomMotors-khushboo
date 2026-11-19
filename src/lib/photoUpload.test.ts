import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {randomUUID} from 'node:crypto'
import {MAX_PHOTO_BYTES} from './imageConfig'
import {testEnv} from './testEnv'
import {isStoragePath} from './imageUrl'
import {
  PhotoUploadError,
  createSupabaseStorageClient,
  detectPhotoType,
  photoStoragePath,
  readPhotoDimensions,
  sha256Hex,
  uploadVehiclePhoto,
  validatePhoto,
  type PhotoErrorCode,
  type StorageClient,
} from './photoUpload'

// Run with: npm run test:images

// ─── Tiny hand-built files: just enough header for the validator, no image library needed ───
const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff]
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
const le24 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff]
const le32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
const text = (s: string) => [...s].map((c) => c.charCodeAt(0))

function jpeg(
  width: number,
  height: number,
  opts: {exif?: boolean; pad?: number} = {},
): Uint8Array {
  const exif = opts.exif ? [0xff, 0xe1, ...be16(8), ...text('Exif'), 0, 0] : []
  const sof = [0xff, 0xc0, ...be16(11), 8, ...be16(height), ...be16(width), 1, 1, 0x11, 0]
  return new Uint8Array([
    0xff,
    0xd8,
    ...exif,
    ...sof,
    0xff,
    0xd9,
    ...new Array(opts.pad ?? 0).fill(7),
  ])
}
function png(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...be32(13),
    ...text('IHDR'),
    ...be32(width),
    ...be32(height),
    8,
    2,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ])
}
function webp(width: number, height: number): Uint8Array {
  return new Uint8Array([
    ...text('RIFF'),
    ...le32(22),
    ...text('WEBP'),
    ...text('VP8X'),
    ...le32(10),
    0,
    0,
    0,
    0,
    ...le24(width - 1),
    ...le24(height - 1),
  ])
}

const VEHICLE = '3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b'

function code(fn: () => unknown): PhotoErrorCode | 'no-error' {
  try {
    fn()
    return 'no-error'
  } catch (e) {
    assert.ok(e instanceof PhotoUploadError, `expected a PhotoUploadError, got ${e}`)
    return e.code
  }
}

describe('valid photos are accepted', () => {
  it('JPEG', () => {
    const r = validatePhoto({
      data: jpeg(4032, 3024),
      filename: 'IMG_0001.JPG',
      declaredType: 'image/jpeg',
    })
    assert.deepEqual([r.type, r.extension, r.width, r.height], ['image/jpeg', 'jpg', 4032, 3024])
  })
  it('PNG', () => {
    const r = validatePhoto({
      data: png(1920, 1080),
      filename: 'front.png',
      declaredType: 'image/png',
    })
    assert.deepEqual([r.type, r.extension, r.width, r.height], ['image/png', 'png', 1920, 1080])
  })
  it('WebP', () => {
    const r = validatePhoto({
      data: webp(2400, 1600),
      filename: 'side.webp',
      declaredType: 'image/webp; charset=binary',
    })
    assert.deepEqual([r.type, r.extension, r.width, r.height], ['image/webp', 'webp', 2400, 1600])
  })
  it('does not need a file name or declared type', () => {
    assert.equal(validatePhoto({data: jpeg(800, 600)}).type, 'image/jpeg')
  })
  it('accepts .jpeg as an extension for a JPEG', () => {
    assert.equal(validatePhoto({data: jpeg(800, 600), filename: 'a.jpeg'}).extension, 'jpg')
  })
  it('reads the size of a lossless WebP', () => {
    // VP8L: signature byte 0x2f then 14 bits width-1 and 14 bits height-1.
    const bits = (640 - 1) | ((480 - 1) << 14)
    const data = new Uint8Array([
      ...text('RIFF'),
      ...le32(22),
      ...text('WEBP'),
      ...text('VP8L'),
      ...le32(10),
      0x2f,
      ...le32(bits),
      0,
      0,
      0,
      0,
      0,
    ])
    assert.deepEqual(readPhotoDimensions(data, 'image/webp'), {width: 640, height: 480})
  })
})

describe('refused files', () => {
  it('wrong type: a GIF, a PDF, text and an SVG', () => {
    assert.equal(
      code(() => validatePhoto({data: new Uint8Array(text('GIF89a......')), filename: 'a.gif'})),
      'unsupported-type',
    )
    assert.equal(
      code(() => validatePhoto({data: new Uint8Array(text('%PDF-1.7 ......')), filename: 'a.pdf'})),
      'unsupported-type',
    )
    assert.equal(
      code(() => validatePhoto({data: new Uint8Array(text('hello world')), filename: 'a.jpg'})),
      'unsupported-type',
    )
    assert.equal(
      code(() =>
        validatePhoto({
          data: new Uint8Array(text('<svg xmlns="http://www.w3.org/2000/svg"/>')),
          filename: 'a.svg',
        }),
      ),
      'unsupported-type',
    )
  })
  it('oversize: one byte over the limit', () => {
    assert.equal(
      code(() => validatePhoto({data: jpeg(100, 100, {pad: MAX_PHOTO_BYTES})})),
      'too-large',
    )
  })
  it('right at the limit is fine', () => {
    const base = jpeg(100, 100)
    assert.equal(
      validatePhoto({data: jpeg(100, 100, {pad: MAX_PHOTO_BYTES - base.length})}).bytes,
      MAX_PHOTO_BYTES,
    )
  })
  it('spoofed extension: a PNG named .jpg, a JPEG named .png', () => {
    assert.equal(
      code(() => validatePhoto({data: png(100, 100), filename: 'photo.jpg'})),
      'type-mismatch',
    )
    assert.equal(
      code(() => validatePhoto({data: jpeg(100, 100), filename: 'photo.png'})),
      'type-mismatch',
    )
  })
  it('spoofed extension: a real photo named .gif or .exe is refused too', () => {
    assert.equal(
      code(() => validatePhoto({data: jpeg(100, 100), filename: 'photo.gif'})),
      'type-mismatch',
    )
    assert.equal(
      code(() => validatePhoto({data: jpeg(100, 100), filename: 'run.exe'})),
      'type-mismatch',
    )
  })
  it('spoofed content type', () => {
    assert.equal(
      code(() => validatePhoto({data: jpeg(100, 100), declaredType: 'image/png'})),
      'type-mismatch',
    )
    assert.equal(
      code(() =>
        validatePhoto({data: jpeg(100, 100), filename: 'a.jpg', declaredType: 'text/html'}),
      ),
      'type-mismatch',
    )
  })
  it('empty file', () => {
    assert.equal(
      code(() => validatePhoto({data: new Uint8Array(0)})),
      'empty',
    )
  })
  it('a "decompression bomb": tiny file, enormous pixel count', () => {
    assert.equal(
      code(() => validatePhoto({data: png(40000, 40000), filename: 'a.png'})),
      'too-many-pixels',
    )
  })
  it('a truncated header', () => {
    assert.equal(
      code(() => validatePhoto({data: new Uint8Array([0xff, 0xd8, 0xff]), filename: 'a.jpg'})),
      'unreadable',
    )
    assert.equal(
      code(() =>
        validatePhoto({
          data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
        }),
      ),
      'unreadable',
    )
  })
  it('detects type from bytes, not from the name', () => {
    assert.equal(detectPhotoType(png(1, 1)), 'image/png')
    assert.equal(detectPhotoType(new Uint8Array(text('MZ......'))), null)
  })
})

describe('storage path is content-addressed', () => {
  const a = jpeg(800, 600)
  const sha = sha256Hex(a)

  it('has the shape vehicles/<vehicle id>/<sha256>.<ext>', () => {
    const path = photoStoragePath(VEHICLE, sha, 'jpg')
    assert.equal(path, `vehicles/${VEHICLE}/${sha}.jpg`)
    assert.match(sha, /^[0-9a-f]{64}$/)
    assert.ok(isStoragePath(path))
  })
  it('the same bytes always give the same path, whatever the file is called', async () => {
    const stored: string[] = []
    const client: StorageClient = {upload: async (p) => (stored.push(p), {created: true})}
    const one = await uploadVehiclePhoto(client, VEHICLE, {data: a, filename: 'one.jpg'})
    const two = await uploadVehiclePhoto(client, VEHICLE, {
      data: new Uint8Array(a),
      filename: 'two.jpeg',
    })
    assert.equal(one.path, two.path)
    assert.equal(one.sha256, sha)
  })
  it('different bytes give a different path', () => {
    const b = jpeg(801, 600)
    assert.notEqual(
      photoStoragePath(VEHICLE, sha256Hex(a), 'jpg'),
      photoStoragePath(VEHICLE, sha256Hex(b), 'jpg'),
    )
  })
  it("the same bytes for a different vehicle land in that vehicle's folder", () => {
    const other = '00000000-0000-4000-8000-000000000000'
    assert.ok(photoStoragePath(other, sha, 'jpg').startsWith(`vehicles/${other}/`))
  })
  it('refuses a vehicle id that is not a UUID (no path tricks)', () => {
    for (const bad of ['', 'abc', '../secrets', `${VEHICLE}/../x`, 'vehicles']) {
      assert.equal(
        code(() => photoStoragePath(bad, sha, 'jpg')),
        'bad-vehicle-id',
        bad,
      )
    }
  })
})

describe('upload stores the original, untouched', () => {
  it('sends the exact bytes with the real content type, and never overwrites', async () => {
    const data = jpeg(4032, 3024, {exif: true})
    const calls: {path: string; data: Uint8Array; contentType: string; cacheControl: string}[] = []
    const client: StorageClient = {
      upload: async (path, bytes, options) => (
        calls.push({path, data: bytes, ...options}),
        {created: false}
      ),
    }
    const result = await uploadVehiclePhoto(client, VEHICLE, {data, filename: 'x.jpg'})
    assert.equal(calls.length, 1)
    assert.deepEqual(
      calls[0].data,
      data,
      'bytes are stored exactly as received (no re-encode, no EXIF stripping)',
    )
    assert.equal(calls[0].contentType, 'image/jpeg')
    assert.match(calls[0].cacheControl, /max-age=31536000/)
    assert.equal(
      result.created,
      false,
      'an identical photo already stored is reported, not an error',
    )
  })
  it('flags EXIF metadata as a privacy warning without touching the file', async () => {
    const client: StorageClient = {upload: async () => ({created: true})}
    assert.deepEqual(
      (await uploadVehiclePhoto(client, VEHICLE, {data: jpeg(100, 100, {exif: true})})).warnings,
      ['exif-metadata'],
    )
    assert.deepEqual(
      (await uploadVehiclePhoto(client, VEHICLE, {data: jpeg(100, 100)})).warnings,
      [],
    )
  })
  it('a refused file never reaches storage', async () => {
    let called = false
    const client: StorageClient = {upload: async () => ((called = true), {created: true})}
    await assert.rejects(
      uploadVehiclePhoto(client, VEHICLE, {data: png(10, 10), filename: 'a.jpg'}),
      PhotoUploadError,
    )
    assert.equal(called, false)
  })
})

describe('Supabase REST client', () => {
  // A throwaway key made fresh for each run (never the real service key): the tests only check where it is sent
  // and that it never leaks into an error message.
  const KEY = `test-${randomUUID()}`
  const SUPABASE_ORIGIN = new URL(testEnv('SUPABASE_URL')).origin
  const BUCKET = testEnv('SUPABASE_STORAGE_BUCKET')
  function fakeFetch(status: number, body = '') {
    const seen: {url: string; init: RequestInit}[] = []
    const fetchImpl = (async (url: string, init: RequestInit) => {
      seen.push({url: String(url), init})
      return new Response(body, {status})
    }) as unknown as typeof fetch
    return {seen, fetchImpl}
  }
  const upload = (fetchImpl: typeof fetch) =>
    createSupabaseStorageClient({
      url: `${SUPABASE_ORIGIN}/`,
      serviceKey: KEY,
      bucket: BUCKET,
      fetchImpl,
    }).upload(`vehicles/${VEHICLE}/${'a'.repeat(64)}.jpg`, jpeg(10, 10), {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    })

  it('posts to the bucket path with the key, and asks Supabase not to overwrite', async () => {
    const {seen, fetchImpl} = fakeFetch(200)
    assert.deepEqual(await upload(fetchImpl), {created: true})
    assert.equal(
      seen[0].url,
      `${SUPABASE_ORIGIN}/storage/v1/object/${BUCKET}/vehicles/${VEHICLE}/${'a'.repeat(64)}.jpg`,
    )
    const headers = seen[0].init.headers as Record<string, string>
    assert.equal(headers['x-upsert'], 'false')
    assert.equal(headers.Authorization, `Bearer ${KEY}`)
    assert.equal(headers['Content-Type'], 'image/jpeg')
  })
  it('treats "already exists" as success (a re-run)', async () => {
    assert.deepEqual(await upload(fakeFetch(409, '{"error":"Duplicate"}').fetchImpl), {
      created: false,
    })
    assert.deepEqual(
      await upload(fakeFetch(400, '{"message":"The resource already exists"}').fetchImpl),
      {created: false},
    )
  })
  it('fails loudly on other errors, without leaking the key', async () => {
    await assert.rejects(
      upload(fakeFetch(500, 'boom').fetchImpl),
      (e: Error) => /500/.test(e.message) && !e.message.includes(KEY),
    )
  })
})
