import {createContext} from 'react'
import type {ObjectInputProps} from 'sanity'

/**
 * What the layout picker needs from the section it sits in. The section's own input (LayoutSectionInput) provides it,
 * using only the public props every object input receives: the section's value and its `onChange`.
 *
 * Why not reach the document from inside the picker field? Because "the document" is not always the same place: when
 * a section is edited in a pop-up dialog, Studio's form root is that section, so paths built from the document root
 * land in the wrong spot. The section's own `onChange` is always relative to the section, wherever it is shown.
 */
export interface LayoutPickerContextValue {
  /** The section's current value. */
  value: Record<string, unknown> | undefined
  /** Writes patches relative to the section (public Studio API). */
  onChange: ObjectInputProps['onChange']
  readOnly?: boolean
}

export const LayoutPickerContext = createContext<LayoutPickerContextValue | null>(null)
