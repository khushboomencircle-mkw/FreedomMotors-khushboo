/**
 * Calmer section forms: plain tab names, and no "All fields" tab.
 *
 * Every section already sorts its fields into tabs (Content, Layout, Typography …). Two things made that feel heavy:
 * technical tab names, and an extra "All fields" tab that shows every field at once (28 in a Banner, 41 in a Feature
 * Grid). This renames the tabs in plain words and hides the "All fields" tab. Group NAMES are unchanged (they are not
 * stored in any content), no field is touched, and the tab is only hidden when every field really has a tab of its own
 * — so nothing can become unreachable.
 *
 * Pure data + functions, no Studio imports.
 */

/** Plain titles for the tabs sections use (by group name). */
export const TAB_TITLES: Record<string, string> = {
  content: 'Content',
  layout: 'Layout',
  cardStyles: 'Card Style',
  typography: 'Text',
  sectionStyles: 'Colors & Theme',
  behavior: 'Settings',
}

/** Sanity's name for the built-in tab that lists every field. */
export const ALL_FIELDS_GROUP = 'all-fields'

interface GroupLike {
  name: string
  title?: string
  hidden?: boolean
}
interface FieldLike {
  name?: string
  group?: string | string[]
}
interface TypeLike {
  name: string
  groups?: GroupLike[]
  fields?: unknown[]
}

/** True when every field belongs to a tab that exists — the condition for hiding the "All fields" tab. */
export function everyFieldHasATab(type: TypeLike): boolean {
  const tabs = new Set((type.groups ?? []).map((g) => g.name))
  return ((type.fields ?? []) as FieldLike[]).every((f) => {
    const groups = Array.isArray(f.group) ? f.group : f.group ? [f.group] : []
    return groups.length > 0 && groups.every((g) => tabs.has(g))
  })
}

/** The type with plain tab names and (when safe) no "All fields" tab; a type without tabs is returned unchanged. */
export function withCalmTabs<T extends TypeLike>(type: T): T {
  if (!type.groups?.length) return type
  const groups: GroupLike[] = type.groups.map((g) => ({
    ...g,
    title: TAB_TITLES[g.name] ?? g.title,
  }))
  const alreadyHandled = groups.some((g) => g.name === ALL_FIELDS_GROUP)
  if (!alreadyHandled && everyFieldHasATab(type))
    groups.push({name: ALL_FIELDS_GROUP, hidden: true})
  return {...type, groups}
}
