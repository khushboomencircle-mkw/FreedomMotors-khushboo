import {makeAddRowButton} from './AddRowButton'
import {ADD_LABELS} from './rows'

/**
 * Gives the card, question, photo … lists an "Add card" / "Add question" … button. Only the list field's `components` is
 * touched (a presentation property); the field itself — its name, type, members, validation — is left exactly as it was.
 * Lists with more than one kind of row keep Sanity's own menu, since one button could not choose between them.
 */
interface FieldLike {
  name?: string
  type?: string
  of?: unknown[]
  components?: Record<string, unknown>
}
interface TypeLike {
  name: string
  fields?: unknown[]
}

export function withAddButtons<T extends TypeLike>(type: T): T {
  const labels = ADD_LABELS[type.name]
  if (!labels) return type
  let changed = false
  const fields = ((type.fields ?? []) as FieldLike[]).map((field) => {
    const label = field.name ? labels[field.name] : undefined
    if (!label || field.type !== 'array' || (field.of ?? []).length !== 1) return field
    if (field.components?.arrayFunctions) return field // never replace one that is already there
    changed = true
    return {...field, components: {...field.components, arrayFunctions: makeAddRowButton(label)}}
  })
  return changed ? {...type, fields} : type
}
