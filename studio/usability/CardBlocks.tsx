import type {ComponentType} from 'react'
import type {ObjectInputProps} from 'sanity'
import {BUTTON_STYLE_FIELDSET, HEADING_MORE_FIELDSET, STATUS_FIELDSET} from './contentLayout'

/**
 * The boxed-card look for the standard Content-tab blocks (Status, Heading & intro, Main button …).
 *
 * Sanity draws a fieldset as a title with a thin line down its left side. This wraps a section's form in an element
 * that carries a small, SCOPED style sheet: it gives just our own blocks a rounded, bordered box, in Sanity's own theme
 * colours (so it follows light and dark mode), and removes the thin line inside the box.
 *
 * What it relies on: Sanity puts a `data-testid="fieldset-<name>"` on every fieldset. If a Studio upgrade ever changes
 * that, the blocks simply fall back to Sanity's normal look: nothing breaks and no field is affected. Switch it off with
 * CARD_BLOCKS_ENABLED in studio/usability/index.ts.
 */

/** The fieldsets (by name) that get a box. */
export const CARD_BLOCK_FIELDSETS = [
  STATUS_FIELDSET,
  'header',
  HEADING_MORE_FIELDSET,
  'primaryButton',
  'secondaryButton',
  BUTTON_STYLE_FIELDSET,
]

/** The attribute on the wrapper that scopes the style sheet to a section's form. */
export const WRAPPER_ATTRIBUTE = 'data-usability-blocks'

const selectorFor = (name: string) =>
  `[${WRAPPER_ATTRIBUTE}] fieldset[data-testid="fieldset-${name}"]`

/** The style sheet. Sanity's own theme variables only: no colour is written out here. */
export const CARD_BLOCKS_CSS = [
  `${CARD_BLOCK_FIELDSETS.map(selectorFor).join(',\n')} {
  border: 1px solid var(--card-border-color);
  border-radius: 10px;
  padding: 12px 14px;
}`,
  // The thin left line Sanity draws inside a fieldset is not needed once the block has a box.
  `${CARD_BLOCK_FIELDSETS.map((n) => `${selectorFor(n)} > :last-child`).join(',\n')} {
  border-left: 0;
  padding-left: 0;
  box-shadow: none;
}`,
].join('\n')

/** A section's form input that adds the box look around the original (or Sanity's own) form. */
export function makeCardBlocksInput(Original?: ComponentType<ObjectInputProps>) {
  function CardBlocksInput(props: ObjectInputProps) {
    return (
      <div {...{[WRAPPER_ATTRIBUTE]: ''}}>
        <style>{CARD_BLOCKS_CSS}</style>
        {Original ? <Original {...props} /> : props.renderDefault(props)}
      </div>
    )
  }
  CardBlocksInput.displayName = 'CardBlocksInput'
  /** The input this wraps, so tests (and a second application) can see through it. */
  CardBlocksInput.original = Original
  CardBlocksInput.isCardBlocks = true as const
  return CardBlocksInput
}
