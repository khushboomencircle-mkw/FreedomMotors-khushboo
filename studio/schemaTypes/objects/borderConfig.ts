import {defineField, defineType} from 'sanity'
import ScaleInput from '../components/ScaleInput'
import ColorPaletteInput from '../components/ColorPaletteInput'
import FullWidthDescField from '../components/FullWidthDescField'

export const borderConfigType = defineType({
  name: 'borderConfig',
  title: 'Border',
  type: 'object',
  description: 'Draws an outline around this area.',
  fieldsets: [
    {
      name: 'style',
      title: '1. Line Style',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {name: 'sides', title: '2. Which Sides', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'show',
      title: 'Show Border',
      type: 'boolean',
      description: 'Turn on to draw a line around this area.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      fieldset: 'style',
      hidden: ({parent}) => !parent?.show,
      components: {input: ColorPaletteInput},
      initialValue: '#374151',
    }),
    defineField({
      name: 'width',
      title: 'Thickness',
      type: 'string',
      fieldset: 'style',
      description: 'How thick the line is.',
      hidden: ({parent}) => !parent?.show,
      components: {input: ScaleInput, field: FullWidthDescField},
      options: {
        list: [
          {title: 'Thin', value: '1px'},
          {title: 'Normal', value: '2px'},
          {title: 'Thick', value: '3px'},
          {title: 'Bold', value: '4px'},
        ],
      },
      initialValue: '1px',
    }),
    defineField({
      name: 'radius',
      title: 'Corner Roundness',
      type: 'string',
      fieldset: 'style',
      description: 'How rounded the corners are.',
      hidden: ({parent}) => !parent?.show,
      components: {input: ScaleInput, field: FullWidthDescField},
      options: {
        list: [
          {title: 'Square', value: 'none'},
          {title: 'Slight', value: 'small'},
          {title: 'Rounded', value: 'medium'},
          {title: 'Very Rounded', value: 'large'},
          {title: 'Pill', value: 'full'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'sides',
      title: 'Edges',
      type: 'object',
      fieldset: 'sides',
      description: 'Choose which edges show the line.',
      hidden: ({parent}) => !parent?.show,
      fields: [
        defineField({name: 'top', title: 'Top', type: 'boolean', initialValue: true}),
        defineField({name: 'right', title: 'Right', type: 'boolean', initialValue: true}),
        defineField({name: 'bottom', title: 'Bottom', type: 'boolean', initialValue: true}),
        defineField({name: 'left', title: 'Left', type: 'boolean', initialValue: true}),
      ],
      options: {columns: 3},
    }),
    defineField({
      name: 'fullWidth',
      title: 'Stretch Edge to Edge',
      type: 'boolean',
      fieldset: 'sides',
      description: 'Lets the border span the full width of the screen.',
      options: {layout: 'switch'},
      hidden: ({parent}) => !parent?.show,
      initialValue: false,
    }),
  ],
})
