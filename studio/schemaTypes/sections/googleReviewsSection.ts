import {defineField, defineType} from 'sanity'
import {StarIcon} from '@sanity/icons/Star'
import {sequenceField, activeField} from '../fields/sectionFields'
import {extractTrustindexWidgetId, isTrustindexWidgetId} from '../../../src/lib/trustindex'

/**
 * Google Reviews Section — shows the client's Google reviews in a slider, through
 * the Trustindex widget already used on the live site (freedommotors.com).
 *
 * Trustindex (not this app) owns the actual review data and the widget's
 * visual style — both are configured once in the Trustindex dashboard and
 * keyed by a single ID (`data-pid`, also the part after "loader.js?" in their
 * embed code). That ID is the only thing needed from the client: the website
 * loads Trustindex's own public loader itself and points it at this ID
 * (src/lib/trustindex.ts), so there is nothing else to install or configure.
 */
export const googleReviewsSectionType = defineType({
  name: 'googleReviewsSection',
  title: 'Google Reviews Section',
  type: 'object',
  icon: StarIcon,
  description: 'Shows your Google reviews in a slider, via your Trustindex widget.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'behavior', title: 'Behavior'},
  ],
  fields: [
    sequenceField('content'),
    defineField({
      name: 'trustindexWidgetId',
      title: 'Trustindex Widget ID',
      type: 'string',
      group: 'content',
      description:
        'The ID of your Trustindex widget — ask the client for it. In Trustindex: Widgets → your Google widget → Get Code, then copy the ID only: the data-pid value, or the letters and digits after "loader.js?" (about 27 characters, e.g. "d30d0d728098843d03365408186"). Not the whole snippet. The look of the slider (layout, colors, number of reviews) is set in Trustindex, not here.',
      validation: (Rule) =>
        Rule.required()
          .error('Add the Trustindex widget ID — without it this section shows nothing.')
          .custom((value) => {
            if (typeof value !== 'string' || value === '' || isTrustindexWidgetId(value))
              return true
            const found = extractTrustindexWidgetId(value)
            return found
              ? `Paste only the ID, not the whole snippet: ${found}`
              : 'That is not a Trustindex widget ID. It is about 27 letters and digits, with no spaces or symbols.'
          }),
    }),
    activeField('behavior'),
  ],
  preview: {
    select: {pid: 'trustindexWidgetId', sequence: 'sequence'},
    prepare({pid, sequence}: {pid?: string; sequence?: number}) {
      return {
        title: 'Google Reviews',
        subtitle: `#${sequence ?? '—'} · ${pid ? `Widget ${pid}` : 'No widget ID set yet'}`,
        media: StarIcon,
      }
    },
  },
})
