import {defineField, defineType} from 'sanity'
import TextShadowInput from '../components/TextShadowInput'

export const textShadowConfigType = defineType({
  name: 'textShadowConfig',
  title: 'Text Shadow',
  type: 'object',
  components: {input: TextShadowInput},
  fields: [
    defineField({name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: false}),
    defineField({name: 'offsetX', title: 'Offset X', type: 'number', initialValue: 0}),
    defineField({name: 'offsetY', title: 'Offset Y', type: 'number', initialValue: 2}),
    defineField({name: 'blur', title: 'Blur', type: 'number', initialValue: 4}),
    defineField({name: 'color', title: 'Color', type: 'string', initialValue: '#000000'}),
    defineField({
      name: 'opacity',
      title: 'Opacity (0–9)',
      type: 'number',
      initialValue: 5,
      validation: (r) => r.min(0).max(9),
    }),
  ],
  preview: {
    select: {enabled: 'enabled', x: 'offsetX', y: 'offsetY', b: 'blur', o: 'opacity'},
    prepare({enabled, x, y, b, o}) {
      return {
        title: enabled ? `Shadow ${x ?? 0}·${y ?? 2}·${b ?? 4} (opacity ${o ?? 5}/9)` : 'Shadow off',
      }
    },
  },
})
