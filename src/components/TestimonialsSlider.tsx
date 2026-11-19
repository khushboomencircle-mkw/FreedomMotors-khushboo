'use client'

import {useCallback, useEffect, useRef, useState, useSyncExternalStore} from 'react'
import TestimonialCard, {type Testimonial} from './TestimonialCard'

interface Props {
  items: Testimonial[]
  showRatings: boolean
  autoPlay: boolean
  intervalSeconds: number
  /** Accessible name for the carousel (the section heading, or a generic fallback). */
  label: string
}

// A mouse press that moves less than this is still a click (e.g. "Read more"), not a drag.
// Same lesson as FeatureGridScroller: without it, tiny hand jitter swallows clicks.
const DRAG_THRESHOLD = 5
// A drag must travel at least this far to change slide.
const SWIPE_DISTANCE = 50

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/**
 * One-quote-at-a-time slider. Built on native scroll-snap so touch swiping, momentum and
 * trackpads work for free; arrows, dots, keyboard and mouse-drag all drive that same scroller.
 *
 * - Arrow keys / Home / End work when the slider has focus.
 * - Auto-slide (optional) pauses on hover, touch and keyboard focus, has a visible
 *   pause button, and never runs when the visitor prefers reduced motion.
 */
export default function TestimonialsSlider({
  items,
  showRatings,
  autoPlay,
  intervalSeconds,
  label,
}: Props) {
  const n = items.length
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [hoverFocusPaused, setHoverFocusPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )

  const goTo = useCallback(
    (to: number) => {
      const el = scrollerRef.current
      if (!el || n < 2) return
      const target = ((to % n) + n) % n // wraps both ways
      el.scrollTo({left: target * el.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth'})
    },
    [n, reducedMotion],
  )

  // Keep the dots in step with whatever moved the scroller (arrows, swipe, keys, drag).
  const onScroll = () => {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
  }

  const autoPlaying = autoPlay && !reducedMotion && n > 1 && !userPaused
  useEffect(() => {
    if (!autoPlaying || hoverFocusPaused) return
    // `index` is a dependency, so any manual move restarts the countdown.
    const id = setInterval(
      () => {
        if (document.visibilityState === 'visible') goTo(index + 1)
      },
      Math.max(3, intervalSeconds) * 1000,
    )
    return () => clearInterval(id)
  }, [autoPlaying, hoverFocusPaused, intervalSeconds, index, goTo])

  // ── Mouse drag (touch uses native scrolling) ──
  const drag = useRef({active: false, startX: 0, moved: false})
  const suppressNextClick = useRef(false)

  const endDrag = (clientX: number, allowNavigate: boolean) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    const el = scrollerRef.current
    if (el) {
      el.style.cursor = ''
      el.style.userSelect = ''
    }
    if (!d.moved) return
    // Only a real drag eats the click that follows it.
    suppressNextClick.current = true
    const dx = clientX - d.startX
    if (allowNavigate && Math.abs(dx) >= SWIPE_DISTANCE) goTo(index + (dx < 0 ? 1 : -1))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || n < 2) return
    drag.current = {active: true, startX: e.clientX, moved: false}
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active || d.moved) return
    if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return
    d.moved = true
    const el = scrollerRef.current
    if (el) {
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return // let "Read more" buttons keep their own keys
    if (e.key === 'ArrowRight') goTo(index + 1)
    else if (e.key === 'ArrowLeft') goTo(index - 1)
    else if (e.key === 'Home') goTo(0)
    else if (e.key === 'End') goTo(n - 1)
    else return
    e.preventDefault()
  }

  if (n === 0) return null
  if (n === 1) {
    return (
      <div className="mx-auto max-w-3xl">
        <TestimonialCard testimonial={items[0]} showRatings={showRatings} />
      </div>
    )
  }

  const iconButton =
    'flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary,currentColor)] motion-reduce:transition-none'
  const iconButtonStyle = {
    border: '1px solid var(--theme-border, color-mix(in srgb, currentColor 30%, transparent))',
  }

  return (
    <div
      className="mx-auto max-w-3xl"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverFocusPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHoverFocusPaused(false)}
      onTouchStart={() => setHoverFocusPaused(true)}
      onTouchEnd={() => setHoverFocusPaused(false)}
      onTouchCancel={() => setHoverFocusPaused(false)}
      onFocus={() => setHoverFocusPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHoverFocusPaused(false)
      }}
    >
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="group"
        aria-label={`${label} — use the left and right arrow keys to change slide`}
        aria-live={autoPlaying && !hoverFocusPaused ? 'off' : 'polite'}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-[var(--theme-card-radius,12px)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-primary,currentColor)]"
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e.clientX, true)}
        onPointerLeave={(e) => endDrag(e.clientX, false)}
        onPointerCancel={(e) => endDrag(e.clientX, false)}
        onClickCapture={(e) => {
          if (suppressNextClick.current) {
            suppressNextClick.current = false
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        {items.map((t, i) => (
          <div
            key={t._key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            // Off-screen slides stay out of the tab order and the accessibility tree.
            inert={i !== index}
            className="flex w-full shrink-0 snap-center snap-always"
          >
            <TestimonialCard testimonial={t} showRatings={showRatings} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => goTo(index - 1)}
          className={iconButton}
          style={iconButtonStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center">
          {items.map((t, i) => (
            <button
              key={t._key}
              type="button"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => goTo(i)}
              className="flex h-6 items-center justify-center px-1 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--theme-primary,currentColor)]"
            >
              <span
                className="block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none"
                style={{
                  width: i === index ? 24 : 8,
                  background:
                    i === index
                      ? 'var(--theme-primary, currentColor)'
                      : 'color-mix(in srgb, currentColor 35%, transparent)',
                }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => goTo(index + 1)}
          className={iconButton}
          style={iconButtonStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Auto-moving content needs a way to stop it (WCAG 2.2.2) — hover/focus pausing alone isn't one. */}
        {autoPlay && !reducedMotion && (
          <button
            type="button"
            aria-label={userPaused ? 'Start auto-slide' : 'Pause auto-slide'}
            onClick={() => setUserPaused((v) => !v)}
            className={`${iconButton} ml-1`}
            style={iconButtonStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              {userPaused ? (
                <path d="M7 4.5v15l13-7.5-13-7.5z" />
              ) : (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
