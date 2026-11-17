import {defineField, defineType} from 'sanity'
import RangeInput from '../components/RangeInput'
import ScaleInput from '../components/ScaleInput'
import ScaleField from '../components/ScaleField'
import ColorPaletteInput from '../components/ColorPaletteInput'
import AlignInput from '../components/AlignInput'

export const typographyConfigType = defineType({
  name: 'typographyConfig',
  title: 'Typography',
  type: 'object',
  fieldsets: [
    {
      name: 'heading',
      title: '1. Heading',
      options: {columns: 4, collapsible: true, collapsed: true},
    },
    {
      name: 'headingEffects',
      title: '2. Heading Effects',
      options: {columns: 1, collapsible: true, collapsed: true},
    },
    {
      name: 'description',
      title: '3. Description',
      options: {columns: 3, collapsible: true, collapsed: true},
    },
    {
      name: 'descriptionEffects',
      title: '4. Description Effects',
      options: {columns: 1, collapsible: true, collapsed: true},
    },
    {
      name: 'spacing',
      title: '5. Spacing',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── Heading ──
    defineField({
      name: 'headingSize',
      title: 'Size',
      type: 'string',
      fieldset: 'heading',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Extra Large', value: 'xl'},
          {title: 'Huge', value: '2xl'},
        ],
      },
      initialValue: 'lg',
    }),
    defineField({
      name: 'headingWeight',
      title: 'Weight',
      type: 'string',
      fieldset: 'heading',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Normal', value: '400'},
          {title: 'Medium', value: '500'},
          {title: 'Semi-Bold', value: '600'},
          {title: 'Bold', value: '700'},
        ],
      },
      initialValue: '700',
    }),
    defineField({
      name: 'headingColor',
      title: 'Color',
      type: 'string',
      fieldset: 'heading',
      components: {input: ColorPaletteInput},
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'headingAlignment',
      title: 'Align',
      type: 'string',
      fieldset: 'heading',
      components: {input: AlignInput},
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'headingShadow',
      title: 'Heading Shadow',
      type: 'textShadowConfig',
      fieldset: 'headingEffects',
    }),
    defineField({
      name: 'headingStroke',
      title: 'Heading Border',
      description: 'A box outline around the heading text — pick which edges show it below.',
      fieldset: 'headingEffects',
      type: 'borderConfig',
    }),
    defineField({
      name: 'headingFontBorder',
      title: 'Heading Font Border',
      fieldset: 'headingEffects',
      type: 'object',
      description:
        'Outlines each letter of the heading text — separate from the Heading Border box above.',
      options: {columns: 3} as any,
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable',
          type: 'boolean',
          options: {layout: 'switch'},
          initialValue: false,
        }),
        defineField({
          name: 'width',
          title: 'Width (px)',
          type: 'number',
          initialValue: 1,
          validation: (r) => r.min(0).max(20),
        }),
        defineField({
          name: 'color',
          title: 'Color',
          type: 'string',
          components: {input: ColorPaletteInput},
          initialValue: '#000000',
        }),
      ],
    }),

    // ── Description ──
    defineField({
      name: 'descriptionSize',
      title: 'Size',
      type: 'string',
      fieldset: 'description',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'X-Large', value: 'xl'},
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'descriptionWeight',
      title: 'Weight',
      type: 'string',
      fieldset: 'description',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Normal', value: '400'},
          {title: 'Medium', value: '500'},
          {title: 'Semi-Bold', value: '600'},
          {title: 'Bold', value: '700'},
        ],
      },
      initialValue: '400',
    }),
    defineField({
      name: 'descriptionLineHeight',
      title: 'Line Spacing',
      type: 'string',
      fieldset: 'description',
      components: {input: ScaleInput, field: ScaleField},
      options: {
        list: [
          {title: 'Compact', value: '1.5'},
          {title: 'Normal', value: '1.65'},
          {title: 'Loose', value: '1.8'},
        ],
      },
      initialValue: '1.65',
    }),

    defineField({
      name: 'descriptionAlignment',
      title: 'Align',
      type: 'string',
      fieldset: 'description',
      components: {input: AlignInput},
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'descriptionColor',
      title: 'Color',
      type: 'string',
      fieldset: 'description',
      components: {input: ColorPaletteInput},
      initialValue: '#e5e7eb',
    }),
    defineField({
      name: 'descriptionShadow',
      title: 'Description Shadow',
      type: 'textShadowConfig',
      fieldset: 'descriptionEffects',
    }),
    defineField({
      name: 'descriptionStroke',
      title: 'Description Border',
      description: 'A box outline around the description text — pick which edges show it below.',
      fieldset: 'descriptionEffects',
      type: 'borderConfig',
    }),
    defineField({
      name: 'descriptionFontBorder',
      title: 'Description Font Border',
      fieldset: 'descriptionEffects',
      type: 'object',
      description:
        'Outlines each letter of the description text — separate from the Description Border box above.',
      options: {columns: 3} as any,
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable',
          type: 'boolean',
          options: {layout: 'switch'},
          initialValue: false,
        }),
        defineField({
          name: 'width',
          title: 'Width (px)',
          type: 'number',
          initialValue: 1,
          validation: (r) => r.min(0).max(20),
        }),
        defineField({
          name: 'color',
          title: 'Color',
          type: 'string',
          components: {input: ColorPaletteInput},
          initialValue: '#000000',
        }),
      ],
    }),

    // ── Spacing (collapsed) ──
    defineField({
      name: 'headingMarginBottom',
      title: 'Space Below Heading',
      type: 'number',
      fieldset: 'spacing',
      components: {input: RangeInput},
      options: {range: {min: 0, max: 120, step: 4}} as any,
      initialValue: 12,
    }),
    defineField({
      name: 'headingPaddingBottom',
      title: 'Heading Inner Padding',
      type: 'number',
      fieldset: 'spacing',
      components: {input: RangeInput},
      options: {range: {min: 0, max: 100, step: 2}} as any,
      initialValue: 0,
    }),
    defineField({
      name: 'descriptionMarginTop',
      title: 'Space Above Description',
      type: 'number',
      fieldset: 'spacing',
      components: {input: RangeInput},
      options: {range: {min: 0, max: 120, step: 4}} as any,
      initialValue: 0,
    }),
    defineField({
      name: 'descriptionPaddingTop',
      title: 'Description Inner Padding',
      type: 'number',
      fieldset: 'spacing',
      components: {input: RangeInput},
      options: {range: {min: 0, max: 100, step: 2}} as any,
      initialValue: 0,
    }),
  ],
})
