import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import ColorPaletteInput from '../components/ColorPaletteInput'
import CompactImageInput from '../components/CompactImageInput'
import {richTextOf} from '../fields/richText'

export const featureCardItemType = defineType({
  name: 'featureCardItem',
  title: 'Feature Card',
  type: 'object',
  icon: ImageIcon,
  fieldsets: [
    {name: 'media', title: 'Media', options: {collapsible: true, collapsed: false}},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Big headline on the card (optional — leave empty for an image-only card).',
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'array',
      of: richTextOf,
    }),

    // ── Media ──
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      fieldset: 'media',
      description: 'Image fills the card background. Video shows a thumbnail + play button.',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'photoWithAlt',
      fieldset: 'media',
      description: 'Full-bleed background image.',
      hidden: ({parent}) => parent?.mediaType === 'video',
    }),
    defineField({
      name: 'videoFile',
      title: 'Upload Video',
      type: 'file',
      fieldset: 'media',
      description: 'mp4/webm. Leave empty to use an external URL instead.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      options: {accept: 'video/*'},
    }),
    defineField({
      name: 'videoUrl',
      title: 'Or External Video URL',
      type: 'url',
      fieldset: 'media',
      description: 'YouTube, Vimeo, or direct URL. Used only if no file is uploaded.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoThumbnail',
      title: 'Video Thumbnail',
      type: 'image',
      fieldset: 'media',
      description: 'Preview image on the card before the video plays.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      options: {hotspot: true},
      components: {input: CompactImageInput},
      fields: [
        defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
      ],
    }),

    // ── Style ──
    defineField({
      name: 'accentColor',
      title: 'Accent Bar Color',
      type: 'string',
      description: 'Vertical colored bar beside the title.',
      components: {input: ColorPaletteInput},
      initialValue: '#dc2626',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL (optional)',
      type: 'string',
      description: 'Makes the whole card clickable.',
      placeholder: '/commercial/',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => !parent?.linkUrl && !parent?.link?.endpoint,
    }),
    defineField({
      name: 'link',
      title: 'Link (legacy)',
      type: 'linkEndpoint',
      hidden: true,
    }),
  ],
  preview: {
    select: {title: 'title', media: 'image.image', mediaType: 'mediaType', thumb: 'videoThumbnail'},
    prepare({title, media, mediaType, thumb}) {
      return {
        title: title || 'Untitled Feature',
        subtitle: mediaType === 'video' ? 'Video card' : 'Feature card',
        media: thumb || media || ImageIcon,
      }
    },
  },
})
