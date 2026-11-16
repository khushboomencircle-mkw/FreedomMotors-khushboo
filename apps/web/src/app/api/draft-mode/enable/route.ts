import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {client} from '@/sanity/client'

/**
 * Entry point for Presentation Tool's preview (`previewUrl.previewMode.enable`
 * in the Studio's `sanity.config.ts`) and for shared preview links.
 *
 * `defineEnableDraftMode` validates the one-time `sanity-preview-secret` query
 * param Studio attaches to this URL (via `@sanity/preview-url-secret`) before
 * turning draft mode on — without a valid secret it responds 401, so this
 * can't be used to view drafts just by guessing the URL. It also sets the
 * draft-mode cookie with the `Partitioned` attribute when loaded inside
 * Presentation Tool's cross-site iframe, so Safari keeps it.
 *
 * Needs `SANITY_API_READ_TOKEN` (Viewer role or above, created in
 * sanity.io/manage — see apps/web/.env.local.example) to validate that secret
 * and to read drafts at all. `validatePreviewUrl` throws synchronously if the
 * client it's given has no token, so that case is handled explicitly below
 * instead of surfacing as an unhandled 500.
 */

// Always serve dynamically — this route reads and writes cookies (draft-mode
// cookie, __prerender_bypass). In Next.js 16 with cacheComponents:true,
// GET route handlers that look static can be pre-rendered at build time,
// which breaks any handler that touches request-scoped cookies or headers.

const token = process.env.SANITY_API_READ_TOKEN
const enableDraftMode = token
  ? defineEnableDraftMode({
      client: client.withConfig({token, useCdn: false}),
    })
  : null

export async function GET(request: Request) {
  if (!enableDraftMode) {
    return new Response(
      "Preview isn't configured yet: SANITY_API_READ_TOKEN is missing.\n" +
        'Create a Viewer-role API token for this project in sanity.io/manage, ' +
        "then set SANITY_API_READ_TOKEN in the web app's environment and restart " +
        'both apps. See apps/web/.env.local.example.',
      {status: 500},
    )
  }
 try {
    return await enableDraftMode.GET(request)
  } catch (err) {
    // Next.js redirect() throws NEXT_REDIRECT internally.
    // It must be rethrown, not converted into a 503 response.
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err
    }

    console.error('[Draft Mode] Enable failed:', err)

    return new Response(
      'Draft mode could not be enabled. Check the Next.js server logs.',
      {status: 503},
    )
  }
}
