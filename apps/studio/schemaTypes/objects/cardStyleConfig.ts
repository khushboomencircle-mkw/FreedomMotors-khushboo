import {defineField, defineType} from 'sanity'
import ColorPaletteInput from '../components/ColorPaletteInput'
import ScaleInput from '../components/ScaleInput'
import AlignInput from '../components/AlignInput'
import FullWidthDescField from '../components/FullWidthDescField'

export const cardStyleConfigType = defineType({
  name: 'cardStyleConfig',
  title: 'Card Look',
  type: 'object',
  description: 'How each card in the grid looks.',
  fieldsets: [
    {name: 'card', title: '1. Card', options: {columns: 2, collapsible: true, collapsed: true}},
    {name: 'image', title: '2. Card Image', options: {columns: 2, collapsible: true, collapsed: true}},
    {name: 'cardBorder', title: '3. Card Border', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'cardBgColor',
      title: 'Background',
      type: 'string',
      fieldset: 'card',
      description: 'Fill color of each card.',
      components: {input: ColorPaletteInput, field: FullWidthDescField},
      options: {allowTransparent: true} as any,
      initialValue: '#1f2937',
    }),
    defineField({
      name: 'cardAlignment',
      title: 'Text Position',
      type: 'string',
      fieldset: 'card',
      description: 'Aligns the text inside each card.',
      components: {input: AlignInput, field: FullWidthDescField},
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
      name: 'cardPadding',
      title: 'Inner Spacing',
      type: 'string',
      fieldset: 'card',
      description: 'Breathing room inside each card, around its content.',
      components: {input: ScaleInput, field: FullWidthDescField},
      options: {
        list: [
          {title: 'Snug', value: '12px'},
          {title: 'Comfortable', value: '20px'},
          {title: 'Spacious', value: '32px'},
        ],
      },
      initialValue: '20px',
    }),
    defineField({
      name: 'cardShadow',
      title: 'Shadow',
      type: 'string',
      fieldset: 'card',
      description: 'Drop shadow depth behind each card.',
      components: {input: ScaleInput, field: FullWidthDescField},
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Subtle', value: 'subtle'},
          {title: 'Medium', value: 'medium'},
          {title: 'Glow', value: 'glow'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'border',
      title: 'Card Border',
      type: 'borderConfig',
      fieldset: 'cardBorder',
    }),
    defineField({
      name: 'cardImageAspectRatio',
      title: 'Shape',
      type: 'string',
      fieldset: 'image',
      description: 'The proportions of the image inside each card.',
      components: {field: FullWidthDescField},
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Square', value: '1/1'},
          {title: 'Landscape', value: '16/9'},
          {title: 'Portrait', value: '3/4'},
          {title: 'Wide', value: '2/1'},
        ],
      },
      initialValue: 'auto',
    }),
    defineField({
      name: 'cardImageFit',
      title: 'Fit',
      type: 'string',
      fieldset: 'image',
      description: 'How the image fills its shape — crop to fill or show the whole image.',
      components: {field: FullWidthDescField},
      options: {
        list: [
          {title: 'Fill (crop)', value: 'cover'},
          {title: 'Fit (no crop)', value: 'contain'},
          {title: 'Stretch', value: 'fill'},
        ],
      },
      initialValue: 'cover',
    }),
    defineField({
      name: 'cardImageBorderRadius',
      title: 'Corner Roundness',
      type: 'string',
      fieldset: 'image',
      description: 'How rounded the image corners are.',
      components: {input: ScaleInput, field: FullWidthDescField},
      options: {
        list: [
          {title: 'Square', value: 'none'},
          {title: 'Slight', value: 'small'},
          {title: 'Rounded', value: 'medium'},
          {title: 'Very Rounded', value: 'large'},
        ],
      },
      initialValue: 'medium',
    }),
  ],
})
