import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'
import ColorPaletteInput from '../components/ColorPaletteInput'
import {richTextOf} from '../fields/richText'

export const linkListItemType = defineType({
  name: 'linkListItem',
  title: 'Link List Item',
  type: 'object',
  icon: LinkIcon,
  fieldsets: [
    {name: 'button', title: 'Right-Side Button (optional)', options: {columns: 1}},
    {name: 'buttonStyle', title: 'Button Style', options: {columns: 2}},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown on the row (e.g. "Shop Rear Entry").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'array',
      of: richTextOf,
      description: 'Shown below the title (always or hover-only, per the section setting).',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'string',
      description: 'Where the whole row redirects when clicked.',
      placeholder: '/rear-entry/',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => !parent?.linkUrl,
    }),
    defineField({
      name: 'hoverColor',
      title: 'Hover Color (optional)',
      type: 'string',
      // Retired: every row now uses the section's Highlight Color. Hidden, not deleted, so
      // already-saved values don't show up as "unknown field" warnings; the site ignores them.
      hidden: true,
      components: {input: ColorPaletteInput},
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      fieldset: 'button',
      placeholder: 'Explore Rear Entry',
    }),
    defineField({
      name: 'buttonShowBg',
      title: 'Filled',
      type: 'boolean',
      fieldset: 'buttonStyle',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => !parent?.buttonLabel,
    }),
    defineField({
      name: 'buttonShowBorder',
      title: 'Border',
      type: 'boolean',
      fieldset: 'buttonStyle',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => !parent?.buttonLabel,
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'linkUrl'},
    prepare({title, subtitle}) {
      return {title: title || 'Untitled', subtitle: subtitle || '—'}
    },
  },
})
