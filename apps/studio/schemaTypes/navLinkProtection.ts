import {createContext} from 'react'
import type {FormPatch, ValidationContext} from 'sanity'
import {isBuiltInNavHref, normalizeNavHref} from './navConstants'

/**
 * Protected nav links: a link can't be removed (or re-pointed) while a page is behind it.
 * Protected = its href is a built-in page (navConstants.ts), or a Landing Page (customPage
 * document, draft or published) has the matching slug. Enforced three ways: the Remove/Duplicate
 * menu entries are hidden, removal patches are dropped, and the `links` validation blocks publish.
 */

export interface NavLinkValue {
  _key?: string
  label?: string
  href?: string
}

export const PROTECTED_LINK_NOTE = "This link is used by a page and can't be removed."

const API_VERSION = '2024-01-01'

export const LANDING_PAGE_SLUGS_QUERY = `*[_type == "customPage" && defined(slug.current)].slug.current`

// One request for validation: the PUBLISHED list is the baseline that must survive.
const VALIDATION_QUERY = `{
  "publishedHrefs": *[_id == "navigationSettings"][0].links[].href,
  "pageSlugs": ${LANDING_PAGE_SLUGS_QUERY}
}`

/** "/slug" for every Landing Page slug, normalized for comparison with link hrefs. */
export const toLandingHrefs = (slugs?: (string | null)[] | null): Set<string> =>
  new Set((slugs ?? []).filter(Boolean).map((slug) => normalizeNavHref(`/${slug}`)))

export const isProtectedHref = (href: string | undefined, landingHrefs: Set<string>): boolean => {
  const normalized = normalizeNavHref(href)
  return normalized !== '' && (isBuiltInNavHref(normalized) || landingHrefs.has(normalized))
}

/** `_key` of every protected link in the list. */
export const protectedKeysOf = (
  links: NavLinkValue[] | undefined,
  landingHrefs: Set<string>,
): Set<string> =>
  new Set(
    (links ?? [])
      .filter((link) => link._key && isProtectedHref(link.href, landingHrefs))
      .map((link) => link._key as string),
  )

/** Shared by the list input, its rows and the href field, so one fetch serves them all. */
export const NavLinkProtectionContext = createContext<{protectedKeys: Set<string>} | null>(null)

/** Drops patches that would delete a protected link; every other patch passes through. */
export function withoutProtectedRemovals(
  patches: FormPatch[],
  protectedKeys: Set<string>,
): FormPatch[] {
  return patches.filter((patch) => {
    if (patch.type !== 'unset') return true
    const last = patch.path[patch.path.length - 1]
    const isItemRemoval = typeof last === 'object' && last !== null && '_key' in last
    return !(isItemRemoval && protectedKeys.has((last as {_key: string})._key))
  })
}

/**
 * Safety net for `links`: errors when a link that was in the published list, and is still
 * protected, is missing from the edited list. Catches removals the UI can't (restore, scripts).
 * A failed lookup never blocks editors — it just can't verify.
 */
export async function validateProtectedLinks(
  links: NavLinkValue[] | undefined,
  getClient: ValidationContext['getClient'],
): Promise<true | string> {
  let result: {publishedHrefs?: (string | null)[] | null; pageSlugs?: string[] | null} | null
  try {
    result = await getClient({apiVersion: API_VERSION})
      .withConfig({perspective: 'raw'})
      .fetch(VALIDATION_QUERY)
  } catch {
    return true
  }

  const landingHrefs = toLandingHrefs(result?.pageSlugs)
  const present = new Set((links ?? []).map((link) => normalizeNavHref(link.href)))
  const missing = [...new Set((result?.publishedHrefs ?? []).filter((href): href is string => !!href))].filter(
    (href) => isProtectedHref(href, landingHrefs) && !present.has(normalizeNavHref(href)),
  )

  return missing.length === 0
    ? true
    : `These links are used by a page and can't be removed: ${missing.join(', ')}. Restore them to publish.`
}
