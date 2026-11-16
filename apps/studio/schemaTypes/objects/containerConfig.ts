import { defineField, defineType } from 'sanity'
import ColorPaletteInput from '../components/ColorPaletteInput'
import RangeInput from '../components/RangeInput'
import FullWidthDescField from '../components/FullWidthDescField'

export const containerConfigType = defineType({
  name: 'containerConfig',
  title: 'Section Background & Width (Fallback Theme)',
  type: 'object',
  description: 'The background color and overall width of this whole section.',
  fieldsets: [
    { name: 'general', title: '1. Theme & Width', options: { collapsible: true, collapsed: true } },
    { name: 'colors', title: '2. Colors', options: { columns: 2, collapsible: true, collapsed: true } },
    { name: 'backgroundImageSet', title: '3. Background Image & Overlay', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: 'sectionTheme',
      title: 'Theme',
      type: 'string',
      fieldset: 'general',
      description: 'Quick switch between a dark or light look.',
      options: {
        list: [
          { title: 'Dark', value: 'dark' },
          { title: 'Light', value: 'light' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'dark',
      hidden: ({ parent }) => Boolean((parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage),
    }),
    defineField({
      name: 'bgColor',
      title: 'Background',
      type: 'string',
      fieldset: 'colors',
      description: 'Fill color behind the whole section. Leave empty to use the Site Theme.',
      components: { input: ColorPaletteInput, field: FullWidthDescField },
      options: { allowTransparent: true } as any,
      hidden: ({ parent }) => Boolean((parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage),
    }),
    defineField({
      name: 'textColor',
      title: 'Text',
      type: 'string',
      fieldset: 'colors',
      description: 'Default color for text in this section. Leave empty to use the Site Theme.',
      components: { input: ColorPaletteInput, field: FullWidthDescField },
    }),
    defineField({
      name: 'containerWidth',
      title: 'Width',
      type: 'string',
      fieldset: 'general',
      description: 'How wide the content area is, from edge to edge.',
      options: {
        list: [
          { title: 'Narrow', value: 'narrow' },
          { title: 'Standard', value: 'default' },
          { title: 'Wide', value: 'wide' },
          { title: 'Full Screen', value: 'full' },
        ],
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'enableBackgroundImage',
      title: 'Enable Background Image',
      type: 'boolean',
      fieldset: 'backgroundImageSet',
      description:
        'Show a photo behind this whole section instead of a flat color. Turns off the Theme and ' +
        'Background fields above, since a color behind an image never shows.',
      options: { layout: 'switch' },
      initialValue: false,
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'photoWithAlt',
      fieldset: 'backgroundImageSet',
      description: 'An image shown behind the whole section.',
      hidden: ({ parent }) => !(parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage,
    }),
    defineField({
      name: 'backgroundOverlay',
      title: 'Overlay Strength',
      type: 'number',
      fieldset: 'backgroundImageSet',
      description: 'Darkens or tints the section so text stays readable over the image.',
      components: { input: RangeInput },
      options: { range: { min: 0, max: 90, step: 5, labels: ['None', 'Light', 'Medium', 'Strong', 'Max'] } } as any,
      initialValue: 0,
      hidden: ({ parent }) => !(parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage,
    }),
    defineField({
      name: 'backgroundOverlayColor',
      title: 'Overlay Color',
      type: 'string',
      fieldset: 'backgroundImageSet',
      description: 'Color of the overlay — black by default, or pick another color to tint instead.',
      components: { input: ColorPaletteInput, field: FullWidthDescField },
      initialValue: '#000000',
      hidden: ({ parent }) => !(parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage,
    }),
    defineField({
      name: 'backgroundImagePosition',
      title: 'Image Focus',
      type: 'string',
      fieldset: 'backgroundImageSet',
      description: 'Which part of the background image stays visible when it is cropped.',
      options: {
        list: [
          { title: 'Center', value: 'center' },
          { title: 'Top', value: 'top' },
          { title: 'Bottom', value: 'bottom' },
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
      hidden: ({ parent }) => !(parent as { enableBackgroundImage?: boolean })?.enableBackgroundImage,
    }),
  ],
})
