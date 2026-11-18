'use client'

import {useState} from 'react'
import ModalShell from './ModalShell'

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

  const isFile = Boolean(videoFileUrl)
  const embedSrc = isFile ? videoFileUrl! : toEmbedUrl(videoUrl || '')

  // The overlay is ModalShell: it is portaled to <body>, so CSS `transform` on any ancestor (e.g.
  // the FeatureHeroSlider's translated flex track) cannot trap `position: fixed`, and it is the
  // highest layer in the app, above every other component.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block h-full w-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        {trigger}
      </button>

      <ModalShell open={open} onClose={() => setOpen(false)} label="Video">
        {/* 16:9, as wide as the screen allows but never taller than it (dvh) — so on a phone held
            sideways the whole video and its controls stay visible. */}
        <div
          className="aspect-video bg-black"
          style={{width: 'min(calc(100vw - 2rem), 64rem, calc((100dvh - 2rem) * 16 / 9))'}}
        >
          {isFile ? (
            <video
              src={embedSrc}
              controls
              autoPlay
              playsInline
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
      </ModalShell>
    </>
  )
}
