/**
 * Blog post visibility rule, shared by every blog query so they can't disagree. Plain strings (no
 * imports) so it can be tested alone. Evaluated per blogPost document.
 *
 * `$preview` is injected by sanityFetch and is true only while the `drafts` perspective is really
 * being read (see client.ts). A post is visible at /<landing slug>/<post slug> when:
 *  - live: the post is published and Active, AND its landing page is published and Page Active;
 *  - preview: the post and landing page just have to exist (draft-only, or either switched off,
 *    still shows so editors can review).
 *
 * Live reads use the `published` perspective, where a draft-only landing page can't be
 * dereferenced at all (`landingPage->` is null), so no extra clause is needed for it. A reference
 * always holds the landing page's published id, and in the `drafts` perspective documents come
 * back with that same id, so the dereference also resolves for a landing page that is still a draft.
 * A post whose landing page can't be resolved never shows.
 */
export const BLOG_POST_VISIBLE = `(
  defined(landingPage->slug.current)
  && ($preview || isActive != false)
  && ($preview || landingPage->isActive == true)
)`
