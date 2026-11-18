/**
 * A URL slug without stray slashes. Blog post slugs are meant to be one plain segment ("my-post"), but an editor can type
 * "/my-post" (the stored value then makes the address /services//my-post, which no route matches). Everything that builds
 * or matches a post address uses this, so such posts still open at /<landing page>/my-post.
 */
export function cleanSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, '')
}
