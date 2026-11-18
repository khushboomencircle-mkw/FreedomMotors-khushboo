'use client'

import {useState} from 'react'
import {X, Copy, Check} from 'lucide-react'
import ModalShell from './ModalShell'

/**
 * Share modal — Modal Backdrop (dark overlay), Modal Dialog (light box, by
 * design — readable regardless of the site's own dark theme), Modal Close
 * Button, Modal Title, and the shareable URL as the Modal Body.
 *
 * The URL shown is just the current address bar — including whatever filter
 * query params it carries (see VehiclesPage) — there's no separate
 * server-generated "share link" to produce yet.
 */
export default function ShareResultsModal({open, onClose}: {open: boolean; onClose: () => void}) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // Each time the modal opens: capture the current address and clear any
  // leftover "Copied" state. Done during render (tracking the previous `open`)
  // rather than in an effect, so there's no extra render pass with stale values.
  // `open` can only flip to true from a click on the client, so `window` exists.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setUrl(window.location.href)
      setCopied(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the URL
      // is still selectable in the field below, so copying by hand always
      // works as a fallback.
    }
  }

  return (
    // ModalShell is the Modal Backdrop (dark overlay) and handles Escape, focus and scroll lock.
    <ModalShell
      open={open}
      onClose={onClose}
      label="Share these results"
      hideCloseButton
      backdropClassName="bg-black/60"
    >
      {/* Modal Dialog */}
      <div className="relative w-[min(calc(100vw-2rem),28rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white p-6 text-gray-900 shadow-2xl">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <h2 className="pr-10 text-lg font-bold">Share these results</h2>
        <p className="mt-1 text-sm text-gray-500">Copy the link below to share this search.</p>

        {/* Modal Body */}
        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Shareable link"
            className="min-w-0 w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base text-gray-700 pointer-fine:text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="tap-target inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
