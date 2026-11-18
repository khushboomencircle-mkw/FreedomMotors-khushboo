import { pageTemplates } from '../pageTemplates'
import { libraryTemplate } from './libraryTemplate'

export { pageTemplateType } from './pageTemplateType'
export { default as TemplatePicker } from './TemplatePicker'
export { libraryTemplate } from './libraryTemplate'

/**
 * Whether the four original hardcoded templates (studio/pageTemplates.ts) are still offered in the Landing Page(s) "+" menu
 * next to the dynamic library.
 *
 * OFF: the "+" button on Landing Page(s) offers only "Blank" (a single choice, so it opens a blank page directly) — the
 * permanent fallback that works even if the library is empty or unreachable. Pages made from templates go through
 * Pages → New Template Page. The other three hardcoded templates are then no longer offered anywhere until they are
 * added to the library (`npm run templates:migrate -- --write`). Existing pages are never affected — a template only
 * matters at the moment a page is created. Set to true to bring the four back into the "+" menu.
 */
export const LEGACY_TEMPLATES_IN_CREATE_MENU = false

/** The hardcoded templates registered with Studio (all four while migrating, otherwise just the permanent Blank). */
export const legacyCreateMenuTemplates = LEGACY_TEMPLATES_IN_CREATE_MENU
  ? pageTemplates
  : pageTemplates.filter((t) => t.id === 'blank')

/** Every template registered with Studio for Landing Pages: the hardcoded ones above plus the library template. */
export const registeredPageTemplates = [...legacyCreateMenuTemplates, libraryTemplate]
