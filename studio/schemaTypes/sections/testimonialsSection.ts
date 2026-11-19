/**
 * Testimonials Section — hand-written customer quotes shown as a slider, a
 * grid, or one large featured quote. (Different from the Google Reviews
 * section, which embeds a live Trustindex widget.)
 *
 * Items are plain inline `testimonialItem` objects for now — no separate
 * testimonial documents.
 *
 * No Review / AggregateRating structured data (JSON-LD) is produced for these
 * quotes: self-serving review markup can break search-engine guidelines.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {DoubleQuoteIcon} from '@sanity/icons/DoubleQuote'
import {sectionThemeFields} from '../fields/sectionTheme'
import {sectionHeaderFields, sequenceField, activeField} from '../fields/sectionFields'

// Layout is optional on old/empty data, and the site treats "no value" as Slider,
// so the Studio's show/hide rules do too.
const layoutOf = (parent?: {layout?: string}) => parent?.layout ?? 'slider'

export const testimonialsSectionType = defineType({
  name: 'testimonialsSection',
  title: 'Testimonials Section',
  type: 'object',
  icon: DoubleQuoteIcon,
  description: 'Customer quotes shown as a slider, a grid, or one featured quote.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
    {name: 'display', title: '1. Display', options: {collapsible: true, collapsed: true}},
    {
      name: 'sliderOptions',
      title: '2. Slider Options',
      options: {collapsible: true, collapsed: true},
    },
    {name: 'gridOptions', title: '2. Grid Options', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      group: 'content',
      description: 'Add a quote and a name to get started. Everything else is optional.',
      of: [defineArrayMember({type: 'testimonialItem'})],
    }),

    // ── Layout: Display ──
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      description:
        'Slider: one quote at a time with arrows and dots. Grid: all quotes side by side. Single featured: only the first quote in the list, shown large — drag a testimonial to the top to choose it.',
      options: {
        list: [
          {title: 'Slider', value: 'slider'},
          {title: 'Grid', value: 'grid'},
          {title: 'Single featured', value: 'featured'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'slider',
    }),
    defineField({
      name: 'showRatings',
      title: 'Show Star Ratings',
      type: 'boolean',
      group: 'layout',
      fieldset: 'display',
      description: 'Shows the stars for testimonials that have a rating.',
      options: {layout: 'switch'},
      initialValue: true,
    }),

    // ── Layout: Slider options (same field names as Cards Grid's slider) ──
    defineField({
      name: 'sliderAutoPlay',
      title: 'Auto-slide',
      type: 'boolean',
      group: 'layout',
      fieldset: 'sliderOptions',
      description:
        'Moves to the next quote automatically. Pauses when a visitor hovers, touches or focuses the slider, and never runs for visitors who ask their device to reduce motion.',
      hidden: ({parent}) => layoutOf(parent) !== 'slider',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'sliderAutoPlayInterval',
      title: 'Auto-slide Speed (seconds)',
      type: 'number',
      group: 'layout',
      fieldset: 'sliderOptions',
      description: 'How long each quote stays visible before the next one appears.',
      hidden: ({parent}) => layoutOf(parent) !== 'slider' || !parent?.sliderAutoPlay,
      initialValue: 6,
      validation: (rule) => rule.min(3).max(30),
    }),

    // ── Layout: Grid options (same field name as Photo Gallery's grid) ──
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      group: 'layout',
      fieldset: 'gridOptions',
      description:
        'How many quotes sit side by side on a desktop screen. Tablets show 2, phones show 1.',
      hidden: ({parent}) => layoutOf(parent) !== 'grid',
      options: {
        list: [
          {title: '2', value: '2'},
          {title: '3', value: '3'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '3',
    }),

    // ── Section Theme ──
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
    select: {
      testimonials: 'testimonials',
      sequence: 'sequence',
      layout: 'layout',
      heading: 'sectionHeading',
    },
    prepare({testimonials, sequence, layout, heading}) {
      const count = testimonials?.length || 0
      return {
        title: heading || `${count} Testimonial${count === 1 ? '' : 's'}`,
        subtitle: `#${sequence ?? '—'} · ${count} quote${count === 1 ? '' : 's'} · ${layout ?? 'slider'} layout`,
        media: DoubleQuoteIcon,
      }
    },
  },
})
