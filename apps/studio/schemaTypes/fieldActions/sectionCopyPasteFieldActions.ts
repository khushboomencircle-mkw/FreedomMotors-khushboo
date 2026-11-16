/**
 * Makes Sanity's own built-in Copy/Paste — already there today, just
 * tucked inside each field's hover/overflow menu — show as always-visible
 * icon buttons on the `sections` field, for every document type that has
 * one. Wraps the built-in `copyField`/`pasteField` document field actions
 * (registered via `document.unstable_fieldActions` in sanity.config.ts)
 * rather than reimplementing copy/paste: every path outside `sections` is
 * returned exactly as the built-in action returned it, so the existing
 * hover-menu Copy/Paste keeps working unchanged everywhere else.
 *
 * `unstable_fieldActions` and the field-action types it depends on
 * (`DocumentFieldAction`, `useCopyPaste`, etc.) are marked `@beta`/`@hidden`
 * in Sanity's own types — they're the real mechanism Sanity's own UI uses
 * (confirmed by reading Sanity's compiled source, not guessed), but Sanity
 * hasn't committed to the exact shape as stable public API yet.
 *
 * A "Copy" button on each section (path ["sections", {_key}]) copies that
 * one section — appends on paste, same as copying a single section today.
 * A "Copy All Sections" button on the `sections` field itself (path
 * ["sections"]) copies the whole array — replaces the target's sections on
 * paste. Either one pastes with the single "Paste" button on the
 * `sections` field, which already decides append-vs-replace itself based
 * on what's in the clipboard — that's native behavior, nothing new built
 * for it.
 */
import {defineDocumentFieldAction, isKeySegment} from 'sanity'
import type {DocumentFieldAction, DocumentFieldActionItem, DocumentFieldActionsResolver, Path} from 'sanity'

/** Every document type whose `sections` field this applies to. */
const SECTION_BEARING_DOCUMENT_TYPES = new Set([
  'customPage',
  'homePage',
  'vehiclesPage',
  'vehicleDetailPage',
  'commercialPage',
  'convertVehicle2Page',
  'ourStoryPage',
  'contactPage',
  'driver',
])

function isSectionsArrayPath(path: Path): boolean {
  return path.length === 1 && path[0] === 'sections'
}

function isSectionItemPath(path: Path): boolean {
  return path.length === 2 && path[0] === 'sections' && isKeySegment(path[1])
}

/** Wraps the built-in "copyField" action: visible button on a section item or the sections field itself, untouched everywhere else. */
function withVisibleCopyButton(action: DocumentFieldAction): DocumentFieldAction {
  return defineDocumentFieldAction({
    name: action.name,
    useAction(props) {
      const base = action.useAction(props)
      if (base.type !== 'action') return base
      if (isSectionItemPath(props.path)) {
        return {...base, renderAsButton: true, title: 'Copy Section'} satisfies DocumentFieldActionItem
      }
      if (isSectionsArrayPath(props.path)) {
        return {...base, renderAsButton: true, title: 'Copy All Sections'} satisfies DocumentFieldActionItem
      }
      return base
    },
  })
}

/** Wraps the built-in "pasteField" action: visible button on the sections field itself only, untouched everywhere else. */
function withVisiblePasteButton(action: DocumentFieldAction): DocumentFieldAction {
  return defineDocumentFieldAction({
    name: action.name,
    useAction(props) {
      const base = action.useAction(props)
      if (base.type !== 'action') return base
      if (isSectionsArrayPath(props.path)) {
        return {...base, renderAsButton: true, title: 'Paste'} satisfies DocumentFieldActionItem
      }
      return base
    },
  })
}

export const sectionCopyPasteFieldActionsResolver: DocumentFieldActionsResolver = (prev, context) => {
  if (!SECTION_BEARING_DOCUMENT_TYPES.has(context.documentType)) return prev

  return prev.map((action) => {
    if (action.name === 'copyField') return withVisibleCopyButton(action)
    if (action.name === 'pasteField') return withVisiblePasteButton(action)
    return action
  })
}
