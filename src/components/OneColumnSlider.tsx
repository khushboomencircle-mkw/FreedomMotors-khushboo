'use client'

import {useCallback, useEffect, useState} from 'react'

interface Props {
  children: React.ReactNode[]
  autoPlay?: boolean
  intervalSeconds?: number
  showArrows?: boolean
  showDots?: boolean
}

export default function OneColumnSlider({
  children,
  autoPlay = false,
  intervalSeconds = 5,
  showArrows = true,
  showDots = true,
}: Props) {
  const items = children.filter(Boolean)
  const count = items.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return
    const t = setInterval(next, Math.max(2, intervalSeconds) * 1000)
    return () => clearInterval(t)
  }, [autoPlay, paused, intervalSeconds, count, next])

  if (count === 0) return null
  if (count === 1) return <div>{items[0]}</div>

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{transform: `translateX(-${index * 100}%)`}}
        >
          {items.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md flex items-center justify-center text-2xl leading-none"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md flex items-center justify-center text-2xl leading-none"
          >
            ›
          </button>
        </>
      )}

      {showDots && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-red-500' : 'w-4 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
