import {Loader2} from 'lucide-react'

/**
 * Full-page loading overlay — shown in place of the vehicle listing while its
 * data is being fetched (e.g. navigating here from any other page). A
 * semi-transparent backdrop over a centered spinner, matching the site's dark
 * theme rather than a light-page overlay.
 */
export default function LoadingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full items-center justify-center bg-[#121212]/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3 text-gray-300">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" aria-hidden />
        <span className="text-sm font-medium">Loading vehicles…</span>
      </div>
    </div>
  )
}
