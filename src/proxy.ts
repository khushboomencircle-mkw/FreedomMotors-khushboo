import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {get} from '@vercel/global-config'
import {GLOBAL_CONFIG_REDIRECTS_KEY, normalizePath, type RedirectMap} from '@/lib/redirects'

/**
 * Studio-editable redirects, looked up against the map `/api/redirects/sync`
 * (and `npm run redirects:sync`) writes to Vercel's Global Config — see
 * src/lib/redirects.ts. A failed or missing lookup must never take the site
 * down, so any error here just falls through to normal routing, exactly as
 * if no redirect existed for that path.
 */
export async function proxy(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname)

  try {
    const map = await get<RedirectMap>(GLOBAL_CONFIG_REDIRECTS_KEY)
    const entry = map?.[pathname]

    if (entry) {
      const destination = new URL(entry.destination, request.url)
      // Layer the incoming query string on top of the destination's own
      // (if the stored destination has none, this is just a copy).
      for (const [key, value] of request.nextUrl.searchParams) {
        if (!destination.searchParams.has(key)) destination.searchParams.set(key, value)
      }
      return NextResponse.redirect(destination, entry.permanent ? 308 : 307)
    }
  } catch (err) {
    console.error('[proxy] redirect lookup failed', err)
  }

  return NextResponse.next()
}

export const config = {
  // Skips /api, /studio, /_next (each on their own or with a sub-path), and
  // any request for a file with an extension (favicon.ico, images, css,
  // js, …) — only page paths go through the redirect lookup above.
  matcher: ['/((?!api(?:/|$)|studio(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)'],
}
