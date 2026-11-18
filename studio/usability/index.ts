import {LIBRARY_GROUPS} from '../sectionLibrary/library'
import {withCalmTabs} from './tabs'
import {withHiddenBadge} from './hiddenBadge'

/**
 * Studio usability improvements, each with its own switch. Set a switch to `false` to put that one thing back exactly
 * as it was; no content is involved in any of them, so nothing else needs to change.
 */
/** Plain tab names in the section forms, and no "All fields" tab. */
export const CALM_TABS_ENABLED = true
/** A "Hidden" marker on the rows of sections that are switched off. */
export const HIDDEN_BADGE_ENABLED = true

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
      if (CALM_TABS_ENABLED) out = withCalmTabs(out as never)
      if (HIDDEN_BADGE_ENABLED) out = withHiddenBadge(out as never)
    }
    return out
  })
}
