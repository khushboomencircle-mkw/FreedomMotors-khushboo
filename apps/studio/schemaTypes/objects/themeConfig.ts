import {defineField, defineType} from 'sanity'
import ColorPaletteInput from '../components/ColorPaletteInput'
import FullWidthDescField from '../components/FullWidthDescField'
import FontSelectInput from '../components/FontSelectInput'

// These fields take a plain number — no px/rem/etc. The app already knows
// which CSS unit each one needs (pixels for padding/border width, rem for
// font sizes) and adds it automatically, so editors just type a number like
// "28" or "0.875". A leftover unit is harmless (the frontend strips anything
// that isn't part of the number), but it's flagged since it means the editor
// may be expecting a unit other than the one actually applied.
const warnIfNotPlainNumber = (Rule: any) =>
  Rule.custom((value?: string) => {
    if (!value || /^-?\d+(\.\d+)?$/.test(value.trim())) return true
    return 'Enter just the number — no unit. The app adds the right one automatically.'
  }).warning()

/**
 * themeConfig — one complete theme (colors, typography, buttons, corner rounding).
 * Reused for the global Site Theme and per-section Theme overrides. All fields are
 * optional so a theme can define only the properties it wants and inherit the rest.
 */

// Font families that are safe to render without loading extra webfonts
// (system stacks + the Geist faces already loaded by the app).
const FONT_OPTIONS = [
  {title: 'Geist Sans (modern)', value: 'var(--font-geist-sans), system-ui, sans-serif'},
  {
    title: 'System Default',
    value: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {title: 'Serif (classic)', value: 'Georgia, Cambria, "Times New Roman", serif'},
  {title: 'Monospace (code)', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'},
]

const WEIGHT_OPTIONS = [
  {title: 'Light', value: '300'},
  {title: 'Normal', value: '400'},
  {title: 'Medium', value: '500'},
  {title: 'Semi-Bold', value: '600'},
  {title: 'Bold', value: '700'},
  {title: 'Extra-Bold', value: '800'},
]

// Friendly corner-rounding choices (no need to type pixel values).
const RADIUS_OPTIONS = [
  {title: 'Square (no rounding)', value: '0px'},
  {title: 'Slightly Rounded', value: '4px'},
  {title: 'Rounded', value: '8px'},
  {title: 'Very Rounded', value: '16px'},
  {title: 'Pill / Fully Round', value: '9999px'},
]

// No initialValue: unset = undefined so section values can fall back to the
// global theme at the property level (and the frontend applies safe defaults).
const color = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'string',
    fieldset: 'colors',
    description,
    components: {input: ColorPaletteInput, field: FullWidthDescField},
  })

export const themeConfigType = defineType({
  name: 'themeConfig',
  title: 'Theme',
  type: 'object',
  fieldsets: [
    {
      name: 'colors',
      title: '1. Colors',
      options: {columns: 2, collapsible: true, collapsed: false},
    },
    {
      name: 'typography',
      title: '2. Typography',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'buttons',
      title: '3. Buttons',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'radius',
      title: '4. Corner Rounding',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── Colors ──
    color(
      'primaryColor',
      'Primary (Brand) Color',
      'Main brand color — used for buttons and highlights.',
    ),
    color('accentColor', 'Accent Color', 'A secondary highlight color.'),
    color('backgroundColor', 'Page Background', 'The main background color behind content.'),
    color(
      'surfaceColor',
      'Card & Panel Background',
      'Background for cards, panels, and boxes on the page.',
    ),
    color('textColor', 'Main Text Color', 'Default color for most text.'),
    color(
      'mutedTextColor',
      'Secondary Text Color',
      'For less important text like captions and hints.',
    ),
    color('borderColor', 'Border & Divider Color', 'Color of lines, borders, and dividers.'),

    // ── Typography ──
    defineField({
      name: 'headingFont',
      title: 'Heading Font',
      type: 'string',
      fieldset: 'typography',
      description: 'Font for titles and headings.',
      options: {list: FONT_OPTIONS},
      components: {input: FontSelectInput, field: FullWidthDescField},
    }),
    defineField({
      name: 'bodyFont',
      title: 'Body Font',
      type: 'string',
      fieldset: 'typography',
      description: 'Font for paragraphs and general text.',
      options: {list: FONT_OPTIONS},
      components: {input: FontSelectInput, field: FullWidthDescField},
    }),
    defineField({
      name: 'buttonFont',
      title: 'Button Font',
      type: 'string',
      fieldset: 'typography',
      description: 'Font used on buttons.',
      options: {list: FONT_OPTIONS},
      components: {input: FontSelectInput, field: FullWidthDescField},
    }),
    defineField({
      name: 'headingFontSize',
      title: 'Heading Size',
      type: 'string',
      fieldset: 'typography',
      description: 'Size in rem — just the number, e.g. 2.5.',
      placeholder: '2.5',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),
    defineField({
      name: 'bodyFontSize',
      title: 'Body Size',
      type: 'string',
      fieldset: 'typography',
      description: 'Size in rem — just the number, e.g. 1.',
      placeholder: '1',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),
    defineField({
      name: 'headingFontWeight',
      title: 'Heading Weight',
      type: 'string',
      fieldset: 'typography',
      options: {list: WEIGHT_OPTIONS},
    }),
    defineField({
      name: 'bodyFontWeight',
      title: 'Body Weight',
      type: 'string',
      fieldset: 'typography',
      options: {list: WEIGHT_OPTIONS},
    }),
    defineField({
      name: 'lineHeight',
      title: 'Body Line Height',
      type: 'string',
      fieldset: 'typography',
      description: 'Unitless, e.g. 1.6.',
      placeholder: '1.6',
      components: {field: FullWidthDescField},
    }),

    // ── Buttons ──
    defineField({
      name: 'buttonBackgroundColor',
      title: 'Button Background',
      type: 'string',
      fieldset: 'buttons',
      components: {input: ColorPaletteInput},
    }),
    defineField({
      name: 'buttonTextColor',
      title: 'Button Text',
      type: 'string',
      fieldset: 'buttons',
      components: {input: ColorPaletteInput},
    }),
    defineField({
      name: 'buttonBorderColor',
      title: 'Button Border',
      type: 'string',
      fieldset: 'buttons',
      components: {input: ColorPaletteInput},
      options: {allowTransparent: true} as any,
    }),
    defineField({
      name: 'buttonBorderWidth',
      title: 'Button Border Width',
      type: 'string',
      fieldset: 'buttons',
      description: 'Width in pixels — just the number, e.g. 1.',
      placeholder: '1',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),
    defineField({
      name: 'buttonFontWeight',
      title: 'Button Weight',
      type: 'string',
      fieldset: 'buttons',
      options: {list: WEIGHT_OPTIONS},
    }),
    defineField({
      name: 'buttonFontSize',
      title: 'Button Text Size',
      type: 'string',
      fieldset: 'buttons',
      description: 'Size in rem — just the number, e.g. 0.875.',
      placeholder: '0.875',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),
    defineField({
      name: 'buttonPaddingX',
      title: 'Button Padding X',
      type: 'string',
      fieldset: 'buttons',
      description: 'Horizontal padding in pixels — just the number, e.g. 28.',
      placeholder: '28',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),
    defineField({
      name: 'buttonPaddingY',
      title: 'Button Padding Y',
      type: 'string',
      fieldset: 'buttons',
      description: 'Vertical padding in pixels — just the number, e.g. 14.',
      placeholder: '14',
      components: {field: FullWidthDescField},
      validation: warnIfNotPlainNumber,
    }),

    // ── Corner Rounding ──
    defineField({
      name: 'buttonRadius',
      title: 'Button Corners',
      type: 'string',
      fieldset: 'radius',
      description: 'How rounded buttons are.',
      options: {list: RADIUS_OPTIONS},
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'cardRadius',
      title: 'Card & Panel Corners',
      type: 'string',
      fieldset: 'radius',
      description: 'How rounded cards and panels are.',
      options: {list: RADIUS_OPTIONS},
      components: {field: FullWidthDescField},
    }),
    defineField({
      name: 'inputRadius',
      title: 'Input Field Corners',
      type: 'string',
      fieldset: 'radius',
      description: 'How rounded form input fields are.',
      options: {list: RADIUS_OPTIONS},
      components: {field: FullWidthDescField},
    }),
  ],
})
