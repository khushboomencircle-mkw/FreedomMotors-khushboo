import {timingSafeEqual} from 'node:crypto'
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {syncRedirects} from '@/lib/redirects'

/**
 * Entry point for the Sanity webhook (Settings → API → Webhooks on
 * manage.sanity.io, configured by hand — see "Redirects" in README.md),
 * fired on publish/unpublish of a `redirect` document. There's no existing
 * webhook-style route in this app to extend (the only other secret-checking
 * route, /api/draft-mode/enable, validates a one-time Presentation Tool
 * query-param secret via next-sanity, which is a different mechanism for a
 * different purpose) — this checks a static shared secret instead, sent as
 * a custom HTTP header the webhook config adds (Sanity's webhook UI lets
 * you attach arbitrary static headers to the request it sends).
 *
 * The webhook's own request body is ignored entirely — this always
 * re-reads every published, active redirect straight from Sanity, so even
 * a replayed or forged request can only trigger a legitimate re-sync of
 * Sanity's own published data, never an arbitrary write.
 */
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.SANITY_REDIRECTS_WEBHOOK_SECRET
  if (!expected) return false

  const provided = request.headers.get('x-sanity-webhook-secret') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  try {
    const {count, dropped} = await syncRedirects()
    return NextResponse.json({ok: true, count, dropped})
  } catch (err) {
    console.error('[redirects:sync] failed', err)
    return NextResponse.json({error: 'Sync failed'}, {status: 500})
  }
}
