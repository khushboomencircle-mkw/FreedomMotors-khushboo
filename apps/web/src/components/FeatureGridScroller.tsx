'use client'

import React, {useRef, useState, useEffect, useCallback} from 'react'
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
  cardGap: string
  overlay: string
  hoverReveal: boolean
  highlightColor?: string
  showScrollArrows: boolean
  showScrollLine: boolean
  cardRadius: number
  playButtonText: string
  playButtonImageUrl?: string
  showAccentBar: boolean
  accentBarColor?: string
  cardWidthPreset?: string
  cardContentPosition?: string
  cardContentPaddingTop?: number
  cardContentPaddingLeft?: number
}

const CARD_OVERLAY_MAP: Record<string, string> = {
  transparent: 'transparent',
  light: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)',
  medium:
    'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)',
  strong:
    'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.25) 100%)',
}

const CARD_WIDTH_MAP: Record<string, string> = {
  narrow: 'clamp(200px, 22vw, 300px)',
  normal: 'clamp(260px, 30vw, 400px)',
  wide: 'clamp(320px, 38vw, 520px)',
  full: '90vw',
}

function PlayButton({accent, label, imageUrl}: {accent: string; label: string; imageUrl?: string}) {
  return (
    <div
      className="absolute bottom-0 left-0 p-6 flex items-center gap-3 pointer-events-none"
      aria-hidden
    >
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-xl flex-shrink-0 overflow-hidden"
        style={{background: imageUrl ? 'transparent' : accent || '#dc2626'}}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Play" className="w-full h-full object-cover" />
        ) : (
          <span className="pl-1">▶</span>
        )}
      </span>
      {label && (
        <span className="text-white font-bold text-sm uppercase tracking-widest drop-shadow">
          {label}
        </span>
      )}
    </div>
  )
}

export default function FeatureGridScroller({
  features,
  cardHeight,
  cardGap,
  overlay,
  hoverReveal,
  highlightColor,
  showScrollArrows,
  showScrollLine,
  cardRadius,
  playButtonText,
  playButtonImageUrl,
  showAccentBar,
  accentBarColor,
  cardWidthPreset,
  cardContentPosition,
  cardContentPaddingTop,
  cardContentPaddingLeft,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  // If the mouse moved far enough to actually scroll, the browser may not fire
  // a click on the card below — suppress the next click so opening a video
  // lightbox after a drag doesn't happen by accident; allow click freely when
  // the pointer barely moved (treat as tap, not drag).
  const hasDragged = useRef(false)
  const suppressNextClick = useRef(false)
  const DRAG_THRESHOLD = 5

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const {scrollLeft: cur, scrollWidth, clientWidth} = el
    const maxScroll = scrollWidth - clientWidth
    setCanScrollLeft(cur > 1)
    setCanScrollRight(cur < maxScroll - 1)
    setProgress(maxScroll > 0 ? Math.max(0, Math.min(1, cur / maxScroll)) : 0)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Run once on mount to set initial arrow state
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, {passive: true})
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    isDragging.current = true
    startX.current = e.pageX - el.offsetLeft
    scrollLeft.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const el = scrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const dx = x - startX.current
    // Skip tiny jitter below threshold — keeps clicks on video cards reliable.
    if (Math.abs(dx) < DRAG_THRESHOLD) return
    hasDragged.current = true
    el.scrollLeft = scrollLeft.current - dx * 1.2
  }

  const stopDrag = () => {
    if (hasDragged.current) suppressNextClick.current = true
    isDragging.current = false
    hasDragged.current = false
    const el = scrollRef.current
    if (!el) return
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  }

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({left: dir === 'right' ? amount : -amount, behavior: 'smooth'})
  }

  const renderCard = (f: Feature, key: string) => {
    const isVideo = f.mediaType === 'video'
    const accent = f.accentColor || '#dc2626'
    // Independent of the play-button's accent above — Accent Bar Color only
    // ever affects the bar, including the explicit "transparent" (no color)
    // choice, which should never also hide the play button.
    const barColor = accentBarColor || f.accentColor || '#dc2626'
    const hoverTint = highlightColor ? `${highlightColor}38` : `${f.accentColor || '#dc2626'}38`
    const bgUrl = isVideo ? f.videoThumbnail?.url : f.image?.url
    const cardW = CARD_WIDTH_MAP[cardWidthPreset || 'normal']
    const contentIsTop = cardContentPosition === 'top'
    const padTop = cardContentPaddingTop ?? 24
    const padLeft = cardContentPaddingLeft ?? 24
    const contentStyle: React.CSSProperties = contentIsTop
      ? {position: 'absolute', top: `${padTop}px`, left: `${padLeft}px`, right: `${padLeft}px`}
      : {position: 'absolute', bottom: 0, left: 0, right: 0, padding: `24px ${padLeft}px`}

    const cardInner = (
      <div
        className="relative overflow-hidden flex-none group bg-gray-900"
        style={{
          width: cardW,
          height: cardHeight,
          scrollSnapAlign: 'start',
          borderRadius: `${cardRadius}px`,
        }}
      >
        {bgUrl && (
          <img
            src={bgUrl}
            alt={(isVideo ? f.videoThumbnail?.alt : f.image?.alt) || f.title || 'Feature'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
        )}
        {overlay !== 'transparent' && (
          <div className="absolute inset-0" style={{background: overlay}} aria-hidden />
        )}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{background: hoverTint}}
        />
        {isVideo && (
          <PlayButton accent={accent} label={playButtonText} imageUrl={playButtonImageUrl} />
        )}
        <div className="flex flex-col gap-3" style={contentStyle}>
          {f.title && (
            <div className="flex items-stretch gap-4">
              {showAccentBar && (
                <span
                  aria-hidden
                  className="shrink-0 self-stretch"
                  style={{width: '4px', background: barColor, borderRadius: '2px'}}
                />
              )}
              <h3 className="text-white font-extrabold leading-tight text-2xl min-w-0">
                {f.title}
              </h3>
            </div>
          )}
          {f.description && (
            <RichText
              value={f.description}
              className={
                hoverReveal
                  ? 'text-gray-200 text-sm leading-relaxed overflow-hidden max-h-0 opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:max-h-48 group-hover:opacity-100 group-hover:translate-y-0'
                  : 'text-gray-200 text-sm leading-relaxed'
              }
            />
          )}
        </div>
      </div>
    )

    if (isVideo && (f.videoUrl || f.videoFileUrl)) {
      return (
        <div key={key} style={{flexShrink: 0}}>
          <VideoLightbox trigger={cardInner} videoUrl={f.videoUrl} videoFileUrl={f.videoFileUrl} />
        </div>
      )
    }

    const href = f.linkUrl || f.link?.endpoint
    return (
      <div key={key} style={{flexShrink: 0}}>
        {href ? (
          <Link
            href={href}
            target={f.openInNewTab || f.link?.openInNewTab ? '_blank' : undefined}
            className="block"
            draggable={false}
          >
            {cardInner}
          </Link>
        ) : (
          cardInner
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {showScrollArrows && canScrollLeft && (
        <button
          aria-label="Scroll left"
          onClick={() => scrollBy('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-150 hover:bg-red-600 hover:text-white"
        >
          ←
        </button>
      )}
      {showScrollArrows && canScrollRight && (
        <button
          aria-label="Scroll right"
          onClick={() => scrollBy('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4 w-10 h-10 rounded-full bg-white/90 text-gray-900 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-150 hover:bg-red-600 hover:text-white"
        >
          →
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          gap: cardGap,
          cursor: features.length > 1 ? 'grab' : 'default',
          scrollSnapType: 'x mandatory',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onClickCapture={(e) => {
          if (suppressNextClick.current) {
            suppressNextClick.current = false
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        {features.map((f) => renderCard(f, f._key))}
      </div>

      {showScrollLine && (canScrollLeft || canScrollRight || progress > 0) && (
        <div className="mt-4 w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-100"
            style={{width: `${Math.round(progress * 100)}%`}}
          />
        </div>
      )}
    </div>
  )
}
