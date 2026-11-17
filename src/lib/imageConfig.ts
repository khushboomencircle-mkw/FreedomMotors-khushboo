import type {NextConfig} from 'next'

/**
 * The image pipeline's configuration, in one place: what the Next.js image optimizer may fetch, how its
 * variants are sized and cached, and the limits the upload helper enforces. next.config.ts builds `images`
 * from `buildImagesConfig`, and the storage helpers import the same constants, so what we accept at upload
 * can never be larger than what the optimizer will fetch. Plain functions, no side effects, so it is easy
 * to unit-test and safe to import from next.config.ts.
 */

type ImagesConfig = NonNullable<NextConfig['images']>
type RemotePattern = NonNullable<ImagesConfig['remotePatterns']>[number] & object
type Env = Record<string, string | undefined>

// ─── What the optimizer may fetch (never an arbitrary host) ───

export const SANITY_CDN_HOST = 'cdn.sanity.io'

// Same defaults as src/sanity/client.ts, sanity.config.ts and sanity.cli.ts (documented in .env.local.example).
// Candidate follow-up: one shared module for all four.
const DEFAULT_SANITY_PROJECT_ID = 'sp8bk444'
const DEFAULT_SANITY_DATASET = 'production'

/** The Supabase Storage bucket vehicle photos live in. Must be a PUBLIC bucket. Override with SUPABASE_STORAGE_BUCKET. */
export const DEFAULT_STORAGE_BUCKET = 'vehicle-photos'

/** Path every public object URL in Supabase Storage starts with, for one bucket. */
export function storagePublicPathPrefix(bucket: string): string {
  return `/storage/v1/object/public/${bucket}/`
}

// ─── Limits shared by the upload helper and the optimizer ───

/** Largest original photo we accept (bytes). Phone and DSLR photos are well under this. */
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024
/** Most pixels an original may have (width × height). 50 MP covers the biggest cameras and blocks decompression bombs. */
export const MAX_PHOTO_PIXELS = 50_000_000
/** The optimizer refuses source images larger than this. Above MAX_PHOTO_BYTES, so every accepted original is optimizable. */
export const MAX_OPTIMIZER_SOURCE_BYTES = 25_000_000

// ─── Optimizer values (each justified in one line) ───

/** Design breakpoints only: phone (640), large phone (828), tablet (1080), the 1280px content width, full-bleed (1920). */
export const OPTIMIZER_DEVICE_SIZES = [640, 828, 1080, 1280, 1920]
/** Small widths for thumbnails, logos and icons: 96 (1×) → 192 (2×) → 384 (small cards / mega menu). */
export const OPTIMIZER_IMAGE_SIZES = [96, 192, 384]
/** One quality: AVIF/WebP at 75 is visually clean, and every extra value multiplies the number of variants. */
export const OPTIMIZER_QUALITIES = [75]
/** AVIF first (≈20% smaller than WebP, fastest once cached), WebP for browsers without AVIF. */
export const OPTIMIZER_FORMATS: NonNullable<ImagesConfig['formats']> = ['image/avif', 'image/webp']
/**
 * One year. Every image URL is content-addressed (Sanity asset ids, checksum-based storage paths), so a URL's bytes
 * never change; replacing a photo changes its URL. The optimizer uses max(this, the origin's s-maxage/max-age).
 */
export const OPTIMIZER_MIN_CACHE_TTL = 60 * 60 * 24 * 365

// ─── Builders ───

function parseUrl(raw: string | undefined): URL | null {
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

/** Sanity images of THIS project and dataset only — not the whole of cdn.sanity.io. */
export function sanityRemotePattern(env: Env): RemotePattern {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || DEFAULT_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || DEFAULT_SANITY_DATASET
  return {
    protocol: 'https',
    hostname: SANITY_CDN_HOST,
    pathname: `/images/${projectId}/${dataset}/**`,
    search: '',
  }
}

/** The Supabase PUBLIC bucket only (host from SUPABASE_URL, path limited to the bucket), or null when unset. */
export function supabaseRemotePattern(env: Env): RemotePattern | null {
  const url = parseUrl(env.SUPABASE_URL)
  if (!url) return null
  const bucket = env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET
  return {
    protocol: url.protocol === 'http:' ? 'http' : 'https',
    hostname: url.hostname,
    port: url.port,
    pathname: `${storagePublicPathPrefix(bucket)}**`,
    search: '',
  }
}

/** True for the Supabase CLI's local stack (http://127.0.0.1:54321) — the only private-IP origin we ever allow. */
function isLocalSupabase(env: Env): boolean {
  const url = parseUrl(env.SUPABASE_URL)
  return !!url && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
}

/** The whole `images` block for next.config.ts. */
export function buildImagesConfig(env: Env): ImagesConfig {
  const supabase = supabaseRemotePattern(env)
  return {
    remotePatterns: supabase ? [sanityRemotePattern(env), supabase] : [sanityRemotePattern(env)],
    // Only our own static images (the fallback placeholder), with no query strings.
    localPatterns: [{pathname: '/images/**', search: ''}],
    formats: OPTIMIZER_FORMATS,
    deviceSizes: OPTIMIZER_DEVICE_SIZES,
    imageSizes: OPTIMIZER_IMAGE_SIZES,
    qualities: OPTIMIZER_QUALITIES,
    minimumCacheTTL: OPTIMIZER_MIN_CACHE_TTL,
    // Redirects from an allowed host are followed WITHOUT being checked against remotePatterns, so a redirect
    // could point the optimizer anywhere. Our hosts never redirect for images, so follow none.
    maximumRedirects: 0,
    maximumResponseBody: MAX_OPTIMIZER_SOURCE_BYTES,
    // SVG optimization stays off: SVGs can carry scripts. (.svg sources are served as-is, never transformed.)
    dangerouslyAllowSVG: false,
    // Only for a local Supabase CLI stack in development — never on Vercel, never for a remote host.
    dangerouslyAllowLocalIP: isLocalSupabase(env) && !env.VERCEL,
  }
}
