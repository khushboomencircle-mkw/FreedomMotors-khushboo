import {useEffect} from 'react'

// Shared by every overlay (mobile menu, lightboxes, modals). Counted, so two overlays open at once
// never unlock the page while the other is still showing.
let locks = 0
let previousOverflow = ''

/** Stops the page behind an overlay from scrolling while `active` is true. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      if (--locks === 0) document.body.style.overflow = previousOverflow
    }
  }, [active])
}
