import {cache} from 'react'
import {createClient, type QueryParams} from 'next-sanity'
import {draftMode} from 'next/headers'

const isProduction = process.env.NODE_ENV === 'production'

// Public, non-secret identifiers (same convention Sanity's own templates
// use) — <SanityLive />/<VisualEditing /> connect straight from the browser,
// so these end up in client-side JS regardless. Falls back to this repo's
// current dev project so nothing breaks before these are set; a real
// deployment (e.g. the client's own Sanity project) sets both instead.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sp8bk444'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  // Production reads go through Sanity's edge CDN (fast). In development we skip
  // the CDN and read the live API, so a published change is visible immediately
  // instead of waiting for the CDN's cache to turn over (s-maxage=60 plus
  // stale-while-revalidate).
  useCdn: isProduction,
  perspective: 'published',
})

/**
 * Draft-mode variant of `client`, used only while a Presentation Tool preview
 * is open (see the `/api/draft-mode` routes and `<VisualEditing />` in
 * layout.tsx). Reads the `drafts` perspective — unpublished edits — straight
 * from the live API (drafts are never on the CDN), and stega-encodes string
 * results so `<VisualEditing />` can trace each one back to the field that
 * produced it and overlay a click-to-edit affordance.
 *
 * Reading drafts is an authenticated operation, so this needs
 * `SANITY_API_READ_TOKEN` — a token with at least Viewer rights, created in
 * sanity.io/manage for this project and set as a server-only env var.
 * `/api/draft-mode/enable` refuses to turn draft mode on at all until that's
 * set (see that route). The fallback in `sanityFetch` below is for the
 * narrower case of a token that's since been revoked or had its rights
 * lowered — a failed draft read falls back to the published client instead of
 * breaking an already-open preview.
 */
/**
 * Field names that are genuinely visible prose — written by an editor, read
 * by a visitor, and safe to stega-encode so <VisualEditing /> can turn a
 * click on the rendered text into "open this field in Studio".
 *
 * Everything else in the schema is layout/control data: enums like
 * `imageLayout`, `textPosition`, `featureDisplayMode`, `cardWidthPreset`;
 * dimensions and style tokens like `width` (border thickness), `radius`,
 * `sides`; colors; URLs. PageSection.tsx compares dozens of these with
 * `===` to decide which layout branch to render (e.g.
 * `section.textPosition === 'besideImage'`). Stega hides zero-width
 * characters inside a string — it still *looks* like "besideImage" but no
 * longer *is* "besideImage", so every such comparison silently goes false.
 * The result: whole sections appear to vanish, reorder, or fall back to an
 * unintended layout, but only in preview — published reads never carry
 * stega, so this never shows up there. Restricting encoding to an explicit
 * allowlist, rather than trying to deny-list every control field (a list
 * that grows every time a new enum field is added to the schema), makes
 * this safe by default: a newly added layout field is simply never stega'd
 * unless someone deliberately adds it here.
 */
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
  // NOT 'question' or 'playButtonText': both are the literal, only visible
  // text of their own click target (the FAQ accordion's toggle row; the
  // slider/play-button card's "trigger" element) — stega-encoding them puts
  // <VisualEditing />'s click-to-edit overlay exactly on top of that control,
  // so a click opens Studio instead of toggling the accordion or firing the
  // video lightbox. Every other field here sits beside, not on top of, the
  // thing it would shadow.
  //
  // 'sectionHeading'/'heading' stay in this set (and so does 'title', for the
  // common case of a page's own title) — they're each a click target only in
  // one specific, narrow situation (a section with "Is Expandable" turned on,
  // whose own heading doubles as the expand/collapse toggle), which this
  // allowlist can't see: the filter only gets a field's own path, not whether
  // a sibling `expandable` field is true. Rather than lose click-to-edit on
  // every section heading site-wide to guard that one toggle, PageSection.tsx
  // strips stega with `stegaClean()` right where it builds that toggle's
  // label — see the `ExpandableSection` call there.
])

/**
 * `title`/`description`/`badge`/`stepBadge` sit inside Feature Grid's and
 * Cards Grid's own card content — and every card is a click target: either
 * `<VideoLightbox trigger={cardInner}>` (a <button>), `<Link>` (an
 * "openLink" card action), or the drag-to-scroll container in
 * FeatureGridScroller.tsx (a mousedown/mousemove region covering the whole
 * card, used in "Horizontal Scroll" display mode). Stega-encoding those four
 * fields there puts <VisualEditing />'s click-to-edit overlay on top of that
 * same clickable/draggable area, so clicking a card opens Studio instead of
 * firing the video lightbox or navigating the link, and starting a drag on a
 * card's title/description doesn't scroll it (the overlay eats the
 * mousedown before it reaches the scroll container). Every *other* use of
 * these four field names (a page's own title, a standard section's heading/
 * description, a FAQ item's badge, etc.) isn't inside a click target, so it
 * stays stega'd via the allowlist above — only occurrences nested under a
 * `features` or `cards` array (Feature Grid's and Cards Grid's card lists;
 * no other array in the schema uses either name) are excluded here.
 */
const SHADOWED_CARD_FIELDS = new Set(['title', 'description', 'badge', 'stepBadge'])
const CARD_ARRAY_ANCESTORS = new Set(['features', 'cards'])

const draftClient = client.withConfig({
  useCdn: false,
  perspective: 'drafts',
  token: process.env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: true,
    studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
    filter: (props) => {
      const endPath = props.resultPath.at(-1)
      if (typeof endPath !== 'string' || !STEGA_TEXT_FIELDS.has(endPath)) return false
      if (
        SHADOWED_CARD_FIELDS.has(endPath) &&
        props.resultPath.some((segment) => typeof segment === 'string' && CARD_ARRAY_ANCESTORS.has(segment))
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

/**
 * True only inside a request where Presentation Tool's preview has turned
 * draft mode on. `draftMode()` has no request to read a cookie from during
 * build-time work like `generateStaticParams`, so this treats that case (and
 * any other call outside a request) as "not in draft mode" rather than
 * throwing — generateStaticParams must always resolve published slugs.
 */
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

/**
 * Runs the query with retries. Wrapped in React's `cache` so the same query +
 * params + perspective is fetched once per request — `generateMetadata` and
 * the page body both ask for the same document, and (now that metadata is no
 * longer held in a 15-minute `use cache`) they would otherwise hit Sanity
 * twice. A new request gets a new cache, so nothing here outlives a render.
 *
 * Throws once every attempt has failed; `sanityFetch` decides whether to turn
 * that into a fallback.
 *
 * - Retries transient failures (network blips, CDN hiccups, rate limits) so a
 *   momentary error doesn't surface at all. Retries are immediate — a
 *   setTimeout delay is unsafe during Next.js prerendering (the deferred fetch
 *   rejects once the prerender completes).
 * - Logs a useful, serialized error only after all attempts fail.
 */
const fetchWithRetry = cache(async (query: string, paramsKey: string, retries: number, draft: boolean) => {
  const params: QueryParams = JSON.parse(paramsKey)
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
})

interface FetchOptions<T> {
  /** When the query ultimately fails, return this instead of throwing. */
  fallback?: T
  /** Number of extra attempts after the first (default 2 → 3 total). */
  retries?: number
}

/**
 * Resilient wrapper around client.fetch. Automatically reads the `drafts`
 * perspective — with stega-encoded results for `<VisualEditing />` — whenever
 * called from a request where Presentation Tool's preview is active. Every
 * caller (all ~15 `getXPage()` functions in queries.ts) gets this for free;
 * none of them need to know about draft mode themselves.
 *
 * - Retries transient failures (see `fetchWithRetry`).
 * - In draft mode, a failed draft read (most likely: `SANITY_API_READ_TOKEN`
 *   isn't set yet, or lacks rights) falls back to the published client rather
 *   than breaking the page — so turning on preview before that token exists
 *   degrades to "shows published content" instead of an error page.
 * - If a `fallback` is given, returns it instead of throwing — used for
 *   non-critical site chrome (settings, nav) so one bad request can't take the
 *   whole site down. Without a fallback it throws a typed SanityFetchError,
 *   which the nearest error boundary (error.tsx / global-error.tsx) renders.
 */
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
