'use client'

import {useState} from 'react'
import SiteImage from './SiteImage'
import ModalShell from './ModalShell'

interface Props {
  trigger: React.ReactNode
  src: string
  alt?: string
}

/**
 * Click-to-enlarge popup for a single photo. The overlay itself (portal, Escape, backdrop click,
 * close button, focus handling, scroll lock) is ModalShell, shared with VideoLightbox and
 * ShareResultsModal; `trigger` wraps whatever should open it.
 */
export default function ImageLightbox({trigger, src, alt}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full h-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        {trigger}
      </button>

      <ModalShell open={open} onClose={() => setOpen(false)} label={alt || 'Enlarged photo'}>
        {/* Optimized, capped size — never the raw original. `auto` size + max-* keeps the photo's proportions
            and keeps it fully inside the screen (dvh = the visible height on phones). */}
        <SiteImage
          src={src}
          alt={alt || ''}
          sizes="lightbox"
          className="max-w-[min(100%,64rem)] max-h-[calc(100dvh-2rem)] object-contain"
          style={{width: 'auto', height: 'auto'}}
        />
      </ModalShell>
    </>
  )
}
