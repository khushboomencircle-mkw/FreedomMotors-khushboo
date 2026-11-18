/**
 * Shows "Hidden" in a section's row in the Page Sections list when its Section Active switch is off.
 *
 * A hidden section stays in the list but not on the website, and the row used to look exactly like a live one.
 * This only wraps what the row already shows: the title, picture and "#order · Type" line are the section's own.
 */

interface PreviewLike {
  select?: Record<string, string>
  prepare?: (selection: Record<string, unknown>) => Record<string, unknown>
}
interface TypeLike {
  name: string
  preview?: PreviewLike
}

/** The key the switch is selected under (chosen so it cannot clash with a key a section already selects). */
export const ACTIVE_KEY = '__sectionActive'

/** Sections whose row already says "Active/Inactive" themselves. */
const ALREADY_SAYS_STATE = new Set(['staticSection'])

/** The row's subtitle with a "Hidden" marker in front. */
export const hiddenSubtitle = (subtitle: unknown): string =>
  typeof subtitle === 'string' && subtitle ? `Hidden · ${subtitle}` : 'Hidden'

export function withHiddenBadge<T extends TypeLike>(type: T): T {
  const preview = type.preview
  if (!preview?.prepare || !preview.select || ALREADY_SAYS_STATE.has(type.name)) return type
  const original = preview.prepare
  return {
    ...type,
    preview: {
      ...preview,
      select: {...preview.select, [ACTIVE_KEY]: 'isActive'},
      prepare: (selection: Record<string, unknown>) => {
        const row = original(selection)
        return selection[ACTIVE_KEY] === false
          ? {...row, subtitle: hiddenSubtitle(row.subtitle)}
          : row
      },
    },
  }
}
