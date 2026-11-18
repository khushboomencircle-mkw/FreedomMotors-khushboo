import {defineField} from 'sanity'
import LayoutPresetInput from './LayoutPresetInput'
import LayoutSectionInput from './LayoutSectionInput'
import {LAYOUT_PRESETS} from './presets'

/**
 * Switch for the layout pickers. Set to `false` to remove every picker at once and return the Studio to exactly
 * how it was — no data is involved, so nothing else needs to change.
 */
export const LAYOUT_PICKER_ENABLED = true

/**
 * The picker's field. It is a display-only slot: its input draws the picker and never writes this field's own value,
 * so no document ever gets a `layoutPreset` property.
 */
const layoutPickerField = defineField({
  name: 'layoutPreset',
  title: 'Layout',
  type: 'string',
  group: 'layout',
  description: 'Pick a layout. The detailed fields below can still be adjusted by hand.',
  components: {input: LayoutPresetInput},
})

interface SectionTypeLike {
  name: string
  fields?: unknown[]
  components?: {input?: unknown} & Record<string, unknown>
}

/**
 * Returns the section type with the picker added as the FIRST field of its Layout tab. Every existing field is
 * kept, in the same order; the only exception is a field the picker fully replaces (`hideFields` in presets.ts),
 * which stays in the schema with its data but is hidden in the Studio. The section's form is wrapped only to hand its
 * value and `onChange` to the picker. Sections without presets are returned unchanged, and so is a section that
 * already has its own custom input (it is never replaced).
 */
export function withLayoutPicker<T extends SectionTypeLike>(type: T): T {
  if (!LAYOUT_PICKER_ENABLED || !LAYOUT_PRESETS[type.name]) return type
  const hide = new Set(LAYOUT_PRESETS[type.name].hideFields ?? [])
  const fields = (type.fields ?? []).map((field) =>
    hide.has((field as {name?: string}).name ?? '') ? {...(field as object), hidden: true} : field,
  )
  const already = fields.some((f) => (f as {name?: string}).name === layoutPickerField.name)
  if (already || type.components?.input) return type
  return {
    ...type,
    components: {...type.components, input: LayoutSectionInput},
    fields: [layoutPickerField, ...fields],
  }
}

/** Applies `withLayoutPicker` to a list of schema types (used where the section types are registered). */
export const applyLayoutPickers = <T extends SectionTypeLike>(types: T[]): T[] =>
  types.map(withLayoutPicker)
