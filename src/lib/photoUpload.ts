import {createHash} from 'node:crypto'
import {MAX_PHOTO_BYTES, MAX_PHOTO_PIXELS} from './imageConfig'
import {isStoragePath} from './imageUrl'

/**
 * Server-only helper for storing a vehicle photo in Supabase Storage — validate, name, upload. Nothing calls it yet:
 * the sync job that will is a separate piece of work. It must never run in the browser (it holds the service key).
 *
 * The rules:
 *  - ORIGINALS ONLY. The bytes are stored exactly as received; we never re-encode, resize or strip anything. The
 *    Next.js image optimizer makes every smaller size on demand.
 *  - CONTENT-ADDRESSED. The path is `vehicles/<vehicle_id>/<sha256 of the bytes>.<ext>`. The same photo always lands
 *    on the same path (so re-running a sync is harmless), and a changed photo gets a new path, hence a new URL and a
 *    fresh cache entry. The database keeps this internal path, never a URL (see lib/imageUrl.ts).
 *  - STRICT. Only real JPEG, PNG and WebP files are accepted; the type comes from the file's own first bytes, and the
 *    file name and declared type must agree with it, so a renamed or mislabeled file is refused.
 *
 * PRIVACY RISK (decision needed): because originals are stored untouched, a JPEG keeps its EXIF metadata, which can
 * include the GPS position where the photo was taken and the camera's serial number. The bucket is public, so anyone
 * with a photo's URL can read it. `uploadVehiclePhoto` reports `warnings: ['exif-metadata']` when it sees EXIF, but
 * does not remove it (stripping means re-encoding or rewriting the file, which was ruled out). Options: strip at
 * source, strip during sync, or accept the risk for dealer-lot photos.
 */

if (typeof window !== 'undefined') {
  throw new Error('lib/photoUpload.ts is server-only: it must never be bundled into the browser.')
}

// ─── Validation ───

export type PhotoMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

const EXTENSION_BY_TYPE: Record<PhotoMimeType, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** File-name extensions we recognise, mapped to the type they claim to be. */
const TYPE_BY_EXTENSION: Record<string, PhotoMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export type PhotoErrorCode =
  | 'empty'
  | 'too-large'
  | 'unsupported-type'
  | 'type-mismatch'
  | 'unreadable'
  | 'too-many-pixels'
  | 'bad-vehicle-id'

export class PhotoUploadError extends Error {
  constructor(
    readonly code: PhotoErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PhotoUploadError'
  }
}

export interface ValidatedPhoto {
  type: PhotoMimeType
  /** The extension used in the storage path. */
  extension: 'jpg' | 'png' | 'webp'
  width: number
  height: number
  bytes: number
  /** Non-blocking notes (see the privacy note at the top of this file). */
  warnings: 'exif-metadata'[]
}

/** The file type from the first bytes (its "magic number"), or null when it is not JPEG, PNG or WebP. */
export function detectPhotoType(data: Uint8Array): PhotoMimeType | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return 'image/jpeg'
  if (
    data.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => data[i] === byte)
  ) {
    return 'image/png'
  }
  if (data.length >= 12 && ascii(data, 0, 4) === 'RIFF' && ascii(data, 8, 4) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

function ascii(data: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...data.subarray(start, start + length))
}
const u16be = (d: Uint8Array, o: number) => (d[o] << 8) | d[o + 1]
const u16le = (d: Uint8Array, o: number) => d[o] | (d[o + 1] << 8)
const u24le = (d: Uint8Array, o: number) => d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)
const u32be = (d: Uint8Array, o: number) =>
  ((d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) >>> 0
const u32le = (d: Uint8Array, o: number) =>
  (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0

/**
 * Width and height from the file header alone (no image library, no decoding), or null when the header is
 * truncated or malformed. This is how an oversized "decompression bomb" is refused without ever decoding it.
 */
export function readPhotoDimensions(
  data: Uint8Array,
  type: PhotoMimeType,
): {width: number; height: number} | null {
  if (type === 'image/png') {
    // 8-byte signature, then the IHDR chunk: length(4) "IHDR"(4) width(4) height(4).
    if (data.length < 24 || ascii(data, 12, 4) !== 'IHDR') return null
    return {width: u32be(data, 16), height: u32be(data, 20)}
  }

  if (type === 'image/webp') {
    if (data.length < 30) return null
    const chunk = ascii(data, 12, 4)
    if (chunk === 'VP8 ') return {width: u16le(data, 26) & 0x3fff, height: u16le(data, 28) & 0x3fff}
    if (chunk === 'VP8L') {
      if (data[20] !== 0x2f) return null
      const bits = u32le(data, 21)
      return {width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1}
    }
    if (chunk === 'VP8X') return {width: u24le(data, 24) + 1, height: u24le(data, 27) + 1}
    return null
  }

  // JPEG: walk the marker segments until a "start of frame" (SOFn) one, which carries the size.
  let offset = 2
  while (offset + 4 <= data.length) {
    if (data[offset] !== 0xff) return null
    const marker = data[offset + 1]
    if (marker === 0xff) {
      offset += 1 // padding byte
      continue
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2 // markers with no length
      continue
    }
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isStartOfFrame) {
      if (offset + 9 > data.length) return null
      return {height: u16be(data, offset + 5), width: u16be(data, offset + 7)}
    }
    if (marker === 0xda) return null // start of scan reached with no frame header
    offset += 2 + u16be(data, offset + 2)
  }
  return null
}

/** True when a JPEG carries an EXIF block (APP1 "Exif") — which may hold GPS position and device serial numbers. */
function hasExif(data: Uint8Array, type: PhotoMimeType): boolean {
  if (type === 'image/jpeg') {
    let offset = 2
    while (offset + 4 <= data.length && data[offset] === 0xff) {
      const marker = data[offset + 1]
      if (marker === 0xda || marker === 0xd9) break
      if (marker === 0xe1 && ascii(data, offset + 4, 4) === 'Exif') return true
      offset += 2 + u16be(data, offset + 2)
    }
    return false
  }
  if (type === 'image/webp') {
    // RIFF chunks: fourcc(4) size(4, little-endian) data (padded to even length).
    let offset = 12
    while (offset + 8 <= data.length) {
      if (ascii(data, offset, 4) === 'EXIF') return true
      offset += 8 + u32le(data, offset + 4) + (u32le(data, offset + 4) % 2)
    }
  }
  return false
}

export interface PhotoInput {
  data: Uint8Array
  /** The original file name, if known. Its extension must agree with the file's real type. */
  filename?: string
  /** The Content-Type the sender declared, if any. Must agree with the file's real type. */
  declaredType?: string
}

/**
 * Checks a photo and returns its facts, or throws a PhotoUploadError saying why it is refused.
 * Order matters: cheap checks first, and the header is read only after the type is known.
 */
export function validatePhoto(input: PhotoInput): ValidatedPhoto {
  const {data, filename, declaredType} = input

  if (data.length === 0) throw new PhotoUploadError('empty', 'The file is empty.')
  if (data.length > MAX_PHOTO_BYTES) {
    throw new PhotoUploadError(
      'too-large',
      `The file is ${(data.length / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`,
    )
  }

  // The type comes from the bytes themselves, never from the name or the sender's say-so.
  const type = detectPhotoType(data)
  if (!type)
    throw new PhotoUploadError('unsupported-type', 'Only JPEG, PNG and WebP photos are accepted.')

  const extension = filename?.includes('.') ? filename.split('.').pop()!.toLowerCase() : undefined
  if (extension && TYPE_BY_EXTENSION[extension] !== type) {
    throw new PhotoUploadError(
      'type-mismatch',
      `The file name ends in .${extension} but the contents are ${type}.`,
    )
  }
  if (declaredType && declaredType.split(';')[0].trim().toLowerCase() !== type) {
    throw new PhotoUploadError(
      'type-mismatch',
      `The declared type ${declaredType} does not match the contents (${type}).`,
    )
  }

  const size = readPhotoDimensions(data, type)
  if (!size || size.width < 1 || size.height < 1) {
    throw new PhotoUploadError('unreadable', 'The image header is damaged or incomplete.')
  }
  if (size.width * size.height > MAX_PHOTO_PIXELS) {
    throw new PhotoUploadError(
      'too-many-pixels',
      `${size.width}×${size.height} is over the ${MAX_PHOTO_PIXELS / 1_000_000} megapixel limit.`,
    )
  }

  return {
    type,
    extension: EXTENSION_BY_TYPE[type],
    width: size.width,
    height: size.height,
    bytes: data.length,
    warnings: hasExif(data, type) ? ['exif-metadata'] : [],
  }
}

// ─── Naming ───

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

/** `vehicles/<vehicle uuid>/<sha256>.<ext>` — the one stored shape (matches isStoragePath in lib/imageUrl.ts). */
export function photoStoragePath(vehicleId: string, sha256: string, extension: string): string {
  const path = `vehicles/${vehicleId.toLowerCase()}/${sha256}.${extension}`
  if (!UUID_PATTERN.test(vehicleId.toLowerCase()) || !isStoragePath(path)) {
    throw new PhotoUploadError('bad-vehicle-id', 'The vehicle id must be a UUID.')
  }
  return path
}

// ─── Storage ───

/** The one thing the helper needs from storage. Swappable, so tests (and a future provider) need no network. */
export interface StorageClient {
  /** Stores the bytes at `path`. Resolves `{created: false}` when that path already holds a file (never overwrites). */
  upload(
    path: string,
    data: Uint8Array,
    options: {contentType: string; cacheControl: string},
  ): Promise<{created: boolean}>
}

export interface UploadedPhoto extends ValidatedPhoto {
  /** The internal path to keep in the database. */
  path: string
  sha256: string
  /** False when an identical photo was already stored (a re-run) — nothing was written. */
  created: boolean
}

/** Validate, name by content, and store a vehicle photo as received. Throws PhotoUploadError for a refused file. */
export async function uploadVehiclePhoto(
  client: StorageClient,
  vehicleId: string,
  input: PhotoInput,
): Promise<UploadedPhoto> {
  const photo = validatePhoto(input)
  const sha256 = sha256Hex(input.data)
  const path = photoStoragePath(vehicleId, sha256, photo.extension)
  const {created} = await client.upload(path, input.data, {
    contentType: photo.type,
    // The path changes whenever the photo does, so the stored file never changes: cache it for a year.
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return {...photo, path, sha256, created}
}

/**
 * A StorageClient for Supabase Storage's REST API (plain fetch, no extra dependency).
 * Upload only: the bucket is public for READING, so writing needs the service key, which is passed in here and
 * never leaves the server. `x-upsert: false` makes Supabase refuse to overwrite an existing path.
 */
export function createSupabaseStorageClient(config: {
  url: string
  serviceKey: string
  /** The PUBLIC bucket's name (from SUPABASE_STORAGE_BUCKET); there is no default. */
  bucket: string
  fetchImpl?: typeof fetch
}): StorageClient {
  const base = config.url.replace(/\/+$/, '')
  const bucket = config.bucket
  const doFetch = config.fetchImpl ?? fetch

  return {
    async upload(path, data, options) {
      // The path is built from a UUID, a hex digest and a fixed extension — nothing user-typed — but encode anyway.
      const encodedPath = path.split('/').map(encodeURIComponent).join('/')
      const response = await doFetch(
        `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.serviceKey}`,
            apikey: config.serviceKey,
            'Content-Type': options.contentType,
            'Cache-Control': options.cacheControl,
            'x-upsert': 'false',
          },
          body: data as BodyInit,
        },
      )
      if (response.ok) return {created: true}
      // Supabase answers 409 (or 400 with "Duplicate") when the path exists: same content, so success.
      const text = await response.text().catch(() => '')
      if (response.status === 409 || /duplicate|already exists/i.test(text)) return {created: false}
      // Never include the key or request headers in the error.
      throw new Error(`Supabase Storage upload failed (${response.status}): ${text.slice(0, 200)}`)
    },
  }
}

/** Builds the client from env. SUPABASE_SERVICE_ROLE_KEY is read here, server-side only — it has no NEXT_PUBLIC_ twin. */
export function createSupabaseStorageClientFromEnv(
  env: Record<string, string | undefined> = process.env,
): StorageClient {
  const url = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = env.SUPABASE_STORAGE_BUCKET
  if (!url || !serviceKey || !bucket)
    throw new Error(
      'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET must be set to upload photos.',
    )
  return createSupabaseStorageClient({url, serviceKey, bucket})
}
