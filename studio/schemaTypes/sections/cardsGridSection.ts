/**
 * Cards Grid Section — displays step cards in a configurable grid.
 * Reusable across any page schema.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionThemeFields} from '../fields/sectionTheme'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {
  sectionHeaderFields,
  expandableFields,
  sequenceField,
  activeField,
} from '../fields/sectionFields'
import ScaleInput from '../components/ScaleInput'

export const cardsGridSectionType = defineType({
  name: 'cardsGridSection',
  title: 'Cards Grid Section',
  type: 'object',
  icon: ThLargeIcon,
  description: 'A row or grid of cards — great for steps, services, or features.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'cardStyles', title: 'Card Style'},
    {name: 'typography', title: 'Typography'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
    {name: 'display', title: '2. Display', options: {collapsible: true, collapsed: true}},
    {
      name: 'sliderOptions',
      title: '3. Slider Options',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      group: 'content',
      description: 'Add one card per item.',
      of: [defineArrayMember({type: 'cardItem'})],
    }),
    defineField({
      name: 'items',
      title: 'Accordion Items (Optional)',
      type: 'array',
      group: 'content',
      description: 'Click-to-expand questions shown below the cards grid.',
      of: [defineArrayMember({type: 'accordionItem'})],
    }),

    // ── Layout ──
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      description: 'How many cards sit side by side on a desktop screen.',
      options: {
        list: [
          {title: '1', value: '1'},
          {title: '2', value: '2'},
          {title: '3', value: '3'},
          {title: '4', value: '4'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '3',
    }),
    defineField({
      name: 'gridGap',
      title: 'Space Between Cards',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      components: {input: ScaleInput},
      options: {
        list: [
          {title: 'Tight', value: '16'},
          {title: 'Normal', value: '24'},
          {title: 'Wide', value: '32'},
          {title: 'Extra Wide', value: '48'},
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'mosaicView',
      title: 'Mosaic View',
      type: 'boolean',
      group: 'layout',
      fieldset: 'display',
      description:
        'Every first card in each group of 5 becomes a larger featured tile, instead of a uniform grid.',
      // Horizontal slider is this section's only non-grid state — any other
      // Columns value, or Columns=1 + Vertical Stack, is still a grid.
      hidden: ({parent}) => parent?.columns === '1' && parent?.oneColumnDisplayMode === 'slider',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'cardContentOrder',
      title: 'Card Layout Order',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      description: 'The order title, image, and description stack inside each card.',
      options: {
        list: [
          {title: 'Title → Image → Text', value: 'titleImageDesc'},
          {title: 'Image → Title → Text', value: 'imageTitleDesc'},
          {title: 'Title → Text → Image', value: 'titleDescImage'},
        ],
        layout: 'radio',
      },
      initialValue: 'titleImageDesc',
    }),
    defineField({
      name: 'enableLoadMore',
      title: 'Enable Load More',
      type: 'boolean',
      group: 'layout',
      fieldset: 'display',
      description:
        'Shows only the first batch of cards, with a button to reveal the rest. Off: every card shows at once, same as today.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'initialVisibleCount',
      title: 'Cards Shown Before "Load More"',
      type: 'number',
      group: 'layout',
      fieldset: 'display',
      hidden: ({parent}) => !parent?.enableLoadMore,
      initialValue: 8,
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'loadMoreButtonLabel',
      title: 'Load More Button Label',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      hidden: ({parent}) => !parent?.enableLoadMore,
      initialValue: 'Load More',
    }),

    // ── 1-Column Slider (only when Columns = 1) ──
    defineField({
      name: 'oneColumnDisplayMode',
      title: 'Display as',
      type: 'string',
      group: 'layout',
      fieldset: 'sliderOptions',
      description: 'When Columns is 1, show cards as a vertical stack or as a horizontal slider.',
      hidden: ({parent}) => parent?.columns !== '1',
      options: {
        list: [
          {title: 'Vertical Stack', value: 'stack'},
          {title: 'Full-Width Slider (with arrows)', value: 'slider'},
        ],
        layout: 'radio',
      },
      initialValue: 'stack',
    }),
    defineField({
      name: 'sliderAutoPlay',
      title: 'Auto-slide',
      type: 'boolean',
      group: 'layout',
      fieldset: 'sliderOptions',
      description: 'Automatically advances to the next card every few seconds.',
      hidden: ({parent}) => parent?.columns !== '1' || parent?.oneColumnDisplayMode !== 'slider',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'sliderAutoPlayInterval',
      title: 'Auto-slide Speed (seconds)',
      type: 'number',
      group: 'layout',
      fieldset: 'sliderOptions',
      description: 'How long each card stays visible before the next one appears.',
      hidden: ({parent}) =>
        parent?.columns !== '1' ||
        parent?.oneColumnDisplayMode !== 'slider' ||
        !parent?.sliderAutoPlay,
      initialValue: 5,
      validation: (rule) => rule.min(2).max(30),
    }),
    defineField({
      name: 'sliderShowArrows',
      title: 'Show Left/Right Arrows',
      type: 'boolean',
      group: 'layout',
      fieldset: 'sliderOptions',
      hidden: ({parent}) => parent?.columns !== '1' || parent?.oneColumnDisplayMode !== 'slider',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'sliderShowDots',
      title: 'Show Progress Dots',
      type: 'boolean',
      group: 'layout',
      fieldset: 'sliderOptions',
      hidden: ({parent}) => parent?.columns !== '1' || parent?.oneColumnDisplayMode !== 'slider',
      options: {layout: 'switch'},
      initialValue: true,
    }),

    // ── Card Styles ──
    defineField({
      name: 'cardStyle',
      title: 'Card Look',
      type: 'cardStyleConfig',
      group: 'cardStyles',
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
  ],
  preview: {
    select: {heading: 'sectionHeading', sequence: 'sequence', cards: 'cards'},
    prepare({heading, sequence, cards}) {
      const count = cards?.length || 0
      return {
        title: heading || `${count} Card${count === 1 ? '' : 's'} Section`,
        subtitle: `#${sequence ?? '—'} · Cards Grid (${count})`,
        media: ThLargeIcon,
      }
    },
  },
})
