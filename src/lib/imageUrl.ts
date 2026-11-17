import {DEFAULT_STORAGE_BUCKET, SANITY_CDN_HOST, storagePublicPathPrefix} from './imageConfig'

/**
 * Where image URLs come from — and the only place a stored photo path becomes a URL.
 *
 * Vehicle photos are stored ONCE, as originals, in a PUBLIC Supabase Storage bucket and the database keeps only the
 * internal path (`vehicles/<vehicle_id>/<sha256>.<ext>`), never a URL. `storagePublicUrl` is the single function
 * that turns that path into a URL (host and bucket from env), so changing storage provider or bucket is one edit.
 * The path is content-addressed: a replaced photo has a new checksum, so a new URL, so a new cache entry — a URL's
 * bytes never change, which is what lets the optimizer cache variants for a year.
 */

/** vehicles/<uuid>/<64-hex sha256>.<jpg|png|webp> — the only shape a stored photo path may have. */
export const STORAGE_PATH_PATTERN =
  /^vehicles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{64}\.(?:jpg|png|webp)$/

export function isStoragePath(value: string): boolean {
  return STORAGE_PATH_PATTERN.test(value)
}

export interface StorageUrlOptions {
  /** Supabase project URL. Defaults to the public env value (set from SUPABASE_URL in next.config.ts). */
  baseUrl?: string
  bucket?: string
}

/** The public URL of a stored photo, or undefined for a malformed path or when Supabase is not configured. */
export function storagePublicUrl(
  storagePath: string,
  options: StorageUrlOptions = {},
): string | undefined {
  if (!isStoragePath(storagePath)) return undefined
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return undefined
  const bucket =
    options.bucket || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET
  let origin: string
  try {
    origin = new URL(baseUrl).origin
  } catch {
    return undefined
  }
  return `${origin}${storagePublicPathPrefix(bucket)}${storagePath}`
}

/** Alias that reads clearly at vehicle call sites. */
export const vehiclePhotoUrl = storagePublicUrl

/**
 * Turn whatever an image field holds into something the optimizer can load:
 * an absolute http(s) URL (Sanity) or a local /path (our static images) is used as-is, a stored vehicle photo path is
 * built into its public URL, and anything else (empty, malformed, javascript:, //host) returns undefined → fallback.
 */
export function resolveImageSrc(
  value: string | null | undefined,
  options: StorageUrlOptions = {},
): string | undefined {
  const v = value?.trim()
  if (!v) return undefined
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('/') && !v.startsWith('//')) return v
  return isStoragePath(v) ? storagePublicUrl(v, options) : undefined
}

/** True for this site's own static images (served from /public). */
export function isLocalImage(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//')
}

/**
 * Sanity puts the pixel size in every image filename (…/<hash>-2925x2194.jpg), which gives next/image the
 * intrinsic size it needs (no layout shift) without a lookup. Undefined for any other URL.
 */
export function sanityImageDimensions(src: string): {width: number; height: number} | undefined {
  if (!src.includes(SANITY_CDN_HOST)) return undefined
  const m = /-(\d{1,5})x(\d{1,5})\.[a-z0-9]+(?:\?.*)?$/i.exec(src)
  return m ? {width: Number(m[1]), height: Number(m[2])} : undefined
}

/**
 * Open Graph / social-share images: kept as ABSOLUTE URLs and never routed through /_next/image (crawlers want a
 * stable public URL). Sanity images are capped at 1200px wide with Sanity's own URL parameters (no format change:
 * not every crawler reads WebP/AVIF). Anything else is returned unchanged.
 */
export function ogImageUrl(src: string): string {
  if (!src.includes(SANITY_CDN_HOST) || src.includes('?')) return src
  return `${src}?w=1200&fit=max`
}
