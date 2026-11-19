/**
 * Trustindex (Google reviews widget) — the one place that knows how the widget is mounted.
 *
 * Trustindex serves ONE public loader script for every customer; which widget to draw is decided by the widget ID
 * on the element it should fill. The loader looks for any element whose `src` / `data-src` contains
 * "trustindex" and "loader.js", takes the ID from what follows the "?", fetches that widget and draws it in
 * that element's place. So the only thing the client has to give us is the widget ID (Sanity: the Google Reviews
 * section's "Trustindex Widget ID") — there is no separate install URL and no environment variable.
 *
 * Used by the website (PageSection.tsx) and by Studio (googleReviewsSection.ts), so both agree on what a valid ID is.
 */

/** Trustindex's public loader script (shared by every widget). */
export const TRUSTINDEX_LOADER_SRC = 'https://cdn.trustindex.io/loader.js'

/** The `data-pid` / ID value from the embed code: letters and digits only. */
const WIDGET_ID = /^[A-Za-z0-9]{16,64}$/

/** True when `value` is a bare widget ID (nothing else around it). */
export function isTrustindexWidgetId(value: unknown): boolean {
  return typeof value === 'string' && WIDGET_ID.test(value)
}

/**
 * Finds the widget ID in whatever an editor pasted: the bare ID, the whole embed snippet, or the loader URL.
 * Returns undefined when there is no ID in it.
 */
export function extractTrustindexWidgetId(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  const text = input.trim()
  if (isTrustindexWidgetId(text)) return text
  const found =
    text.match(/loader\.js\?([A-Za-z0-9]{16,64})(?![A-Za-z0-9])/) ??
    text.match(/data-pid\s*=\s*["']([A-Za-z0-9]{16,64})["']/)
  return found?.[1]
}

/** The address the loader reads the widget ID from, or undefined when `widgetId` is not a usable ID. */
export function trustindexWidgetSrc(widgetId: unknown): string | undefined {
  const id = extractTrustindexWidgetId(widgetId)
  return id ? `${TRUSTINDEX_LOADER_SRC}?${id}` : undefined
}
