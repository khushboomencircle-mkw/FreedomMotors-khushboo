'use client'

import {useEffect, useState} from 'react'
import {X, Copy, Check} from 'lucide-react'

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

  // Close on Escape, same as any other modal.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* Modal Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-2xl">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <h2 id="share-modal-title" className="pr-8 text-lg font-bold">
          Share these results
        </h2>
        <p className="mt-1 text-sm text-gray-500">Copy the link below to share this search.</p>

        {/* Modal Body */}
        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full truncate rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
