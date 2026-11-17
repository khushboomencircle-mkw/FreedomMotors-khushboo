import {defineField, defineType} from 'sanity'

/**
 * photoWithAlt — a single photo + its alt text. The one shared "photo" shape
 * for new schema going forward, instead of each place that needs a photo
 * inlining its own image+alt fields. That inline shape is already repeated
 * in cardItem.ts, featureCardItem.ts, bannerSection.ts, and vehicleType.ts —
 * those four are candidates for a future normalization pass onto this type,
 * but are intentionally left untouched here.
 *
 * `image` deliberately has NO custom input component: Sanity's native image
 * field supports dropping multiple files onto an array at once, which is
 * what a photo gallery needs. CompactImageInput's file input isn't
 * `multiple`, so wiring it here would break bulk-uploading a gallery.
 */
export const photoWithAltType = defineType({
  name: 'photoWithAlt',
  title: 'Photo',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      validation: (rule) => rule.required().max(140),
    }),
  ],
  preview: {
    select: {media: 'image', alt: 'alt'},
    prepare({media, alt}) {
      return {
        title: alt || 'Untitled Photo',
        media,
      }
    },
  },
})
