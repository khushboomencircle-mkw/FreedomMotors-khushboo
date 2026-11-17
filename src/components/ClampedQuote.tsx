'use client'

import {useEffect, useId, useRef, useState} from 'react'

/**
 * A quote limited to a few lines, with a "Read more" toggle that only appears
 * when the text is actually cut off — short quotes show no button, long ones
 * are never silently hidden from visitors.
 *
 * The full text is always in the page (CSS clamps it visually), so screen
 * readers and search engines still get all of it.
 */
export default function ClampedQuote({
  text,
  lines = 6,
  className = '',
  style,
}: {
  text: string
  lines?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  // Measure only while clamped — once expanded there is nothing left to measure,
  // and `overflowing` must stay true so "Show less" remains available.
  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded, text, lines])

  return (
    <>
      <blockquote className="m-0">
        <p
          ref={ref}
          id={id}
          className={`whitespace-pre-line ${className}`}
          style={
            expanded
              ? style
              : {
                  ...style,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: lines,
                  overflow: 'hidden',
                }
          }
        >
          {text}
        </p>
      </blockquote>
      {(overflowing || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-fit rounded text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary,currentColor)]"
          style={{color: 'var(--theme-primary, currentColor)'}}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  )
}
