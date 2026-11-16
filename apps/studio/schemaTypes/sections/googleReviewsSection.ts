import { defineField, defineType } from 'sanity'
import { StarIcon } from '@sanity/icons/Star'
import { sequenceField, activeField } from '../fields/sectionFields'

/**
 * Google Reviews Section — embeds the Trustindex widget already used on the
 * live site (freedommotors.com) to show Google reviews in a slider.
 *
 * Trustindex (not this app) owns the actual review data and the widget's
 * visual style — both are configured once in the Trustindex dashboard and
 * keyed by a single ID (`data-pid` in their embed snippet). This section only
 * needs that ID; the matching loader script is added once, site-wide, in
 * layout.tsx — not per section, since Trustindex's own install instructions
 * install it once per site, not once per widget placement.
 */
export const googleReviewsSectionType = defineType({
  name: 'googleReviewsSection',
  title: 'Google Reviews Section',
  type: 'object',
  icon: StarIcon,
  description: 'Shows your Google reviews in a slider, via your Trustindex widget.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'behavior', title: 'Behavior' },
  ],
  fields: [
    sequenceField('content'),
    defineField({
      name: 'trustindexWidgetId',
      title: 'Trustindex Widget ID',
      type: 'string',
      group: 'content',
      description:
        'From Trustindex dashboard → widget → Get Code → the data-pid value only (e.g. "d30d0d728098843d03365408186"), not the whole snippet.',
      validation: (Rule) => Rule.required().error('Paste the data-pid value from your Trustindex embed code.'),
    }),
    activeField('behavior'),
  ],
  preview: {
    select: { pid: 'trustindexWidgetId', sequence: 'sequence' },
    prepare({ pid, sequence }: { pid?: string; sequence?: number }) {
      return {
        title: 'Google Reviews',
        subtitle: `#${sequence ?? '—'} · ${pid ? `Widget ${pid}` : 'No widget ID set yet'}`,
        media: StarIcon,
      }
    },
  },
})
