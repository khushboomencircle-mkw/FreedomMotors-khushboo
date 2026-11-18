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
 * kept exactly as it is, in the same order. The section's form is wrapped only to hand its value and `onChange`
 * to the picker; it renders exactly as before. Sections without presets are returned unchanged, and so is a section
 * that already has its own custom input (it is never replaced).
 */
export function withLayoutPicker<T extends SectionTypeLike>(type: T): T {
  if (!LAYOUT_PICKER_ENABLED || !LAYOUT_PRESETS[type.name]) return type
  const fields = type.fields ?? []
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
