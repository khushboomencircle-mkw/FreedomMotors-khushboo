'use client'

import {useEffect, useState} from 'react'

interface Props {
  trigger: React.ReactNode
  src: string
  alt?: string
}

/**
 * Click-to-enlarge popup for a single photo. Same interaction shell as
 * VideoLightbox.tsx (Escape closes, clicking the backdrop closes, a
 * `trigger` prop wraps whatever should open it) so the two lightboxes in
 * this codebase behave consistently — VideoLightbox itself isn't reusable
 * here as-is since it's YouTube/Vimeo/video-URL specific, not a plain image.
 */
export default function ImageLightbox({trigger, src, alt}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full h-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        {trigger}
      </button>

      {open && (
        // z-[9999], not VideoLightbox's z-[10000] — the video lightbox stays
        // the single highest layer in the app on purpose (see its own
        // comment); the two are never open at the same time in practice, but
        // this keeps that ordering true if that ever changed.
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl leading-none"
            >
              ×
            </button>
            <img src={src} alt={alt || ''} className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </>
  )
}
