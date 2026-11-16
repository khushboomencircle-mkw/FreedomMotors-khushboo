import { defineField, defineType } from 'sanity'
import { CodeBlockIcon } from '@sanity/icons/CodeBlock'
import HtmlCodeInput from '../components/HtmlCodeInput'
import { validateHtmlContent, TRUSTED_SCRIPT_HOSTS_LABEL } from './htmlValidation'
import { sectionThemeFields } from '../fields/sectionTheme'
import { sequenceField, activeField } from '../fields/sectionFields'

/**
 * Custom HTML Section — lets an editor paste static HTML markup that is rendered
 * directly on the frontend. Exactly ONE editable field: `htmlCode`.
 *
 * Iframe, embed, event handlers and javascript:/vbscript:/data: URLs are
 * rejected here in the editor and independently sanitized on the frontend.
 * Inline <script> is also rejected — a <script src="..."> is allowed, but
 * only pointing at a host on the TRUSTED_SCRIPT_HOSTS allowlist (see
 * htmlValidation.ts).
 *
 * Also exposes the shared Section Theme override (colors, fonts, buttons,
 * corner rounding) so the HTML content can inherit the same per-section
 * theming every other section type gets, instead of only ever following the
 * sitewide Site Theme.
 */
export const customHtmlSectionType = defineType({
  name: 'customHtmlSection',
  title: 'Custom HTML Section',
  type: 'object',
  icon: CodeBlockIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'sectionStyles', title: 'Section Theme' },
    { name: 'behavior', title: 'Behavior' },
  ],
  fieldsets: [
    {
      name: 'htmlContent',
      title: '1. HTML Content',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    sequenceField('content'),
    defineField({
      name: 'htmlCode',
      title: 'HTML Code',
      type: 'text',
      rows: 20,
      group: 'content',
      fieldset: 'htmlContent',
      description:
        'Paste your own HTML and CSS. Not allowed: full pages (<html>, <head>, <meta>), <iframe>, <form>, <svg>, ' +
        'inline scripts, onclick-style handlers and data: links. ' +
        `Scripts: only <script src="https://..."> from these hosts: ${TRUSTED_SCRIPT_HOSTS_LABEL}. ` +
        'Need another host? Ask an admin.',
      components: { input: HtmlCodeInput },
      validation: (Rule) =>
        Rule.required().error('HTML code is required.').custom((value) => {
          if (typeof value !== 'string' || !value.trim()) {
            return true
          }

          return validateHtmlContent(value)
        }),
    }),
    ...sectionThemeFields(),
    defineField({
      name: 'container',
      title: 'Section Background & Width (Fallback Theme)',
      type: 'containerConfig',
      group: 'sectionStyles',
      hidden: ({ parent }) => parent?.enableSectionTheme,
    }),
    defineField({
      name: 'border',
      title: 'Section Border',
      type: 'borderConfig',
      group: 'sectionStyles',
      hidden: ({ parent }) => parent?.enableSectionTheme,
    }),
    activeField('behavior'),
  ],
  preview: {
    select: { html: 'htmlCode' },
    prepare({ html }: { html?: string }) {
      const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      return {
        title: 'Custom HTML Section',
        subtitle: text ? text.slice(0, 60) : 'Empty',
      }
    },
  },
})
