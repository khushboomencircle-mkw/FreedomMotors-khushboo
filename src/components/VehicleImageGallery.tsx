'use client'

import {useMemo, useState} from 'react'

// ─── VEHICLE DETAIL CARD CHANGE — gallery frame/selection border color ───
// Pick ONE. The live Site Settings theme currently has borderColor set to
// #ffffff, which would make option 2 render an invisible border against
// the page's white background right now — kept as a fallback-only value
// there so it still shows something if that ever happens, but the active
// line below decides what actually renders today.
//
// Option 1 — hardcoded brand red (ACTIVE): same red as not-found.tsx's CTA
// button, always visible regardless of the current theme configuration.
const GALLERY_BORDER_COLOR = '#e3290b'
// Option 2 — follow Site Settings' border color once it's set to something
// visible, falling back to the brand red only while the CSS var is
// completely undefined (not merely resolving to white, as it does today).
// To switch: comment out Option 1 above, uncomment the line below.
// const GALLERY_BORDER_COLOR = 'var(--theme-border, #e3290b)'
// ─── END VEHICLE DETAIL CARD CHANGE ───

const VISIBLE_THUMBNAILS = 5

export interface GalleryPhoto {
  url: string
  alt?: string
}

function buildPhotoList(
  mainImage: string | undefined,
  mainImageAlt: string,
  gallery: {url?: string; alt?: string}[] | undefined,
): GalleryPhoto[] {
  const photos: GalleryPhoto[] = []
  if (mainImage) photos.push({url: mainImage, alt: mainImageAlt})
  for (const g of gallery || []) {
    if (g.url) photos.push({url: g.url, alt: g.alt || mainImageAlt})
  }
  return photos
}

function Thumbnail({
  photo,
  selected,
  onClick,
  className,
}: {
  photo: GalleryPhoto
  selected: boolean
  onClick: () => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={photo.alt || 'View photo'}
      aria-pressed={selected}
      className={`relative shrink-0 overflow-hidden rounded-md ${className}`}
    >
      <img src={photo.url} alt={photo.alt || ''} className="w-full h-full object-cover" />
      {selected && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{boxShadow: `inset 0 0 0 2px ${GALLERY_BORDER_COLOR}`}}
        />
      )}
    </button>
  )
}

export default function VehicleImageGallery({
  mainImage,
  mainImageAlt,
  gallery,
}: {
  mainImage?: string
  mainImageAlt: string
  gallery?: {url?: string; alt?: string}[]
}) {
  const photos = useMemo(
    () => buildPhotoList(mainImage, mainImageAlt, gallery),
    [mainImage, mainImageAlt, gallery],
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  // First visible thumbnail in the desktop strip's paged window of 5 — the
  // up/down pills page this window, independent of which thumbnail is
  // currently selected (clicking a thumbnail never moves the window itself).
  const [windowStart, setWindowStart] = useState(0)

  if (photos.length === 0) {
    return <div className="w-full rounded-xl aspect-video bg-gray-800" />
  }

  const selected = photos[selectedIndex] ?? photos[0]
  const maxWindowStart = Math.max(0, photos.length - VISIBLE_THUMBNAILS)
  const visiblePhotos = photos.slice(windowStart, windowStart + VISIBLE_THUMBNAILS)
  const canScrollUp = windowStart > 0
  const canScrollDown = windowStart < maxWindowStart

  return (
    <div className="w-full">
      {/* Desktop / tablet: narrow paged thumbnail column + large image, side by side, one shared frame. */}
      <div
        className="hidden lg:flex h-[480px] rounded-xl overflow-hidden"
        style={{boxShadow: `inset 0 0 0 2px ${GALLERY_BORDER_COLOR}`}}
      >
        <div className="w-24 shrink-0 flex flex-col p-2 gap-2">
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {visiblePhotos.map((photo, i) => {
              const index = windowStart + i
              return (
                <Thumbnail
                  key={index}
                  photo={photo}
                  selected={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}
                  className="flex-1 w-full aspect-square"
                />
              )
            })}
          </div>
          {photos.length > VISIBLE_THUMBNAILS && (
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setWindowStart((s) => Math.max(0, s - 1))}
                disabled={!canScrollUp}
                aria-label="Show earlier photos"
                className="rounded-full py-1 text-xs disabled:opacity-30 transition"
                style={{
                  boxShadow: `inset 0 0 0 1px ${GALLERY_BORDER_COLOR}`,
                  color: GALLERY_BORDER_COLOR,
                }}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => setWindowStart((s) => Math.min(maxWindowStart, s + 1))}
                disabled={!canScrollDown}
                aria-label="Show more photos"
                className="rounded-full py-1 text-xs disabled:opacity-30 transition"
                style={{
                  boxShadow: `inset 0 0 0 1px ${GALLERY_BORDER_COLOR}`,
                  color: GALLERY_BORDER_COLOR,
                }}
              >
                ▼
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 h-full">
          <img
            src={selected.url}
            alt={selected.alt || mainImageAlt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Mobile: large image on top, thumbnails as a horizontal scroll row below, same shared frame. */}
      <div
        className="flex lg:hidden flex-col rounded-xl overflow-hidden"
        style={{boxShadow: `inset 0 0 0 2px ${GALLERY_BORDER_COLOR}`}}
      >
        <img
          src={selected.url}
          alt={selected.alt || mainImageAlt}
          className="w-full aspect-video object-cover"
        />
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {photos.map((photo, index) => (
              <Thumbnail
                key={index}
                photo={photo}
                selected={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className="w-16 h-16 aspect-square"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
