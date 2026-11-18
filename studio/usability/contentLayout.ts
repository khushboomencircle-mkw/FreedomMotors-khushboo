/**
 * The standard Content tab: the same blocks, in the same order, with the same plain names, in every section.
 *
 *   Status          Section Active + Display Order, side by side, always at the top
 *   Heading & intro title and subtitle, open by default
 *   (the section's own content)
 *   Main button     \
 *   Second button   /  only for sections that have buttons
 *
 * STRICT RULE: this only changes how fields are TITLED, GROUPED, ORDERED and shown. It never removes a field and never
 * changes a field's name (key), type, options, validation or default — the website's queries and every saved document
 * depend on those. fieldLock.test.ts enforces that for every field.
 *
 * Pure data + functions (no Studio imports).
 */

interface FieldsetLike {
  name: string
  title?: string
  options?: Record<string, unknown>
}
interface GroupLike {
  name: string
  title?: string
  hidden?: boolean
}
interface FieldLike {
  name?: string
  title?: string
  group?: string | string[]
  fieldset?: string
}
interface TypeLike {
  name: string
  groups?: GroupLike[]
  fieldsets?: FieldsetLike[]
  fields?: unknown[]
}

/** The group the standard blocks live in. */
export const CONTENT_GROUP = 'content'
/** The fieldset that holds Section Active and Display Order. */
export const STATUS_FIELDSET = 'status'

/** Plain titles for the shared blocks (by fieldset NAME, which does not change). */
export const BLOCK_TITLES: Record<string, string> = {
  header: 'Heading & intro',
  primaryButton: 'Main button',
  secondaryButton: 'Second button',
}

/** Plain titles for the button fields (only replaced when the title is exactly the old one). */
export const BUTTON_FIELD_TITLES: Record<string, {from: string; to: string}> = {
  showButton: {from: 'Show a Button', to: 'Show main button'},
  showSecondaryButton: {from: 'Show a Second Button', to: 'Show second button'},
  buttonLabel: {from: 'Button Text', to: 'Text'},
  buttonLinkUrl: {from: 'Button Destination', to: 'Goes to'},
  secondaryButtonLabel: {from: 'Second Button Text', to: 'Text'},
  secondaryButtonLinkUrl: {from: 'Second Button Destination', to: 'Goes to'},
}

/** "1. Header" → "Header". Numbers in a title said nothing true, and they were not applied consistently. */
export const stripNumber = (title: string | undefined): string | undefined =>
  title?.replace(/^\s*\d+\.\s*/, '')

const groupsOf = (field: FieldLike): string[] =>
  Array.isArray(field.group) ? field.group : field.group ? [field.group] : []

/** The fieldsets with plain titles; the shared ones open or closed the way the standard says. */
function standardFieldsets(fieldsets: FieldsetLike[], hasStatus: boolean): FieldsetLike[] {
  const out = fieldsets.map((fs) => {
    const title = BLOCK_TITLES[fs.name] ?? stripNumber(fs.title)
    const options = {...fs.options}
    // Heading and Main button are open; Second button stays folded away until it is wanted.
    if (fs.name === 'header' || fs.name === 'primaryButton') options.collapsed = false
    if (fs.name === 'secondaryButton') options.collapsed = true
    return {...fs, title, options}
  })
  if (hasStatus && !out.some((f) => f.name === STATUS_FIELDSET)) {
    out.unshift({name: STATUS_FIELDSET, title: 'Status', options: {columns: 2}})
  }
  return out
}

/** The type with the standard Content tab, or unchanged when it has no tabs (the Static section). */
export function withStandardContent<T extends TypeLike>(type: T): T {
  if (!type.groups?.length) return type
  const fieldsetNames = new Set((type.fieldsets ?? []).map((f) => f.name))
  const rawFields = (type.fields ?? []) as FieldLike[]
  const hasStatus =
    rawFields.some((f) => f.name === 'isActive') && rawFields.some((f) => f.name === 'sequence')

  const mapped = rawFields.map((field) => {
    const name = field.name ?? ''
    // Section Active + Display Order: one row at the top of the Content tab.
    if (hasStatus && (name === 'isActive' || name === 'sequence')) {
      return {...field, group: CONTENT_GROUP, fieldset: STATUS_FIELDSET}
    }
    let next = field
    // The "show" switches belong with their button, not loose above it.
    if (name === 'showButton' && fieldsetNames.has('primaryButton') && !field.fieldset) {
      next = {...next, fieldset: 'primaryButton'}
    }
    if (name === 'showSecondaryButton' && fieldsetNames.has('secondaryButton') && !field.fieldset) {
      next = {...next, fieldset: 'secondaryButton'}
    }
    const rename = BUTTON_FIELD_TITLES[name]
    if (rename && field.title === rename.from) next = {...next, title: rename.to}
    return next
  })

  // Status first (Section Active, then Display Order), everything else in the order it already had.
  const rank = (f: FieldLike) =>
    hasStatus ? (f.name === 'isActive' ? 0 : f.name === 'sequence' ? 1 : 2) : 2
  const fields = [...mapped].sort((a, b) => rank(a) - rank(b))

  // A tab nothing is left in (Settings, once Section Active moved out) is hidden instead of shown empty.
  const used = new Set(fields.flatMap(groupsOf))
  const groups = type.groups.map((g) => (used.has(g.name) || g.hidden ? g : {...g, hidden: true}))

  return {
    ...type,
    groups,
    fieldsets: standardFieldsets(type.fieldsets ?? [], hasStatus),
    fields,
  }
}
