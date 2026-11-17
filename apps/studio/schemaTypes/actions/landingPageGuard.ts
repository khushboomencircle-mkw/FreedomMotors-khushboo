/**
 * Pure rules behind the Landing Page delete/unpublish guard (see LandingPageGuardActions.tsx).
 * A landing page can't be deleted or unpublished while any Blog Post points at it, because every
 * post under it would then 404.
 */

/**
 * Ids of every Blog Post that points at this landing page. Run with the `raw` perspective so
 * drafts and release versions are included, not only published posts. A post's reference always
 * holds the PUBLISHED id of its landing page, so `$landingPageId` must be the published id.
 */
export const POSTS_FOR_LANDING_PAGE_QUERY = `*[_type == "blogPost" && landingPage._ref == $landingPageId]._id`

/** A post can exist as published + draft (+ release versions); it still counts once. */
export function countDistinctPosts(ids: readonly string[] | null | undefined): number {
  return new Set((ids ?? []).map((id) => id.replace(/^(drafts\.|versions\.[^.]+\.)/, ''))).size
}

export type GuardedAction = 'delete' | 'unpublish'

export function blockedReason(count: number, action: GuardedAction): string {
  const posts = count === 1 ? '1 blog post' : `${count} blog posts`
  const them = count === 1 ? 'it' : 'them'
  return action === 'delete'
    ? `This landing page has ${posts}. Move or delete ${them} first.`
    : `This landing page has ${posts}, so it can't be unpublished. Move or delete ${them} first.`
}

/** Shown while the count is unknown and when the lookup failed: the guard fails closed. */
export const CHECKING_REASON = 'Checking for blog posts on this landing page…'
export const LOOKUP_FAILED_REASON =
  "Couldn't check this landing page for blog posts, so it can't be changed right now. Try again."
