/**
 * megaMenuConfig — all the same customization options as featureGridSection,
 * embedded inside a navigation link's mega menu configuration.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {buttonFields} from './fields/sectionFields'
import ScaleInput from './components/ScaleInput'
import ScaleField from './components/ScaleField'
import ColorPaletteInput from './components/ColorPaletteInput'
import RadiusInput from './components/RadiusInput'
import CompactImageInput from './components/CompactImageInput'
import FullWidthDescField from './components/FullWidthDescField'

export const megaMenuConfigType = defineType({
  name: 'megaMenuConfig',
  title: 'Mega Menu',
  type: 'object',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'typography', title: 'Typography'},
    {name: 'style', title: 'Style'},
  ],
  fieldsets: [
    {name: 'footer', title: 'Footer CTA', options: {collapsible: true, collapsed: true}},
    {
      name: 'primaryButton',
      title: 'CTA Button',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'displaySetup',
      title: '1. Display Mode',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'scrollNav',
      title: '2. Scroll Navigation',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'cardSizing',
      title: '3. Card Size',
      options: {columns: 3, collapsible: true, collapsed: true},
    },
    {
      name: 'cardStyle',
      title: '4. Card Style',
      options: {columns: 1, collapsible: true, collapsed: true},
    },
    {name: 'playBtn', title: '5. Play Button', options: {collapsible: true, collapsed: true}},
    {
      name: 'contentPos',
      title: '6. Content Position',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
  ],

  fields: [
    // ── Content ───────────────────────────────────────────────────────────────
    defineField({
      name: 'features',
      title: 'Feature Cards',
      type: 'array',
      group: 'content',
      description: 'Image cards shown in the mega menu grid.',
      of: [defineArrayMember({type: 'featureCardItem'})],
    }),

    defineField({
      name: 'showFooter',
      title: 'Show Footer CTA',
      type: 'boolean',
      group: 'content',
      fieldset: 'footer',
      description: 'A divider + heading + button row below the cards.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'footerHeading',
      title: 'Footer Heading',
      type: 'string',
      group: 'content',
      fieldset: 'footer',
      hidden: ({parent}) => !parent?.showFooter,
    }),
    // ── Logo strip (mega menu only, not in featureGridSection) ────────────────
    defineField({
      name: 'logoStrip',
      title: 'Logo Strip',
      type: 'array',
      group: 'content',
      fieldset: 'footer',
      description: 'Brand logos shown in a bordered row between the cards and the CTA button.',
      of: [
        {
          type: 'object',
          name: 'logoStripItem',
          title: 'Logo',
          fields: [
            defineField({
              name: 'logo',
              title: 'Logo Image',
              type: 'image',
              options: {hotspot: false},
              components: {input: CompactImageInput},
            }),
            defineField({
              name: 'label',
              title: 'Brand Name',
              type: 'string',
              description: 'Text shown beside the logo (e.g. "CHEVROLET").',
            }),
            defineField({
              name: 'href',
              title: 'Link (optional)',
              type: 'string',
              placeholder: '/vehicles?brand=chevrolet',
            }),
            defineField({
              name: 'openInNewTab',
              title: 'Open in New Tab',
              type: 'boolean',
              options: {layout: 'switch'},
              initialValue: false,
              hidden: ({parent}) => !parent?.href,
            }),
          ],
          preview: {
            select: {title: 'label', media: 'logo'},
            prepare({title, media}: {title?: string; media?: any}) {
              return {title: title || 'Untitled Brand', media}
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footerDividerColor',
      title: 'Divider Line Color',
      type: 'string',
      group: 'content',
      fieldset: 'footer',
      hidden: ({parent}) => !parent?.showFooter,
      components: {input: ColorPaletteInput},
      initialValue: '#4b5563',
    }),
    ...buttonFields({group: 'content', includeStyle: true}),

    // ── Layout: 1 — Display Mode ──────────────────────────────────────────────
    defineField({
      name: 'featureDisplayMode',
      title: 'Display Mode',
      type: 'string',
      group: 'layout',
      fieldset: 'displaySetup',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Horizontal Scroll', value: 'horizontalScroll'},
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
      fieldset: 'displaySetup',
      description: 'Cards per row on desktop (Grid mode only).',
      hidden: ({parent}) => parent?.featureDisplayMode === 'horizontalScroll',
      options: {
        list: [
          {title: '2', value: '2'},
          {title: '3', value: '3'},
          {title: '4', value: '4'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '4',
    }),

    // ── Layout: 2 — Scroll Navigation ────────────────────────────────────────
    defineField({
      name: 'showScrollArrows',
      title: 'Show Scroll Arrows',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      options: {layout: 'switch'},
      initialValue: true,
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'showScrollLine',
      title: 'Show Scroll Progress Line',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      options: {layout: 'switch'},
      initialValue: true,
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'sliderAutoPlay',
      title: 'Auto-Play',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'sliderAutoPlayInterval',
      title: 'Auto-Play Interval (ms)',
      type: 'number',
      group: 'layout',
      fieldset: 'scrollNav',
      hidden: ({parent}) =>
        parent?.featureDisplayMode !== 'horizontalScroll' || !parent?.sliderAutoPlay,
      initialValue: 3000,
      validation: (rule) => rule.min(500).max(10000),
    }),
    defineField({
      name: 'sliderShowArrows',
      title: 'Show Prev / Next Arrows',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      options: {layout: 'switch'},
      initialValue: true,
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'sliderShowDots',
      title: 'Show Dot Indicators',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {field: FullWidthDescField},
    }),

    // ── Layout: 3 — Card Size ─────────────────────────────────────────────────
    defineField({
      name: 'cardHeight',
      title: 'Card Height',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Compact', value: '200'},
          {title: 'Standard', value: '260'},
          {title: 'Tall', value: '340'},
          {title: 'Extra Tall', value: '440'},
        ],
      },
      initialValue: '260',
    }),
    defineField({
      name: 'gridGap',
      title: 'Space Between Cards',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Tight', value: '8'},
          {title: 'Normal', value: '16'},
          {title: 'Wide', value: '24'},
        ],
      },
      initialValue: '8',
    }),
    defineField({
      name: 'cardWidthPreset',
      title: 'Card Width',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      description: 'Width of each card (Horizontal Scroll mode only).',
      hidden: ({parent}) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Narrow', value: 'narrow'},
          {title: 'Normal', value: 'normal'},
          {title: 'Wide', value: 'wide'},
          {title: 'Full Screen', value: 'full'},
        ],
      },
      initialValue: 'normal',
    }),

    // ── Layout: 4 — Card Style ────────────────────────────────────────────────
    defineField({
      name: 'cardOverlayStrength',
      title: 'Image Dark Overlay',
      type: 'string',
      group: 'layout',
      fieldset: 'cardStyle',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Light', value: 'light'},
          {title: 'Medium', value: 'medium'},
          {title: 'Strong', value: 'strong'},
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'featureCardRadius',
      title: 'Corner Radius',
      type: 'number',
      group: 'layout',
      fieldset: 'cardStyle',
      description: '0 = square corners.',
      components: {input: RadiusInput, field: FullWidthDescField},
      validation: (rule) => rule.min(0).max(60),
      initialValue: 0,
    }),
    defineField({
      name: 'showAccentBar',
      title: 'Show Accent Bar',
      type: 'boolean',
      group: 'layout',
      fieldset: 'cardStyle',
      description: 'Vertical colored bar to the left of each card title.',
      options: {layout: 'switch'},
      initialValue: true,
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'descriptionOnHover',
      title: 'Reveal Description on Hover',
      type: 'boolean',
      group: 'layout',
      fieldset: 'cardStyle',
      options: {layout: 'switch'},
      initialValue: true,
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'highlightColor',
      title: 'Card Hover Color',
      type: 'string',
      group: 'layout',
      fieldset: 'cardStyle',
      description: "Tint on hover. Leave blank for each card's own accent color.",
      components: {input: ColorPaletteInput, field: FullWidthDescField},
      options: {allowTransparent: true} as any,
    }),

    // ── Layout: 5 — Play Button ───────────────────────────────────────────────
    defineField({
      name: 'playButtonText',
      title: 'Play Button Label',
      type: 'string',
      group: 'layout',
      fieldset: 'playBtn',
      placeholder: 'Play Video',
    }),
    defineField({
      name: 'playButtonImage',
      title: 'Play Button Image',
      type: 'image',
      group: 'layout',
      fieldset: 'playBtn',
      options: {hotspot: false},
      components: {input: CompactImageInput},
    }),

    // ── Layout: 6 — Content Position ─────────────────────────────────────────
    defineField({
      name: 'cardContentPosition',
      title: 'Position',
      type: 'string',
      group: 'layout',
      fieldset: 'contentPos',
      options: {
        list: [
          {title: 'Top Left', value: 'top'},
          {title: 'Bottom Left', value: 'bottom'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'bottom',
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'cardContentPaddingLeft',
      title: 'Space from Left (px)',
      type: 'number',
      group: 'layout',
      fieldset: 'contentPos',
      validation: (rule) => rule.min(0).max(200),
      initialValue: 16,
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'cardContentPaddingTop',
      title: 'Space from Top (px)',
      type: 'number',
      group: 'layout',
      fieldset: 'contentPos',
      hidden: ({parent}) => parent?.cardContentPosition !== 'top',
      validation: (rule) => rule.min(0).max(200),
      initialValue: 16,
      components: {field: FullWidthDescField},
    }),

    // ── Typography ────────────────────────────────────────────────────────────
    defineField({
      name: 'typography',
      title: 'Typography',
      type: 'typographyConfig',
      group: 'typography',
    }),

    // ── Style — panel appearance ───────────────────────────────────────────────
    defineField({
      name: 'panelBgColor',
      title: 'Panel Background Color',
      type: 'string',
      group: 'style',
      description: 'Background of the mega menu dropdown panel. Defaults to white.',
      components: {input: ColorPaletteInput},
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'panelPadding',
      title: 'Panel Padding',
      type: 'string',
      group: 'style',
      description: 'Vertical padding inside the panel.',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Compact', value: '16'},
          {title: 'Normal', value: '24'},
          {title: 'Spacious', value: '40'},
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'panelMaxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'style',
      description: 'Max width of the panel on large screens — it still shrinks to fit small ones.',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Narrow', value: '960'},
          {title: 'Standard', value: '1280'},
          {title: 'Wide', value: '1440'},
          {title: 'Full Width (edge to edge)', value: 'full'},
        ],
      },
      initialValue: '1280',
    }),
    defineField({
      name: 'panelHorizontalPadding',
      title: 'Left & Right Spacing',
      type: 'string',
      group: 'style',
      description: "Space between the panel's content and its edges.",
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Compact', value: '16'},
          {title: 'Normal', value: '32'},
          {title: 'Spacious', value: '48'},
        ],
      },
      initialValue: '32',
    }),
  ],
})
