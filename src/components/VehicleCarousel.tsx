'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useReducedMotion} from '@/lib/useReducedMotion'
import VehicleCarouselCard, {type CarouselVehicle} from './VehicleCarouselCard'

// A mouse press that moves less than this is still a click, not a drag — same lesson as
// FeatureGridScroller: without it, tiny hand jitter swallows the click on a card.
const DRAG_THRESHOLD = 5

// Cards per view: 1 on phones, 2 on small tablets, 3 on laptops, 4 on wide screens.
// Widths are (100% − gaps) / n, where the gap is Tailwind's gap-4 (1rem).
const SLIDE_CLASS =
  'shrink-0 snap-start basis-full sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)] xl:basis-[calc((100%_-_3rem)/4)]'

/**
 * Row of vehicle cards on native scroll-snap: touch swipe and trackpads work natively; mouse drag,
 * arrow buttons and the keyboard (arrow keys / Home / End, or Tab through the cards) drive the
 * same scroller. Arrows only appear when there are more cards than fit.
 */
export default function VehicleCarousel({
  vehicles,
  fallbackImageUrl,
  label,
}: {
  vehicles: CarouselVehicle[]
  fallbackImageUrl: string
  /** Accessible name for the carousel (the section heading, or a generic fallback). */
  label: string
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const reducedMotion = useReducedMotion()
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 1)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateEdges()
    el.addEventListener('scroll', updateEdges, {passive: true})
    // Resizing changes how many cards fit, so the arrows must be re-evaluated.
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      ro.disconnect()
    }
  }, [updateEdges, vehicles.length])

  /** Scroll one "page" (everything currently visible) left or right. */
  const scrollPage = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current
      if (!el) return
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0
      el.scrollBy({
        left: dir * (el.clientWidth + gap),
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    },
    [reducedMotion],
  )

  // ── Mouse drag (touch uses native scrolling) ──
  const drag = useRef({active: false, startX: 0, startScroll: 0, moved: false})
  const suppressNextClick = useRef(false)

  const endDrag = () => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    const el = trackRef.current
    if (el) {
      // Hand control back to scroll-snap so the row settles on a card.
      el.style.scrollSnapType = ''
      el.style.cursor = ''
      el.style.userSelect = ''
    }
    // Only a real drag eats the click that follows it, so a plain click always reaches the card.
    if (d.moved) suppressNextClick.current = true
    d.moved = false
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = {active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false}
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    const el = trackRef.current
    if (!d.active || !el) return
    const dx = e.clientX - d.startX
    // Skip tiny jitter below the threshold — keeps clicks on cards reliable.
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      // Snapping would fight the pointer while dragging; it is restored on release.
      el.style.scrollSnapType = 'none'
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }
    el.scrollLeft = d.startScroll - dx
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Only when the row itself has focus — a focused card link keeps its own keys.
    if (e.target !== e.currentTarget) return
    const el = trackRef.current
    if (!el) return
    if (e.key === 'ArrowRight') scrollPage(1)
    else if (e.key === 'ArrowLeft') scrollPage(-1)
    else if (e.key === 'Home') el.scrollTo({left: 0, behavior: reducedMotion ? 'auto' : 'smooth'})
    else if (e.key === 'End')
      el.scrollTo({left: el.scrollWidth, behavior: reducedMotion ? 'auto' : 'smooth'})
    else return
    e.preventDefault()
  }

  const arrowClass =
    'flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-current/10 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary,currentColor)] motion-reduce:transition-none'
  const arrowStyle = {
    border: '1px solid var(--theme-border, color-mix(in srgb, currentColor 30%, transparent))',
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label={`${label} — use the left and right arrow keys to scroll`}
        className="scrollbar-hide m-0 flex snap-x snap-mandatory list-none gap-4 overflow-x-auto overscroll-x-contain p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-primary,currentColor)]"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (suppressNextClick.current) {
            suppressNextClick.current = false
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        {vehicles.map((v) => (
          <li key={v._id} className={SLIDE_CLASS}>
            <VehicleCarouselCard vehicle={v} fallbackImageUrl={fallbackImageUrl} />
          </li>
        ))}
      </ul>

      {(canPrev || canNext) && (
        <div className="mt-6 flex justify-end gap-2">
          {/* aria-disabled (not disabled) so keyboard focus isn't dropped when an end is reached. */}
          <button
            type="button"
            aria-label="Previous vehicles"
            aria-disabled={!canPrev}
            onClick={() => canPrev && scrollPage(-1)}
            className={arrowClass}
            style={arrowStyle}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next vehicles"
            aria-disabled={!canNext}
            onClick={() => canNext && scrollPage(1)}
            className={arrowClass}
            style={arrowStyle}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
