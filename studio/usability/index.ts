import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {SINGLETON_PAGES} from '../singletonPages'
import {withCalmTabs} from './tabs'
import {withStandardContent} from './contentLayout'
import {withHiddenBadge} from './hiddenBadge'
import {SECTION_CHECKS, withReadinessChecks, withSeoWarnings} from './readiness'

/**
 * Studio usability improvements, each with its own switch. Set a switch to `false` to put that one thing back exactly
 * as it was; no content is involved in any of them, so nothing else needs to change.
 */
/** Plain tab names in the section forms, and no "All fields" tab. */
export const CALM_TABS_ENABLED = true
/** The standard Content tab: Status row, "Heading & intro", plain button blocks, no numbers in titles. */
export const STANDARD_CONTENT_ENABLED = true
/** A "Hidden" marker on the rows of sections that are switched off. */
export const HIDDEN_BADGE_ENABLED = true
/** Plain-language warnings (never errors) about empty cards, missing answers, no SEO title … */
export const READINESS_CHECKS_ENABLED = true

/**
 * The types that are real pages on the website, so a missing SEO title is worth a reminder: the fixed pages, Landing
 * Pages, Blog Posts and Articles. (Vehicles, Categories, Site Settings and Page Templates also have an SEO block, but
 * a reminder on each of hundreds of vehicles would only be noise.)
 */
const SEO_REMINDER_TYPES = new Set([
  ...SINGLETON_PAGES.map((p) => p.type),
  'customPage',
  'blogPost',
  'educationalArticle',
])

interface TypeLike {
  name: string
  type?: string
  fields?: unknown[]
  groups?: {name: string; title?: string; hidden?: boolean}[]
  preview?: unknown
  validation?: unknown
}

/** The names of the section types (the ones in the Add section menu). */
const SECTION_TYPES = new Set(LIBRARY_GROUPS.flatMap((g) => g.of))

/** Applies the usability improvements once, over the whole list of schema types (no section or page file is edited). */
export function applyStudioUsability<T extends TypeLike>(types: T[]): T[] {
  return types.map((type) => {
    let out = type
    if (SECTION_TYPES.has(type.name)) {
      // The standard Content tab first: it decides which tabs are left, then the tab names are tidied.
      if (STANDARD_CONTENT_ENABLED) out = withStandardContent(out as never)
      if (CALM_TABS_ENABLED) out = withCalmTabs(out as never)
      if (HIDDEN_BADGE_ENABLED) out = withHiddenBadge(out as never)
      if (READINESS_CHECKS_ENABLED && SECTION_CHECKS[type.name])
        out = withReadinessChecks(out as never)
    } else if (READINESS_CHECKS_ENABLED && SEO_REMINDER_TYPES.has(type.name)) {
      out = withSeoWarnings(out as never)
    }
    return out
  })
}
