import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ImageIcon} from '@sanity/icons/Image'
import ScaleInput from '../components/ScaleInput'
import AlignInput from '../components/AlignInput'
import CompactImageInput from '../components/CompactImageInput'
import {richTextOf} from '../fields/richText'

export const cardItemType = defineType({
  name: 'cardItem',
  title: 'Card Item',
  type: 'object',
  icon: DocumentTextIcon,
  fieldsets: [
    {name: 'media', title: 'Media', options: {collapsible: true, collapsed: false}},
    {name: 'action', title: 'Action When Clicked', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'badge',
      title: 'Badge / Step Label',
      type: 'string',
      description: 'Optional label above the title (e.g. "Step 1", "01").',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow / Category Label',
      type: 'string',
      description:
        'Short category label shown above the title (e.g. "Accessible SUVs," "Lifestyle"). Takes priority over Badge / Step Label when both are set.',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: richTextOf,
    }),

    // ── Media ──
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      fieldset: 'media',
      description: 'What this card shows above the title & text.',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'No Media', value: 'none'},
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
      hidden: ({parent}) => parent?.mediaType === 'video' || parent?.mediaType === 'none',
    }),
    defineField({
      name: 'videoFile',
      title: 'Upload Video',
      type: 'file',
      fieldset: 'media',
      description: 'Video file (mp4/webm); leave empty to use the URL below instead.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      options: {accept: 'video/*'},
    }),
    defineField({
      name: 'videoUrl',
      title: 'Or External Video URL',
      type: 'url',
      fieldset: 'media',
      description: 'YouTube, Vimeo, or direct video URL (used if no file is uploaded).',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoThumbnail',
      title: 'Video Thumbnail',
      type: 'image',
      fieldset: 'media',
      description: 'Preview image shown before the video plays.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      options: {hotspot: true},
      components: {input: CompactImageInput},
      fields: [
        defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
      ],
    }),
    defineField({
      name: 'videoOrientation',
      title: 'Video Orientation',
      type: 'string',
      fieldset: 'media',
      description: 'Landscape (16:9) or Portrait (9:16).',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      components: {input: AlignInput},
      options: {
        list: [
          {title: 'Landscape', value: 'landscape'},
          {title: 'Portrait', value: 'portrait'},
        ],
      },
      initialValue: 'landscape',
    }),
    defineField({
      name: 'videoSize',
      title: 'Video Size',
      type: 'string',
      fieldset: 'media',
      description: 'How tall the video appears in the card.',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      components: {input: ScaleInput},
      options: {
        list: [
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Full', value: 'xl'},
        ],
      },
      initialValue: 'md',
    }),

    // ── Action When Clicked ──
    defineField({
      name: 'cardAction',
      title: 'When the Card is Clicked',
      type: 'string',
      fieldset: 'action',
      description: 'Makes the whole card clickable (add a button below too, if you want both).',
      options: {
        list: [
          {title: 'Do Nothing', value: 'none'},
          {title: 'Go to a Link', value: 'openLink'},
          {title: 'Play Video in a Popup', value: 'videoLightbox'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'actionVideoUrl',
      title: 'Popup Video URL',
      type: 'url',
      fieldset: 'action',
      description: 'YouTube, Vimeo, or direct video URL to play when the card is clicked.',
      hidden: ({parent}) => parent?.cardAction !== 'videoLightbox',
    }),
    defineField({
      name: 'actionVideoFile',
      title: 'Or Upload Popup Video',
      type: 'file',
      fieldset: 'action',
      description: 'Takes priority over the URL above if both are set.',
      hidden: ({parent}) => parent?.cardAction !== 'videoLightbox',
      options: {accept: 'video/*'},
    }),
    defineField({
      name: 'actionLink',
      title: 'Link',
      type: 'linkEndpoint',
      fieldset: 'action',
      hidden: ({parent}) => parent?.cardAction !== 'openLink',
    }),
    defineField({
      name: 'actionOpenInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      fieldset: 'action',
      options: {layout: 'switch'},
      hidden: ({parent}) => parent?.cardAction !== 'openLink',
      initialValue: true,
    }),

    // ── Legacy "Show Button" controls (bottom-of-card button) ──
    defineField({
      name: 'showButton',
      title: 'Also Show a Button at the Bottom',
      type: 'boolean',
      description: 'Optional — the card can already be clickable via the setting above.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      hidden: ({parent}) => !parent?.showButton,
    }),
    defineField({
      name: 'buttonLink',
      title: 'Button Link',
      type: 'linkEndpoint',
      hidden: ({parent}) => !parent?.showButton,
    }),
  ],
  preview: {
    select: {title: 'title', badge: 'badge', media: 'image.image', mediaType: 'mediaType'},
    prepare({title, badge, media, mediaType}) {
      const typeLabel = mediaType === 'video' ? 'Video card' : mediaType === 'none' ? 'Text card' : 'Card item'
      return {
        title: title || 'Untitled Card',
        subtitle: badge ? `[${badge}] · ${typeLabel}` : typeLabel,
        media: media || ImageIcon,
      }
    },
  },
})
