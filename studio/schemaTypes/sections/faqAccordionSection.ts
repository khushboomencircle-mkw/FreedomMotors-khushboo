/**
 * Accordion Section — expandable content with header, eyebrow, and collapsible items.
 * Use for FAQs, expandable Q&A lists, step-by-step guides, or any togglable content.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionThemeFields} from '../fields/sectionTheme'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import ColorPaletteInput from '../components/ColorPaletteInput'
import {
  sectionHeaderFields,
  expandableFields,
  sequenceField,
  activeField,
} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

export const accordionSectionType = defineType({
  name: 'accordionSection',
  title: 'Accordion Section',
  type: 'object',
  icon: DocumentTextIcon,
  description: 'A list of click-to-expand items — great for FAQs or step-by-step details.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'typography', title: 'Typography'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [{name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}}],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      group: 'content',
      description: 'Small text above the heading (e.g. "Common Questions").',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
      description: 'Main heading displayed above the accordion items.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: richTextOf,
      group: 'content',
      description: 'Paragraph shown below the heading, above the accordion items.',
    }),
    defineField({
      name: 'items',
      title: 'Accordion Items',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'accordionItem'})],
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
    ...expandableFields({group: 'behavior', includeFaqOptions: true}),
    defineField({
      name: 'accordionDividerColor',
      title: 'Divider Line Color',
      type: 'string',
      group: 'behavior',
      description: 'Color of the line between each question.',
      components: {input: ColorPaletteInput},
      initialValue: '#d1d5db',
    }),
  ],
  preview: {
    select: {heading: 'sectionHeading', title: 'heading', sequence: 'sequence', items: 'items'},
    prepare({heading, title, sequence, items}) {
      const count = items?.length || 0
      return {
        title: heading || title || `Accordion (${count} item${count === 1 ? '' : 's'})`,
        subtitle: `#${sequence ?? '—'} · Accordion Section`,
        media: DocumentTextIcon,
      }
    },
  },
})
