import type {ComponentType} from 'react'
import type {ObjectInputProps} from 'sanity'
import {makeCardBlocksInput} from './CardBlocks'
import {STATUS_FIELDSET} from './contentLayout'

/**
 * Wraps a section's form in the card-blocks look. A section that already has its own input (the five with the layout
 * picker) keeps it: the new wrapper renders THAT inside itself, so nothing it did is lost.
 */
interface TypeLike {
  name: string
  fieldsets?: {name: string}[]
  components?: {input?: unknown} & Record<string, unknown>
}

export function withCardBlocks<T extends TypeLike>(type: T): T {
  // Only sections that got the standard Content tab (they are the ones with a Status block).
  if (!type.fieldsets?.some((f) => f.name === STATUS_FIELDSET)) return type
  const existing = type.components?.input as
    (ComponentType<ObjectInputProps> & {isCardBlocks?: boolean}) | undefined
  if (existing?.isCardBlocks) return type // already applied
  return {...type, components: {...type.components, input: makeCardBlocksInput(existing)}}
}
