/**
 * Nav visibility rule: one definition shared by the header, the footer and the custom-page
 * fallback, so the three can never disagree. Plain strings (no imports) so it can be tested alone.
 *
 * `$preview` is injected by sanityFetch and is true only while the `drafts` perspective is really
 * being read. Live reads use the `published` perspective, which cannot see drafts at all, so a
 * draft-only page is invisible there without any extra clause. (In the drafts perspective a
 * document's `_id` comes back without its "drafts." prefix, so an `_id` check can't tell them apart.)
 *
 * A Landing Page counts as visible when:
 *  - live: it is published and Page Active is on;
 *  - preview: it exists at all (draft-only, or Page Active off, still shows so editors can review).
 */
export const LANDING_PAGE_VISIBLE = `($preview || isActive == true)`

/**
 * GROQ condition for one nav link (its own `href`): the link has a real page behind it when it is
 * a built-in page, an external URL, or a visible Landing Page with the matching slug. A link with
 * no page behind it never shows, live or preview.
 */
export const NAV_LINK_HAS_PAGE = `(
  href in $builtIn
  || string::startsWith(href, "http")
  || count(*[_type == "customPage" && "/" + slug.current == ^.href && ${LANDING_PAGE_VISIBLE}]) > 0
)`
