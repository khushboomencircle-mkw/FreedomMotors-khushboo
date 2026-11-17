/**
 * Testimonial Item — one hand-written customer quote inside a Testimonials
 * Section. Kept as its own small object type (like cardItem / accordionItem)
 * with a flat, simple shape, so these items could later be moved into
 * standalone `testimonial` documents without reshaping the data.
 *
 * `photo` reuses the shared `photoWithAlt` type instead of inlining another
 * image + alt pair.
 */
import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'

export const testimonialItemType = defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'What the customer said, in their own words. No quotation marks needed.',
      validation: (rule) => [
        rule.required().error('Add the customer’s quote.'),
        // Soft limit only — very long quotes are clamped with a "Read more" link on the site.
        rule.max(600).warning('Over 600 characters — long quotes are shortened on the site.'),
      ],
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'e.g. "Priya S." — use a first name and initial if you prefer.',
      validation: (rule) => rule.required().error('Add the customer’s name.'),
    }),
    defineField({
      name: 'role',
      title: 'Role or Location',
      type: 'string',
      description: 'Optional. e.g. "Rajkot" or "Fleet Manager, Acme Ltd".',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'photoWithAlt',
      description: 'Optional. Without a photo, the first letter of the name is shown instead.',
    }),
    defineField({
      name: 'rating',
      title: 'Star Rating',
      type: 'number',
      description: 'Optional. Leave blank to show no stars for this customer.',
      options: {
        list: [
          {title: '5 stars', value: 5},
          {title: '4 stars', value: 4},
          {title: '3 stars', value: 3},
          {title: '2 stars', value: 2},
          {title: '1 star', value: 1},
        ],
      },
      validation: (rule) => rule.integer().min(1).max(5),
    }),
    defineField({
      name: 'source',
      title: 'Source Label',
      type: 'string',
      description: 'Optional. Where the review came from, e.g. "Google" or "Facebook".',
    }),
  ],
  preview: {
    select: {name: 'name', quote: 'quote', media: 'photo.image'},
    prepare({name, quote, media}) {
      const text = (quote || '').replace(/\s+/g, ' ').trim()
      return {
        title: name || 'Unnamed customer',
        subtitle: text ? (text.length > 70 ? `${text.slice(0, 70)}…` : text) : 'No quote yet',
        media: media || CommentIcon,
      }
    },
  },
})
