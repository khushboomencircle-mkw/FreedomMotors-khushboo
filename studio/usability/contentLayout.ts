/**
 * The standard Content tab: the same blocks, in the same order, with the same plain names, in every section.
 *
 *   Status          Section Active + Display Order (+ position), side by side, always at the top
 *   Heading & intro the section's heading and text, open
 *   (the section's own content)
 *   Main button     the switch, its text and where it goes, in one row   \  only for sections
 *   Second button   the same, folded away until wanted                   /  that have buttons
 *
 * How the buttons LOOK (colour, corner radius, "float over image") moves to "Button style" in the Colors & Theme tab,
 * so the Content tab holds only what the button says and where it goes.
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
  description?: unknown
  placeholder?: unknown
  type?: string
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
/** The tab that holds how things look (colours, fonts, button style). */
export const STYLE_GROUP = 'sectionStyles'
/** The fieldset that holds Section Active and Display Order. */
export const STATUS_FIELDSET = 'status'
/** The fieldset that holds the colour / corner / float settings of the buttons, in the style tab. */
export const BUTTON_STYLE_FIELDSET = 'buttonStyle'
/** The second heading block, for the heading fields that are not the main pair. */
export const HEADING_MORE_FIELDSET = 'headerMore'

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

/** The fields that decide how a button LOOKS (they move to the style tab). */
export const BUTTON_STYLE_FIELDS = new Set([
  'buttonStyle',
  'buttonTextColor',
  'buttonRadius',
  'buttonOverlay',
  'secondaryButtonStyle',
  'secondaryButtonTextColor',
  'secondaryButtonRadius',
])

/**
 * Fields in the standard blocks whose long helper text is dropped, so a block is a clean label and input as in the
 * design. Guidance now lives in the intro card, the labels themselves and (for text fields) an "e.g." placeholder.
 */
export const COMPACT_FIELDS = new Set([
  'isActive',
  'sequence',
  'sectionHeading',
  'sectionDescription',
  'heading',
  'description',
  'eyebrow',
  'headerStyle',
  'showButton',
  'showSecondaryButton',
  'buttonLabel',
  'buttonLinkUrl',
  'secondaryButtonLabel',
  'secondaryButtonLinkUrl',
])

/**
 * Sections whose headline is the "Heading / Description / Eyebrow" set rather than "Title / Subtitle" (the website draws
 * the hero and the FAQ heading from those). Both sets are used in real content, so neither is hidden: these come first in
 * "Heading & intro" and the other pair follows in "More heading options".
 */
export const HEADING_ORDER: Record<string, {primary: string[]; more: string[]}> = {
  bannerSection: {
    primary: ['heading', 'description', 'eyebrow', 'headerStyle'],
    more: ['sectionHeading', 'sectionDescription'],
  },
  accordionSection: {
    primary: ['heading', 'description', 'eyebrow'],
    more: ['sectionHeading', 'sectionDescription'],
  },
}

/** "1. Header" → "Header". Numbers in a title said nothing true, and they were not applied consistently. */
export const stripNumber = (title: string | undefined): string | undefined =>
  title?.replace(/^\s*\d+\.\s*/, '')

/** `e.g. "How It Works"` inside old helper text → the placeholder "e.g. How It Works" (undefined when there is none). */
export function exampleFrom(description: unknown): string | undefined {
  const match = typeof description === 'string' ? /e\.g\.\s*"([^"]+)"/.exec(description) : null
  return match ? `e.g. ${match[1]}` : undefined
}

const groupsOf = (field: FieldLike): string[] =>
  Array.isArray(field.group) ? field.group : field.group ? [field.group] : []

/** Blocks that are always open and have no fold-away triangle. */
const FLAT_BLOCKS = new Set(['header', 'primaryButton', HEADING_MORE_FIELDSET, STATUS_FIELDSET])

/** The fieldsets with plain titles; the shared ones open or closed the way the standard says. */
function standardFieldsets(
  fieldsets: FieldsetLike[],
  extra: {status: boolean; headingMore: boolean; buttonStyle: boolean},
): FieldsetLike[] {
  const out: FieldsetLike[] = fieldsets.map((fs) => {
    const title = BLOCK_TITLES[fs.name] ?? stripNumber(fs.title)
    const options: Record<string, unknown> = {...fs.options}
    if (FLAT_BLOCKS.has(fs.name)) {
      options.collapsible = false
      options.collapsed = false
    }
    // The switch, its text and where it goes: one row.
    if (fs.name === 'primaryButton' || fs.name === 'secondaryButton') options.columns = 3
    // Second button stays folded away until it is wanted.
    if (fs.name === 'secondaryButton') {
      options.collapsible = true
      options.collapsed = true
    }
    return {...fs, title, options}
  })
  const add = (fs: FieldsetLike, atStart = false) => {
    if (out.some((f) => f.name === fs.name)) return
    if (atStart) out.unshift(fs)
    else out.push(fs)
  }
  // New blocks are made with the very options the "flat" rule would give them, so applying this twice changes nothing.
  if (extra.status) {
    add(
      {
        name: STATUS_FIELDSET,
        title: 'Status',
        options: {columns: 3, collapsible: false, collapsed: false},
      },
      true,
    )
  }
  if (extra.headingMore) {
    add({
      name: HEADING_MORE_FIELDSET,
      title: 'More heading options',
      options: {collapsible: false, collapsed: false},
    })
  }
  if (extra.buttonStyle) {
    add({
      name: BUTTON_STYLE_FIELDSET,
      title: 'Button style',
      options: {collapsible: true, collapsed: true},
    })
  }
  return out
}

/** The type with the standard Content tab, or unchanged when it has no tabs (the Static section). */
export function withStandardContent<T extends TypeLike>(type: T): T {
  if (!type.groups?.length) return type
  const fieldsetNames = new Set((type.fieldsets ?? []).map((f) => f.name))
  const rawFields = (type.fields ?? []) as FieldLike[]
  const has = (name: string) => rawFields.some((f) => f.name === name)
  const hasStatus = has('isActive') && has('sequence')
  const hasStyleTab = type.groups.some((g) => g.name === STYLE_GROUP)
  const heading = HEADING_ORDER[type.name]
  const headingMore = Boolean(heading && heading.more.some(has))
  const hasButtonStyle = hasStyleTab && rawFields.some((f) => BUTTON_STYLE_FIELDS.has(f.name ?? ''))

  const mapped = rawFields.map((field) => {
    const name = field.name ?? ''
    let next: FieldLike = field

    // Section Active + Display Order: one row at the top of the Content tab.
    if (hasStatus && (name === 'isActive' || name === 'sequence')) {
      next = {...next, group: CONTENT_GROUP, fieldset: STATUS_FIELDSET}
    }

    // The section's real headline pair first; the other pair in a second heading block.
    if (heading?.primary.includes(name)) next = {...next, group: CONTENT_GROUP, fieldset: 'header'}
    if (headingMore && heading?.more.includes(name)) {
      next = {...next, group: CONTENT_GROUP, fieldset: HEADING_MORE_FIELDSET}
    }

    // The "show" switches belong with their button, not loose above it.
    if (name === 'showButton' && fieldsetNames.has('primaryButton') && !field.fieldset) {
      next = {...next, fieldset: 'primaryButton'}
    }
    if (name === 'showSecondaryButton' && fieldsetNames.has('secondaryButton') && !field.fieldset) {
      next = {...next, fieldset: 'secondaryButton'}
    }
    const rename = BUTTON_FIELD_TITLES[name]
    if (rename && field.title === rename.from) next = {...next, title: rename.to}

    // How a button LOOKS goes to the style tab, so Content holds only what it says and where it goes.
    if (hasButtonStyle && BUTTON_STYLE_FIELDS.has(name)) {
      next = {...next, group: STYLE_GROUP, fieldset: BUTTON_STYLE_FIELDSET}
    }

    // A clean label and input: the long helper text goes, and an "e.g." example stays as a placeholder.
    if (COMPACT_FIELDS.has(name) && next.description !== undefined) {
      const {description, ...rest} = next
      const example =
        next.type === 'string' && !next.placeholder ? exampleFrom(description) : undefined
      next = {...rest, ...(example ? {placeholder: example} : {})}
    }
    return next
  })

  // Order: Status, then the heading block (the main pair first), then everything else as it already was.
  const rank = (f: FieldLike): number => {
    const name = f.name ?? ''
    if (hasStatus && name === 'isActive') return 0
    if (hasStatus && name === 'sequence') return 1
    if (heading?.primary.includes(name)) return 2 + heading.primary.indexOf(name) / 100
    if (headingMore && heading?.more.includes(name)) return 2.5 + heading.more.indexOf(name) / 100
    return 3
  }
  const fields = [...mapped].sort((a, b) => rank(a) - rank(b))

  // A tab nothing is left in (Settings, once Section Active moved out) is hidden instead of shown empty.
  const used = new Set(fields.flatMap(groupsOf))
  const groups = type.groups.map((g) => (used.has(g.name) || g.hidden ? g : {...g, hidden: true}))

  return {
    ...type,
    groups,
    fieldsets: standardFieldsets(type.fieldsets ?? [], {
      status: hasStatus,
      headingMore,
      buttonStyle: hasButtonStyle,
    }),
    fields,
  }
}
