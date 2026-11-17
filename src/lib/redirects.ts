import {client} from '@/sanity/client'

export type RedirectEntry = {destination: string; permanent: boolean}
export type RedirectMap = Record<string, RedirectEntry>

/** The single Global Config key the whole flattened map is stored under. */
export const GLOBAL_CONFIG_REDIRECTS_KEY = 'redirects'

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

function vercelApiHeaders(): HeadersInit {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error('VERCEL_API_TOKEN is not set.')
  return {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}
}

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

export async function syncRedirects(): Promise<SyncResult> {
  const raw = await fetchPublishedRedirects()
  const {map, dropped} = flattenRedirects(raw)
  await writeRedirectMap(map)
  return {count: Object.keys(map).length, dropped, map}
}
