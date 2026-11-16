'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import VideoLightbox from './VideoLightbox'
import RichText from './RichText'

interface Feature {
  _key: string
  title?: string
  description?: string | any[]
  mediaType?: 'image' | 'video'
  image?: {url?: string; alt?: string}
  videoFileUrl?: string
  videoUrl?: string
  videoThumbnail?: {url?: string; alt?: string}
  accentColor?: string
  linkUrl?: string
  link?: {title?: string; label?: string; endpoint?: string; openInNewTab?: boolean}
  openInNewTab?: boolean
}

interface Props {
  features: Feature[]
  cardHeight: string
  overlay: string
  hoverReveal: boolean
  showArrows: boolean
  showDots: boolean
  autoPlay: boolean
  intervalSeconds: number
  showAccentBar: boolean
  accentBarColor?: string
  playButtonText: string
  playButtonImageUrl?: string
  cardContentPosition?: string
  cardContentPaddingTop?: number
  cardContentPaddingLeft?: number
}

const SLIDE_MS = 750
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

function ArrowButton({dir, onClick}: {dir: 'prev' | 'next'; onClick: () => void}) {
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
      onClick={onClick}
      className="absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-red-600 shadow-lg transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-12 sm:w-12"
      style={dir === 'prev' ? {left: 'clamp(12px, 2vw, 28px)'} : {right: 'clamp(12px, 2vw, 28px)'}}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/**
 * Full-width, one-slide-at-a-time slider for the Feature Grid in Horizontal
 * Scroll mode with Card Width = Full Screen. Loops seamlessly (edge clones),
 * supports auto-slide (pauses on hover/touch), swipe, arrows and dots.
 */
export default function FeatureHeroSlider({
  features,
  cardHeight,
  overlay,
  hoverReveal,
  showArrows,
  showDots,
  autoPlay,
  intervalSeconds,
  showAccentBar,
  accentBarColor,
  playButtonText,
  playButtonImageUrl,
  cardContentPosition,
  cardContentPaddingTop,
  cardContentPaddingLeft,
}: Props) {
  const n = features.length
  const loop = n > 1
  // [last, ...all, first] so wrapping slides in the same direction.
  const slides = loop ? [features[n - 1], ...features, features[0]] : features

  const [pos, setPos] = useState(loop ? 1 : 0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const posRef = useRef(pos)
  const busyRef = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchX = useRef<number | null>(null)

  const commit = useCallback((next: number) => {
    posRef.current = next
    setPos(next)
  }, [])

  // After landing on a clone, jump (without animation) to the real slide.
  const settle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    busyRef.current = false
    if (!loop) return
    if (posRef.current === 0) {
      setAnimate(false)
      commit(n)
    } else if (posRef.current === n + 1) {
      setAnimate(false)
      commit(1)
    }
  }, [loop, n, commit])

  // Re-enable the transition on the frame after an instant jump.
  useEffect(() => {
    if (animate) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [animate])

  const move = useCallback(
    (to: number) => {
      if (!loop || busyRef.current) return
      busyRef.current = true
      setAnimate(true)
      commit(to)
      // Safety net in case transitionend never fires (hidden tab, reduced motion).
      if (settleTimer.current) clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(settle, SLIDE_MS + 150)
    },
    [loop, commit, settle],
  )

  const next = useCallback(() => move(posRef.current + 1), [move])
  const prev = useCallback(() => move(posRef.current - 1), [move])

  useEffect(() => {
    if (!autoPlay || !loop || paused) return
    const id = setInterval(
      () => {
        if (document.visibilityState === 'visible') next()
      },
      Math.max(2, intervalSeconds) * 1000,
    )
    return () => clearInterval(id)
  }, [autoPlay, loop, paused, intervalSeconds, next])

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    },
    [],
  )

  const activeIndex = loop ? (pos - 1 + n) % n : 0

  const padLeft = cardContentPaddingLeft ?? 24
  const padTop = cardContentPaddingTop ?? 24
  const contentIsTop = cardContentPosition === 'top'
  // Align content with the site container on wide screens, never closer than padLeft.
  const sidePad = `max(${padLeft}px, calc((100% - 80rem) / 2 + ${padLeft}px))`

  const renderSlide = (f: Feature, i: number) => {
    const isClone = loop && (i === 0 || i === slides.length - 1)
    const isVideo = f.mediaType === 'video'
    const accent = f.accentColor || '#dc2626'
    // Independent of the play-button accent above — Accent Bar Color only
    // ever affects the bar, including the explicit "transparent" (no color)
    // choice, which should never also hide the play button.
    const barColor = accentBarColor || f.accentColor || '#dc2626'
    const bgUrl = isVideo ? f.videoThumbnail?.url : f.image?.url
    const href = f.linkUrl || f.link?.endpoint

    const inner = (
      <div className="group relative h-full w-full overflow-hidden bg-gray-900">
        {bgUrl && (
          <img
            src={bgUrl}
            alt={(isVideo ? f.videoThumbnail?.alt : f.image?.alt) || f.title || ''}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            loading={i <= 1 ? 'eager' : 'lazy'}
          />
        )}
        {overlay !== 'transparent' && (
          <div className="absolute inset-0" style={{background: overlay}} aria-hidden />
        )}

        {isVideo && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <span
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-2xl text-white shadow-xl"
              style={{background: playButtonImageUrl ? 'transparent' : accent}}
            >
              {playButtonImageUrl ? (
                <img src={playButtonImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="pl-1">▶</span>
              )}
            </span>
            {playButtonText && (
              <span className="ml-3 text-sm font-bold uppercase tracking-widest text-white drop-shadow">
                {playButtonText}
              </span>
            )}
          </div>
        )}

        {(f.title || f.description) && (
          <div
            className="absolute flex flex-col gap-3"
            style={
              contentIsTop
                ? {top: padTop, left: sidePad, right: sidePad}
                : {
                    bottom: 0,
                    left: sidePad,
                    right: sidePad,
                    paddingTop: 24,
                    paddingBottom: 'clamp(32px, 6vw, 72px)',
                  }
            }
          >
            {f.title && (
              <div className="flex items-stretch gap-4">
                {showAccentBar && (
                  <span
                    aria-hidden
                    className="shrink-0 self-stretch"
                    style={{width: 4, background: barColor, borderRadius: 2}}
                  />
                )}
                <h3
                  data-sanity-edit-target
                  className="min-w-0 text-3xl font-extrabold leading-tight text-white drop-shadow sm:text-5xl"
                >
                  {f.title}
                </h3>
              </div>
            )}
            {f.description && (
              <RichText
                value={f.description}
                className={
                  hoverReveal
                    ? 'max-w-2xl translate-y-2 overflow-hidden text-base leading-relaxed text-gray-100 opacity-0 transition-all duration-300 ease-out max-h-0 group-hover:max-h-48 group-hover:translate-y-0 group-hover:opacity-100 sm:text-lg'
                    : 'max-w-2xl text-base leading-relaxed text-gray-100 sm:text-lg'
                }
              />
            )}
          </div>
        )}
      </div>
    )

    let body: React.ReactNode = inner
    if (isVideo && (f.videoUrl || f.videoFileUrl)) {
      body = <VideoLightbox trigger={inner} videoUrl={f.videoUrl} videoFileUrl={f.videoFileUrl} />
    } else if (href) {
      body = (
        <Link
          href={href}
          target={f.openInNewTab || f.link?.openInNewTab ? '_blank' : undefined}
          rel={f.openInNewTab || f.link?.openInNewTab ? 'noopener noreferrer' : undefined}
          className="block h-full w-full"
          draggable={false}
          tabIndex={isClone ? -1 : undefined}
        >
          {inner}
        </Link>
      )
    }

    return (
      <div
        key={`${f._key}-${i}`}
        className="h-full w-full flex-none"
        style={{flexBasis: '100%'}}
        aria-hidden={isClone || undefined}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{height: `min(${cardHeight}, 80vh)`, minHeight: 280}}
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
        setPaused(true)
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        setPaused(false)
        if (start == null) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
      }}
    >
      <div
        className="flex h-full will-change-transform"
        style={{
          transform: `translate3d(-${pos * 100}%, 0, 0)`,
          transition: animate ? `transform ${SLIDE_MS}ms ${EASE}` : 'none',
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget) settle()
        }}
      >
        {slides.map(renderSlide)}
      </div>

      {showArrows && loop && (
        <>
          <ArrowButton dir="prev" onClick={prev} />
          <ArrowButton dir="next" onClick={next} />
        </>
      )}

      {showDots && loop && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {features.map((f, i) => (
            <button
              key={f._key}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => move(i + 1)}
              className="h-2 rounded-full bg-white transition-all duration-300"
              style={{width: i === activeIndex ? 28 : 8, opacity: i === activeIndex ? 1 : 0.5}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
