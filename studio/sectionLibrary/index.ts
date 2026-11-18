import {
  groupsFor,
  LIBRARY_GROUPS,
  MISSING_DESCRIPTIONS,
  previewUrlFor,
  startingRowsFor,
} from './library'

/**
 * Switch for the visual section library. Set to `false` to put the Add menu back to the plain list and stop giving
 * new sections their empty starting rows. No page data is involved, so nothing else needs to change.
 */
export const SECTION_LIBRARY_ENABLED = true

interface FieldLike {
  name?: string
  type?: string
  of?: {type?: string}[]
  options?: Record<string, unknown>
}
interface TypeLike {
  name: string
  fields?: unknown[]
  description?: string
  initialValue?: unknown
}

const LIBRARY_TYPES = new Set(LIBRARY_GROUPS.flatMap((g) => g.of))

/** The "Add section" menu: pictures in a grid (or a plain list), grouped, searchable. */
function insertMenuFor(available: string[]) {
  return {
    filter: 'auto' as const,
    showIcons: true,
    groups: groupsFor(available),
    views: [{name: 'grid' as const, previewImageUrl: previewUrlFor}, {name: 'list' as const}],
  }
}

/** A page type's `sections` array gets the menu; every other field, and every option already on it, is kept. */
function withMenu(type: TypeLike): TypeLike {
  const fields = (type.fields ?? []) as FieldLike[]
  let changed = false
  const next = fields.map((field) => {
    if (field.name !== 'sections' || field.type !== 'array') return field
    const available = (field.of ?? []).map((m) => m.type ?? '').filter((t) => LIBRARY_TYPES.has(t))
    if (available.length === 0 || field.options?.insertMenu) return field
    changed = true
    return {...field, options: {...field.options, insertMenu: insertMenuFor(available)}}
  })
  return changed ? {...type, fields: next} : type
}

/**
 * A section gets its missing description and its empty starting rows. Both only fill gaps: a description or an
 * initial value the section already has is never replaced (an existing initial value is merged over the rows).
 */
function withStartingPoint(type: TypeLike): TypeLike {
  const description = MISSING_DESCRIPTIONS[type.name]
  const hasRows = Boolean(startingRowsFor(type.name))
  if (!description && !hasRows) return type
  const existing = type.initialValue
  return {
    ...type,
    ...(description && !type.description ? {description} : {}),
    ...(hasRows
      ? {
          // A function, so every new section gets its own fresh keys.
          initialValue: async (...args: unknown[]) => ({
            ...startingRowsFor(type.name),
            ...((typeof existing === 'function'
              ? await (existing as (...a: unknown[]) => unknown)(...args)
              : existing) as object | undefined),
          }),
        }
      : {}),
  }
}

/**
 * Applies the section library to a list of schema types (used where the types are registered, so no page or section
 * file is edited). Page types with a `sections` array get the visual Add menu; section types get their starting rows.
 */
export function applySectionLibrary<T extends TypeLike>(types: T[]): T[] {
  if (!SECTION_LIBRARY_ENABLED) return types
  return types.map((type) => withStartingPoint(withMenu(type)) as T)
}
