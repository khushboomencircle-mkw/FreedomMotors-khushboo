import {useCallback} from 'react'
import type {ArrayInputFunctionsProps, ArraySchemaType} from 'sanity'

/**
 * The "Add …" button under a list of cards, questions, photos and so on. It adds exactly what Sanity's own button adds
 * (a new row of the list's one row type, with that type's usual starting values), but says what it adds.
 */

const button = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px dashed color-mix(in srgb, currentColor 30%, transparent)',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
})

type Props = ArrayInputFunctionsProps<unknown, ArraySchemaType>

/** A button component for `components.arrayFunctions`, labelled `label`. */
export function makeAddRowButton(label: string) {
  function AddRowButton({onItemAppend, onValueCreate, readOnly, schemaType}: Props) {
    const add = useCallback(() => {
      // The lists this is used on have exactly one kind of row, so the first (only) member is the one to add.
      const member = schemaType.of[0]
      if (!member || readOnly) return
      onItemAppend(onValueCreate(member as never))
    }, [onItemAppend, onValueCreate, readOnly, schemaType])

    return (
      <button type="button" style={button(Boolean(readOnly))} disabled={readOnly} onClick={add}>
        + {label}
      </button>
    )
  }
  AddRowButton.displayName = `AddRowButton(${label})`
  return AddRowButton
}
