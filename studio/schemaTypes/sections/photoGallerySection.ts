/**
 * Photo Gallery Section — a grid, mosaic, or slider of photos with optional
 * click-to-enlarge. Each photo is a reusable `photoWithAlt` item, so bulk
 * drag-and-drop uploads work the same way a native Sanity image array does.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {sectionThemeFields} from '../fields/sectionTheme'
import {sequenceField, activeField} from '../fields/sectionFields'

export const photoGallerySectionType = defineType({
  name: 'photoGallerySection',
  title: 'Photo Gallery',
  type: 'object',
  icon: ImageIcon,
  description: 'A grid, mosaic, or slider of photos with optional click-to-enlarge.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {name: 'display', title: '1. Display', options: {collapsible: true, collapsed: true}},
    {name: 'lightboxSet', title: '2. Lightbox', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      group: 'content',
      description: 'Add 2–24 photos. Drag and drop multiple files at once.',
      of: [defineArrayMember({type: 'photoWithAlt'})],
      validation: (rule) => rule.min(2).max(24),
    }),

    // ── Layout: Display ──
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      description: 'How the photos are arranged.',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Mosaic', value: 'mosaic'},
          {title: 'Slider', value: 'slider'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      group: 'layout',
      fieldset: 'display',
      description: 'How many photos sit side by side on a desktop screen (Grid layout only).',
      hidden: ({parent}) => parent?.layout !== 'grid',
      options: {
        list: [
          {title: '2', value: '2'},
          {title: '3', value: '3'},
          {title: '4', value: '4'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '3',
    }),

    // ── Layout: Lightbox ──
    defineField({
      name: 'lightbox',
      title: 'Click to Enlarge',
      type: 'boolean',
      group: 'layout',
      fieldset: 'lightboxSet',
      description: 'Clicking a photo opens a larger popup view.',
      options: {layout: 'switch'},
      initialValue: false,
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
    select: {photos: 'photos', sequence: 'sequence', layout: 'layout', media: 'photos.0.image'},
    prepare({photos, sequence, layout, media}) {
      const count = photos?.length || 0
      return {
        title: `${count} Photo Gallery`,
        subtitle: `#${sequence ?? '—'} · ${layout} layout`,
        media: media || ImageIcon,
      }
    },
  },
})
