/**
 * Link List Section — image on one side + a hover-highlighted list of
 * clickable text links on the other side, with optional per-item button.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionThemeFields} from '../fields/sectionTheme'
import {MenuIcon} from '@sanity/icons/Menu'
import {sectionHeaderFields, sequenceField, activeField} from '../fields/sectionFields'
import ColorPaletteInput from '../components/ColorPaletteInput'
import FullWidthDescField from '../components/FullWidthDescField'

export const linkListSectionType = defineType({
  name: 'linkListSection',
  title: 'Image + Link List Section',
  type: 'object',
  icon: MenuIcon,
  description: 'An image beside a clickable list of titles; hover highlights the row.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'typography', title: 'Typography'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {
      name: 'layoutRow',
      title: '1. Layout Options',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'listOptions',
      title: '2. List Options',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'photoWithAlt',
      group: 'content',
    }),
    defineField({
      name: 'listItems',
      title: 'List Items',
      type: 'array',
      group: 'content',
      description: 'Each row is a clickable link that highlights on hover.',
      of: [defineArrayMember({type: 'linkListItem'})],
    }),

    // ── Layout ──
    defineField({
      name: 'imageSide',
      title: 'Image Side',
      type: 'string',
      group: 'layout',
      fieldset: 'layoutRow',
      options: {
        list: [
          {title: 'Image Left', value: 'left'},
          {title: 'Image Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'highlightColor',
      title: 'Highlight Color',
      type: 'string',
      group: 'layout',
      fieldset: 'layoutRow',
      description:
        'Background color shown when any row is hovered. Leave blank to follow the Site Theme.',
      components: {input: ColorPaletteInput, field: FullWidthDescField},
    }),
    defineField({
      name: 'showNumbers',
      title: 'Show Numeric Bullets (01, 02, 03…)',
      type: 'boolean',
      group: 'layout',
      fieldset: 'listOptions',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'showDescriptionOnHover',
      title: 'Reveal Description on Hover Only',
      type: 'boolean',
      group: 'layout',
      fieldset: 'listOptions',
      description: 'Off shows descriptions always; on shows them only on hover.',
      options: {layout: 'switch'},
      initialValue: false,
    }),

    // ── Typography ──
    defineField({
      name: 'typography',
      title: 'Typography',
      type: 'typographyConfig',
      group: 'typography',
    }),

    // ── Section Style ──
    ...sectionThemeFields(),
    defineField({
      name: 'container',
      title: 'Section Background & Width (Fallback Theme)',
      type: 'containerConfig',
      group: 'sectionStyles',
      hidden: ({parent}) => parent?.enableSectionTheme,
    }),
    defineField({
      name: 'border',
      title: 'Section Border',
      type: 'borderConfig',
      group: 'sectionStyles',
      hidden: ({parent}) => parent?.enableSectionTheme,
    }),

    // ── Behavior ──
    activeField('behavior'),
  ],
  preview: {
    select: {heading: 'sectionHeading', sequence: 'sequence', items: 'listItems'},
    prepare({heading, sequence, items}) {
      const count = items?.length || 0
      return {
        title: heading || `Image + Link List (${count})`,
        subtitle: `#${sequence ?? '—'} · Image + Link List (${count} link${count === 1 ? '' : 's'})`,
        media: MenuIcon,
      }
    },
  },
})
