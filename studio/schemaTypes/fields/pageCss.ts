/**
 * Shared per-page "Custom CSS" field + its collapsed fieldset — one definition, used by every page type
 * that renders sections (the same approach as fields/pageChrome.ts).
 *
 * Usage in a page document schema:
 *   fieldsets: [...pageChromeFieldsets, ...pageCssFieldsets],
 *   fields: [
 *     ...pageChromeFields,
 *     ...pageCssFields(),            // pass a group name if the page type uses field groups
 *   ]
 *
 * The CSS is limited to this page's content area when the site renders it, and is sanitized there
 * (src/lib/sanitizeCss.ts). The validation below runs the very same sanitizer, so editors are told in
 * plain language what would be refused — but it is a warning, never the only protection.
 */
import {defineField} from 'sanity'
import HtmlCodeInput from '../components/HtmlCodeInput'
import {MAX_PAGE_CSS_LENGTH} from '../../../src/lib/cssPolicy'
import {validatePageCss} from '../../../src/lib/sanitizeCss'

/** Collapsed by default, so ordinary editors never see it. */
export const pageCssFieldsets = [
  {
    name: 'advancedCss',
    title: 'Advanced: Custom CSS',
    options: {collapsible: true, collapsed: true},
  },
]

export function pageCssFields(group?: string) {
  return [
    defineField({
      name: 'customCss',
      title: 'Custom CSS',
      type: 'text',
      rows: 12,
      group,
      fieldset: 'advancedCss',
      description:
        'For developers and designers. CSS here changes only this page’s content — never the header, footer or other pages. ' +
        'Use “body” or “:root” for the whole page area, and a section’s own address to change just one section: ' +
        '[data-section-key="…"] or .page-section--bannerSection. ' +
        'Sections are styled inline, so an override often needs !important. ' +
        `Not allowed: @import, @font-face, position: fixed, expression(), or javascript:/data: addresses. Up to ${MAX_PAGE_CSS_LENGTH.toLocaleString('en-US')} characters.`,
      components: {input: HtmlCodeInput},
      validation: (rule) => rule.custom((value) => validatePageCss(value as string | undefined)),
    }),
  ]
}
