import {cache} from 'react'
import {createClient, type QueryParams} from 'next-sanity'
import {draftMode} from 'next/headers'
import {requireEnv} from '@/lib/env'

const isProduction = process.env.NODE_ENV === 'production'

const projectId = requireEnv(
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
)
const dataset = requireEnv('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET)

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: isProduction,
  perspective: 'published',
})

const STEGA_TEXT_FIELDS = new Set([
  'sectionHeading',
  'sectionDescription',
  'heading',
  'description',
  'title',
  'label',
  'text', // Portable Text span content (answer[].children[].text)
  'stepBadge',
  'badge',
  'eyebrow',
  'overlayTitle',
  'overlayDescription',
  'footerHeading',
  'buttonLabel',
  'secondaryButtonLabel',
])

const SHADOWED_CARD_FIELDS = new Set(['title', 'description', 'badge', 'stepBadge'])
const CARD_ARRAY_ANCESTORS = new Set(['features', 'cards'])

const draftClient = client.withConfig({
  useCdn: false,
  perspective: 'drafts',
  token: process.env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: true,
    // Studio is embedded at /studio on this same site.
    studioUrl: '/studio',
    filter: (props) => {
      const endPath = props.resultPath.at(-1)
      if (typeof endPath !== 'string' || !STEGA_TEXT_FIELDS.has(endPath)) return false
      if (
        SHADOWED_CARD_FIELDS.has(endPath) &&
        props.resultPath.some(
          (segment) => typeof segment === 'string' && CARD_ARRAY_ANCESTORS.has(segment),
        )
      ) {
        return false
      }
      // Still defer to the built-in safety checks (e.g. don't encode
      // something that's actually a URL or date) for whatever passes the
      // allowlist above.
      return props.filterDefault(props)
    },
  },
})

async function isDraftModeActive(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

/**
 * When reading through the CDN, ask it never to answer with a stale copy while
 * it revalidates in the background — otherwise the first request after a
 * publish can still return the old content. Ignored when `useCdn` is false
 * (dev, and every draft-mode read), so it's safe to pass unconditionally.
 */
const fetchOptions = isProduction ? ({cacheMode: 'noStale'} as const) : undefined

/** Error thrown when a Sanity query fails (network down, API error, timeout). */
export class SanityFetchError extends Error {
  readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'SanityFetchError'
    this.cause = cause
  }
}

/** Pull useful, serializable detail out of whatever the client threw. */
function describeError(err: unknown): Record<string, unknown> {
  const e = err as {
    message?: string
    name?: string
    statusCode?: number
    response?: {statusCode?: number; body?: unknown}
    code?: string
  }
  return {
    name: e?.name,
    message: e?.message || String(err ?? 'Unknown error'),
    statusCode: e?.statusCode ?? e?.response?.statusCode,
    code: e?.code,
  }
}

const fetchWithRetry = cache(
  async (query: string, paramsKey: string, retries: number, draft: boolean) => {
    // `$preview` is reserved: it mirrors the client actually used (true only for the drafts
    // perspective), so a failed draft read that falls back to published also falls back to the
    // strict live rules. Queries may use it; callers can't set it.
    const params: QueryParams = {...JSON.parse(paramsKey), preview: draft}
    const activeClient = draft ? draftClient : client
    let lastErr: unknown

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await activeClient.fetch(query, params, fetchOptions)
      } catch (err) {
        lastErr = err
        // Retry immediately; a transient connection reset often clears at once.
      }
    }

    console.error('[Sanity fetch failed]', {
      query: query.replace(/\s+/g, ' ').trim().slice(0, 140),
      draft,
      ...describeError(lastErr),
    })
    throw new SanityFetchError('Failed to load content from the CMS.', lastErr)
  },
)

interface FetchOptions<T> {
  /** When the query ultimately fails, return this instead of throwing. */
  fallback?: T
  /** Number of extra attempts after the first (default 2 → 3 total). */
  retries?: number
}

// `any` default is intentional: call sites rely on it for untyped queries (a stricter default
// like `unknown` breaks ~100 call sites). Callers can still pass an explicit type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sanityFetch<T = any>(
  query: string,
  params: QueryParams = {},
  options: FetchOptions<T> = {},
): Promise<T> {
  const draft = await isDraftModeActive()
  const paramsKey = JSON.stringify(params)
  const retries = options.retries ?? 2

  try {
    return (await fetchWithRetry(query, paramsKey, retries, draft)) as T
  } catch (err) {
    if (draft) {
      try {
        return (await fetchWithRetry(query, paramsKey, retries, false)) as T
      } catch {
        // Fall through to the fallback/throw below using the original error.
      }
    }
    if ('fallback' in options) {
      return options.fallback as T
    }
    throw err
  }
}
