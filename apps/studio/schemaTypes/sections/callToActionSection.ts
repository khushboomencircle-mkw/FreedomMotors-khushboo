/**
 * Call to Action Section — a focused heading, short text, and one or two
 * buttons, for a closing pitch at the end of a page (e.g. "Ready to get
 * started? [Book a Demo] [Learn More]").
 *
 * Reuses sectionHeaderFields() for heading/text and buttonFields() for the
 * button(s) — the same builders cardsGridSection/featureGridSection already
 * use — rather than introducing new field names for the same job.
 *
 * Deliberately has NO separate "background photo" field: sectionThemeFields()
 * + containerConfig (added below, same as every other section) already give
 * this section a background image via containerConfig.backgroundImage. A
 * second, parallel photo field would duplicate that, not add a capability.
 */
import {defineField, defineType} from 'sanity'
import {RocketIcon} from '@sanity/icons/Rocket'
import {sectionThemeFields} from '../fields/sectionTheme'
import {
  sequenceField,
  activeField,
  sectionHeaderFields,
  buttonFields,
} from '../fields/sectionFields'

export const callToActionSectionType = defineType({
  name: 'callToActionSection',
  title: 'Call to Action Section',
  type: 'object',
  icon: RocketIcon,
  description:
    'A heading, short text, and one or two buttons — a closing pitch at the end of a page.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
    {
      name: 'primaryButton',
      title: '2. Primary Button',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'secondaryButton',
      title: '3. Secondary Button',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    ...buttonFields({group: 'content', includeSecondary: true, includeStyle: true}),

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
    select: {heading: 'sectionHeading', sequence: 'sequence'},
    prepare({heading, sequence}) {
      return {
        title: heading || 'Call to Action Section',
        subtitle: `#${sequence ?? '—'} · Call to Action`,
        media: RocketIcon,
      }
    },
  },
})
