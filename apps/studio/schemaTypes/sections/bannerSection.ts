/**
 * Banner Section — full-width hero image with heading, text, overlay & buttons.
 * Reusable across any page schema.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionThemeFields} from '../fields/sectionTheme'
import {ImageIcon} from '@sanity/icons/Image'
import {
  sectionHeaderFields,
  buttonFields,
  expandableFields,
  sequenceField,
  activeField,
} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'
import ScaleInput from '../components/ScaleInput'
import RadiusInput from '../components/RadiusInput'
import ColorPaletteInput from '../components/ColorPaletteInput'

export const bannerSectionType = defineType({
  name: 'bannerSection',
  title: 'Banner / Hero Section',
  type: 'object',
  icon: ImageIcon,
  description: 'A big image at the top of the page with a heading and a button.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'typography', title: 'Typography'},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {
      name: 'primaryButton',
      title: 'Primary Button',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'secondaryButton',
      title: 'Secondary Button',
      options: {columns: 2, collapsible: true, collapsed: false},
    },
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
    {
      name: 'layoutBase',
      title: '1. Image & Text Layout',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'sideBySide',
      title: '2. Side-by-Side Layout',
      description: 'Only used when Text Position is "Side by Side".',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'overlay',
      title: '3. Image Overlay',
      description: 'Only used when Text Position is "Over Image".',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    activeField('behavior'),
    sequenceField('content'),
    // ── Content ──
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      fieldset: 'header',
      group: 'content',
      description: 'The main headline shown over or beside the image.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: richTextOf,
      fieldset: 'header',
      group: 'content',
      description: 'Supporting paragraph below the heading.',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Label',
      fieldset: 'header',
      type: 'string',
      group: 'content',
      description: 'Small label above the heading (e.g. "What We Convert").',
    }),
    defineField({
      name: 'headerStyle',
      title: 'Heading Style',
      fieldset: 'header',
      type: 'string',
      group: 'content',
      description: 'Two ways to present the heading and text together.',
      options: {
        list: [
          {title: 'Heading + Paragraph', value: 'standard'},
          {title: 'Eyebrow + Big Headline', value: 'eyebrowHeadline'},
        ],
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'content',
      description: 'The banner photo (or photos for a grid/list layout).',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'photo',
              title: 'Photo',
              type: 'photoWithAlt',
            }),
            defineField({
              name: 'overlayTitle',
              title: 'Overlay Title',
              type: 'string',
              description: 'Title shown on top of the image (e.g. "How we build for Drivers").',
            }),
            defineField({
              name: 'overlayDescription',
              title: 'Overlay Description',
              type: 'text',
              rows: 2,
              description: 'Short line shown under the overlay title.',
            }),
            defineField({
              name: 'linkUrl',
              title: 'Link URL',
              type: 'string',
              description: 'Makes the image clickable. Path (/drivers/) or full URL.',
              placeholder: '/drivers/',
            }),
            defineField({
              name: 'openInNewTab',
              title: 'Open in New Tab',
              type: 'boolean',
              options: {layout: 'switch'},
              initialValue: false,
              hidden: ({parent}) => !parent?.linkUrl,
            }),
            defineField({
              name: 'imageRadius',
              title: 'Corner Radius',
              type: 'number',
              description: 'Enter a value or drag the slider to round the image corners.',
              components: {input: RadiusInput},
              validation: (rule) => rule.min(0).max(60),
              initialValue: 0,
            }),
            // imageFit hidden — always defaults to 'cover' (Fill: crop to fill frame).
            // defineField({ name: 'imageFit', ... })
          ],
          preview: {
            select: {media: 'photo.image', title: 'overlayTitle', alt: 'photo.alt'},
            prepare({media, title, alt}) {
              return {title: title || alt || 'Banner image', media}
            },
          },
        }),
      ],
    }),
    ...buttonFields({
      group: 'content',
      includeSecondary: true,
      includeOverlay: true,
      includeStyle: true,
    }),
    defineField({
      name: 'items',
      title: 'Accordion Items (Optional)',
      type: 'array',
      group: 'content',
      description: 'Click-to-expand questions shown below the banner content.',
      of: [defineArrayMember({type: 'accordionItem'})],
    }),

    // ── Layout ──
    defineField({
      name: 'imageLayout',
      title: 'Image Layout',
      type: 'string',
      group: 'layout',
      fieldset: 'layoutBase',
      description: 'How multiple images are arranged, if more than one is added.',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Stacked List', value: 'list'},
          {title: 'Full Width', value: 'fullWidth'},
          {title: 'Padded', value: 'padded'},
        ],
        layout: 'radio',
      },
      initialValue: 'fullWidth',
    }),
    defineField({
      name: 'mosaicView',
      title: 'Mosaic View',
      type: 'boolean',
      group: 'layout',
      fieldset: 'layoutBase',
      // Schema only, per explicit confirmation: `imageLayout: 'grid'` has
      // no distinct rendering in PageSection.tsx yet (it currently falls
      // through to the same path as every other non-fullWidth value), so
      // this toggle's frontend effect is deferred until that base Grid
      // layout itself is built as a separate task — flipping it on today
      // does nothing visible.
      description:
        'Every first image in each group of 5 becomes a larger featured tile, instead of a uniform grid. ' +
        'Needs the Grid image layout above — not yet visually implemented; this toggle has no effect yet.',
      hidden: ({parent}) => parent?.imageLayout !== 'grid',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'enableImageHover',
      title: 'Hover Focus on Images',
      type: 'boolean',
      group: 'layout',
      fieldset: 'layoutBase',
      description: 'Highlights images in red on hover. Turn off for a static look.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'textPosition',
      title: 'Text Position',
      type: 'string',
      group: 'layout',
      fieldset: 'layoutBase',
      description: 'Where the heading and text sit relative to the image.',
      options: {
        list: [
          {title: 'Above Image', value: 'aboveImage'},
          {title: 'Over Image', value: 'overImage'},
          {title: 'Below Image', value: 'belowImage'},
          {title: 'Boxed (Title → Image → Text)', value: 'boxLayout'},
          {title: 'Side by Side', value: 'besideImage'},
        ],
        layout: 'radio',
      },
      initialValue: 'overImage',
    }),

    // ── Side-by-Side Layout Options ──
    defineField({
      name: 'imageSide',
      title: 'Which side the Image is on',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'Content (heading, text, buttons) sits on the opposite side.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      options: {
        list: [
          {title: 'Image Left · Content Right', value: 'left'},
          {title: 'Image Right · Content Left', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'accordionSide',
      title: 'Or pick the Accordion Side instead',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'Optional alternative to the field above. Leave blank to use that instead.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      options: {
        list: [
          {title: 'Accordion Left · Image Right', value: 'left'},
          {title: 'Accordion Right · Image Left', value: 'right'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'imageWidth',
      title: 'Image Share of Row',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'How much of the row the image takes up.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      components: {input: ScaleInput},
      options: {
        list: [
          {title: '30%', value: '30'},
          {title: '40%', value: '40'},
          {title: 'Equal Split', value: '50'},
          {title: '60%', value: '60'},
          {title: '70%', value: '70'},
        ],
      },
      initialValue: '50',
    }),
    defineField({
      name: 'splitContentVerticalAlign',
      title: 'Text Vertical Position',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'Where the text sits top-to-bottom next to the image.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      options: {
        list: [
          {title: 'Top', value: 'top'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'bottom'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'splitContentBgColor',
      title: 'Text Area Background',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'Background behind the text. "Transparent" matches the section.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      components: {input: ColorPaletteInput},
      options: {allowTransparent: true} as any,
      initialValue: 'transparent',
    }),
    defineField({
      name: 'splitImageHeight',
      title: 'Row Height',
      type: 'string',
      group: 'layout',
      fieldset: 'sideBySide',
      description: 'How tall the image/text row is.',
      hidden: ({parent}) => parent?.textPosition !== 'besideImage',
      components: {input: ScaleInput},
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Short', value: '300'},
          {title: 'Medium', value: '450'},
          {title: 'Tall', value: '600'},
          {title: 'Full Screen', value: '100vh'},
        ],
      },
      initialValue: 'auto',
    }),
    // ── Image Overlay Options ──
    defineField({
      name: 'overlayPosition',
      title: 'Text Position on Image',
      type: 'string',
      group: 'layout',
      fieldset: 'overlay',
      description: 'Where the heading sits on top of the image.',
      hidden: ({parent}) => parent?.textPosition !== 'overImage',
      options: {
        list: [
          {title: 'Center Left', value: 'centerLeft'},
          {title: 'Top Left', value: 'topLeft'},
          {title: 'Top Center', value: 'topCenter'},
          {title: 'Top Right', value: 'topRight'},
          {title: 'Center', value: 'center'},
          {title: 'Center Right', value: 'centerRight'},
          {title: 'Bottom Left', value: 'bottomLeft'},
          {title: 'Bottom Center', value: 'bottomCenter'},
          {title: 'Bottom Right', value: 'bottomRight'},
        ],
      },
      initialValue: 'centerLeft',
    }),
    defineField({
      name: 'bannerHeight',
      title: 'Banner Height',
      type: 'string',
      group: 'layout',
      fieldset: 'overlay',
      description: 'How tall the banner image is.',
      hidden: ({parent}) => parent?.textPosition !== 'overImage',
      components: {input: ScaleInput},
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Compact', value: 'small'},
          {title: 'Medium', value: 'medium'},
          {title: 'Tall', value: 'large'},
        ],
      },
      initialValue: 'large',
    }),
    defineField({
      name: 'overlayGradient',
      title: 'Dark Overlay',
      type: 'string',
      group: 'layout',
      fieldset: 'overlay',
      description: 'Add a dark overlay only if the image is too bright for the text.',
      hidden: ({parent}) => parent?.textPosition !== 'overImage',
      options: {
        list: [
          {title: 'None — clean image (recommended)', value: 'none'},
          {title: 'Subtle Fade from Left', value: 'darkLeft'},
          {title: 'Subtle Fade from Bottom', value: 'darkBottom'},
          {title: 'Light Dark Wash', value: 'darkFull'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'imageFocalPoint',
      title: 'Image Focus Point',
      type: 'string',
      group: 'layout',
      fieldset: 'layoutBase',
      description: 'Which part of the image stays centered when cropped.',
      options: {
        list: [
          {title: 'Right', value: 'rightCenter'},
          {title: 'Center', value: 'center'},
          {title: 'Left', value: 'leftCenter'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'rightCenter',
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
    ...expandableFields({group: 'behavior', includeFaqOptions: true}),
  ],
  preview: {
    select: {heading: 'sectionHeading', title: 'heading', sequence: 'sequence', media: 'images.0'},
    prepare({heading, title, sequence, media}) {
      return {
        title: heading || title || 'Banner Section',
        subtitle: `#${sequence ?? '—'} · Banner / Hero`,
        media: media || ImageIcon,
      }
    },
  },
})
