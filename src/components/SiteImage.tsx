'use client'

import {useState, type CSSProperties} from 'react'
import Image from 'next/image'
import {IMAGE_SIZES, type ImageSizePreset} from '@/lib/imageSizes'
import {resolveImageSrc, sanityImageDimensions} from '@/lib/imageUrl'

/** Our own placeholder (public/images). Local on purpose: a missing image must never call another site. */
export const NO_IMAGE_SRC = '/images/no-image.jpg'

/** Used only when an image has no known size and the caller gave none (keeps the box from collapsing). */
const DEFAULT_WIDTH = 1600
const DEFAULT_HEIGHT = 1200

interface SiteImageProps {
  /** Sanity URL, stored vehicle photo path, or local /path. Empty or malformed → the placeholder. */
  src: string | null | undefined
  alt: string
  /** Which `sizes` preset (lib/imageSizes.ts) describes how wide this image is shown. */
  sizes: ImageSizePreset
  /** Fill the parent (which must be `position: relative` with a size). Use for cards, backgrounds, galleries. */
  fill?: boolean
  /** Natural size, for images that take their own height. Sanity URLs carry their size, so this is optional there. */
  width?: number
  height?: number
  /** Preload this image. Use for the single above-the-fold (LCP) image of a page, never more than one. */
  preload?: boolean
  className?: string
  style?: CSSProperties
  /** Replace the placeholder (e.g. a logo that has its own fallback). */
  fallbackSrc?: string
  draggable?: boolean
}

/**
 * The one image component for the whole site. It wraps next/image so every picture is resized by the optimizer,
 * delivered as AVIF/WebP, lazy-loaded (except the one preloaded hero), and falls back to a local placeholder
 * — with the layout unchanged — if the source is missing, malformed or fails to load.
 *
 * It is a client component only so it can react to a failed load; it still renders on the server, so the
 * markup (and the preload hint) is in the first HTML.
 */
export default function SiteImage({
  src,
  alt,
  sizes,
  fill,
  width,
  height,
  preload,
  className,
  style,
  fallbackSrc = NO_IMAGE_SRC,
  draggable,
}: SiteImageProps) {
  const resolved = resolveImageSrc(src)
  // Remember WHICH url failed (not just "failed"), so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showFallback = !resolved || failedSrc === resolved
  const finalSrc = showFallback ? fallbackSrc : resolved

  const common = {
    sizes: IMAGE_SIZES[sizes],
    className,
    style,
    draggable,
    preload,
    // The fallback is the last resort: if it fails too, stop (no retry loop).
    onError: showFallback ? undefined : () => setFailedSrc(resolved ?? null),
  }

  if (fill) return <Image key={finalSrc} src={finalSrc} alt={alt} fill {...common} />

  // Natural-size image: use the caller's size, else the size encoded in a Sanity URL, else a safe default.
  // For the placeholder, keep the box the caller asked for (or the default) so the layout does not jump.
  const known = showFallback ? undefined : sanityImageDimensions(finalSrc)
  return (
    <Image
      key={finalSrc}
      src={finalSrc}
      alt={alt}
      width={width ?? known?.width ?? DEFAULT_WIDTH}
      height={height ?? known?.height ?? DEFAULT_HEIGHT}
      {...common}
    />
  )
}
