import {client} from '@/sanity/client'

export type RedirectEntry = {destination: string; permanent: boolean}
export type RedirectMap = Record<string, RedirectEntry>

/** The single Global Config key the whole flattened map is stored under. */
export const GLOBAL_CONFIG_REDIRECTS_KEY = 'redirects'

type RawRedirect = {source: string; destination: string; permanent: boolean}

const PUBLISHED_REDIRECTS_QUERY = `*[
  _type == "redirect" && isActive != false && defined(source) && defined(destination)
]{source, destination, "permanent": permanent != false}`

/**
 * Keep this in sync with apps/studio/schemaTypes/redirectType.ts's
 * `normalizePath` — same algorithm, duplicated because the web app and
 * Studio are separate, independently-deployed packages with no shared
 * module between them. Lowercases, forces a leading slash, strips any
 * query/hash, and drops a trailing slash (except on the root path).
 */
export function normalizePath(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '')
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const withoutQueryOrHash = withLeadingSlash.split(/[?#]/)[0]
  const lower = withoutQueryOrHash.toLowerCase()
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower
}

/**
 * Collapses chains (A → B → C becomes A → C) and drops cycles entirely.
 * Studio's redirectType.ts validation already blocks creating a chain or a
 * loop in the first place, so in the common case every entry here is
 * already a single, direct hop. This pass exists as a defensive second
 * layer for data that predates that validation, or that the bulk CSV
 * import script wrote directly — so a bad record degrades to "dropped from
 * the live map" rather than an infinite redirect or a 500.
 */
export function flattenRedirects(raw: RawRedirect[]): {
  map: RedirectMap
  dropped: {source: string; reason: string}[]
} {
  const bySource = new Map<string, RawRedirect>()
  for (const r of raw) {
    const source = normalizePath(r.source)
    const destination = normalizePath(r.destination)
    if (!source || !destination || source === destination) continue
    bySource.set(source, {source, destination, permanent: r.permanent})
  }

  const map: RedirectMap = {}
  const dropped: {source: string; reason: string}[] = []

  for (const [source, entry] of bySource) {
    const seen = new Set<string>([source])
    let current = entry.destination
    let looped = false

    while (bySource.has(current)) {
      if (seen.has(current)) {
        looped = true
        break
      }
      seen.add(current)
      current = bySource.get(current)!.destination
    }

    if (looped) {
      dropped.push({source, reason: 'part of a redirect loop'})
      continue
    }

    map[source] = {destination: current, permanent: entry.permanent}
  }

  return {map, dropped}
}

export async function fetchPublishedRedirects(): Promise<RawRedirect[]> {
  return client.fetch<RawRedirect[]>(PUBLISHED_REDIRECTS_QUERY)
}

function vercelApiHeaders(): HeadersInit {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error('VERCEL_API_TOKEN is not set.')
  return {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}
}

/**
 * Replaces the whole redirect map in one atomic upsert, rather than writing
 * one Global Config item per path — avoids any risk of this job deleting or
 * colliding with unrelated keys another feature might store in the same
 * Global Config, and keeps a sync either fully applied or not applied at all.
 */
async function writeRedirectMap(map: RedirectMap): Promise<void> {
  const configId = process.env.GLOBAL_CONFIG_ID
  if (!configId) throw new Error('GLOBAL_CONFIG_ID is not set.')

  const url = new URL(`https://api.vercel.com/v1/global-config/${configId}/items`)
  const teamId = process.env.VERCEL_TEAM_ID
  if (teamId) url.searchParams.set('teamId', teamId)

  const res = await fetch(url, {
    method: 'PATCH',
    headers: vercelApiHeaders(),
    body: JSON.stringify({
      items: [{operation: 'upsert', key: GLOBAL_CONFIG_REDIRECTS_KEY, value: map}],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Vercel Global Config update failed (${res.status}): ${body}`)
  }
}

export type SyncResult = {
  count: number
  dropped: {source: string; reason: string}[]
  map: RedirectMap
}

/**
 * The one sync routine both `/api/redirects/sync` (the webhook target) and
 * `npm run redirects:sync` (the by-hand script) call — reads every active,
 * published redirect from Sanity, flattens/drops as above, and writes the
 * result to Vercel's Global Config.
 */
export async function syncRedirects(): Promise<SyncResult> {
  const raw = await fetchPublishedRedirects()
  const {map, dropped} = flattenRedirects(raw)
  await writeRedirectMap(map)
  return {count: Object.keys(map).length, dropped, map}
}
