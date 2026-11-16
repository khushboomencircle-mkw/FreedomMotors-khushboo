/**
 * Feature Grid Section — a header + grid of image-cards + a centered CTA footer.
 * A combination of a banner's framing and a grid's image-card layout.
 * Example: "Why Choose Rear Entry?" with three cards and an "Explore" button at the bottom.
 */
import { defineArrayMember, defineField, defineType } from 'sanity'
import { sectionThemeFields } from '../fields/sectionTheme'
import { ThLargeIcon } from '@sanity/icons/ThLarge'
import {
  sectionHeaderFields,
  buttonFields,
  sequenceField,
  activeField,
} from '../fields/sectionFields'
import ScaleInput from '../components/ScaleInput'
import ScaleField from '../components/ScaleField'
import ColorPaletteInput from '../components/ColorPaletteInput'
import RadiusInput from '../components/RadiusInput'
import CompactImageInput from '../components/CompactImageInput'
import FullWidthDescField from '../components/FullWidthDescField'

export const featureGridSectionType = defineType({
  name: 'featureGridSection',
  title: 'Feature Grid Section',
  type: 'object',
  icon: ThLargeIcon,
  description: 'A title, a grid of image feature cards, and an optional CTA button.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'layout', title: 'Layout' },
    { name: 'typography', title: 'Typography' },
    { name: 'sectionStyles', title: 'Section Theme' },
    { name: 'behavior', title: 'Behavior' },
  ],
  fieldsets: [
    // ── Content ──────────────────────────────────────────────────────────────
    { name: 'footer', title: 'Footer CTA', options: { columns: 2, collapsible: true, collapsed: true } },
    { name: 'primaryButton', title: 'Primary Button', options: { columns: 2, collapsible: true, collapsed: true } },
    { name: 'secondaryButton', title: 'Secondary Button', options: { columns: 2, collapsible: true, collapsed: true } },
    { name: 'header', title: '1. Header', options: { collapsible: true, collapsed: true } },

    // ── Layout — step-by-step sections ───────────────────────────────────────

    // Step 1: Display Mode — controls grid vs scroll and column count
    {
      name: 'displaySetup',
      title: '1. Display Mode',
      options: { collapsible: true, collapsed: true },
    },

    // Step 2: Scroll Navigation — only relevant in Horizontal Scroll mode
    {
      name: 'scrollNav',
      title: '2. Scroll Navigation',
      options: { columns: 1, collapsible: true, collapsed: true },
    },

    // Step 3: Card Size — compact ScaleInput controls in a 3-column row
    {
      name: 'cardSizing',
      title: '3. Card Size',
      options: { columns: 3, collapsible: true, collapsed: true },
    },

    // Step 4: Card Style — appearance controls in a 2-column grid
    {
      name: 'cardStyle',
      title: '4. Card Style',
      options: { columns: 1, collapsible: true, collapsed: true },
    },

    // Step 5: Play Button — full-width so description reads comfortably
    {
      name: 'playBtn',
      title: '5. Play Button',
      options: { collapsible: true, collapsed: true },
    },

    // Step 6: Content Position — 2-column compact controls
    {
      name: 'contentPos',
      title: '6. Content Position',
      options: { columns: 2, collapsible: true, collapsed: true },
    },
  ],
  fields: [
    // ── Content ──────────────────────────────────────────────────────────────
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'features',
      title: 'Feature Cards',
      type: 'array',
      group: 'content',
      description: 'Each card has an image, a title, and an optional description + link.',
      of: [defineArrayMember({ type: 'featureCardItem' })],
    }),

    // ── Footer CTA ───────────────────────────────────────────────────────────
    defineField({
      name: 'showFooter',
      title: 'Show Footer CTA',
      type: 'boolean',
      group: 'content',
      fieldset: 'footer',
      description: 'A centered divider + heading + button below the cards.',
      options: { layout: 'switch' },
      initialValue: true,
    }),
    defineField({
      name: 'footerHeading',
      title: 'Footer Heading',
      type: 'string',
      group: 'content',
      fieldset: 'footer',
      description: 'Centered line above the button (e.g. "FIND THE PERFECT REAR ENTRY VEHICLE").',
      hidden: ({ parent }) => !parent?.showFooter,
    }),
    defineField({
      name: 'footerHeadingColor',
      title: 'Footer Heading Color',
      type: 'string',
      group: 'content',
      fieldset: 'footer',
      hidden: ({ parent }) => !parent?.showFooter,
      components: { input: ColorPaletteInput },
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'footerDividerColor',
      title: 'Divider Line Color',
      type: 'string',
      group: 'content',
      fieldset: 'footer',
      hidden: ({ parent }) => !parent?.showFooter,
      components: { input: ColorPaletteInput },
      initialValue: '#4b5563',
    }),
    ...buttonFields({ group: 'content', includeStyle: true }),

    // ── Layout: Step 1 — Display Mode ────────────────────────────────────────
    defineField({
      name: 'featureDisplayMode',
      title: 'Display Mode',
      type: 'string',
      group: 'layout',
      fieldset: 'displaySetup',
      description: 'Grid lays cards in rows. Horizontal Scroll puts all cards in one draggable row.',
      options: {
        list: [
          { title: 'Grid', value: 'grid' },
          { title: 'Horizontal Scroll', value: 'horizontalScroll' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'mosaicView',
      title: 'Mosaic View',
      type: 'boolean',
      group: 'layout',
      fieldset: 'displaySetup',
      description: 'Every first card in each group of 5 becomes a larger featured tile, instead of a uniform grid.',
      hidden: ({ parent }) => parent?.featureDisplayMode === 'horizontalScroll',
      options: { layout: 'switch' },
      initialValue: false,
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      group: 'layout',
      fieldset: 'displaySetup',
      description: 'How many cards sit side by side on a desktop screen (Grid mode only).',
      hidden: ({ parent }) => parent?.featureDisplayMode === 'horizontalScroll',
      options: {
        list: [
          { title: '2', value: '2' },
          { title: '3', value: '3' },
          { title: '4', value: '4' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: '3',
    }),

    // ── Layout: Step 2 — Scroll Navigation ───────────────────────────────────
    defineField({
      name: 'showScrollArrows',
      title: 'Show Scroll Arrows',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      description: 'Left / right arrow buttons (Horizontal Scroll only).',
      options: { layout: 'switch' },
      initialValue: true,
      hidden: ({ parent }) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'showScrollLine',
      title: 'Show Scroll Progress Line',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      description: 'Thin progress bar that fills as the user scrolls right (Horizontal Scroll only).',
      options: { layout: 'switch' },
      initialValue: true,
      hidden: ({ parent }) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'sliderAutoPlay',
      title: 'Auto-slide',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      description: 'Auto-advances the full-width slider (Card Width = Full Screen only); pauses on hover.',
      options: { layout: 'switch' },
      initialValue: false,
      hidden: ({ parent }) =>
        parent?.featureDisplayMode !== 'horizontalScroll' || parent?.cardWidthPreset !== 'full',
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'sliderAutoPlayInterval',
      title: 'Auto-slide Speed (seconds)',
      type: 'number',
      group: 'layout',
      fieldset: 'scrollNav',
      description: 'How long each slide stays visible.',
      hidden: ({ parent }) =>
        parent?.featureDisplayMode !== 'horizontalScroll' ||
        parent?.cardWidthPreset !== 'full' ||
        !parent?.sliderAutoPlay,
      initialValue: 5,
      validation: (rule) => rule.min(2).max(30),
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'sliderShowDots',
      title: 'Show Progress Dots',
      type: 'boolean',
      group: 'layout',
      fieldset: 'scrollNav',
      description: 'Dot indicators below the full-width slider.',
      options: { layout: 'switch' },
      initialValue: true,
      hidden: ({ parent }) =>
        parent?.featureDisplayMode !== 'horizontalScroll' || parent?.cardWidthPreset !== 'full',
      components: { field: FullWidthDescField },
    }),

    // ── Layout: Step 3 — Card Size ────────────────────────────────────────────
    defineField({
      name: 'cardHeight',
      title: 'Card Height',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      components: { input: ScaleInput, field: ScaleField },
      options: {
        list: [
          { title: 'Compact', value: '280' },
          { title: 'Standard', value: '360' },
          { title: 'Tall', value: '460' },
          { title: 'Extra Tall', value: '1500' },
        ],
      },
      initialValue: '360',
    }),
    defineField({
      name: 'gridGap',
      title: 'Space Between Cards',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      components: { input: ScaleInput, field: ScaleField },
      options: {
        list: [
          { title: 'None', value: '0' },
          { title: 'Tight', value: '16' },
          { title: 'Normal', value: '24' },
          { title: 'Wide', value: '32' },
          { title: 'Extra Wide', value: '48' },
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'cardWidthPreset',
      title: 'Card Width',
      type: 'string',
      group: 'layout',
      fieldset: 'cardSizing',
      description: 'Width of each card (Horizontal Scroll mode only).',
      hidden: ({ parent }) => parent?.featureDisplayMode !== 'horizontalScroll',
      components: { input: ScaleInput, field: ScaleField },
      options: {
        list: [
          { title: 'Narrow', value: 'narrow' },
          { title: 'Normal', value: 'normal' },
          { title: 'Wide', value: 'wide' },
          { title: 'Full Screen', value: 'full' },
        ],
      },
      initialValue: 'normal',
    }),

    // ── Layout: Step 4 — Card Style ───────────────────────────────────────────
    defineField({
      name: 'cardOverlayStrength',
      title: 'Image Dark Overlay',
      type: 'string',
      group: 'layout',
      fieldset: 'cardStyle',
      components: { input: ScaleInput, field: ScaleField },
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Light', value: 'light' },
          { title: 'Medium', value: 'medium' },
          { title: 'Strong', value: 'strong' },
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
      description: 'Enter a value or drag the slider to round the card corners. 0 = square.',
      components: { input: RadiusInput, field: FullWidthDescField },
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
      options: { layout: 'switch' },
      initialValue: true,
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'descriptionOnHover',
      title: 'Reveal Description on Hover',
      type: 'boolean',
      group: 'layout',
      fieldset: 'cardStyle',
      description: 'Show description only when the user hovers the card.',
      options: { layout: 'switch' },
      initialValue: true,
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'highlightColor',
      title: 'Card Hover Color',
      type: 'string',
      group: 'layout',
      fieldset: 'cardStyle',
      description: 'Tint color on hover. Leave blank to use each card\'s own accent color.',
      components: { input: ColorPaletteInput, field: FullWidthDescField },
      options: { allowTransparent: true } as any,
    }),
    defineField({
      name: 'accentBarColor',
      title: 'Accent Bar Color',
      type: 'string',
      group: 'layout',
      fieldset: 'cardStyle',
      description: 'Accent bar color. Blank uses each card\'s own color; pick Transparent for none.',
      components: { input: ColorPaletteInput, field: FullWidthDescField },
      options: { allowTransparent: true } as any,
    }),

    // ── Layout: Step 5 — Play Button ─────────────────────────────────────────
    defineField({
      name: 'playButtonText',
      title: 'Play Button Label',
      type: 'string',
      group: 'layout',
      fieldset: 'playBtn',
      description: 'Text beside the play circle (blank = icon only).',
      placeholder: 'Play Video',
    }),
    defineField({
      name: 'playButtonImage',
      title: 'Play Button Image',
      type: 'image',
      group: 'layout',
      fieldset: 'playBtn',
      description: 'Image inside the play circle (default: ▶ arrow).',
      options: { hotspot: false },
      components: { input: CompactImageInput },
    }),

    // ── Layout: Step 6 — Content Position ────────────────────────────────────
    defineField({
      name: 'showContentOverImage',
      title: 'Show Content Over Image',
      type: 'boolean',
      group: 'layout',
      fieldset: 'contentPos',
      description:
        'On (default): title/description sit on top of the image, as they do today. ' +
        'Off: image and content are shown as separate blocks — choose their order below.',
      options: { layout: 'switch' },
      // MUST be true: every document saved before this field existed comes
      // back with it absent (undefined), and the render code treats that
      // exactly like true (`!== false`, not `=== true`) — this initialValue
      // only affects what a brand-new card starts with, not existing ones.
      initialValue: true,
    }),
    defineField({
      // Reuses cardsGridSection.ts's own field exactly (same name/options/
      // default) rather than inventing a second, narrower ordering scheme —
      // one shared field, same as mosaicView/sequence/isActive elsewhere.
      name: 'cardContentOrder',
      title: 'Card Layout Order',
      type: 'string',
      group: 'layout',
      fieldset: 'contentPos',
      description: 'The order title, image, and description stack inside each card, when content is not shown over the image.',
      hidden: ({ parent }) => parent?.showContentOverImage !== false,
      options: {
        list: [
          { title: 'Title → Image → Text', value: 'titleImageDesc' },
          { title: 'Image → Title → Text', value: 'imageTitleDesc' },
          { title: 'Title → Text → Image', value: 'titleDescImage' },
        ],
        layout: 'radio',
      },
      initialValue: 'titleImageDesc',
    }),
    defineField({
      name: 'cardContentPosition',
      title: 'Position',
      type: 'string',
      group: 'layout',
      fieldset: 'contentPos',
      description: 'Where the title and description sit inside the card.',
      hidden: ({ parent }) => parent?.showContentOverImage === false,
      options: {
        list: [
          { title: 'Top Left', value: 'top' },
          { title: 'Bottom Left', value: 'bottom' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'bottom',
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'cardContentPaddingLeft',
      title: 'Space from Left (px)',
      type: 'number',
      group: 'layout',
      fieldset: 'contentPos',
      description: 'Distance from the left edge of the card.',
      hidden: ({ parent }) => parent?.showContentOverImage === false,
      validation: (rule) => rule.min(0).max(200),
      initialValue: 24,
      components: { field: FullWidthDescField },
    }),
    defineField({
      name: 'cardContentPaddingTop',
      title: 'Space from Top (px)',
      type: 'number',
      group: 'layout',
      fieldset: 'contentPos',
      description: 'Distance from the top edge of the card (Top Left position only).',
      hidden: ({ parent }) =>
        parent?.showContentOverImage === false || parent?.cardContentPosition !== 'top',
      validation: (rule) => rule.min(0).max(200),
      initialValue: 24,
      components: { field: FullWidthDescField },
    }),

    // ── Typography ────────────────────────────────────────────────────────────
    defineField({
      name: 'typography',
      title: 'Typography',
      type: 'typographyConfig',
      group: 'typography',
    }),

    // ── Section Style ─────────────────────────────────────────────────────────
    ...sectionThemeFields(),
    defineField({
      name: 'container',
      title: 'Section Background & Width (Fallback Theme)',
      type: 'containerConfig',
      group: 'sectionStyles',
      hidden: ({ parent }) => parent?.enableSectionTheme,
    }),
    defineField({
      name: 'border',
      title: 'Section Border',
      type: 'borderConfig',
      group: 'sectionStyles',
      hidden: ({ parent }) => parent?.enableSectionTheme,
    }),

    // ── Behavior ─────────────────────────────────────────────────────────────
    activeField('behavior'),
  ],
  preview: {
    select: { heading: 'sectionHeading', sequence: 'sequence', features: 'features' },
    prepare({ heading, sequence, features }) {
      const count = features?.length || 0
      return {
        title: heading || `Feature Grid (${count} card${count === 1 ? '' : 's'})`,
        subtitle: `#${sequence ?? '—'} · Feature Grid (${count})`,
        media: ThLargeIcon,
      }
    },
  },
})
