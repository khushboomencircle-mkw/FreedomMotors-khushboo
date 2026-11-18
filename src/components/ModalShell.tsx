'use client'

import {useEffect, useRef, useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'
import {useScrollLock} from '@/lib/useScrollLock'

// Nothing to subscribe to — useSyncExternalStore is used only because it reports `false` during
// server render/hydration and `true` afterwards (`document.body`, the portal target, exists from then on).
const subscribeNoop = () => () => {}

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'

/**
 * The one overlay shell behind every lightbox and modal (ImageLightbox, VideoLightbox,
 * ShareResultsModal), so they all behave the same on every screen:
 *  - rendered in a portal on <body>, so a transformed or overflow-hidden ancestor (the sliders)
 *    can never clip it or break `position: fixed`;
 *  - sized with `dvh`, scrolls inside itself when its content is taller than the screen;
 *  - a 44px close button that always stays inside the viewport (not hanging off the content);
 *  - dialog semantics, Escape and backdrop-click to close, focus moved in, kept inside (Tab
 *    cycles) and put back on whatever opened it, and the page behind does not scroll.
 * The content is `children`; it sizes itself (use `dvh`, not `vh`, for any height limit).
 */
export default function ModalShell({
  open,
  onClose,
  label,
  children,
  hideCloseButton = false,
  backdropClassName = 'bg-black/85',
}: {
  open: boolean
  onClose: () => void
  /** Accessible name of the dialog (read out when it opens). */
  label: string
  children: React.ReactNode
  /** For a dialog that draws its own close button. */
  hideCloseButton?: boolean
  backdropClassName?: string
}) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  // Callers pass inline functions; keep the latest one in a ref so the effect below only re-runs
  // when `open` changes (otherwise every re-render would move focus again).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useScrollLock(open)

  // Escape closes; focus moves in on open and goes back to the opener on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const frame = requestAnimationFrame(() => {
      const el = dialogRef.current
      if (el && !el.contains(document.activeElement)) el.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(frame)
      opener?.focus?.()
    }
  }, [open])

  // Tab cycles inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const root = dialogRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mounted || !open) return null

  return createPortal(
    // Highest layer in the app on purpose (above the sticky header and any preview tooling).
    // `h-dvh` follows the visible screen as phone browser bars show and hide.
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={onClose}
      className={`fixed inset-x-0 top-0 z-[10000] flex h-dvh items-center justify-center overflow-y-auto overscroll-contain p-4 outline-none ${backdropClassName}`}
    >
      {!hideCloseButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Close"
          className="fixed right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-3xl leading-none text-white transition-colors hover:bg-black/80"
        >
          <span aria-hidden>×</span>
        </button>
      )}
      {/* Clicks inside the content don't reach the backdrop's close handler. */}
      <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full">
        {children}
      </div>
    </div>,
    document.body,
  )
}
