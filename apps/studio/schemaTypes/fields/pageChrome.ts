/**
 * Shared per-page "Header & Footer" controls + collapsible fieldsets.
 *
 * Usage in a page document schema:
 *   fieldsets: [...pageChromeFieldsets],
 *   fields: [
 *     ...other fields,
 *     ...pageChromeFields,
 *     defineField({ name: 'seo', ..., fieldset: 'seoSettings' }),
 *   ]
 */
import {defineField} from 'sanity'

/** Collapsible, collapsed-by-default fieldsets every page shares. */
export const pageChromeFieldsets = [
  {
    name: 'pageInfo',
    title: 'Page Title & Description',
    options: {collapsible: true, collapsed: true},
  },
  {
    name: 'chrome',
    title: 'Header & Footer',
    options: {collapsible: true, collapsed: true},
  },
  {
    name: 'seoSettings',
    title: 'SEO',
    options: {collapsible: true, collapsed: true},
  },
]

/** Per-page toggles to show/hide the site header and footer. */
export const pageChromeFields = [
  defineField({
    name: 'showHeader',
    title: 'Show Header',
    type: 'boolean',
    fieldset: 'chrome',
    description: 'Show the site header (navigation bar) on this page.',
    options: {layout: 'switch'},
    initialValue: true,
  }),
  defineField({
    name: 'showFooter',
    title: 'Show Footer',
    type: 'boolean',
    fieldset: 'chrome',
    description: 'Show the site footer on this page.',
    options: {layout: 'switch'},
    initialValue: true,
  }),
]
