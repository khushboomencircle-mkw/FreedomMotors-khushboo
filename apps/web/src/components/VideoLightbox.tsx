'use client'

import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

interface Props {
  trigger: React.ReactNode
  videoUrl?: string
  videoFileUrl?: string
}

function toEmbedUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '')
      return `https://www.youtube.com/embed/${id}?autoplay=1`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace('/', '')
      return `https://player.vimeo.com/video/${id}?autoplay=1`
    }
  } catch {
    return url
  }
  return url
}

export default function VideoLightbox({trigger, videoUrl, videoFileUrl}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const isFile = Boolean(videoFileUrl)
  const embedSrc = isFile ? videoFileUrl! : toEmbedUrl(videoUrl || '')

  // Portal the overlay to document.body so that CSS `transform` on any ancestor
  // (e.g. the FeatureHeroSlider's translated flex track) cannot create a new
  // containing block for `position: fixed` and push the modal off-screen.
  const modal = open ? (
    <div
      // Highest z-index in the app on purpose: this overlay (and the video
      // iframe inside it) must sit above every other component, including
      // PreviewBar's z-[9999] draft-mode banner — the next value used
      // after that anywhere in the codebase.
      className="fixed inset-0 z-[10000] bg-black/85 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-5xl aspect-video bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close video"
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl leading-none"
        >
          ×
        </button>
        {isFile ? (
          <video
            src={embedSrc}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={embedSrc}
            title="Video"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block h-full w-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        {trigger}
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  )
}
