import type {ObjectInputProps} from 'sanity'
import {LayoutPickerContext} from './LayoutPickerContext'

/**
 * Wraps a section's normal form. It changes nothing about how the form looks or works: it renders the default input
 * and only hands the section's value and `onChange` to the layout picker field inside it.
 */
export default function LayoutSectionInput(props: ObjectInputProps) {
  return (
    <LayoutPickerContext.Provider
      value={{
        value: props.value as Record<string, unknown> | undefined,
        onChange: props.onChange,
        readOnly: props.readOnly,
      }}
    >
      {props.renderDefault(props)}
    </LayoutPickerContext.Provider>
  )
}
