import {client} from '@/sanity/client'

export type RedirectEntry = {destination: string; permanent: boolean}
export type RedirectMap = Record<string, RedirectEntry>

type RawRedirect = {source: string; destination: string; permanent: boolean}

const PUBLISHED_REDIRECTS_QUERY = `*[
  _type == "redirect" && isActive != false && defined(source) && defined(destination)
]{source, destination, "permanent": permanent != false}`

export function normalizePath(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '')
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const withoutQueryOrHash = withLeadingSlash.split(/[?#]/)[0]
  const lower = withoutQueryOrHash.toLowerCase()
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower
}

export function splitDestination(raw?: string | null): {key: string; full: string} {
  const value = (raw || '').trim()
  const key = normalizePath(value)
  if (!key || /^https?:\/\//i.test(value)) return {key, full: key}
  const suffixAt = value.search(/[?#]/)
  return {key, full: suffixAt === -1 ? key : key + value.slice(suffixAt)}
}

export function flattenRedirects(raw: RawRedirect[]): {
  map: RedirectMap
  dropped: {source: string; reason: string}[]
} {
  const bySource = new Map<
    string,
    {destination: string; destinationFull: string; permanent: boolean}
  >()
  for (const r of raw) {
    const source = normalizePath(r.source)
    const {key: destination, full: destinationFull} = splitDestination(r.destination)
    if (!source || !destination || source === destination) continue
    bySource.set(source, {destination, destinationFull, permanent: r.permanent})
  }

  const map: RedirectMap = {}
  const dropped: {source: string; reason: string}[] = []

  for (const [source, entry] of bySource) {
    const seen = new Set<string>([source])
    let current = entry.destination
    let finalDestination = entry.destinationFull
    let looped = false

    while (bySource.has(current)) {
      if (seen.has(current)) {
        looped = true
        break
      }
      seen.add(current)
      const next = bySource.get(current)!
      current = next.destination
      finalDestination = next.destinationFull
    }

    if (looped) {
      dropped.push({source, reason: 'part of a redirect loop'})
      continue
    }

    map[source] = {destination: finalDestination, permanent: entry.permanent}
  }

  return {map, dropped}
}

export async function fetchPublishedRedirects(): Promise<RawRedirect[]> {
  return client.fetch<RawRedirect[]>(PUBLISHED_REDIRECTS_QUERY)
}

// ─── Looking redirects up while serving requests ───

/** How long a loaded redirect map is reused. A redirect saved in Studio is live for visitors within this time. */
export const REDIRECT_MAP_TTL_MS = 30_000
/** After a failed load, how long to wait before trying Sanity again (the site keeps working meanwhile). */
export const REDIRECT_RETRY_AFTER_FAILURE_MS = 5_000

/**
 * Builds a function that returns the current redirect map, read from Sanity (the published, active `redirect`
 * documents, flattened — chains collapsed, loops dropped) and kept in memory for `ttlMs`.
 *  - Concurrent callers share one Sanity request.
 *  - If Sanity cannot be reached, the last good map keeps being used (an empty map if there never was one), and
 *    the next attempt is a few seconds later — a failed lookup never takes the site down or stalls every request.
 * `fetchRaw` and `now` are parameters so the caching rules can be tested without a network or a clock.
 */
export function createRedirectMapLoader(
  fetchRaw: () => Promise<RawRedirect[]>,
  options: {ttlMs?: number; now?: () => number} = {},
): () => Promise<RedirectMap> {
  const ttlMs = options.ttlMs ?? REDIRECT_MAP_TTL_MS
  const now = options.now ?? Date.now
  let cached: {loadedAt: number; map: RedirectMap} | null = null
  let inFlight: Promise<RedirectMap> | null = null

  return async function getRedirectMap() {
    if (cached && now() - cached.loadedAt < ttlMs) return cached.map
    if (!inFlight) {
      inFlight = (async () => {
        try {
          const {map} = flattenRedirects(await fetchRaw())
          cached = {loadedAt: now(), map}
          return map
        } catch (err) {
          console.error('[redirects] could not load redirects from Sanity', err)
          // Keep the last good map; try again soon rather than on every request.
          const map = cached?.map ?? {}
          cached = {loadedAt: now() - ttlMs + REDIRECT_RETRY_AFTER_FAILURE_MS, map}
          return map
        } finally {
          inFlight = null
        }
      })()
    }
    return inFlight
  }
}

/** The redirect map the site uses: published Studio redirects, read straight from Sanity (no other service needed). */
export const getRedirectMap = createRedirectMapLoader(fetchPublishedRedirects)
